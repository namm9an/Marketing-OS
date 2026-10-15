"""
Unit Tests for SQLite Persistence Layer, FTS5 BM25 Search & Grounded Knowledge Database
"""

import json
import sys
import tempfile
import unittest
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent.parent
sys.path.insert(0, str(BASE_DIR))

from app.core.config import settings
from app.core.primitives import new_id, content_hash
from app.db import database
from app.db.database import (
    init_db,
    save_decision,
    get_all_decisions,
    save_knowledge_unit,
    search_knowledge_units,
    get_connection,
    _expand_query_terms,
    _format_fts5_token,
    _TAXONOMY_EXPANSIONS,
)
from app.db.grounded_seed import seed_grounded_knowledge


class TestDatabaseLayer(unittest.TestCase):
    def setUp(self):
        self._tmp = tempfile.TemporaryDirectory()
        self._real_path = settings.DB_PATH
        settings.DB_PATH = Path(self._tmp.name) / "test_db.db"
        database.init_db(force=True)

    def tearDown(self):
        settings.DB_PATH = self._real_path
        database._INITIALIZED = False
        try:
            self._tmp.cleanup()
        except Exception:
            pass

    def test_database_seeding_and_search(self):
        seed_grounded_knowledge()
        facts = search_knowledge_units(query="B200", limit=10)
        self.assertTrue(len(facts) > 0, "Database should return grounded facts for B200 query")
        for f in facts:
            self.assertIn("organization", f)
            self.assertIn("source_url", f)
            self.assertIsNotNone(f["source_url"])

    def test_full_sentence_goal_still_retrieves(self):
        # Regression: the old whole-sentence LIKE returned nothing for realistic goals.
        # Keyword extraction should still surface B200/pricing facts from a full goal.
        seed_grounded_knowledge()
        facts = search_knowledge_units(
            query="Formulate a branding strategy for our B200 pricing against Nebius", limit=10
        )
        self.assertTrue(len(facts) > 0, "Keyword search must match facts inside a full goal sentence")

    def test_decision_record_persistence(self):
        dec_id = new_id()
        save_decision(
            decision_id=dec_id,
            goal_statement="Test GPU Positioning Goal",
            selected_option="Sovereign AI Infrastructure Strategy",
            confidence="High",
            escalated=False,
            reasoning_source="test_runner",
            rationale="Test strategic rationale",
            risks="Test risks",
        )
        decisions = get_all_decisions()
        self.assertTrue(any(d["id"] == dec_id for d in decisions), "Saved decision record should exist in SQLite database")

    def test_fts5_virtual_table_sync_triggers(self):
        """Test FTS5 triggers for INSERT, UPDATE, and DELETE on knowledge_units."""
        ku_id = new_id()
        save_knowledge_unit(
            id_str=ku_id,
            organization="Test Cloud",
            k_class="hardware",
            confidence="high",
            content="Unique H100 SXM5 supercomputing cluster available",
            source_url="https://example.com/h100",
        )
        conn = get_connection()
        try:
            fts_row = conn.execute("SELECT * FROM knowledge_units_fts WHERE id = ?", (ku_id,)).fetchone()
            self.assertIsNotNone(fts_row)
            self.assertEqual(fts_row["organization"], "Test Cloud")
            self.assertIn("SXM5", fts_row["content"])
        finally:
            conn.close()

        # Update knowledge_unit via save_knowledge_unit (INSERT OR REPLACE)
        save_knowledge_unit(
            id_str=ku_id,
            organization="Test Cloud Updated",
            k_class="hardware",
            confidence="high",
            content="Updated B200 NVL72 cluster with liquid cooling",
            source_url="https://example.com/b200",
        )
        conn = get_connection()
        try:
            fts_row_updated = conn.execute("SELECT * FROM knowledge_units_fts WHERE id = ?", (ku_id,)).fetchone()
            self.assertIsNotNone(fts_row_updated)
            self.assertEqual(fts_row_updated["organization"], "Test Cloud Updated")
            self.assertIn("NVL72", fts_row_updated["content"])

            # Direct SQL UPDATE statement to explicitly exercise trg_ku_au trigger
            conn.execute(
                "UPDATE knowledge_units SET content = ? WHERE id = ?",
                ("Direct SQL UPDATE verified cluster B200", ku_id),
            )
            conn.commit()
            fts_row_sql_updated = conn.execute("SELECT * FROM knowledge_units_fts WHERE id = ?", (ku_id,)).fetchone()
            self.assertIsNotNone(fts_row_sql_updated)
            self.assertIn("Direct SQL UPDATE verified", fts_row_sql_updated["content"])

            # Delete knowledge_unit
            conn.execute("DELETE FROM knowledge_units WHERE id = ?", (ku_id,))
            conn.commit()
            fts_row_deleted = conn.execute("SELECT * FROM knowledge_units_fts WHERE id = ?", (ku_id,)).fetchone()
            self.assertIsNone(fts_row_deleted)
        finally:
            conn.close()


    def test_fts5_bm25_ranking_accuracy(self):
        """Verify engine-level BM25 ranking prioritizes multiple/dense keyword hits."""
        save_knowledge_unit(
            id_str="fact_low",
            organization="Nebius",
            k_class="hardware",
            confidence="high",
            content="Nebius operates standard cloud instances.",
        )
        save_knowledge_unit(
            id_str="fact_high",
            organization="Nebius",
            k_class="pricing",
            confidence="high",
            content="Nebius B200 on-demand pricing and rate card for GPU clusters.",
        )
        results = search_knowledge_units(query="Nebius B200 pricing", limit=5)
        self.assertTrue(len(results) >= 2)
        self.assertEqual(results[0]["id"], "fact_high", "BM25 must rank dense multi-keyword match first")
        self.assertIn("rank", results[0])

    def test_porter_stemming_retrieval(self):
        """Verify Porter stemmer matches linguistic variants (e.g. cluster/clusters, price/pricing)."""
        save_knowledge_unit(
            id_str="stem_fact",
            organization="Hyperstack",
            k_class="hardware",
            confidence="high",
            content="Verified GPU clusters and computing nodes.",
        )
        res1 = search_knowledge_units(query="cluster", limit=5)
        self.assertTrue(any(f["id"] == "stem_fact" for f in res1), "Porter stemmer should match 'clusters' for query 'cluster'")

    def test_taxonomy_expansion_hardware(self):
        """Verify taxonomy expansion maps architectural families to specific SKUs."""
        exp_blackwell = _expand_query_terms("blackwell", expand_taxonomy=True)
        self.assertIn('"b200"', exp_blackwell)
        self.assertIn('"gb200"', exp_blackwell)

        exp_hopper = _expand_query_terms("hopper", expand_taxonomy=True)
        self.assertIn('"h100"', exp_hopper)
        self.assertIn('"h200"', exp_hopper)

        # Seed facts with H100 and B200
        save_knowledge_unit("h100_fact", "RunPod", "hardware", "high", "Fleet of NVIDIA H100 accelerators")
        save_knowledge_unit("b200_fact", "CoreWeave", "hardware", "high", "Fleet of NVIDIA B200 accelerators")

        hopper_hits = search_knowledge_units("Who offers Hopper cards?", expand_taxonomy=True)
        self.assertTrue(any(f["id"] == "h100_fact" for f in hopper_hits))

        blackwell_hits = search_knowledge_units("Which clouds have Blackwell chips?", expand_taxonomy=True)
        self.assertTrue(any(f["id"] == "b200_fact" for f in blackwell_hits))

    def test_taxonomy_expansion_indian_sovereign(self):
        """Verify Indian and sovereign market taxonomy terms expand correctly."""
        save_knowledge_unit(
            "sov_fact",
            "Yotta Data Services",
            "positioning",
            "high",
            "Sovereign digital infrastructure with MeitY empanelment in India",
        )
        hits = search_knowledge_units("Which vendors are Indian?", expand_taxonomy=True)
        self.assertTrue(any(f["id"] == "sov_fact" for f in hits))

    def test_quote_safe_tokenization_and_special_characters(self):
        """Verify special punctuation and operator injection attempts do not crash FTS5."""
        special_queries = [
            'B200: $1.99/hr (on-demand) -- "cheapest"',
            '" OR 1=1; --',
            "NOT AND OR NEAR",
            "hyphenated-term and /slash/ query",
            "??? !!! ***",
            "",
            "   ",
        ]
        for q in special_queries:
            res = search_knowledge_units(query=q, limit=5, expand_taxonomy=True)
            self.assertIsInstance(res, list)

    def test_limit_prescoring_truncation_fix(self):
        """Verify older inserted facts are not pre-truncated by SQL LIMIT before scoring."""
        # Insert target fact first (oldest created_at)
        save_knowledge_unit(
            "target_oldest",
            "Crusoe Cloud",
            "hardware",
            "high",
            "Crusoe Cloud hardware fleet with liquid cooled superclusters",
        )
        # Insert 30 filler facts (newer created_at) that only weakly match or don't match
        for i in range(30):
            save_knowledge_unit(
                f"filler_{i}",
                f"Competitor_{i}",
                "documentation",
                "medium",
                f"General cloud documentation page number {i}",
            )
        # Search specifically for the oldest fact's key terms
        results = search_knowledge_units("Crusoe Cloud hardware fleet", limit=5)
        self.assertTrue(len(results) > 0)
        self.assertEqual(results[0]["id"], "target_oldest", "Relevant fact must not be dropped by pre-scoring LIMIT")

    def test_sourced_only_isolation(self):
        """Verify agent-enriched rows are strictly excluded when sourced_only=True."""
        save_knowledge_unit(
            "grounded_row",
            "Nebius",
            "positioning",
            "high",
            "Empirical positioning from scraped site",
            enriched_by="grounded_crawler",
        )
        save_knowledge_unit(
            "agent_row",
            "Nebius",
            "positioning",
            "high",
            "Synthesized agent draft claim",
            enriched_by="branding_agent",
        )
        sourced = search_knowledge_units("Nebius", sourced_only=True)
        all_rows = search_knowledge_units("Nebius", sourced_only=False)
        self.assertTrue(any(r["id"] == "grounded_row" for r in sourced))
        self.assertFalse(any(r["id"] == "agent_row" for r in sourced))
        self.assertTrue(any(r["id"] == "agent_row" for r in all_rows))

    def test_unicode_and_currency_edge_queries(self):
        """Verify non-standard unicode currency symbols and emojis do not crash search."""
        weird_queries = [
            "€ £ ¥ ₹ ₿",
            "🚀 🤖 🔥",
            "pricing in € or £",
            "GPU pricing under $2.00",
        ]
        for q in weird_queries:
            res = search_knowledge_units(query=q, limit=5, expand_taxonomy=True)
            self.assertIsInstance(res, list)

    def test_graph_prices_provenance_schema(self):
        """Verify prices edge provenance contains valid JSON with rate metadata and both ID keys."""
        from app.memory.graph import rebuild_corpus_graph
        seed_grounded_knowledge()
        conn = get_connection()
        try:
            prices_edges = conn.execute("SELECT * FROM edges WHERE rel = 'prices'").fetchall()
            self.assertTrue(len(prices_edges) > 0, "Must have reconciled prices edges")
            for edge in prices_edges:
                prov = json.loads(edge["provenance"])
                self.assertIn("knowledge_unit_id", prov)
                self.assertIn("source_fact_id", prov)
                self.assertEqual(prov["knowledge_unit_id"], prov["source_fact_id"])
                self.assertIn("currency", prov)
                self.assertIn("unit", prov)
                self.assertIn("rates", prov)
        finally:
            conn.close()


if __name__ == "__main__":
    unittest.main()
