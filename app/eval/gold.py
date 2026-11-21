"""Retrieval questions judged against the bundled source observations."""

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
    knowledge_class: Optional[str] = None

    def matches(self, fact: dict) -> bool:
        content = (fact.get("content") or "").lower()
        organization = (fact.get("organization") or "").lower()
        if self.org and self.org.lower() not in organization:
            return False
        if self.knowledge_class and self.knowledge_class != fact.get("knowledge_class"):
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


GOLD: List[GoldQuery] = [
    GoldQuery("B200", Relevance(all_of=["B200"]), "lexical"),
    GoldQuery("H200 GPU availability", Relevance(all_of=["H200"]), "lexical"),
    GoldQuery("L40S", Relevance(all_of=["L40S"]), "lexical"),
    GoldQuery("RTX 4090", Relevance(all_of=["RTX 4090"]), "lexical"),
    GoldQuery("GB300", Relevance(all_of=["GB300"]), "lexical"),
    GoldQuery("HGX", Relevance(all_of=["HGX"]), "lexical"),
    GoldQuery("Which clouds list B200 and H200?", Relevance(all_of=["B200", "H200"]), "lexical"),
    GoldQuery("Yotta Shakti Cloud", Relevance(org="Yotta"), "lexical"),
    GoldQuery("Nebius", Relevance(org="Nebius"), "lexical"),
    GoldQuery("CoreWeave positioning", Relevance(org="CoreWeave"), "lexical"),
    GoldQuery("Crusoe Cloud hardware", Relevance(org="Crusoe", knowledge_class="hardware"), "lexical"),
    GoldQuery("Lambda Labs", Relevance(org="Lambda"), "lexical"),
    GoldQuery("RunPod pricing", Relevance(org="RunPod", knowledge_class="pricing"), "lexical"),
    GoldQuery("Voltage Park HGX H100", Relevance(org="Voltage Park", all_of=["HGX"]), "lexical"),
    GoldQuery("Hyperstack GB300", Relevance(org="Hyperstack", all_of=["GB300"]), "lexical"),
    GoldQuery("RunPod Serverless network storage", Relevance(org="RunPod", all_of=["network storage"]), "lexical"),
    GoldQuery("Neysa Velocis", Relevance(org="Neysa", all_of=["Velocis"]), "lexical"),
    GoldQuery("sovereign digital infrastructure", Relevance(all_of=["sovereign"]), "lexical"),
    GoldQuery("Together AI", Relevance(org="Together"), "lexical"),
    GoldQuery("Neysa AI", Relevance(org="Neysa"), "lexical"),
    GoldQuery("Foundry", Relevance(org="Foundry"), "lexical"),
    GoldQuery("VAST Data", Relevance(org="VAST"), "lexical"),

    GoldQuery("Who is cheapest per hour for GPU rental?", Relevance(knowledge_class="pricing"), "paraphrase"),
    GoldQuery("What does an hour of compute cost?", Relevance(knowledge_class="pricing"), "paraphrase"),
    GoldQuery("Which vendors publish billing options?", Relevance(knowledge_class="pricing"), "paraphrase"),
    GoldQuery("Which vendors are Indian?", Relevance(any_of=["India", "sovereign"]), "paraphrase"),
    GoldQuery("Who markets themselves on data residency?", Relevance(any_of=["sovereign", "India"]), "paraphrase"),
    GoldQuery("Which competitors have Blackwell-generation silicon?",
              Relevance(any_of=["B200", "GB200", "GB300"]), "paraphrase"),
    GoldQuery("Who offers last-generation Hopper cards?", Relevance(any_of=["H100", "H200"]), "paraphrase"),
    GoldQuery("What is their pitch for AI teams?", Relevance(knowledge_class="positioning"), "paraphrase"),
    GoldQuery("How do rivals describe their AI cloud?", Relevance(knowledge_class="positioning"), "paraphrase"),
    GoldQuery("Which providers target enterprise buyers rather than developers?",
              Relevance(knowledge_class="positioning"), "paraphrase"),
    GoldQuery("consumer-grade cards for cheap inference",
              Relevance(any_of=["RTX 4090", "L40"]), "paraphrase"),
    GoldQuery("Who sells inference capacity by the hour?", Relevance(knowledge_class="pricing"), "paraphrase"),
]

LEXICAL = [g for g in GOLD if g.kind == "lexical"]
PARAPHRASE = [g for g in GOLD if g.kind == "paraphrase"]
