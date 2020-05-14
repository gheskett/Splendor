import main
from main import app
import pytest
from flask import request

session_id = []


@pytest.fixture
def client():
    app.config['TESTING'] = True
    with app.test_client() as client:
        yield client


def test_new_game(client):
    for _ in range(0, 3):
        result = client.post('/new_game', query_string=dict(
            username='Bob'
        ), follow_redirects=True)
        json = result.get_json()
        assert json['player_id'] == 0
        assert json['most_recent_action'] == 'New lobby created successfully!'
        session_id.append(json['session_id'])


def test_join_game(client):
    for x in range(0, 3):
        for y in range(0, 1+x):
            username = ''
            if y == 0:
                username = 'John'
            elif y == 2:
                username = 'Charlie'

            result = client.post('/join_game', query_string=dict(
                session_id=session_id[x],
                username=username
            ), follow_redirects=True)
            json = result.get_json()
            assert json['session_id'] == session_id[x]
            assert json['player_id'] == y + 1


def test_leave_lobby(client):
    for x in range(0, 3):
        result = client.post('/drop_out', query_string=dict(
            session_id=session_id[x],
            player_id=x,
            leave_point=0
        ), follow_redirects=True)
        assert result.get_json() == 'OK'

        result = client.post('/join_game', query_string=dict(
            session_id=session_id[x],
            username=''
        ), follow_redirects=True)
        json = result.get_json()
        assert json['session_id'] == session_id[x]
        assert json['player_id'] == x


def test_is_game_started(client):
    for x in range(0, 3):
        result = client.get('/is_game_started', query_string=dict(
            session_id=session_id[x]
        ), follow_redirects=True)

        json = result.get_json()
        if x == 0:
            assert json['is_started'] is False
            assert json['players']['0']['player_id'] == 0
            assert json['players']['0']['username'] == 'Player 1'
            assert json['players']['1']['player_id'] == 1
            assert json['players']['1']['username'] == 'John'
            assert len(json['players']) == 2

        elif x == 1:
            assert json['is_started'] is False
            assert json['players']['0']['player_id'] == 0
            assert json['players']['0']['username'] == 'Bob'
            assert json['players']['1']['player_id'] == 1
            assert json['players']['1']['username'] == 'Player 2'
            assert json['players']['2']['player_id'] == 2
            assert json['players']['2']['username'] == 'Player 3'
            assert len(json['players']) == 3

        elif x == 2:
            assert json['is_started'] is False
            assert json['players']['0']['player_id'] == 0
            assert json['players']['0']['username'] == 'Bob'
            assert json['players']['1']['player_id'] == 1
            assert json['players']['1']['username'] == 'John'
            assert json['players']['2']['player_id'] == 2
            assert json['players']['2']['username'] == 'Player 3'
            assert json['players']['3']['player_id'] == 3
            assert json['players']['3']['username'] == 'Charlie'
            assert len(json['players']) == 4


def test_start_game(client):
    for x in range(0, 3):
        result = client.post('/start_game', query_string=dict(
            session_id=session_id[x],
            player_id=0
        ), follow_redirects=True)
        if x != 0:
            assert result.get_json() == 'OK'
        else:
            assert result.get_json() == 'ERROR: Only the game host can start the game!'
            result = client.post('/start_game', query_string=dict(
                session_id=session_id[x],
                player_id=1
            ), follow_redirects=True)
            assert result.get_json() == 'OK'


