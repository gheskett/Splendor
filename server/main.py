import sys
import flask
import lobby
import game
import logging
from threading import Lock
from flask import request
from flask_socketio import SocketIO, join_room, leave_room
from flask_cors import CORS

logging.basicConfig(filename='python_server.log', filemode='w', level=logging.DEBUG)
app = flask.Flask(__name__)
app.config['CORS_HEADERS'] = 'Content-Type'
cors = CORS(app, resources={r"/api/*": {"origins": "*"}})
# app.config["DEBUG"] = True
socketio = SocketIO(app, cors_allowed_origins='*')

lock = Lock()

gem_ids = ["diamond", "sapphire", "emerald", "ruby", "onyx", "joker"]

clients = {}
games = {}
nobles = []
cards = []


# Noble object
class Noble:
    def __init__(self, pp, dmd, sap, emr, rby, onx):
        self.noble_id = len(nobles)  # noble ID
        self.pp = pp  # prestige points (always 3 for Nobles)
        self.diamond = dmd  # diamonds needed
        self.sapphire = sap  # sapphires needed
        self.emerald = emr  # emeralds needed
        self.ruby = rby  # rubies needed
        self.onyx = onx  # onyx needed


# Card object
class Card:
    def __init__(self, rank, pp, gem_type, dmd, sap, emr, rby, onx):
        self.card_id = len(cards)  # card ID
        self.rank = rank  # card rank (1, 2, or 3)
        self.pp = pp  # prestige points
        self.gem_type = gem_type  # gem type of card
        self.diamond = dmd  # diamonds needed
        self.sapphire = sap  # sapphires needed
        self.emerald = emr  # emeralds needed
        self.ruby = rby  # rubies needed
        self.onyx = onx  # onyx needed


# Player object
class Player:
    def __init__(self):
        self.sid = ""
        self.player_id = 0
        self.username = ""
        self.player_cards = []
        self.player_reserved_cards = []
        self.private_reserved_cards = []
        self.player_chips = [0, 0, 0, 0, 0, 0]
        self.player_nobles = []
        self.player_num_gem_cards = [0, 0, 0, 0, 0]
        self.prestige_points = 0


# Game object
class Game:
    def __init__(self, player):
        self.card_order = [[], [], []]
        self.noble_order = []

        r1, r2, r3 = 0, 0, 0
        for x in range(0, len(cards)):
            if cards[x].rank == 1:
                r1 += 1
                self.card_order[0].append(x)
            elif cards[x].rank == 2:
                r2 += 1
                self.card_order[1].append(x)
            elif cards[x].rank == 3:
                r3 += 1
                self.card_order[2].append(x)

        for x in range(0, len(nobles)):
            self.noble_order.append(x)

        self.session_id = ""
        self.room = ""
        self.host_id = player.player_id
        self.players = {player.player_id: player}
        self.player_order = [player.player_id]
        self.player_turn = -3
        self.field_cards = [[], [], []]
        self.total_cards = [r1, r2, r3]
        self.cards_remaining = [r1, r2, r3]
        self.field_chips = [3, 3, 3, 3, 3, 5]
        self.field_nobles = []
        self.victory = []
        self.most_recent_action = "New lobby created successfully!"


# emit updates to each client in a game lobby
def emit_game_started(session_id):
    with lock:
        ret = lobby.is_game_started({'session_id': session_id}, games).get_json()
    socketio.emit('/api/is_game_started', ret, room=games[session_id].room)


# emit unique updates to each client in an active game
def emit_game_state(session_id):
    with lock:
        game_ret = game.get_game_state({'session_id': session_id, 'player_id': -1}, games).get_json()
    gm = games[session_id]

    # socketio.emit('/api/get_game_state', game_ret, room=gm.room+"_sp")  # future spectator functionality?

    for _, value in gm.players.items():
        game_ret["players"][str(value.player_id)]["private_reserved_cards"] = value.private_reserved_cards
        socketio.emit('/api/get_game_state', game_ret, room=value.sid)


