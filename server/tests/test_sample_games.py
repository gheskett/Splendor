import main
from main import app
import pytest
import json

session_id = ""


@pytest.fixture
def client():
    app.config['TESTING'] = True
    with app.test_client() as client:
        yield client


def grb(client, pid, g_chips, r_chips):
    g_chips = {"diamond": g_chips[0], "sapphire": g_chips[1], "emerald": g_chips[2], "ruby": g_chips[3],
               "onyx": g_chips[4], "joker": g_chips[5]}
    r_chips = {"diamond": r_chips[0], "sapphire": r_chips[1], "emerald": r_chips[2], "ruby": r_chips[3],
               "onyx": r_chips[4], "joker": r_chips[5]}
    result = client.post('/api/grab_chips', data=json.dumps(dict(
        session_id=session_id,
        player_id=pid,
        grabbed_chips=g_chips,
        returned_chips=r_chips
    )), follow_redirects=True, content_type='application/json')
    assert result.get_json() == 'OK'


def res(client, pid, r_crd, r_chips):
    r_chips = {"diamond": r_chips[0], "sapphire": r_chips[1], "emerald": r_chips[2], "ruby": r_chips[3],
               "onyx": r_chips[4], "joker": r_chips[5]}
    result = client.post('/api/reserve_card', data=json.dumps(dict(
        session_id=session_id,
        player_id=pid,
        reserved_card=r_crd,
        returned_chips=r_chips
    )), follow_redirects=True, content_type='application/json')
    assert result.get_json() == 'OK'


def buy(client, pid, p_crd, r_chips, noble):
    r_chips = {"diamond": r_chips[0], "sapphire": r_chips[1], "emerald": r_chips[2], "ruby": r_chips[3],
               "onyx": r_chips[4], "joker": r_chips[5]}
    result = client.post('/api/buy_card', data=json.dumps(dict(
        session_id=session_id,
        player_id=pid,
        purchased_card=p_crd,
        returned_chips=r_chips,
        noble_acquired=noble
    )), follow_redirects=True, content_type='application/json')
    assert result.get_json() == 'OK'


def init_2P(client):
    result = client.post('/api/new_game', data=json.dumps(dict(
        username="Zachary"
    )), follow_redirects=True, content_type='application/json')
    global session_id
    session_id = result.get_json()['session_id']
    client.post('/api/join_game', data=json.dumps(dict(
        session_id=session_id,
        username="Gregory"
    )), follow_redirects=True, content_type='application/json')
    client.post('/api/start_game', data=json.dumps(dict(
        session_id=session_id,
        player_id=0
    )), follow_redirects=True, content_type='application/json')

    game = main.games[session_id]
    game.card_order = [[6, 23, 11, 16, 0, 3, 21, 25, 31, 38, 29, 13, 12, 7, 8, 1, 5, 20, 10, 14, 27, 24, 9, 19, 4, 2,
                        15, 17, 18, 22, 26, 28, 30, 32, 33, 34, 35, 36, 37, 39],
                       [69, 52, 66, 62, 44, 45, 40, 41, 42, 43, 46, 47, 48, 49, 50, 51, 53, 54, 55, 56, 57, 58, 59, 60,
                        61, 63, 64, 65, 67, 68],
                       [89, 84, 86, 70, 76, 78, 81, 77, 71, 72, 73, 74, 75, 79, 80, 82, 83, 85, 87, 88]]
    game.noble_order = [2, 7, 9, 0, 1, 3, 4, 5, 6, 8]
    game.field_cards = [[6, 23, 11, 16], [69, 52, 66, 62], [89, 84, 86, 70]]
    game.field_nobles = [2, 7, 9]
    game.player_order = [0, 1]
    game.player_turn = 0
    game.most_recent_action = 'The game has started! Zachary will go first.'
    game.field_chips = [5, 5, 5, 5, 5, 5]  # Whoops, looks like somebody forgot how to play this game! :/


