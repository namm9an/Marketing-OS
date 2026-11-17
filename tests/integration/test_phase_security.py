"""Bounded, offline application-security regressions required by every phase.

This is not a traffic flood or a certification of a deployed proxy/TLS stack.
The route inventory deliberately fails when a new API needs a contract check.
"""
import hashlib
import json
from unittest.mock import patch

import pytest

from app.core.config import settings
from app.core.security import session_store, validate_prompt, PayloadTooLargeError
from app.db import database
from app.db.grounded_seed import seed_grounded_knowledge
from app.main import app


API_CONTRACTS = {
    ("/api/health", "GET"), ("/api/me", "GET"),
    ("/api/login", "POST"), ("/api/logout", "POST"),
    ("/api/run", "POST"), ("/api/history", "GET"),
    ("/api/decisions/<decision_id>", "GET"),
    ("/api/decisions/<decision_id>/review", "POST"),
    ("/api/export/markdown", "POST"), ("/api/digest/network", "GET"),
    ("/api/digest", "POST"), ("/api/chat", "POST"),
    ("/api/chat/threads", "GET"), ("/api/chat/thread/<thread_id>", "GET"),
    ("/api/memory", "GET"), ("/api/triage", "POST"),
}
PUBLIC = {"/api/health", "/api/me", "/api/login", "/api/logout"}


@pytest.fixture
def security_client(tmp_path, monkeypatch):
    monkeypatch.setattr(settings, "DB_PATH", tmp_path / "security.db")
    database.reset_db_state()
    database.init_db(force=True)
    seed_grounded_knowledge()
    yield app.test_client()
    database.reset_db_state()


def login(client, **kwargs):
    return client.post('/api/login', json={
        'username': settings.ADMIN_USER, 'password': settings.ADMIN_PASSWORD,
    }, **kwargs)


def test_all_registered_apis_have_explicit_contracts():
    actual = {(rule.rule, method) for rule in app.url_map.iter_rules()
              if rule.rule.startswith('/api/')
              for method in rule.methods - {'HEAD', 'OPTIONS'}}
    assert actual == API_CONTRACTS, 'Add health/auth/shape checks for new API routes'


@pytest.mark.parametrize('path,method', sorted(API_CONTRACTS))
def test_every_api_has_a_healthy_contract_and_safe_cache_policy(security_client, path, method):
    client = security_client
    assert login(client).status_code == 200
    # Generate real stored IDs using controlled inference, not made-up snapshots.
    decision = client.post('/api/run', json={'goal': 'Plan a B200 launch'}).get_json()['decision']['id']
    chat = client.post('/api/chat', json={'agent': 'branding', 'message': 'Plan a B200 launch'}).get_json()['thread_id']
    url = path.replace('<decision_id>', decision).replace('<thread_id>', chat)
    payloads = {
        '/api/login': {'username': settings.ADMIN_USER, 'password': settings.ADMIN_PASSWORD},
        '/api/run': {'goal': 'Plan a B200 launch', 'agent_type': 'pr'},
        '/api/chat': {'agent': 'pr', 'message': 'Review the launch message'},
        '/api/triage': {'agents': ['branding', 'pr'], 'message': 'Review the B200 launch'},
        '/api/decisions/<decision_id>/review': {'status': 'approved', 'reason': 'Reviewed in test'},
    }
    response = client.open(url, method=method, json=payloads.get(path, {}) if method == 'POST' else None)
    assert response.status_code == 200, (path, response.get_data(as_text=True))
    if path == '/api/export/markdown':
        assert response.mimetype == 'text/markdown'
    else:
        assert isinstance(response.get_json(), dict), path
    assert 'no-store' in response.headers.get('Cache-Control', ''), path
    assert response.headers.get('X-Content-Type-Options') == 'nosniff'
    assert 'Cookie' in response.vary


@pytest.mark.parametrize('path,method', sorted(API_CONTRACTS - {(p, m) for p, m in API_CONTRACTS if p in PUBLIC}))
def test_every_protected_route_rejects_anonymous_requests(security_client, path, method):
    response = security_client.open(path.replace('<decision_id>', 'x').replace('<thread_id>', 'x'),
                                    method=method, json={} if method == 'POST' else None)
    assert response.status_code == 401


@pytest.mark.parametrize('size', [52, 72, 120])
def test_long_username_never_removes_password_requirement(security_client, monkeypatch, size):
    monkeypatch.setattr(settings, 'ADMIN_USER', 'u' * size)
    monkeypatch.setattr(settings, 'ADMIN_PASSWORD', 'p' * 90 + 'correct-suffix')
    good = {'username': settings.ADMIN_USER, 'password': settings.ADMIN_PASSWORD}
    assert security_client.post('/api/login', json=good).status_code == 200
    for wrong in ('', 'p' * 90 + 'wrong-suffix', 'p' * 72):
        assert security_client.post('/api/login', json={**good, 'password': wrong}).status_code in (400, 401)


def test_password_bytes_are_not_silently_trimmed(security_client, monkeypatch):
    monkeypatch.setattr(settings, 'ADMIN_PASSWORD', ' exact password ')
    assert login(security_client).status_code == 200
    assert security_client.post('/api/login', json={
        'username': settings.ADMIN_USER, 'password': 'exact password',
    }).status_code == 401