# create new game
@app.route('/api/new_game', methods=['POST'])
def new_game():
    args = request.get_json()
    if args is None or 'sid' not in args.keys():
        return flask.jsonify(player_id=-1, session_id=None,
                             most_recent_action="ERROR: missing 'sid' argument!")

    sid = args['sid']
    if sid not in clients.keys():
        if sid == 'debug':
            clients[sid] = {'player_id': -1, 'session_id': None}
        else:
            return flask.jsonify(player_id=-1, session_id=None,
                                 most_recent_action="ERROR: sid not present in clients dictionary!")

    if clients[sid]['session_id'] is not None and sid != 'debug':
        return flask.jsonify(player_id=clients[sid]['player_id'], session_id=clients[sid]['session_id'],
                             most_recent_action="ERROR: Player cannot join two games at once!")

    player = Player()
    gm = Game(player)
    with lock:
        ret = lobby.new_game(player, args, gm, games)
        clients[sid] = {'player_id': player.player_id, 'session_id': gm.session_id}

    join_room(gm.room, sid, "/")
    emit_game_started(gm.session_id)

    return ret


# join existing game
@app.route('/api/join_game', methods=['POST'])
def join_game():
    args = request.get_json()
    if args is None or 'sid' not in args.keys():
        return flask.jsonify(player_id=-1, session_id=None,
                             most_recent_action="ERROR: missing 'sid' argument!")

    sid = args['sid']
    if sid not in clients.keys():
        if sid == 'debug':
            clients[sid] = {'player_id': -1, 'session_id': None}
        else:
            return flask.jsonify(player_id=-1, session_id=None,
                                 most_recent_action="ERROR: sid not present in clients dictionary!")

    if args is None or 'session_id' not in args.keys():
        return flask.jsonify(player_id=-1, session_id=None,
                             most_recent_action="ERROR: missing 'session_id' argument!")

    if clients[sid]['session_id'] is not None and sid != 'debug':
        return flask.jsonify(player_id=clients[sid]['player_id'], session_id=clients[sid]['session_id'],
                             most_recent_action="ERROR: Player cannot join two games at once!")

    session_id = args['session_id']
    if session_id is None or session_id not in games.keys():
        return flask.jsonify(player_id=-1, session_id=None,
                             most_recent_action="ERROR: Could not find game!")

    player = Player()
    with lock:
        ret = lobby.join_game(player, args, games)

    ret_json = ret.get_json()
    if ret_json['player_id'] < 0:
        return ret

    with lock:
        clients[sid] = {'player_id': player.player_id, 'session_id': ret_json['session_id']}

    join_room(games[session_id].room, sid, "/")
    emit_game_started(session_id)

    return ret


# change username
@app.route('/api/change_username', methods=['POST'])
def change_username():
    with lock:
        ret = lobby.change_username(request.get_json(), games)
    if ret.get_json() != 'OK':
        return ret

    session_id = request.get_json()['session_id']
    if games[session_id].player_turn >= 0:
        emit_game_state(session_id)
    else:
        emit_game_started(session_id)

    return ret


# check if game has started
@app.route('/api/is_game_started', methods=['GET'])
def is_game_started():
    with lock:
        ret = lobby.is_game_started(request.args, games)
    return ret


# drop out of game
@app.route('/api/drop_out', methods=['POST'])
def drop_out():
    with lock:
        ret = lobby.drop_out(request.get_json(), games, clients)
    if ret.get_json() != 'OK':
        return ret

    session_id = request.get_json()['session_id']
    if games[session_id].player_turn >= 0:
        emit_game_state(session_id)
    else:
        emit_game_started(session_id)

    return ret


# start game
@app.route('/api/start_game', methods=['POST'])
def start_game():
    with lock:
        ret = game.start_game(request.get_json(), games)

    if ret.get_json() != 'OK':
        return ret

    session_id = request.get_json()['session_id']
    emit_game_started(session_id)
    emit_game_state(session_id)

    return ret


# get current status of game
@app.route('/api/get_game_state', methods=['GET'])
def get_game_state():
    with lock:
        ret = game.get_game_state(request.args, games)

    if ret.get_json() != 'OK':
        return ret

    session_id = request.get_json()['session_id']
    emit_game_state(session_id)

    return ret


