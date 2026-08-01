"""M9.8 retrieval evaluation — design_doc §9.16.

Turns "keyword recall is insufficient" from an assertion into a number, which is what
§9.14 says has been missing: until something counts it, the deferral of embeddings is a
preference rather than a finding.

    python -m app.eval.retrieval          # print the report
    python -m app.eval.retrieval --json   # machine-readable

**F2, not F1.** A missed fact makes the answer ungrounded; a surplus fact costs tokens.
Those are not equal costs, so recall carries 2x weight.

**Recall is achievable-recall.** When more than k facts are relevant, k of them is a perfect
score — `hits / min(|relevant|, k)`. Dividing by the full relevant set instead would cap a
query with 20 relevant facts at 0.25 and make the headline number a statement about corpus
density rather than about retrieval.
"""

import argparse
import json
import sys
from typing import Any, Dict, List

from app.db.database import search_knowledge_units, get_all_knowledge_units
from app.eval.gold import GOLD, GoldQuery

K = 5   # matches _FACT_RECALL in app/graph/chat.py — evaluate what the agent actually sees


def _score_one(gold: GoldQuery, k: int = K) -> Dict[str, Any]:
    """Run one gold query through the real retrieval path and score it."""
    retrieved = search_knowledge_units(query=gold.query, limit=k, sourced_only=True)
    corpus = get_all_knowledge_units()

    relevant_total = sum(1 for f in corpus if gold.relevance.matches(f))
    hit_flags = [gold.relevance.matches(f) for f in retrieved]
    hits = sum(hit_flags)

    # No relevant fact exists — the gold entry is wrong, not the retriever. Surfaced
    # rather than silently scored 0, because a broken fixture and a broken index look
    # identical in an aggregate.
    if relevant_total == 0:
        return {"query": gold.query, "kind": gold.kind, "broken_fixture": True,
                "recall": 0.0, "precision": 0.0, "f2": 0.0, "rr": 0.0,
                "hits": 0, "relevant_total": 0, "retrieved": len(retrieved)}

    denominator = min(relevant_total, k)
    recall = hits / denominator
    precision = hits / len(retrieved) if retrieved else 0.0
    f2 = (5 * precision * recall / (4 * precision + recall)) if (precision + recall) else 0.0
    rr = next((1.0 / (i + 1) for i, ok in enumerate(hit_flags) if ok), 0.0)

    return {"query": gold.query, "kind": gold.kind, "broken_fixture": False,
            "recall": recall, "precision": precision, "f2": f2, "rr": rr,
            "hits": hits, "relevant_total": relevant_total, "retrieved": len(retrieved),
            "note": gold.note}


def _mean(values: List[float]) -> float:
    return sum(values) / len(values) if values else 0.0


def evaluate(k: int = K) -> Dict[str, Any]:
    rows = [_score_one(g, k) for g in GOLD]

    def summarise(subset: List[Dict[str, Any]]) -> Dict[str, Any]:
        return {
            "n": len(subset),
            "recall@%d" % k: round(_mean([r["recall"] for r in subset]), 4),
            "precision@%d" % k: round(_mean([r["precision"] for r in subset]), 4),
            "f2@%d" % k: round(_mean([r["f2"] for r in subset]), 4),
            "mrr": round(_mean([r["rr"] for r in subset]), 4),
            "zero_hit": sum(1 for r in subset if r["hits"] == 0),
        }

    return {
        "k": k,
        "overall": summarise(rows),
        "lexical": summarise([r for r in rows if r["kind"] == "lexical"]),
        "paraphrase": summarise([r for r in rows if r["kind"] == "paraphrase"]),
        "broken_fixtures": [r["query"] for r in rows if r["broken_fixture"]],
        "rows": rows,
    }


# --- Corpus hygiene -----------------------------------------------------------------

# Scraped error pages that were seeded as facts. An agent citing "Official Website
# Positioning: '404'" is grounded in the sense the pipeline means — the row has a real
# source_url — and worthless in the sense the CMO means. Counted so the number is known.
_JUNK_MARKERS = ["404", "page not found", "not found", "oops!", "403", "forbidden",
                 "access denied", "just a moment"]


def corpus_hygiene() -> Dict[str, Any]:
    corpus = get_all_knowledge_units()
    junk = [
        {"organization": f["organization"], "content": f["content"][:90],
         "source_url": f.get("source_url")}
        for f in corpus
        if any(m in (f.get("content") or "").lower() for m in _JUNK_MARKERS)
    ]
    return {"total": len(corpus), "junk": len(junk),
            "junk_ratio": round(len(junk) / len(corpus), 4) if corpus else 0.0,
            "examples": junk[:8]}


def _report() -> int:
    result = evaluate()
    hygiene = corpus_hygiene()

    print(f"\nRetrieval @ k={result['k']}  ({result['overall']['n']} gold queries)")
    print("=" * 62)
    header = f"{'split':<12}{'n':>4}{'recall':>9}{'prec':>8}{'F2':>8}{'MRR':>8}{'0-hit':>7}"
    print(header)
    print("-" * 62)
    for split in ("overall", "lexical", "paraphrase"):
        s = result[split]
        print(f"{split:<12}{s['n']:>4}{s['recall@%d' % result['k']]:>9.3f}"
              f"{s['precision@%d' % result['k']]:>8.3f}{s['f2@%d' % result['k']]:>8.3f}"
              f"{s['mrr']:>8.3f}{s['zero_hit']:>7}")

    if result["broken_fixtures"]:
        print("\nBROKEN FIXTURES (no relevant fact exists — fix the gold set, not the index):")
        for q in result["broken_fixtures"]:
            print(f"  - {q}")

    print(f"\nWorst queries (zero relevant fact retrieved):")
    for r in sorted(result["rows"], key=lambda r: (r["recall"], r["rr"]))[:8]:
        if r["hits"] == 0:
            print(f"  [{r['kind']:<10}] {r['query'][:58]}")

    print(f"\nCorpus hygiene: {hygiene['junk']}/{hygiene['total']} rows look like scraped "
          f"error pages ({hygiene['junk_ratio']:.1%})")
    for e in hygiene["examples"][:4]:
        print(f"  [{e['organization'][:18]:<18}] {e['content'][:60]}")

    print()
    return 0


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--json", action="store_true", help="machine-readable output")
    args = ap.parse_args()
    if args.json:
        print(json.dumps({"retrieval": evaluate(), "hygiene": corpus_hygiene()}, indent=2))
        return 0
    return _report()


if __name__ == "__main__":
    sys.exit(main())
