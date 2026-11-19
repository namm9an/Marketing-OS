import pytest
from app import main

DOCUMENT = '<!doctype html><html lang="en"><body>Showcase shell</body></html>'


@pytest.fixture
def built_client(tmp_path, monkeypatch):
    (tmp_path / "index.html").write_text(DOCUMENT)
    monkeypatch.setattr(main, "FRONTEND_DIST", tmp_path)
    return main.app.test_client()


@pytest.mark.parametrize("route", ["/", "/console", "/console/", "/console/history"])
def test_compiled_entry_routes_serve_the_spa_on_direct_navigation(built_client, route):
    response = built_client.get(route)
    assert response.status_code == 200
    assert response.get_data(as_text=True) == DOCUMENT


@pytest.mark.parametrize(
    "route",
    ["/preview/f03?agent=branding", "/preview/f03/", "/preview/f03/motion", "/unknown/page/"],
)
def test_missing_browser_documents_return_the_spa_as_a_404(built_client, route):
    response = built_client.get(route, headers={"Accept": "text/html,application/xhtml+xml,*/*;q=0.8"})
    assert response.status_code == 404
    assert response.get_data(as_text=True) == DOCUMENT
    assert "Location" not in response.headers
    assert "Accept" in response.vary


def test_missing_non_document_leaves_the_404_body_and_varies_on_accept(built_client):
    response = built_client.get("/unknown/page", headers={"Accept": "application/json"})
    assert response.status_code == 404
    assert DOCUMENT not in response.get_data(as_text=True)
    assert "Accept" in response.vary


@pytest.mark.parametrize(
    "route",
    ["/assets/missing.css", "/examples/missing.json", "/showcase/missing", "/missing.svg"],
)
def test_missing_assets_keep_the_standard_404_even_on_direct_navigation(built_client, route):
    response = built_client.get(route, headers={"Accept": "text/html"})
    assert response.status_code == 404
    assert DOCUMENT not in response.get_data(as_text=True)


def test_api_auth_and_cache_headers_stay_outside_the_spa_fallback(built_client):
    response = built_client.get("/api/unknown", headers={"Accept": "text/html"})
    assert response.status_code == 401
    assert response.get_json() == {"error": "Authentication required"}
    assert response.cache_control.no_store and response.cache_control.private
    assert "Cookie" in response.vary
