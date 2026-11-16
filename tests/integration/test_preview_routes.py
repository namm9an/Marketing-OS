import pytest
from app.main import app


@pytest.mark.parametrize('route', ['/preview/f03', '/preview/f03/', '/preview/f03/motion'])
def test_compiled_review_routes_serve_the_spa_on_direct_navigation(tmp_path, monkeypatch, route):
    import app.main as main
    document = '<!doctype html><html lang="en"><body>Page foundation review</body></html>'
    (tmp_path / 'index.html').write_text(document)
    monkeypatch.setattr(main, 'FRONTEND_DIST', tmp_path)
    response = app.test_client().get(route)
    assert response.status_code == 200
    assert response.get_data(as_text=True) == document
