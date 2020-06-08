import main
from main import app
import pytest
import json

session_id = []


@pytest.fixture
def client():
    app.config['TESTING'] = True
    with app.test_client() as client:
        yield client


def test_lobby_new_game(client):
    result = client.post('/api/new_game', data=json.dumps(dict(
        username="",
        sid='debug'
    )), follow_redirects=True, content_type='application/json')
    game = result.get_json()
    assert game['player_id'] == 0
    assert game['most_recent_action'] == 'New lobby created successfully!'
    session_id.append(game['session_id'])
    assert main.games[session_id[0]].players[0].username == "Player 1"