def set_vars():
    game0 = main.games[session_id[0]]
    game1 = main.games[session_id[1]]
    game2 = main.games[session_id[2]]

    game0.card_order = [[8, 18, 14, 7, 25, 11, 13, 39, 3, 6, 9, 1, 22, 28, 36, 29, 21, 2, 4, 37, 20, 24, 17, 33, 16, 23,
                         12, 10, 27, 15, 32, 34, 0, 30, 35, 26, 38, 31, 5, 19],
                        [51, 69, 57, 53, 40, 52, 41, 50, 63, 67, 60, 45, 47, 61, 62, 54, 55, 59, 68, 65, 44, 58, 66, 46,
                         48, 42, 49, 56, 64, 43],
                        [84, 72, 77, 87, 75, 81, 71, 80, 85, 76, 74, 78, 70, 86, 79, 82, 88, 89, 83, 73]]
    game1.card_order = [[23, 31, 22, 34, 30, 10, 27, 0, 13, 18, 12, 9, 20, 25, 24, 39, 19, 17, 14, 11, 3, 16, 32, 5, 28,
                         7, 33, 8, 29, 26, 37, 38, 35, 4, 2, 36, 1, 6, 15, 21],
                        [67, 59, 63, 65, 46, 56, 64, 68, 58, 52, 49, 40, 57, 42, 47, 61, 41, 55, 54, 60, 43, 51, 62, 45,
                         48, 44, 50, 66, 69, 53],
                        [82, 78, 76, 83, 89, 88, 80, 71, 87, 73, 70, 75, 85, 77, 74, 81, 86, 72, 79, 84]]
    game2.card_order = [[5, 11, 34, 4, 13, 30, 16, 23, 15, 6, 17, 29, 0, 12, 1, 9, 27, 31, 14, 33, 2, 8, 21, 18, 20, 24,
                         19, 36, 35, 39, 37, 28, 38, 32, 7, 26, 3, 25, 10, 22],
                        [66, 51, 43, 62, 53, 47, 48, 65, 49, 56, 42, 69, 67, 40, 57, 50, 44, 46, 54, 60, 58, 68, 55, 64,
                         63, 41, 45, 61, 52, 59],
                        [72, 89, 85, 87, 82, 71, 73, 78, 70, 74, 79, 81, 75, 88, 83, 80, 77, 76, 86, 84]]

    game0.noble_order = [9, 2, 8, 0, 3, 1, 7, 6, 4, 5]
    game1.noble_order = [9, 1, 2, 3, 7, 0, 4, 8, 6, 5]
    game2.noble_order = [8, 6, 9, 7, 5, 1, 0, 4, 2, 3]

    game0.field_cards = [[8, 18, 14, 7], [51, 69, 57, 53], [84, 72, 77, 87]]
    game1.field_cards = [[23, 31, 22, 34], [67, 59, 63, 65], [82, 78, 76, 83]]
    game2.field_cards = [[5, 11, 34, 4], [66, 51, 43, 62], [72, 89, 85, 87]]

    game0.field_nobles = [9, 2, 8]
    game1.field_nobles = [9, 1, 2, 3]
    game2.field_nobles = [8, 6, 9, 7, 5]

    game0.player_order = [0, 1]
    game1.player_order = [2, 0, 1]
    game2.player_order = [2, 3, 1, 0]

    game0.player_turn = 0
    game1.player_turn = 2
    game2.player_turn = 2

    game0.most_recent_action = 'The game has started! Player 1 will go first.'
    game1.most_recent_action = 'The game has started! Player 3 will go first.'
    game2.most_recent_action = 'The game has started! Player 3 will go first.'

    game0.cards_remaining = [36, 26, 16]
    game1.cards_remaining = [36, 26, 16]
    game2.cards_remaining = [36, 26, 16]


def test_init_get_game_state(client):
    set_vars()
    for x in range(0, 3):
        result = client.get('/get_game_state', query_string=dict(
            session_id=session_id[x],
            player_id=main.games[session_id[x]].player_order[main.games[session_id[x]].player_order.index
                                                             (main.games[session_id[x]].player_turn) - 1]
        ), follow_redirects=True)
        game = result.get_json()

        assert game['session_id'] == session_id[x]
        if x == 0:
            assert game['field_cards'] == [[8, 18, 14, 7], [51, 69, 57, 53], [84, 72, 77, 87]]
            assert game['field_nobles'] == [9, 2, 8]
            assert game['player_order'] == [0, 1]
            assert game['player_turn'] == 0
            assert game['most_recent_action'] == 'The game has started! Player 1 will go first.'
            assert game['cards_remaining'] == [36, 26, 16]
        elif x == 1:
            assert game['field_cards'] == [[23, 31, 22, 34], [67, 59, 63, 65], [82, 78, 76, 83]]
            assert game['field_nobles'] == [9, 1, 2, 3]
            assert game['player_order'] == [2, 0, 1]
            assert game['player_turn'] == 2
            assert game['most_recent_action'] == 'The game has started! Player 3 will go first.'
            assert game['cards_remaining'] == [36, 26, 16]
        elif x == 2:
            assert game['field_cards'] == [[5, 11, 34, 4], [66, 51, 43, 62], [72, 89, 85, 87]]
            assert game['field_nobles'] == [8, 6, 9, 7, 5]
            assert game['player_order'] == [2, 3, 1, 0]
            assert game['player_turn'] == 2
            assert game['most_recent_action'] == 'The game has started! Player 3 will go first.'
            assert game['cards_remaining'] == [36, 26, 16]