# def test_2P(client):
#     init_2P(client)
#
#     grb(client, 0, [0, 0, 1, 1, 1, 0], [0, 0, 0, 0, 0, 0])
#     grb(client, 1, [0, 0, 1, 1, 1, 0], [0, 0, 0, 0, 0, 0])
#
#     grb(client, 0, [0, 0, 1, 1, 1, 0], [0, 0, 0, 0, 0, 0])
#     grb(client, 1, [0, 0, 1, 1, 1, 0], [0, 0, 0, 0, 0, 0])
#
#     buy(client, 0, 6, [0, 0, 0, 2, 1, 0], -1)
#     buy(client, 1, 11, [0, 0, 2, 0, 2, 0], -1)
#
#     grb(client, 0, [0, 1, 0, 1, 1, 0], [0, 0, 0, 0, 0, 0])
#     grb(client, 1, [0, 1, 1, 0, 1, 0], [0, 0, 0, 0, 0, 0])
#
#     buy(client, 0, 3, [0, 1, 1, 1, 1, 0], -1)
#     grb(client, 1, [2, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0])
#
#     grb(client, 0, [0, 2, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0])
#     buy(client, 1, 21, [2, 0, 0, 0, 0, 0], -1)
#
#     grb(client, 0, [0, 0, 1, 1, 1, 0], [0, 0, 0, 0, 0, 0])
#     grb(client, 1, [1, 1, 1, 0, 0, 0], [0, 0, 0, 0, 0, 0])
#
#     buy(client, 0, 52, [0, 3, 0, 0, 2, 0], -1)
#     buy(client, 1, 23, [1, 2, 0, 0, 0, 0], -1)
#
#     grb(client, 0, [0, 1, 0, 1, 1, 0], [0, 0, 0, 0, 0, 0])
#     buy(client, 1, 0, [0, 0, 2, 0, 0, 0], -1)
#
#     grb(client, 0, [0, 1, 0, 1, 1, 0], [0, 0, 0, 0, 0, 0])
#     grb(client, 1, [1, 1, 0, 0, 1, 0], [0, 0, 0, 0, 0, 0])
#
#     buy(client, 0, 38, [0, 2, 0, 1, 0, 0], -1)
#     buy(client, 1, 29, [0, 0, 0, 0, 1, 0], -1)
#
#     buy(client, 0, 13, [0, 0, 0, 1, 1, 0], -1)
#     buy(client, 1, 25, [1, 0, 0, 0, 1, 0], -1)
#
#     buy(client, 0, 31, [0, 0, 0, 0, 1, 0], -1)
#     buy(client, 1, 8, [0, 0, 0, 2, 0, 0], -1)
#
#     grb(client, 0, [0, 1, 0, 1, 1, 0], [0, 0, 0, 0, 0, 0])
#     grb(client, 1, [0, 0, 2, 0, 0, 0], [0, 0, 0, 0, 0, 0])
#
#     grb(client, 0, [0, 1, 0, 1, 1, 0], [0, 0, 0, 0, 0, 0])
#     buy(client, 1, 66, [0, 0, 2, 0, 0, 0], -1)
#
#     buy(client, 0, 1, [0, 0, 0, 0, 1, 0], -1)
#     buy(client, 1, 5, [0, 0, 0, 0, 0, 0], -1)
#
#     buy(client, 0, 12, [0, 0, 0, 1, 0, 0], -1)
#     buy(client, 1, 20, [0, 0, 0, 0, 0, 0], -1)
#
#     grb(client, 0, [0, 0, 0, 0, 2, 0], [0, 0, 0, 0, 0, 0])
#     buy(client, 1, 14, [0, 0, 0, 0, 0, 0], -1)
#
#     buy(client, 0, 27, [0, 0, 0, 1, 0, 0], -1)
#     grb(client, 1, [0, 0, 0, 2, 0, 0], [0, 0, 0, 0, 0, 0])
#
#     buy(client, 0, 7, [0, 0, 0, 0, 0, 0], -1)
#     grb(client, 1, [1, 0, 0, 1, 1, 0], [0, 0, 0, 0, 0, 0])
#
#     buy(client, 0, 9, [0, 0, 0, 0, 0, 0], -1)
#     res(client, 1, 70, [0, 0, 0, 0, 0, 0])
#
#     buy(client, 0, 19, [0, 0, 0, 0, 1, 0], -1)
#     grb(client, 1, [0, 1, 1, 1, 0, 0], [0, 0, 0, 0, 0, 0])
#
#     grb(client, 0, [1, 0, 1, 0, 1, 0], [0, 0, 0, 0, 0, 0])
#     buy(client, 1, 70, [0, 0, 0, 3, 1, 1], 9)
#
#     buy(client, 0, 24, [0, 0, 0, 0, 0, 0], -1)
#     res(client, 1, 86, [0, 0, 0, 0, 0, 0])
#
#     buy(client, 0, 78, [1, 0, 0, 0, 2, 0], -1)
#     res(client, 1, 81, [0, 0, 0, 0, 0, 0])
#
#     grb(client, 0, [2, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0])
#     buy(client, 1, 81, [0, 2, 0, 0, 0, 2], -1)
#
#     result = client.get('/api/get_game_state', query_string=dict(
#         session_id=session_id,
#         player_id=0
#     ), follow_redirects=True, content_type='application/json')
#     game = result.get_json()
#     print(game, flush=True)


