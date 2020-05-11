import sys
import random
import flask
import lobby
import game
from threading import Lock
from flask import request

srv = flask.Flask(__name__)
# app.config["DEBUG"] = True
games = {}
nobles = []
cards = []
lock = Lock()


# Noble object
class Noble:
    def __init__(self, vp, dmd, sap, emr, rby, onx):
        self.noble_id = len(nobles)  # noble ID
        self.vp = vp  # victory points (always 3 for Nobles)
        self.diamond = dmd  # diamonds needed
        self.sapphire = sap  # sapphires needed
        self.emerald = emr  # emeralds needed
        self.ruby = rby  # rubies needed
        self.onyx = onx  # onyx needed


# Card object
class Card:
    def __init__(self, rank, vp, gem_type, dmd, sap, emr, rby, onx):
        self.card_id = len(cards)  # card ID
        self.rank = rank  # card rank (1, 2, or 3)
        self.vp = vp  # victory points
        self.gem_type = gem_type  # gem type of card
        self.diamond = dmd  # diamonds needed
        self.sapphire = sap  # sapphires needed
        self.emerald = emr  # emeralds needed
        self.ruby = rby  # rubies needed
        self.onyx = onx  # onyx needed


# Player object
class Player:
    def __init__(self):
        self.player_id = 0
        self.username = ""
        self.player_cards = []
        self.player_reserved_cards = []
        self.private_reserved_cards = []
        self.player_chips = [0, 0, 0, 0, 0, 0]
        self.player_nobles = []
        self.player_num_gem_cards = [0, 0, 0, 0, 0]
        self.victory_points = 0


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
        self.is_started = False
        self.host_id = player.player_id
        self.players = {player.player_id: player}
        self.player_order = [player.player_id]
        self.player_turn = ""
        self.field_cards = [[], [], []]
        self.total_cards = [r1, r2, r3]
        self.cards_remaining = [r1, r2, r3]
        self.field_chips = [4, 4, 4, 4, 4, 5]
        self.field_nobles = []
        self.victory = []


# get nobles being used with server
@srv.route('/get_nobles_database', methods=['GET'])
def get_nobles_database():
    nobles_db = {}
    with lock:
        for x in range(0, len(nobles)):
            noble = {
                "noble_id": nobles[x].noble_id,
                "vp": nobles[x].vp,
                "diamond": nobles[x].diamond,
                "sapphire": nobles[x].sapphire,
                "emerald": nobles[x].emerald,
                "ruby": nobles[x].ruby,
                "onyx": nobles[x].onyx
            }
            nobles_db[x] = noble
    return flask.jsonify(nobles=nobles_db)


# get cards being used with server
@srv.route('/get_cards_database', methods=['GET'])
def get_cards_database():
    cards_db = {}
    with lock:
        for x in range(0, len(cards)):
            card = {
                "card_id": cards[x].card_id,
                "rank": cards[x].rank,
                "vp": cards[x].vp,
                "gem_type": cards[x].gem_type,
                "diamond": cards[x].diamond,
                "sapphire": cards[x].sapphire,
                "emerald": cards[x].emerald,
                "ruby": cards[x].ruby,
                "onyx": cards[x].onyx
            }
            cards_db[x] = card
    return flask.jsonify(cards=cards_db)


# Shut down server when Ctrl+C decides not to work properly  TODO: definitely not secure, remove later
@srv.route('/shutdown', methods=['POST'])
def shutdown():
    fnc = request.environ.get('werkzeug.server.shutdown')
    if fnc is None:
        raise RuntimeError('Not running Werkzeug Server')
    fnc()
    return 'Server shutting down...'


# create new game
@srv.route('/new_game', methods=['POST'])
def new_game():
    player = Player()
    gm = Game(player)
    with lock:
        ret = lobby.new_game(player, request.args, gm, games)
    return ret


# join existing game
@srv.route('/join_game', methods=['POST'])
def join_game():
    session_id = request.args.get('session_id')
    if session_id is None or session_id not in games.keys():
        return flask.jsonify(player_id=-1, session_id=None)
    player = Player()
    with lock:
        ret = lobby.join_game(player, request.args, games)
    return ret


# change username
@srv.route('/change_username', methods=['POST'])
def change_username():
    with lock:
        ret = lobby.change_username(request.args, games)
    return ret


# check if game has started
@srv.route('/is_game_started', methods=['GET'])
def is_game_started():
    with lock:
        ret = lobby.is_game_started(request.args, games)
    return ret


# drop out of game
@srv.route('/drop_out', methods=['POST'])
def drop_out():
    with lock:
        ret = lobby.drop_out(request.args, games)
    return ret


# start game
@srv.route('/start_game', methods=['POST'])
def start_game():
    with lock:
        ret = game.start_game(request.args, games)
    return ret


# get current status of game
@srv.route('/get_game_state', methods=['GET'])
def get_game_state():
    with lock:
        ret = game.get_game_state(request.args, games)
    return ret


# main
arg_len = len(sys.argv)
if arg_len >= 2:
    srv_prt = int(sys.argv[1])
    if srv_prt > 65535 or srv_prt < 1024:
        print("ERROR: Expected port between 1024 and 65535")
        sys.exit(1)
else:
    srv_prt = random.randint(1024, 49151)

try:
    with open("nobles", "r") as file:
        while True:
            ln = file.readline()
            if len(ln) == 0:
                break
            if len(ln) < 13:
                print("ERROR: Formatting of Nobles database invalid!")
                sys.exit(1)
            new_noble = Noble(int(ln[1]), int(ln[3]), int(ln[5]), int(ln[7]), int(ln[9]), int(ln[11]))
            nobles.append(new_noble)
except IOError:
    print("ERROR: Cannot locate Nobles database!")
    sys.exit(1)

try:
    with open("cards", "r") as file:
        while True:
            ln = file.readline()
            if len(ln) == 0:
                break
            if len(ln) < 17:
                print("ERROR: Formatting of card database invalid!")
                sys.exit(1)
            new_card = Card(int(ln[1]), int(ln[3]), int(ln[5]), int(ln[7]), int(ln[9]), int(ln[11]), int(ln[13]),
                            int(ln[15]))
            cards.append(new_card)
except IOError:
    print("ERROR: Cannot locate card database!")
    sys.exit(1)

srv.run(port=srv_prt)
