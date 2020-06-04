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
    while True:
        session_id = generate_session_id()
        if session_id not in games.keys():
            break

    game.session_id = session_id
    game.room = session_id
    games[session_id] = game

    if args is None or 'username' not in args.keys() or args['username'] == "":
        player.username = "Player " + str(player.player_id + 1)
    else:
        player.username = args['username']

    player.sid = args['sid']

    game.messages.append({'player_id': player.player_id, 'message': game.most_recent_action, 'is_game_event': True})

    return flask.jsonify(player_id=game.players[player.player_id].player_id, session_id=session_id,
                         most_recent_action=game.most_recent_action)


# join existing game
def join_game(player, args, games):
    session_id = args['session_id']

    game = games[session_id]
    if game.player_turn >= 0:
        return flask.jsonify(player_id=-1, session_id=None,
                             most_recent_action="ERROR: Current game is already started!")
    if len(game.players) >= 4:
        return flask.jsonify(player_id=-1, session_id=None,
                             most_recent_action="ERROR: Current game is full!")

    x = 0
    while True:
        if x not in game.players.keys():
            break
        x += 1
    player.player_id = x
    if 'username' not in args.keys() or args['username'] is None or args['username'] == "":
        player.username = "Player " + str(player.player_id + 1)
    else:
        player.username = args['username']
    game.players[player.player_id] = player
    game.player_order.append(player.player_id)
    for y in range(0, 5):
        game.field_chips[y] += 1

    player.sid = args['sid']

    game.most_recent_action = player.username + " joined the game lobby!"

    game.messages.append({'player_id': player.player_id, 'message': game.most_recent_action, 'is_game_event': True})

    return flask.jsonify(player_id=player.player_id, session_id=session_id, most_recent_action=game.most_recent_action)


# change username
def change_username(args, games):
    if args is None or 'session_id' not in args.keys() or 'player_id' not in args.keys():
        return flask.jsonify("ERROR: Missing important arguments!\nExpected: 'player_id', 'session_id', 'username'")
    session_id = args['session_id']
    player_id = args['player_id']
    if player_id is None or session_id is None:
        return flask.jsonify("ERROR: Missing important arguments!\nExpected: 'player_id', 'session_id', 'username'")
    if session_id not in games.keys():
        return flask.jsonify("ERROR: Could not find game!")

    game = games[session_id]

    player_id = int(player_id)

    if player_id not in game.players.keys():
        return flask.jsonify("ERROR: Could not find player in game!")

    tmp = game.players[player_id].username

    if 'username' not in args.keys() or args['username'] is None or args['username'] == "":
        game.players[player_id].username = "Player " + str(game.players[player_id].player_id + 1)
    else:
        game.players[player_id].username = args['username']

    if tmp != game.players[player_id].username:
        game.most_recent_action = tmp + " changed their username to " + game.players[player_id].username + "!"

    game.messages.append({'player_id': player_id, 'message': game.most_recent_action, 'is_game_event': True})

    return flask.jsonify("OK")


# check if game has started
def is_game_started(args, games):
    session_id = args.get('session_id')

    if session_id is None or session_id not in games.keys():
        return flask.jsonify(exists=False, is_started=False, players={}, host_id=-1, session_id=None)

    game = games[session_id]
    players = {}
    for _, value in game.players.items():
        player = {"player_id": value.player_id,
                  "username": value.username
                  }
        players[player["player_id"]] = player

    started = False
    if game.player_turn >= 0:
        started = True

    return flask.jsonify(exists=True, is_started=started, players=players, host_id=game.host_id,
                         most_recent_action=game.most_recent_action, session_id=game.session_id)


# drop out of game
def drop_out(args, games, clients):
    if args is None or 'session_id' not in args.keys() or 'player_id' not in args.keys():
        return flask.jsonify("ERROR: Missing important arguments!\nExpected: 'player_id', 'session_id'")
    player_id = args['player_id']
    session_id = args['session_id']
    if player_id is None or session_id is None:
        return flask.jsonify("ERROR: Missing important arguments!\nExpected: 'player_id', 'session_id'")

    player_id = int(player_id)

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

    tmp = game.players[player_id].username
    sid = game.players[player_id].sid

    del game.players[player_id]

    game.most_recent_action = tmp + " left the game"
    if game.player_turn == -3:
        game.most_recent_action += " lobby"
    game.most_recent_action += "!"

    if game.player_turn >= 0 and len(game.players) == 1:
        game.victory.append(game.player_order[0])
        game.player_turn = -2
        game.most_recent_action += "\n\n" + game.players[game.player_order[0]].username + " is the only player left, " \
                                                                                          "so this means they win the" \
                                                                                          " game!"

    game.messages.append({'player_id': player_id, 'message': game.most_recent_action, 'is_game_event': True})

    if len(game.players) == 0:
        del games[session_id]
    elif game.host_id == player_id:
        game.host_id = game.player_order[0]

    clients[sid] = {'player_id': -1, 'session_id': None}

    return flask.jsonify("OK")


def send_message(args, games):
    if args is None or 'session_id' not in args.keys() or 'player_id' not in args.keys() \
            or 'message' not in args.keys():
        return flask.jsonify("ERROR: Missing important arguments!\nExpected: 'session_id', 'player_id', 'message'")

    player_id = args['player_id']
    session_id = args['session_id']
    message = args['message']

    if player_id is None or session_id is None or message is None:
        return flask.jsonify("ERROR: Missing important arguments!\nExpected: 'session_id', 'player_id', 'message'")

    if len(message) == 0:
        return flask.jsonify("ERROR: Cannot send blank messages!")

    if session_id not in games.keys():
        return flask.jsonify("ERROR: Could not find game!")

    game = games[session_id]
    if player_id not in game.players.keys():
        return flask.jsonify("ERROR: Could not find player in game!")  # disable to allow for spectators to chat
        # player_id = -1

    game.messages.append({'player_id': player_id, 'message': message, 'is_game_event': False})

    return flask.jsonify("OK")


def get_messages(args, games):
    session_id = args.get('session_id')
    print(str(session_id), flush=True)
    if session_id is None or session_id not in games.keys():
        return flask.jsonify([])

    num_messages = int(args.get('num_messages'))
    if 'num_messages' is None:
        num_messages = -1

    game = games[session_id]

    msg_len = len(game.messages)
    if num_messages < 0 or num_messages > msg_len:
        num_messages = msg_len

    print("OI", flush=True)

    if num_messages == 0:
        return flask.jsonify([])

    print("OI", flush=True)

    ret = game.messages[slice(msg_len - num_messages, msg_len)]

    return flask.jsonify(ret)