def init_3P(client):
    result = client.post('/api/new_game', data=json.dumps(dict(
        username="Gregory"
    )), follow_redirects=True, content_type='application/json')
    global session_id
    session_id = result.get_json()['session_id']
    client.post('/api/join_game', data=json.dumps(dict(
        session_id=session_id,
        username="Zachary"
    )), follow_redirects=True, content_type='application/json')
    client.post('/api/join_game', data=json.dumps(dict(
        session_id=session_id,
        username="John"
    )), follow_redirects=True, content_type='application/json')
    client.post('/api/start_game', data=json.dumps(dict(
        session_id=session_id,
        player_id=0
    )), follow_redirects=True, content_type='application/json')

    game = main.games[session_id]
    game.card_order = [[1, 13, 33, 34, 30, 23, 4, 22, 5, 8, 2, 31, 29, 3, 12, 7, 17, 6, 37, 11, 27, 35, 25, 0, 32, 10,
                        39, 38, 28, 18, 15, 21, 16, 14, 9, 19, 20, 24, 26, 36],
                       [53, 61, 41, 49, 58, 66, 59, 69, 47, 42, 52, 57, 40, 65, 68, 43, 44, 45, 46, 48, 50, 51, 54, 55,
                        56, 60, 62, 63, 64, 67],
                       [87, 72, 77, 70, 82, 86, 83, 71, 73, 74, 75, 76, 78, 79, 80, 81, 84, 85, 88, 89]]
    game.noble_order = [5, 8, 2, 1, 0, 3, 4, 6, 7, 9]
    game.field_cards = [[1, 13, 33, 34], [53, 61, 41, 49], [87, 72, 77, 70]]
    game.field_nobles = [5, 8, 2, 1]
    game.player_order = [0, 1, 2]
    game.player_turn = 0
    game.most_recent_action = 'The game has started! Gregory will go first.'


