"""
Frontier Agent Evaluation Graders — Anthropic Standard (Jan 2026).

Implements The Grader Triad:
1. CodeGrader: Physical SQLite outcome state inspection, namespace boundary isolation,
   and grounded citation verification.
2. ModelGrader: Calibrated model-based judge scoring Groundedness (1-5) and Strategic Tone
   with mandatory guardrail: "If context lacks evidence, return 'UNKNOWN'. Do not fabricate."
   Features 100% deterministic offline fallback with zero paid API key dependencies.
3. HumanReferenceGrader: Golden reference evaluation against human-annotated targets.
"""

import re
import json
import sqlite3
from pathlib import Path
from typing import Any, Dict, Iterable, List, Optional, Tuple, Union

from app.core.config import settings
from app.db.database import get_connection
from app.services.llm_service import LLMService


class CodeGrader:
    """Code-Based Outcome Checkers for deterministic state and invariant verification."""

    @staticmethod
    def _resolve_connection(db: Optional[Union[sqlite3.Connection, str, Path]] = None) -> Tuple[sqlite3.Connection, bool]:
        """Resolve a DB connection and return (conn, should_close)."""
        if db is None:
            conn = get_connection()
            return conn, True
        if isinstance(db, (str, Path)):
            conn = sqlite3.connect(str(db))
            conn.row_factory = sqlite3.Row
            return conn, True
        if isinstance(db, sqlite3.Connection):
            return db, False
        raise TypeError(f"Unsupported db type: {type(db)}")

    @classmethod
    def check_outcome_state(
        cls,
        db: Optional[Union[sqlite3.Connection, str, Path]],
        table: str,
        expected_fields: Dict[str, Any],
    ) -> Tuple[bool, str]:
        """Check if at least one row in SQLite `table` matches `expected_fields`.

        Returns (True, "OK") or (False, error_reason).
        """
        conn, should_close = cls._resolve_connection(db)
        try:
            # Query all rows or recent rows from the table
            cursor = conn.execute(f"SELECT * FROM {table}")
            col_names = [d[0] for d in cursor.description] if cursor.description else []
            rows = [
                dict(row) if hasattr(row, "keys") else dict(zip(col_names, row))
                for row in cursor.fetchall()
            ]
            if not rows:
                return False, f"Table '{table}' is empty; expected fields {expected_fields}"

            for row in rows:
                match = True
                for key, val in expected_fields.items():
                    if key not in row:
                        match = False
                        break
                    row_val = row[key]
                    if callable(val):
                        if not val(row_val):
                            match = False
                            break
                    elif row_val != val:
                        match = False
                        break
                if match:
                    return True, f"Found matching row in table '{table}'"

            return False, (
                f"No row in table '{table}' matched expected fields: {expected_fields}. "
                f"Inspected {len(rows)} rows."
            )
        except Exception as e:
            return False, f"Database query failed on table '{table}': {str(e)}"
        finally:
            if should_close:
                conn.close()

    @classmethod
    def assert_outcome_state(
        cls,
        db: Optional[Union[sqlite3.Connection, str, Path]],
        table: str,
        expected_fields: Dict[str, Any],
    ) -> bool:
        """Assert that a matching outcome state exists in SQLite table. Raises AssertionError on failure."""
        ok, reason = cls.check_outcome_state(db, table, expected_fields)
        if not ok:
            raise AssertionError(f"[CodeGrader] Outcome state check failed: {reason}")
        return True

    @classmethod
    def check_zero_namespace_leakage(
        cls,
        transcript: Any,
        forbidden_namespaces: Iterable[str],
    ) -> Tuple[bool, str]:
        """Assert an agent never reads another's private memory or unauthorized joint spaces.

        Inspects transcripts, state dicts, memory lists, and turns.
        """
        forbidden_set = {ns.strip().lower() for ns in forbidden_namespaces if ns}
        if not forbidden_set:
            return True, "No forbidden namespaces specified"

        visited = set()

        def _scan(node: Any, path: str = "") -> Optional[str]:
            if node is None or isinstance(node, (int, float, bool)):
                return None

            node_id = id(node)
            if isinstance(node, (dict, list, tuple, set)) or hasattr(node, "__dict__"):
                if node_id in visited:
                    return None
                visited.add(node_id)

            if isinstance(node, str):
                node_lower = node.lower()
                for f_ns in forbidden_set:
                    # Look for exact namespace boundary matches (prevents agent:pr colliding with agent:product_marketing)
                    pattern = rf"(?<![a-zA-Z0-9_:-]){re.escape(f_ns)}(?![a-zA-Z0-9_:-])"
                    if re.search(pattern, node_lower):
                        return f"Forbidden namespace '{f_ns}' found at path '{path}': {node[:80]}"
                return None
            elif hasattr(node, "model_dump") and callable(getattr(node, "model_dump")):
                return _scan(node.model_dump(), path)
            elif hasattr(node, "dict") and callable(getattr(node, "dict")):
                return _scan(node.dict(), path)
            elif hasattr(node, "__dict__"):
                return _scan(node.__dict__, path)
            elif isinstance(node, dict):
                for k, v in node.items():
                    k_str = str(k).lower()
                    for f_ns in forbidden_set:
                        if f_ns == k_str:
                            return f"Forbidden namespace '{f_ns}' found as key at path '{path}.{k}'"
                    err = _scan(v, f"{path}.{k}" if path else str(k))
                    if err:
                        return err
            elif isinstance(node, (list, tuple, set)):
                for idx, item in enumerate(node):
                    err = _scan(item, f"{path}[{idx}]")
                    if err:
                        return err
            return None

        leak_err = _scan(transcript)
        if leak_err:
            return False, leak_err
        return True, "Zero namespace leakage verified across transcript"

    @classmethod
    def assert_zero_namespace_leakage(
        cls,
        transcript: Any,
        forbidden_namespaces: Iterable[str],
    ) -> bool:
        """Assert zero namespace leakage. Raises AssertionError if leakage is detected."""
        ok, reason = cls.check_zero_namespace_leakage(transcript, forbidden_namespaces)
        if not ok:
            raise AssertionError(f"[CodeGrader] Namespace leakage detected: {reason}")
        return True

    @classmethod
    def extract_urls(cls, text_or_obj: Any) -> List[str]:
        """Extract URLs from text or structured object."""
        urls: List[str] = []
        if isinstance(text_or_obj, dict):
            if "citations" in text_or_obj and isinstance(text_or_obj["citations"], list):
                for c in text_or_obj["citations"]:
                    if isinstance(c, str):
                        urls.append(c)
                    elif isinstance(c, dict) and "url" in c:
                        urls.append(c["url"])
                    elif isinstance(c, dict) and "source_url" in c:
                        urls.append(c["source_url"])
            if "sources" in text_or_obj and isinstance(text_or_obj["sources"], list):
                for s in text_or_obj["sources"]:
                    if isinstance(s, str):
                        urls.append(s)
            for v in text_or_obj.values():
                urls.extend(cls.extract_urls(v))
        elif isinstance(text_or_obj, list):
            for item in text_or_obj:
                urls.extend(cls.extract_urls(item))
        elif isinstance(text_or_obj, str):
            found = re.findall(r"https?://[^\s)\]\"'>]+", text_or_obj)
            urls.extend(found)
        return list(dict.fromkeys(u.rstrip(".,;?'\"") for u in urls if u))

    @classmethod
    def check_valid_citations(
        cls,
        response: Any,
        corpus_db: Optional[Union[sqlite3.Connection, str, Path]] = None,
    ) -> Tuple[bool, str, List[str]]:
        """Assert 100% of cited facts carry valid, active source_urls in knowledge_units.

        Returns (passed, reason, invalid_urls).
        """
        urls = cls.extract_urls(response)
        if not urls:
            return True, "No URLs cited in response", []

        conn, should_close = cls._resolve_connection(corpus_db)
        invalid: List[str] = []
        try:
            try:
                for url in urls:
                    row = conn.execute(
                        "SELECT id FROM knowledge_units WHERE source_url = ? AND enriched_by NOT LIKE '%agent%'",
                        (url,),
                    ).fetchone()
                    if not row:
                        # Also check if URL matches normalized trailing slash
                        alt_url = url.rstrip("/") if url.endswith("/") else url + "/"
                        row_alt = conn.execute(
                            "SELECT id FROM knowledge_units WHERE source_url = ? AND enriched_by NOT LIKE '%agent%'",
                            (alt_url,),
                        ).fetchone()
                        if not row_alt:
                            invalid.append(url)
            except Exception as e:
                return False, f"Database query failed during citation check: {str(e)}", urls
            if invalid:
                return False, f"Cited URLs not found in grounded corpus knowledge_units: {invalid}", invalid
            return True, f"All {len(urls)} cited URLs verified in grounded corpus", []
        finally:
            if should_close:
                conn.close()

    @classmethod
    def assert_valid_citations(
        cls,
        response: Any,
        corpus_db: Optional[Union[sqlite3.Connection, str, Path]] = None,
    ) -> bool:
        """Assert valid citations. Raises AssertionError on ungrounded or fake URLs."""
        ok, reason, _ = cls.check_valid_citations(response, corpus_db)
        if not ok:
            raise AssertionError(f"[CodeGrader] Citation verification failed: {reason}")
        return True


