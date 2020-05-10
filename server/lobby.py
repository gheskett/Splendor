import random
import flask


def generate_session_id():
    ret = ""
    for x in range(0, 6):
        val = random.randint(48, 109)
        if val >= 58:
            val += 7
        if val >= 91:
            val += 6
        ret += chr(val)
    return ret


# create new game
def new_game(player, args, game, games):
    username = args.get('username')
    while True:
        session_id = generate_session_id()
        if session_id not in games.keys():
            break

    game.session_id = session_id
    games[session_id] = game

    if username is None or username == "":
        player.username = "Player " + str(player.player_id + 1)
    else:
        player.username = username

    return flask.jsonify(player_id=game.players[player.player_id].player_id, session_id=session_id)


# join existing game
def join_game(player, args, games):
    session_id = args.get('session_id')
    username = args.get('username')

    game = games[session_id]
    if len(game.players) >= 4:
        return flask.jsonify(player_id=-1, session_id="FULL")

    x = 0
    while True:
        if x not in game.players.keys():
            break
        x += 1
    player.player_id = x
    if username is None or username == "":
        player.username = "Player " + str(player.player_id + 1)
    else:
        player.username = username
    game.players[player.player_id] = player
    game.player_order.append(player.player_id)
    for y in range(0, 5):
        game.field_chips[y] += 1

    return flask.jsonify(player_id=player.player_id, session_id=session_id)


# check if game has started
def is_game_started(args, games):
    session_id = args.get('session_id')

    if session_id is None or session_id not in games.keys():
        return flask.jsonify(is_started=False, players={}, host_id=-1)

    game = games[session_id]
    players = {}
    for key, value in game.players.items():
        player = {"player_id": value.player_id,
                  "username": value.username,
                  "player_cards": value.player_cards,
                  "player_reserved_cards": value.player_reserved_cards,
                  "player_chips": value.player_chips,
                  "player_nobles": value.player_nobles,
                  "player_num_gem_cards": value.player_num_gem_cards
                  }
        players[player["player_id"]] = player

    return flask.jsonify(is_started=game.is_started, players=players, host_id=game.host_id)


# drop out of game
def drop_out(args, games):
    player_id = args.get('player_id')
    session_id = args.get('session_id')
    leave_point = args.get('leave_point')
    if player_id is None or session_id is None or leave_point is None:
        return flask.jsonify("ERROR: Missing important arguments!\nExpected: 'player_id', 'session_id', 'leave_point'")

    player_id = int(player_id)
    leave_point = int(leave_point)

    if session_id not in games.keys():
        return flask.jsonify("ERROR: Could not find game!")

    game = games[session_id]
    if player_id not in game.players.keys():
        return flask.jsonify("ERROR: Could not find player in game!")

    x = 0
    for x in range(len(game.player_order)):
        if player_id == game.player_order[x]:
            break

    if game.player_turn == player_id:
        if x != len(game.player_order) - 1:
            game.player_turn = game.player_order[x+1]
        else:
            game.player_turn = game.player_order[0]

    game.player_order.pop(x)

    for y in range(0, 6):
        game.field_chips[y] += game.players[player_id].player_chips[y]
        if y != 5:
            game.field_chips[y] -= 1  # intentionally can become negative, must be properly relayed in client

    del game.players[player_id]

    if leave_point == 1 and len(game.players) == 1:
        game.victory.append(game.player_order[0])
    elif len(game.players) == 0:
        del games[session_id]
    elif game.host_id == player_id:
        game.host_id = game.player_order[0]
    return flask.jsonify("OK")
