"""Bounded parser checks for the pinned Gunicorn HTTP/1 server, not an edge audit."""
import pytest
from gunicorn.config import Config
from gunicorn.http.errors import InvalidHeader, InvalidHeaderName
from gunicorn.http.message import Request
from gunicorn.http.unreader import IterUnreader


@pytest.mark.parametrize('headers', [
    b'Content-Length: 4\r\nTransfer-Encoding: chunked\r\n',
    b'Content-Length: 4\r\nContent-Length: 8\r\n',
    b'Content-Length : 4\r\n',
])
def test_ambiguous_http1_framing_is_rejected(headers):
    wire = b'POST /api/run HTTP/1.1\r\nHost: localhost\r\n' + headers + b'\r\n0\r\n\r\n'
    with pytest.raises((InvalidHeader, InvalidHeaderName)):
        Request(Config(), IterUnreader([wire]), ('127.0.0.1', 12345))


def test_valid_framing_still_parses():
    wire = b'POST /api/run HTTP/1.1\r\nHost: localhost\r\nContent-Length: 2\r\n\r\n{}'
    request = Request(Config(), IterUnreader([wire]), ('127.0.0.1', 12345))
    assert request.body.read() == b'{}'