class ModelGrader:
    """Calibrated Model-Based Judge scoring Groundedness and Strategic Tone.

    Mandatory guardrail: 'If context lacks evidence, return UNKNOWN. Do not fabricate.'
    Includes live LLM-as-judge scoring with deterministic calibrated offline rubric fallback.
    """

    GUARDRAIL_PROMPT = "If context lacks evidence, return 'UNKNOWN'. Do not fabricate."

    @classmethod
    def judge_with_llm(
        cls,
        prompt: str,
        system_prompt: str,
        provider: str = "gemini-3.6-flash",
    ) -> Optional[Dict[str, Any]]:
        """Attempt live calibrated LLM-as-judge evaluation.

        Returns parsed JSON dict on success, or None to signal fallback to calibrated offline rubric.
        """
        try:
            res = LLMService.generate(
                system_prompt=system_prompt,
                user_prompt=prompt,
                provider=provider,
            )
            # If it was a mock-fallback from empty key, return None to trigger calibrated deterministic fallback
            if res.get("model_used") in ("mock-fallback", "gemini-fallback"):
                return None
            text = res.get("text", "")
            m = re.search(r"\{.*\}", text, re.DOTALL)
            if m:
                data = json.loads(m.group(0))
                if isinstance(data, dict) and "score" in data:
                    return data
            return None
        except Exception:
            return None

    @classmethod
    def score_groundedness(
        cls,
        response: str,
        context_facts: List[Dict[str, Any]],
        strict_guardrail: bool = True,
        use_llm: bool = False,
        provider: str = "gemini-3.6-flash",
    ) -> Dict[str, Any]:
        """Score semantic Groundedness on a 1-5 scale.

        Rubric:
        5: Fully supported — all claims derive strictly from context_facts (or compliant UNKNOWN).
        4: Substantially supported — minor paraphrasing without factual distortion.
        3: Partially supported — some claims supported, others uncited but neutral.
        2: Weakly supported — claims extrapolate beyond context.
        1: Hallucinated / Contaminated — claims directly contradict or invent facts.
        """
        if not response or not response.strip():
            return {
                "score": 1,
                "verdict": "EMPTY",
                "grounded": False,
                "rationale": "Response is empty",
                "unknown": False,
            }

        if use_llm:
            judge_prompt = (
                f"Context Facts:\n{json.dumps(context_facts, indent=2)}\n\n"
                f"Response to Grade:\n{response}\n\n"
                f"Evaluate semantic groundedness on a 1-5 scale.\n"
                f"MANDATORY GUARDRAIL: {cls.GUARDRAIL_PROMPT}\n"
                f"Output JSON with keys: score (1-5), verdict (string), grounded (bool), rationale (string)."
            )
            system_prompt = (
                "You are a calibrated frontier agent evaluation judge for enterprise marketing intelligence.\n"
                f"Rule: {cls.GUARDRAIL_PROMPT}"
            )
            llm_result = cls.judge_with_llm(judge_prompt, system_prompt, provider=provider)
            if llm_result:
                return llm_result

        resp_lower = response.lower()

        # Guardrail check: If response states UNKNOWN / lacks evidence, verify compliance
        is_unknown_response = any(
            marker in resp_lower
            for marker in ["unknown", "not enough information", "no data", "cannot determine", "lacks evidence"]
        )
        if is_unknown_response:
            return {
                "score": 5,
                "verdict": "COMPLIANT_UNKNOWN",
                "grounded": True,
                "rationale": "Guardrail satisfied: Correctly returned UNKNOWN when context lacks evidence.",
                "unknown": True,
            }

        # Guardrail check: If context is empty and the response generates unevidenced claims
        if not context_facts:
            if strict_guardrail:
                return {
                    "score": 1,
                    "verdict": "FABRICATION_VIOLATION",
                    "grounded": False,
                    "rationale": "Fabrication violation: Generated factual claims when context facts were absent.",
                    "unknown": False,
                }

        # Token and entity analysis
        context_corpus = " ".join((f.get("content") or "") for f in context_facts).lower()

        # Check for numeric pricing claims in response ($X, ₹X)
        prices_in_resp = set(re.findall(r"[\$₹]\s*\d+(?:\.\d+)?", resp_lower))
        prices_in_ctx = set(re.findall(r"[\$₹]\s*\d+(?:\.\d+)?", context_corpus))
        invented_prices = prices_in_resp - prices_in_ctx

        # Check for GPU SKU claims (H100, B200, etc.)
        skus_in_resp = set(re.findall(r"\b(?:h100|h200|b200|gb200|gb300|l40s|l4|rtx\s*4090|a100)\b", resp_lower))
        skus_in_ctx = set(re.findall(r"\b(?:h100|h200|b200|gb200|gb300|l40s|l4|rtx\s*4090|a100)\b", context_corpus))
        invented_skus = skus_in_resp - skus_in_ctx

        if invented_prices or invented_skus:
            return {
                "score": 1,
                "verdict": "HALLUCINATION",
                "grounded": False,
                "rationale": f"Invented empirical entities: prices={invented_prices}, skus={invented_skus}",
                "unknown": False,
            }

        # Factual overlap check
        words_resp = [w for w in re.findall(r"[a-z0-9]+", resp_lower) if len(w) > 3]
        if not words_resp:
            return {"score": 3, "verdict": "NEUTRAL", "grounded": True, "rationale": "Minimal tokens", "unknown": False}

        matches = sum(1 for w in words_resp if w in context_corpus)
        overlap_ratio = matches / len(words_resp)

        if overlap_ratio >= 0.65:
            score = 5
            verdict = "FULLY_GROUNDED"
        elif overlap_ratio >= 0.45:
            score = 4
            verdict = "SUBSTANTIALLY_GROUNDED"
        elif overlap_ratio >= 0.25:
            score = 3
            verdict = "PARTIALLY_GROUNDED"
        else:
            score = 2
            verdict = "WEAKLY_GROUNDED"

        return {
            "score": score,
            "verdict": verdict,
            "grounded": score >= 4,
            "overlap_ratio": round(overlap_ratio, 3),
            "rationale": f"Empirical claim verification: overlap_ratio={overlap_ratio:.2f}",
            "unknown": False,
        }

    @classmethod
    def score_strategic_tone(
        cls,
        response: str,
        target_persona: str = "branding",
        use_llm: bool = False,
        provider: str = "gemini-3.6-flash",
    ) -> Dict[str, Any]:
        """Score Strategic Tone adherence on a 1-5 scale.

        Evaluates developer-first, objective, CMO-governed communication vs casual/hype.
        """
        if use_llm:
            judge_prompt = (
                f"Target Persona: {target_persona}\n"
                f"Response to Grade:\n{response}\n\n"
                f"Evaluate strategic tone (1-5) against developer-first, objective executive communication.\n"
                f"Output JSON with keys: score (1-5), verdict (string), tone (string), rationale (string)."
            )
            system_prompt = "You are a calibrated judge evaluating enterprise tone compliance."
            llm_result = cls.judge_with_llm(judge_prompt, system_prompt, provider=provider)
            if llm_result:
                return llm_result

        resp_lower = response.lower()
        casual_markers = ["lol", "haha", "super cool", "crazy awesome", "insane deal", "trust me bro"]
        found_casual = [m for m in casual_markers if m in resp_lower]

        objective_markers = ["infrastructure", "pricing", "workload", "latency", "benchmark", "sovereign", "deployment", "gpu"]
        found_objective = [m for m in objective_markers if m in resp_lower]

        if found_casual:
            return {
                "score": 1,
                "verdict": "CASUAL_DRIFT",
                "tone": "Casual / Unprofessional",
                "rationale": f"Found casual markers: {found_casual}",
            }

        if len(found_objective) >= 3:
            return {
                "score": 5,
                "verdict": "EXECUTIVE_STRATEGIC",
                "tone": "Objective, Developer-First Strategic Tone",
                "rationale": f"Found {len(found_objective)} enterprise markers: {found_objective[:4]}",
            }
        elif len(found_objective) >= 1:
            return {
                "score": 4,
                "verdict": "ACCEPTABLE_PROFESSIONAL",
                "tone": "Professional",
                "rationale": "Sufficient professional phrasing",
            }
        else:
            return {
                "score": 3,
                "verdict": "NEUTRAL",
                "tone": "Neutral",
                "rationale": "Lacks specific enterprise domain markers",
            }