def test_both_credentials_reach_fixed_length_constant_time_comparison(security_client):
    from app import main
    original = main.hmac.compare_digest
    with patch.object(main.hmac, 'compare_digest', wraps=original) as compare:
        response = security_client.post('/api/login', json={'username': 'unknown', 'password': 'wrong'})
    assert response.status_code == 401
    assert compare.call_count == 2  # No username-only short circuit.
    assert all(len(arg) == hashlib.sha256().digest_size for call in compare.call_args_list for arg in call.args)


@pytest.mark.parametrize('origin', ['https://attacker.invalid', 'null'])
@pytest.mark.parametrize('path', ['/api/login', '/api/logout', '/api/run'])
def test_disallowed_origin_cannot_mutate_even_with_a_valid_cookie(security_client, origin, path):
    assert login(security_client).status_code == 200
    with patch('app.services.llm_service.LLMService.generate') as generate:
        response = security_client.post(path, json={'goal': 'Launch B200'}, headers={'Origin': origin})
    assert response.status_code == 403
    generate.assert_not_called()
    assert security_client.get('/api/me').get_json()['authenticated'] is True


def test_allowed_origin_and_nonbrowser_clients_still_work(security_client):
    assert login(security_client, headers={'Origin': 'http://localhost:5173'}).status_code == 200
    assert security_client.get('/api/me').get_json()['authenticated'] is True
    assert login(security_client).status_code == 200


@pytest.mark.parametrize('token', ['authenticated_admin', 'eyJhbGciOiJub25lIn0.eyJzdWIiOiJhZG1pbiJ9.', 'invalid\u200btoken'])
def test_forged_or_jwt_shaped_tokens_cannot_authenticate(security_client, token):
    security_client.set_cookie('auth_session', token)
    assert security_client.get('/api/history').status_code == 401


def test_logged_out_token_replay_is_rejected(security_client):
    assert login(security_client).status_code == 200
    token = security_client.get_cookie('auth_session').value
    assert security_client.post('/api/logout').status_code == 200
    security_client.set_cookie('auth_session', token)
    assert security_client.get('/api/history').status_code == 401


@pytest.mark.parametrize('username', ['ａｄｍｉｎ', 'аdmin', 'admin\u200b', 'admin\x00'])
def test_unicode_lookalikes_are_not_admin_credentials(security_client, username):
    assert security_client.post('/api/login', json={
        'username': username, 'password': settings.ADMIN_PASSWORD,
    }).status_code == 401


@pytest.mark.parametrize('payload', [[], 'not an object', {'goal': {'$ne': None}}])
def test_noncontract_json_cannot_reach_a_model(security_client, payload):
    assert login(security_client).status_code == 200
    with patch('app.services.llm_service.LLMService.generate') as generate:
        assert security_client.post('/api/run', json=payload).status_code == 400
    generate.assert_not_called()


def test_xml_is_rejected_without_entity_expansion(security_client):
    assert login(security_client).status_code == 200
    body = '<!DOCTYPE x [<!ENTITY xxe SYSTEM "file:///etc/passwd">]><x>&xxe;</x>'
    response = security_client.post('/api/run', data=body, content_type='application/xml')
    assert response.status_code == 400
    assert b'root:' not in response.data


def test_invalid_unicode_and_deep_json_are_client_errors(security_client):
    assert login(security_client).status_code == 200
    for body in ('{"goal":"\\ud800"}', '{"goal":' + '[' * 2000 + '0' + ']' * 2000 + '}'):
        response = security_client.post('/api/run', data=body, content_type='application/json')
        assert response.status_code == 400
    response = security_client.post('/api/run', json={'goal': 'Plan a launch for हिन्दी and Ελληνικά users 🚀'})
    assert response.status_code == 200


def test_export_does_not_evaluate_template_or_prototype_payloads(security_client):
    assert login(security_client).status_code == 200
    text = '{{7*7}} <script>window.bad=true</script>'
    response = security_client.post('/api/export/markdown', json={
        'positioning': {'statement': text}, '__proto__': {'polluted': True},
    })
    assert response.status_code == 200
    assert text in response.get_data(as_text=True)
    assert response.mimetype == 'text/markdown'
    assert response.headers.get('X-Content-Type-Options') == 'nosniff'


def test_prompt_limit_precedes_regex_evaluation():
    with patch('app.core.security.detect_prompt_injection') as detector:
        with pytest.raises(PayloadTooLargeError):
            validate_prompt('ignore ' + ' ' * 64000)
    detector.assert_not_called()


def test_no_unsupported_identity_query_or_socket_surfaces_are_registered():
    rules = [r.rule.lower() for r in app.url_map.iter_rules()]
    assert not any(any(word in rule for word in ('graphql', 'oauth', 'saml', 'websocket', '/2fa')) for rule in rules)
    # Tokens come from the server-side CSPRNG store, not Math.random or a JWT parser.
    token = session_store.create_session('test')
    assert len(token) >= 43 and session_store.validate_session(token)['username'] == 'test'
