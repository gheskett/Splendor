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
def new_game(game, games):
    while True:
        session_id = generate_session_id()
        if session_id not in games.keys():
            break

    game.session_id = session_id
    games[session_id] = game

    return flask.jsonify(player_id=game.players[len(game.players)-1][0], session_id=session_id)


# join existing game
def join_game(args, games):
    username = args.get('username')
    session_id = args.get('session_id')

    if session_id not in games.keys():
        return flask.jsonify(player_id="NULL", session_id="NULL")

    game = games[session_id]
    if len(game.players) >= 4:
        return flask.jsonify(player_id="NULL", session_id="FULL")

    x = 0
    while x < len(game.players):
        tmp = "p" + str(x)
        exists = False
        for y in range(len(game.players)):
            if game.players[y][0] == tmp:
                exists = True
                break
        if not exists:
            break
        x += 1
    player_id = "p" + str(x)
    game.players.append([player_id, username])
    game.player_cards.append([player_id])
    game.player_reserved_cards.append([player_id])
    game.user_reserved_cards.append([player_id])
    game.player_chips.append([player_id, 0, 0, 0, 0, 0, 0])
    for y in range(0, 5):
        game.field_chips[y] += 1
    game.player_nobles.append([player_id])

    return flask.jsonify(player_id=player_id, session_id=session_id)


# drop out of game
def drop_out(args, games):
    player_id = args.get('player_id')
    session_id = args.get('session_id')
    leave_point = args.get('leave_point')

    if session_id not in games.keys():
        return flask.jsonify("ERROR: Could not find game!")

    game = games[session_id]
    x = 0
    while x < len(game.players):
        if game.players[x][0] == player_id:
            break
        x += 1
    if x == len(game.players):
        return flask.jsonify("ERROR: Could not find player in game!")

    if game.player_turn == player_id:
        game.player_turn = game.players[x+1][0]

    game.players.pop(x)

    x = 0
    while x < len(game.player_cards):
        if game.player_cards[x][0] == player_id:
            break
        x += 1
    if x == len(game.player_cards):
        print("Something is definitely wrong: see drop_out function!")
        return flask.jsonify("ERROR: Critical server error, please see server!")

    game.player_cards.pop(x)
    game.player_reserved_cards.pop(x)
    game.user_reserved_cards.pop(x)
    for y in range(0, 6):
        game.field_chips[y] += game.player_chips[x][y+1]
        if y != 5:
            game.field_chips[y] -= 1  # intentionally can become negative, must be properly relayed in client
    game.player_chips.pop(x)
    game.player_nobles.pop(x)

    if len(game.players) == 0:
        del games[session_id]
    return flask.jsonify("OK")
