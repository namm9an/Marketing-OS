"""M9.8 retrieval gold set — design_doc §9.16.

Relevance is expressed as a **predicate over fact content**, never as a list of row ids.
`grounded_seed.py` mints ids with `new_id()` on every reseed, so an id-based gold set would
go stale the first time anyone re-ran the seeder, and would do it silently — every query
scoring 0.0 while looking like a retrieval collapse rather than a stale fixture.

Each entry is a question an agent would plausibly be asked, paired with what a human decided
counts as a relevant fact for it. `kind` splits the set in two, because the two halves measure
different things:

    lexical    — the question shares vocabulary with the corpus. Keyword search should win
                 these. If it does not, retrieval is broken rather than merely limited.
    paraphrase — the question means the same thing in different words ("cheapest hourly rate"
                 vs "Empirical Pricing & Rate Card Terms: $1.99/hr"). Keyword search is
                 expected to lose these; that gap is the entire argument for M9.9/M9.10 and
                 §9.16 predicts the trigger will fire on exactly this split.

Reporting them separately is the point. A single blended number would let a strong lexical
score hide a total paraphrase failure, which is the failure this corpus actually has.
"""

from dataclasses import dataclass, field
from typing import List, Optional


@dataclass(frozen=True)
class Relevance:
    """What makes a fact relevant to one query. Case-insensitive substring logic.

    A fact is relevant when it contains every string in `all_of` AND at least one from
    `any_of` (when given) AND belongs to `org` (when given).
    """
    all_of: List[str] = field(default_factory=list)
    any_of: List[str] = field(default_factory=list)
    org: Optional[str] = None

    def matches(self, fact: dict) -> bool:
        content = (fact.get("content") or "").lower()
        organization = (fact.get("organization") or "").lower()
        if self.org and self.org.lower() not in organization:
            return False
        if not all(term.lower() in content for term in self.all_of):
            return False
        if self.any_of and not any(term.lower() in content for term in self.any_of):
            return False
        return True


@dataclass(frozen=True)
class GoldQuery:
    query: str
    relevance: Relevance
    kind: str          # "lexical" | "paraphrase"
    note: str = ""


# --- The set ------------------------------------------------------------------------
# Kept deliberately small and hand-checked. §9.16 says ~50; 34 hand-verified entries are
# worth more than 50 generated ones, and the split below is what the number is *for*.

GOLD: List[GoldQuery] = [
    # --- lexical: the query wording appears in the corpus ---------------------------
    GoldQuery("B200", Relevance(all_of=["B200"]), "lexical", "bare SKU token"),
    GoldQuery("H200 GPU availability", Relevance(all_of=["H200"]), "lexical"),
    GoldQuery("L40S", Relevance(all_of=["L40S"]), "lexical"),
    GoldQuery("RTX 4090", Relevance(all_of=["RTX 4090"]), "lexical"),
    GoldQuery("GB300", Relevance(all_of=["GB300"]), "lexical"),
    GoldQuery("HGX", Relevance(all_of=["HGX"]), "lexical"),
    GoldQuery("Which clouds run B200 and H200 together?",
              Relevance(all_of=["B200", "H200"]), "lexical"),
    GoldQuery("Yotta Shakti Cloud", Relevance(org="Yotta"), "lexical"),
    GoldQuery("Nebius", Relevance(org="Nebius"), "lexical"),
    GoldQuery("CoreWeave positioning", Relevance(org="CoreWeave"), "lexical"),
    GoldQuery("Crusoe Cloud hardware",
              Relevance(org="Crusoe", all_of=["hardware fleet"]), "lexical"),
    GoldQuery("Lambda Labs", Relevance(org="Lambda"), "lexical"),
    GoldQuery("RunPod pricing",
              Relevance(org="RunPod", all_of=["pricing"]), "lexical"),
    GoldQuery("Voltage Park rate card",
              Relevance(org="Voltage Park", all_of=["pricing"]), "lexical"),
    GoldQuery("Hyperstack GPU fleet",
              Relevance(org="Hyperstack", all_of=["hardware fleet"]), "lexical"),
    GoldQuery("E2E Networks TIR platform",
              Relevance(org="E2E", all_of=["TIR"]), "lexical"),
    GoldQuery("MeitY empanelled", Relevance(all_of=["MeitY"]), "lexical"),
    GoldQuery("sovereign digital infrastructure",
              Relevance(all_of=["sovereign"]), "lexical"),
    GoldQuery("Together AI", Relevance(org="Together"), "lexical"),
    GoldQuery("Neysa AI", Relevance(org="Neysa"), "lexical"),
    GoldQuery("Foundry", Relevance(org="Foundry"), "lexical"),
    GoldQuery("VAST Data", Relevance(org="VAST"), "lexical"),

    # --- paraphrase: same meaning, different words ----------------------------------
    # These are the ones lexical retrieval is expected to miss. Each was checked by hand
    # against the corpus to confirm a relevant fact genuinely exists to be found.
    GoldQuery("Who is cheapest per hour for GPU rental?",
              Relevance(all_of=["pricing"]), "paraphrase",
              "corpus says 'Empirical Pricing & Rate Card Terms', never 'cheapest' or 'rental'"),
    GoldQuery("What does an hour of compute cost?",
              Relevance(all_of=["pricing"]), "paraphrase"),
    GoldQuery("Show me rate cards in rupees",
              Relevance(all_of=["₹"]), "paraphrase", "currency symbol, not the word rupee"),
    GoldQuery("Which vendors are Indian?",
              Relevance(any_of=["India", "sovereign", "MeitY"]), "paraphrase",
              "E2E / Yotta / Neysa are Indian but most rows never say so"),
    GoldQuery("Who markets themselves on data residency?",
              Relevance(any_of=["sovereign", "India"]), "paraphrase"),
    GoldQuery("Which competitors have Blackwell-generation silicon?",
              Relevance(any_of=["B200", "GB200", "GB300"]), "paraphrase",
              "'Blackwell' is the architecture; the corpus only ever names SKUs"),
    GoldQuery("Who offers last-generation Hopper cards?",
              Relevance(any_of=["H100", "H200"]), "paraphrase",
              "'Hopper' likewise never appears in the corpus"),
    GoldQuery("What is our own tagline?",
              Relevance(org="E2E", all_of=["positioning"]), "paraphrase"),
    GoldQuery("How do rivals describe their AI cloud?",
              Relevance(all_of=["positioning"]), "paraphrase"),
    GoldQuery("Which providers target enterprise buyers rather than developers?",
              Relevance(all_of=["positioning"]), "paraphrase"),
    GoldQuery("consumer-grade cards for cheap inference",
              Relevance(any_of=["RTX 4090", "L40"]), "paraphrase",
              "RTX 4090 is the consumer card; the phrase never appears"),
    GoldQuery("Who sells inference capacity by the hour?",
              Relevance(all_of=["/hr"]), "paraphrase"),
]

LEXICAL = [g for g in GOLD if g.kind == "lexical"]
PARAPHRASE = [g for g in GOLD if g.kind == "paraphrase"]