# player grabs chips from field
@app.route('/api/grab_chips', methods=['POST'])
def grab_chips():
    with lock:
        ret = game.grab_chips(request.get_json(), games)

    if ret.get_json() != 'OK':
        return ret

    session_id = request.get_json()['session_id']
    emit_game_state(session_id)

    return ret


# player reserves card from field
@app.route('/api/reserve_card', methods=['POST'])
def reserve_card():
    with lock:
        ret = game.reserve_card(request.get_json(), games)

    if ret.get_json() != 'OK':
        return ret

    session_id = request.get_json()['session_id']
    emit_game_state(session_id)

    return ret


# player buys card from field
@app.route('/api/buy_card', methods=['POST'])
def buy_card():
    with lock:
        ret = game.buy_card(request.get_json(), games, cards, nobles)

    if ret.get_json() != 'OK':
        return ret

    session_id = request.get_json()['session_id']
    emit_game_state(session_id)

    return ret


# get nobles being used with server
@app.route('/api/get_nobles_database', methods=['GET'])
def get_nobles_database():
    nobles_db = {}
    for x in range(0, len(nobles)):
        noble = {
            "noble_id": nobles[x].noble_id,
            "prestige_points": nobles[x].pp,
            "diamond": nobles[x].diamond,
            "sapphire": nobles[x].sapphire,
            "emerald": nobles[x].emerald,
            "ruby": nobles[x].ruby,
            "onyx": nobles[x].onyx
        }
        nobles_db[x] = noble
    return flask.jsonify(nobles_db)


# get cards being used with server
@app.route('/api/get_cards_database', methods=['GET'])
def get_cards_database():
    cards_db = {}
    for x in range(0, len(cards)):
        card = {
            "card_id": cards[x].card_id,
            "rank": cards[x].rank,
            "prestige_points": cards[x].pp,
            "gem_type": gem_ids[cards[x].gem_type],
            "diamond": cards[x].diamond,
            "sapphire": cards[x].sapphire,
            "emerald": cards[x].emerald,
            "ruby": cards[x].ruby,
            "onyx": cards[x].onyx
        }
        cards_db[x] = card
    return flask.jsonify(cards_db)


@socketio.on('connect')
def io_connect():
    with lock:
        clients[request.sid] = {'player_id': -1, 'session_id': None}
    socketio.emit('connect', room=request.sid)


@socketio.on('disconnect')
def io_disconnect():
    cli = clients[request.sid]
    if cli['session_id'] is not None:
        gm = games[cli['session_id']]
        g_room = gm.room
        leave_room(g_room)
        with lock:
            lobby.drop_out(cli, games, clients)
    with lock:
        del clients[request.sid]

    # print('Client disconnected.', flush=True)


# main
srv_prt = 36251  # hardcoded server port given no cmd argument
if __name__ == '__main__':
    arg_len = len(sys.argv)
    if arg_len >= 2:
        srv_prt = int(sys.argv[1])
        if srv_prt > 65535 or srv_prt < 1024:
            logging.error("ERROR: Expected port between 1024 and 65535")
            sys.exit(1)

try:
    with open("nobles", "r") as file:
        while True:
            ln = file.readline()
            if len(ln) == 0:
                break
            if len(ln) < 13:
                logging.error("ERROR: Formatting of Nobles database invalid!")
                sys.exit(1)
            new_noble = Noble(int(ln[1]), int(ln[3]), int(ln[5]), int(ln[7]), int(ln[9]), int(ln[11]))
            nobles.append(new_noble)
except IOError:
    logging.error("ERROR: Cannot locate Nobles database!")
    sys.exit(1)

try:
    with open("cards", "r") as file:
        while True:
            ln = file.readline()
            if len(ln) == 0:
                break
            if len(ln) < 17:
                logging.error("ERROR: Formatting of card database invalid!")
                sys.exit(1)
            new_card = Card(int(ln[1]), int(ln[3]), int(ln[5]), int(ln[7]), int(ln[9]), int(ln[11]), int(ln[13]),
                            int(ln[15]))
            cards.append(new_card)
except IOError:
    logging.error("ERROR: Cannot locate card database!")
    sys.exit(1)

if __name__ == '__main__':
    print("Running server on port {}".format(srv_prt))
    socketio.run(app, host='0.0.0.0', port=srv_prt)