def test_grab_chips(client):
    for x in range(0, 3):
        result = ""
        if x == 0:
            result = client.post('/grab_chips', query_string=dict(
                session_id=session_id[x],
                player_id=0,
                grabbed_chips='[1, 0, 0, 1, 1, 0]',
                returned_chips='[0, 0, 0, 0, 0, 0]'
            ), follow_redirects=True)
        elif x == 1:
            result = client.post('/grab_chips', query_string=dict(
                session_id=session_id[x],
                player_id=2,
                grabbed_chips='[0, 0, 2, 0, 0, 0]',
                returned_chips='[0, 0, 0, 0, 0, 0]'
            ), follow_redirects=True)
        elif x == 2:
            # main.games[session_id[x]].players[2].player_chips = [0, 3, 3, 3, 0, 0]
            # main.games[session_id[x]].field_chips = [7, 4, 4, 4, 7, 5]
            result = client.post('/grab_chips', query_string=dict(
                session_id=session_id[x],
                player_id=2,
                grabbed_chips='[0, 1, 1, 0, 1, 0]',
                returned_chips='[0, 0, 0, 0, 0, 0]'
            ), follow_redirects=True)
        assert result.get_json() == 'OK'

    for x in range(0, 3):
        result = client.get('/get_game_state', query_string=dict(
            session_id=session_id[x],
            player_id=main.games[session_id[x]].player_order[main.games[session_id[x]].player_order.index
                                                             (main.games[session_id[x]].player_turn) - 1]
        ), follow_redirects=True)
        game = result.get_json()

        assert game['session_id'] == session_id[x]
        if x == 0:
            assert game['field_cards'] == [[8, 18, 14, 7], [51, 69, 57, 53], [84, 72, 77, 87]]
            assert game['field_nobles'] == [9, 2, 8]
            assert game['player_order'] == [0, 1]
            assert game['player_turn'] == 1
            assert game['players']['0']['player_chips'] == [1, 0, 0, 1, 1, 0]
            assert game['field_chips'] == [3, 4, 4, 3, 3, 5]
            assert game['most_recent_action'] == 'Player 1 grabbed 1 Diamond, 1 Ruby, and 1 Onyx tokens!'
            assert game['cards_remaining'] == [36, 26, 16]
        elif x == 1:
            assert game['field_cards'] == [[23, 31, 22, 34], [67, 59, 63, 65], [82, 78, 76, 83]]
            assert game['field_nobles'] == [9, 1, 2, 3]
            assert game['player_order'] == [2, 0, 1]
            assert game['player_turn'] == 0
            assert game['players']['2']['player_chips'] == [0, 0, 2, 0, 0, 0]
            assert game['field_chips'] == [5, 5, 3, 5, 5, 5]
            assert game['most_recent_action'] == 'Player 3 grabbed 2 Emerald tokens!'
            assert game['cards_remaining'] == [36, 26, 16]
        elif x == 2:
            assert game['field_cards'] == [[5, 11, 34, 4], [66, 51, 43, 62], [72, 89, 85, 87]]
            assert game['field_nobles'] == [8, 6, 9, 7, 5]
            assert game['player_order'] == [2, 3, 1, 0]
            assert game['player_turn'] == 3
            assert game['players']['2']['player_chips'] == [0, 1, 1, 0, 1, 0]
            assert game['field_chips'] == [7, 6, 6, 7, 6, 5]
            assert game['most_recent_action'] == 'Player 3 grabbed 1 Sapphire, 1 Emerald, and 1 Onyx tokens!'
            assert game['cards_remaining'] == [36, 26, 16]


