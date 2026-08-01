"""M9.8 — the eval harness, and the thresholds that make a regression fail CI.

Thresholds are floors under *measured* behaviour, not aspirations. The paraphrase split is
deliberately given a floor near zero: it currently scores 0.167 and that is the finding, not
a bug to be hidden. Asserting it were good would make this suite lie about the system.
"""

import tempfile
from pathlib import Path

import pytest

from app.core.config import settings
from app.db import database
from app.eval import groundedness
from app.eval.gold import GOLD, LEXICAL, PARAPHRASE
from app.eval.retrieval import corpus_hygiene, evaluate


@pytest.fixture(scope="module", autouse=True)
def seeded_corpus():
    """A real seeded corpus — the eval is meaningless against fixtures."""
    tmp = tempfile.TemporaryDirectory()
    original = settings.DB_PATH
    settings.DB_PATH = Path(tmp.name) / "eval.db"
    database.init_db(force=True)
    from app.db.grounded_seed import seed_grounded_knowledge
    seed_grounded_knowledge()
    yield
    settings.DB_PATH = original
    tmp.cleanup()


# --- The gold set itself ------------------------------------------------------------

def test_every_gold_query_has_at_least_one_relevant_fact():
    """A gold entry with no matching fact scores 0 and looks like a retrieval failure.

    Catching it here keeps a broken fixture from being read as a broken index.
    """
    result = evaluate()
    assert result["broken_fixtures"] == [], (
        f"gold entries with no relevant fact in the corpus: {result['broken_fixtures']}"
    )


def test_gold_set_is_split_across_both_kinds():
    assert len(LEXICAL) >= 15, "too few lexical queries to trust the lexical number"
    assert len(PARAPHRASE) >= 10, "too few paraphrase queries to trust the gap"
    assert len(GOLD) == len(LEXICAL) + len(PARAPHRASE)


# --- Retrieval floors ---------------------------------------------------------------

def test_lexical_retrieval_does_not_regress():
    """Keyword search must win the queries that share vocabulary with the corpus.

    If this drops, retrieval is broken rather than merely limited — a different problem
    from the paraphrase gap and one that would otherwise hide inside the blended average.
    """
    lexical = evaluate()["lexical"]
    assert lexical["recall@5"] >= 0.80, lexical
    assert lexical["mrr"] >= 0.80, lexical


def test_overall_retrieval_does_not_regress():
    overall = evaluate()["overall"]
    assert overall["recall@5"] >= 0.55, overall


def test_paraphrase_gap_is_measured_not_assumed():
    """§9.16 gates M9.10 on Recall@5 < 0.85. This records that the trigger has fired.

    Deliberately asserts the gap EXISTS. When hybrid retrieval lands and paraphrase recall
    rises past the lexical floor, this test should fail and be rewritten — that failure is
    the signal the upgrade worked.
    """
    result = evaluate()
    paraphrase, lexical = result["paraphrase"], result["lexical"]
    assert paraphrase["recall@5"] < lexical["recall@5"], (
        "paraphrase now matches lexical — rewrite this test, the M9.10 upgrade landed"
    )
    assert result["overall"]["recall@5"] < 0.85, "M9.10 trigger condition no longer holds"


# --- Groundedness -------------------------------------------------------------------

FACTS = [{"content": "Empirical Pricing & Rate Card Terms: $1.99/hr.",
          "source_url": "https://www.voltagepark.com/"},
         {"content": "Verified GPU Hardware Fleet on Crusoe Cloud: B200, H100, H200.",
          "source_url": "https://crusoe.ai/"}]


def test_supported_values_pass():
    result = groundedness.check("Voltage Park lists $1.99/hr; Crusoe runs B200 and H200.", FACTS)
    assert result["grounded"], result["unsupported"]
    assert result["checked"] >= 3


def test_invented_price_fails():
    result = groundedness.check("Voltage Park lists $1.49/hr.", FACTS)
    assert not result["grounded"]
    assert any(c["value"] == "$1.49" for c in result["unsupported"])


def test_invented_sku_fails():
    result = groundedness.check("Crusoe runs A100 hardware.", FACTS)
    assert not result["grounded"]
    assert any("A100" in c["value"] for c in result["unsupported"])


def test_invented_url_fails():
    result = groundedness.check("See https://example.com/pricing for details.", FACTS)
    assert not result["grounded"]
    assert any(c["kind"] == "url" for c in result["unsupported"])


def test_answer_with_nothing_checkable_is_flagged_vacuous():
    """Confident prose with no verifiable token is not a clean pass."""
    result = groundedness.check("They are positioned as the premium enterprise option.", FACTS)
    assert result["grounded"] and result["vacuous"]


def test_whitespace_and_case_do_not_defeat_the_check():
    assert groundedness.check("$1.99 / hr on h100", FACTS)["grounded"]


# --- Corpus hygiene -----------------------------------------------------------------

def test_corpus_junk_ratio_does_not_worsen():
    """13.2% of seeded rows are scraped error pages ('404', 'Page Not Found').

    They carry real source_urls, so the grounding pipeline considers them valid. Floor set
    just above the measured value so a worse crawl fails rather than passing quietly.
    """
    hygiene = corpus_hygiene()
    assert hygiene["total"] > 0
    assert hygiene["junk_ratio"] <= 0.15, (
        f"{hygiene['junk']}/{hygiene['total']} rows are scraped error pages"
    )
