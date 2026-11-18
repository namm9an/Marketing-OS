from concurrent.futures import ThreadPoolExecutor

from app.core.evidence_capture import capture_retrievals, observe_retrieval


def test_capture_copies_source_rows_and_nested_scopes_do_not_leak():
    facts = [{"id": "original", "content": "Original source content"}]
    with capture_retrievals() as outer:
        observe_retrieval("branding", "first", facts)
        with capture_retrievals() as inner:
            observe_retrieval("pr", "second", facts)
        facts[0]["content"] = "Changed after retrieval"
    assert outer[0]["facts"][0]["content"] == "Original source content"
    assert [item["agent"] for item in outer] == ["branding"]
    assert [item["agent"] for item in inner] == ["pr"]
    observe_retrieval("events", "outside", facts)
    assert len(outer) == 1


def test_concurrent_capture_contexts_keep_their_own_requests():
    def collect(agent):
        with capture_retrievals() as records:
            observe_retrieval(agent, agent, [{"id": agent}])
        return records
    with ThreadPoolExecutor(max_workers=2) as pool:
        results = list(pool.map(collect, ("branding", "pr")))
    assert [[item["agent"] for item in result] for result in results] == [["branding"], ["pr"]]