class HumanReferenceGrader:
    """Evaluates agent outcomes against human-curated golden references."""

    @staticmethod
    def evaluate_governance(
        escalated_actual: bool,
        escalated_expected: bool,
        escalation_reason: Optional[str] = None,
    ) -> Dict[str, Any]:
        """Verify governance outcome matches human gold reference."""
        matches = escalated_actual == escalated_expected
        return {
            "passed": matches,
            "actual": escalated_actual,
            "expected": escalated_expected,
            "escalation_reason": escalation_reason,
            "verdict": "PASS" if matches else "FAIL",
        }

    @staticmethod
    def evaluate_memory_admission(
        admitted_record: Optional[Dict[str, Any]],
        expected_admitted: bool,
        expected_category: Optional[str] = None,
    ) -> Dict[str, Any]:
        """Verify memory promotion gate admission matches human gold reference."""
        if isinstance(admitted_record, dict) and "admitted" in admitted_record:
            was_admitted = bool(admitted_record["admitted"])
            actual_category = admitted_record.get("category")
        else:
            was_admitted = admitted_record is not None
            raw_cat = (
                admitted_record.get("category")
                or admitted_record.get("provenance")
                if admitted_record else None
            )
            if raw_cat and isinstance(raw_cat, str) and raw_cat.startswith("user:"):
                parts = raw_cat.split(":")
                actual_category = parts[1] if len(parts) >= 2 else raw_cat
            else:
                actual_category = raw_cat

        admission_ok = was_admitted == expected_admitted

        category_ok = True
        if expected_admitted and expected_category:
            category_ok = (actual_category == expected_category)

        passed = admission_ok and category_ok
        return {
            "passed": passed,
            "actual_admitted": was_admitted,
            "expected_admitted": expected_admitted,
            "actual_category": actual_category,
            "expected_category": expected_category,
            "verdict": "PASS" if passed else "FAIL",
        }