def test_reserve_card(client):
    for x in range(0, 3):
        result = ""
        if x == 0:
            result = client.post('/reserve_card', query_string=dict(
                session_id=session_id[x],
                player_id=1,
                reserved_card=8,
                returned_chips='[0, 0, 0, 0, 0, 0]'
            ), follow_redirects=True)
        elif x == 1:
            result = client.post('/reserve_card', query_string=dict(
                session_id=session_id[x],
                player_id=0,
                reserved_card=63,
                returned_chips='[0, 0, 0, 0, 0, 0]'
            ), follow_redirects=True)
        elif x == 2:
            result = client.post('/reserve_card', query_string=dict(
                session_id=session_id[x],
                player_id=3,
                reserved_card=-3,
                returned_chips='[0, 0, 0, 0, 0, 0]'
            ), follow_redirects=True)
        assert result.get_json() == 'OK'

    for x in range(0, 3):
        result = client.get('/get_game_state', query_string=dict(
            session_id=session_id[x],
            player_id=main.games[session_id[x]].player_order[main.games[session_id[x]].player_order.index
                                                             (main.games[session_id[x]].player_turn) - 1]
        ), follow_redirects=True)
        game = result.get_json()

        assert game['session_id'] == session_id[x]
        if x == 0:
            assert game['field_cards'] == [[18, 14, 7, 25], [51, 69, 57, 53], [84, 72, 77, 87]]
            assert game['players']['1']['player_reserved_cards'] == [1]
            assert game['players']['1']['private_reserved_cards'] == [8]
            assert game['field_nobles'] == [9, 2, 8]
            assert game['player_order'] == [0, 1]
            assert game['player_turn'] == 0
            assert game['players']['1']['player_chips'] == [0, 0, 0, 0, 0, 1]
            assert game['field_chips'] == [3, 4, 4, 3, 3, 4]
            assert game['most_recent_action'] == 'John reserved a card!'
            assert game['cards_remaining'] == [35, 26, 16]
        elif x == 1:
            assert game['field_cards'] == [[23, 31, 22, 34], [67, 59, 65, 46], [82, 78, 76, 83]]
            assert game['players']['0']['player_reserved_cards'] == [2]
            assert game['players']['0']['private_reserved_cards'] == [63]
            assert game['field_nobles'] == [9, 1, 2, 3]
            assert game['player_order'] == [2, 0, 1]
            assert game['player_turn'] == 1
            assert game['players']['0']['player_chips'] == [0, 0, 0, 0, 0, 1]
            assert game['field_chips'] == [5, 5, 3, 5, 5, 4]
            assert game['most_recent_action'] == 'Bob reserved a card!'
            assert game['cards_remaining'] == [36, 25, 16]
        elif x == 2:
            assert game['field_cards'] == [[5, 11, 34, 4], [66, 51, 43, 62], [72, 89, 85, 87]]
            assert game['players']['3']['player_reserved_cards'] == [3]
            assert game['players']['3']['private_reserved_cards'] == [82]
            assert game['field_nobles'] == [8, 6, 9, 7, 5]
            assert game['player_order'] == [2, 3, 1, 0]
            assert game['player_turn'] == 1
            assert game['players']['3']['player_chips'] == [0, 0, 0, 0, 0, 1]
            assert game['field_chips'] == [7, 6, 6, 7, 6, 4]
            assert game['most_recent_action'] == 'Charlie reserved a card!'
            assert game['cards_remaining'] == [36, 26, 15]

        # print(client.get('/get_game_state', query_string=dict(
        #     session_id=session_id[x],
        #     player_id=main.games[session_id[x]].player_order[main.games[session_id[x]].player_order.index
        #                                                              (main.games[session_id[x]].player_turn) - 1]
        # ), follow_redirects=True).get_json(), flush=True)
