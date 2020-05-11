import random
import flask
import sys


# start game
def start_game(args, games):
    player_id = args.get('player_id')
    session_id = args.get('session_id')

    if player_id is None or session_id is None:
        return flask.jsonify("ERROR: Missing important arguments!\nExpected: 'session_id', 'player_id'")

    player_id = int(player_id)

    if session_id not in games.keys():
        return flask.jsonify("ERROR: Could not find game!")

    game = games[session_id]
    if player_id not in game.players.keys():
        return flask.jsonify("ERROR: Could not find player in game!")
    if game.host_id != player_id:
        return flask.jsonify("ERROR: Only the game host can start the game!")
    if len(game.players) < 2:
        return flask.jsonify("ERROR: At least two players must be present to start new game!")
    if game.is_started:
        return flask.jsonify("ERROR: Game already started!")

    num_players = len(game.players)
    game.field_chips = [3+num_players, 3+num_players, 3+num_players, 3+num_players, 3+num_players, 5]
    game.field_cards = [[], [], []]
    game.field_nobles = []
    game.cards_remaining = [game.total_cards[0], game.total_cards[1], game.total_cards[2]]
    game.victory = []

    for key, value in game.players.items():
        value.player_cards = []
        value.player_reserved_cards = []
        value.private_reserved_cards = []
        value.player_chips = [0, 0, 0, 0, 0, 0]
        value.player_num_gem_cards = [0, 0, 0, 0, 0]
        value.player_nobles = []
        value.victory_points = 0

    random.shuffle(game.player_order)
    random.shuffle(game.noble_order)
    random.shuffle(game.card_order[0])
    random.shuffle(game.card_order[1])
    random.shuffle(game.card_order[2])

    for x in range(0, num_players + 1):
        game.field_nobles.append(game.noble_order[x])

    for x in range(0, 4):
        if game.cards_remaining[0] > 0:
            game.field_cards[0].append(game.card_order[0][game.cards_remaining[0] - game.total_cards[0]])
            game.cards_remaining[0] -= 1
        if game.cards_remaining[1] > 0:
            game.field_cards[1].append(game.card_order[1][game.cards_remaining[1] - game.total_cards[1]])
            game.cards_remaining[1] -= 1
        if game.cards_remaining[2] > 0:
            game.field_cards[2].append(game.card_order[2][game.cards_remaining[2] - game.total_cards[2]])
            game.cards_remaining[2] -= 1

    game.player_turn = game.player_order[0]
    game.is_started = True

    game.most_recent_action = "The game has started! " + game.players[game.player_turn].username + " will go first."

    return flask.jsonify("OK")


# get current status of game
def get_game_state(args, games):
    player_id = args.get('player_id')
    session_id = args.get('session_id')

    return_game = {
        "exists": False
    }

    if session_id is None or session_id not in games.keys():
        return flask.jsonify(game=return_game)

    game = games[session_id]

    if not game.is_started:
        return_game["is_started"] = False
        return_game["exists"] = True
        return flask.jsonify(game=return_game)

    if player_id is None:
        player_id = -1

    player_id = int(player_id)

    players = {}
    for key, value in game.players.items():
        player = {"player_id": value.player_id,
                  "username": value.username,
                  "player_cards": value.player_cards,
                  "player_reserved_cards": value.player_reserved_cards,
                  "private_reserved_cards": None,
                  "player_chips": value.player_chips,
                  "player_nobles": value.player_nobles,
                  "player_num_gem_cards": value.player_num_gem_cards,
                  "victory_points": value.victory_points
                  }
        if player_id == value.player_id:
            player["private_reserved_cards"] = value.private_reserved_cards
        players[player["player_id"]] = player

    return_game = {
        "exists": True,
        "players": players,
        "session_id": game.session_id,
        "is_started": game.is_started,
        "host_id": game.host_id,
        "player_order": game.player_order,
        "player_turn": game.player_turn,
        "field_cards": game.field_cards,
        "cards_remaining": game.cards_remaining,
        "field_chips": game.field_chips,
        "field_nobles": game.field_nobles,
        "victory": game.victory,
        "most_recent_action": game.most_recent_action
    }

    return flask.jsonify(game=return_game)