def test_3P(client):
    init_3P(client)

    grb(client, 0, [1, 0, 1, 1, 0, 0], [0, 0, 0, 0, 0, 0])
    grb(client, 1, [0, 1, 1, 0, 1, 0], [0, 0, 0, 0, 0, 0])
    grb(client, 2, [0, 1, 0, 1, 1, 0], [0, 0, 0, 0, 0, 0])

    grb(client, 0, [1, 0, 1, 0, 1, 0], [0, 0, 0, 0, 0, 0])
    grb(client, 1, [1, 1, 0, 0, 1, 0], [0, 0, 0, 0, 0, 0])
    grb(client, 2, [1, 1, 0, 0, 1, 0], [0, 0, 0, 0, 0, 0])

    buy(client, 0, 33, [0, 0, 2, 1, 0, 0], -1)
    buy(client, 1, 1, [0, 2, 0, 0, 2, 0], -1)
    grb(client, 2, [1, 0, 1, 0, 1, 0], [0, 0, 0, 0, 0, 0])

    grb(client, 0, [0, 0, 1, 1, 1, 0], [0, 0, 0, 0, 0, 0])
    grb(client, 1, [0, 1, 1, 1, 0, 0], [0, 0, 0, 0, 0, 0])
    buy(client, 2, 30, [1, 0, 0, 1, 3, 0], -1)

    buy(client, 0, 13, [1, 0, 1, 1, 0, 0], -1)
    buy(client, 1, 34, [1, 0, 2, 0, 0, 0], -1)
    grb(client, 2, [0, 1, 1, 0, 1, 0], [0, 0, 0, 0, 0, 0])

    grb(client, 0, [0, 1, 1, 1, 0, 0], [0, 0, 0, 0, 0, 0])
    grb(client, 1, [0, 0, 1, 1, 1, 0], [0, 0, 0, 0, 0, 0])
    buy(client, 2, 4, [0, 3, 0, 0, 0, 0], -1)

    grb(client, 0, [1, 0, 1, 1, 0, 0], [0, 0, 0, 0, 0, 0])
    buy(client, 1, 22, [0, 1, 0, 2, 1, 0], -1)
    grb(client, 2, [0, 1, 0, 1, 1, 0], [0, 0, 0, 0, 0, 0])

    buy(client, 0, 5, [0, 0, 2, 1, 0, 0], -1)
    grb(client, 1, [1, 1, 0, 0, 1, 0], [0, 0, 0, 0, 0, 0])
    grb(client, 2, [1, 1, 0, 1, 0, 0], [0, 0, 0, 0, 0, 0])

    grb(client, 0, [0, 1, 1, 1, 0, 0], [0, 0, 0, 0, 0, 0])
    buy(client, 1, 31, [1, 0, 0, 0, 1, 0], -1)
    buy(client, 2, 53, [2, 0, 2, 2, 0, 0], -1)

    buy(client, 0, 29, [0, 0, 1, 0, 0, 0], -1)
    buy(client, 1, 3, [0, 1, 0, 0, 0, 0], -1)
    grb(client, 2, [1, 0, 0, 1, 1, 0], [0, 0, 0, 0, 0, 0])

    buy(client, 0, 58, [1, 0, 0, 1, 2, 0], -1)
    grb(client, 1, [0, 1, 1, 1, 0, 0], [0, 0, 0, 0, 0, 0])
    buy(client, 2, 12, [0, 0, 0, 1, 1, 0], -1)

    buy(client, 0, 41, [1, 2, 0, 1, 0, 0], -1)
    grb(client, 1, [1, 1, 1, 0, 0, 0], [0, 0, 0, 0, 0, 0])
    grb(client, 2, [0, 0, 1, 1, 1, 0], [0, 0, 0, 0, 0, 0])

    grb(client, 0, [1, 0, 1, 0, 1, 0], [0, 0, 0, 0, 0, 0])
    buy(client, 1, 7, [1, 1, 0, 0, 0, 0], -1)

    # Uh oh, looks like we've caught a cheater!
    main.cards[59].onyx -= 1
    buy(client, 2, 59, [0, 2, 0, 1, 2, 0], -1)
    main.cards[59].onyx += 1

    grb(client, 0, [0, 1, 0, 1, 1, 0], [0, 0, 0, 0, 0, 0])
    buy(client, 1, 66, [0, 1, 3, 1, 0, 0], -1)
    grb(client, 2, [0, 1, 1, 1, 0, 0], [0, 0, 0, 0, 0, 0])

    buy(client, 0, 17, [0, 0, 0, 1, 0, 0], -1)
    grb(client, 1, [0, 1, 0, 1, 1, 0], [0, 0, 0, 0, 0, 0])
    buy(client, 2, 6, [0, 0, 0, 0, 1, 0], -1)

    buy(client, 0, 37, [0, 0, 0, 0, 0, 0], -1)
    grb(client, 1, [0, 0, 1, 1, 1, 0], [0, 0, 0, 0, 0, 0])
    grb(client, 2, [0, 0, 1, 1, 1, 0], [0, 0, 0, 0, 0, 0])

    buy(client, 0, 11, [0, 0, 1, 0, 0, 0], -1)
    buy(client, 1, 27, [0, 0, 0, 1, 0, 0], -1)
    buy(client, 2, 35, [0, 1, 0, 0, 0, 0], -1)

    buy(client, 0, 25, [0, 0, 0, 0, 0, 0], -1)
    res(client, 1, 61, [0, 0, 0, 0, 0, 0])
    buy(client, 2, 42, [0, 0, 0, 2, 1, 0], -1)

    buy(client, 0, 52, [0, 1, 0, 0, 0, 0], -1)
    grb(client, 1, [0, 1, 1, 0, 1, 0], [0, 0, 0, 0, 0, 0])
    grb(client, 2, [1, 1, 0, 1, 0, 0], [0, 0, 0, 0, 0, 0])

    buy(client, 0, 2, [0, 0, 0, 0, 0, 0], -1)
    buy(client, 1, 47, [0, 2, 1, 1, 0, 0], -1)
    grb(client, 2, [1, 1, 0, 1, 0, 0], [0, 0, 0, 0, 0, 0])

    grb(client, 0, [0, 1, 1, 1, 0, 0], [0, 0, 0, 0, 0, 0])
    grb(client, 1, [1, 1, 0, 1, 0, 0], [0, 0, 0, 0, 0, 0])
    buy(client, 2, 8, [0, 0, 0, 2, 0, 0], -1)

    buy(client, 0, 10, [0, 0, 0, 0, 1, 0], -1)
    buy(client, 1, 39, [0, 0, 0, 1, 0, 0], -1)
    res(client, 2, 77, [0, 0, 0, 0, 0, 0])

    buy(client, 0, 38, [0, 0, 0, 0, 0, 0], 2)
    buy(client, 1, 28, [0, 1, 0, 0, 0, 0], -1)
    buy(client, 2, 77, [3, 1, 0, 0, 0, 1], -1)

    buy(client, 0, 18, [0, 0, 0, 0, 0, 0], 5)
    grb(client, 1, [0, 1, 0, 1, 1, 0], [0, 0, 0, 0, 0, 0])
    buy(client, 2, 23, [0, 0, 0, 0, 0, 0], -1)

    grb(client, 0, [1, 1, 0, 1, 0, 0], [0, 0, 0, 0, 0, 0])
    buy(client, 1, 69, [0, 0, 0, 0, 3, 0], -1)
    res(client, 2, 57, [0, 0, 0, 0, 0, 0])

    buy(client, 0, 82, [0, 2, 0, 0, 0, 0], -1)
    buy(client, 1, 61, [0, 0, 0, 0, 1, 0], 8)
    buy(client, 2, 57, [0, 0, 3, 0, 0, 1], -1)

    buy(client, 0, 87, [0, 0, 0, 2, 0, 0], -1)
    buy(client, 1, 21, [0, 0, 0, 0, 0, 0], -1)
    buy(client, 2, 15, [0, 0, 0, 0, 0, 0], -1)

    result = client.get('/api/get_game_state', query_string=dict(
        session_id=session_id,
        player_id=0
    ), follow_redirects=True, content_type='application/json')
    game = result.get_json()

    assert game['field_nobles'] == [1]
    assert game['field_cards'] == [[16, 32, 14, 0], [40, 68, 65, 49], [83, 72, 86, 70]]
    assert game['field_chips'] == {"diamond": 2, "sapphire": 3, "emerald": 3, "ruby": 4, "onyx": 4, "joker": 4}
    assert game['victory'] == [0]
    assert game['exists'] is True
    assert game['is_started'] is False
    assert game['cards_remaining'] == [6, 15, 13]
    assert game['most_recent_action'] == "John purchased a Sapphire card!\n\nThe game is over! Winner: Gregory"
    assert game['player_turn'] == -2

    player0 = game['players']['0']
    player1 = game['players']['1']
    player2 = game['players']['2']

    assert player0['player_nobles'] == [2, 5]
    assert player0['player_num_gem_cards'] == {"diamond": 3, "sapphire": 3, "emerald": 3, "ruby": 4, "onyx": 4}
    assert player0['player_chips'] == {"diamond": 2, "sapphire": 0, "emerald": 1, "ruby": 0, "onyx": 1, "joker": 0}
    assert player0['prestige_points'] == 16
    assert player0['player_reserved_cards'] == []

    assert player1['player_nobles'] == [8]
    assert player1['player_num_gem_cards'] == {"diamond": 3, "sapphire": 1, "emerald": 2, "ruby": 4, "onyx": 4}
    assert player1['player_chips'] == {"diamond": 1, "sapphire": 1, "emerald": 1, "ruby": 1, "onyx": 0, "joker": 1}
    assert player1['prestige_points'] == 11
    assert player1['player_reserved_cards'] == []

    assert player2['player_nobles'] == []
    assert player2['player_num_gem_cards'] == {"diamond": 3, "sapphire": 4, "emerald": 3, "ruby": 2, "onyx": 1}
    assert player2['player_chips'] == {"diamond": 0, "sapphire": 1, "emerald": 0, "ruby": 0, "onyx": 0, "joker": 0}
    assert player2['prestige_points'] == 13
    assert player2['player_reserved_cards'] == []
