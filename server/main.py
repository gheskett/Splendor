import sys
import random
import flask
import lobby
from threading import Lock
from flask import request

srv = flask.Flask(__name__)
# app.config["DEBUG"] = True
games = []
nobles = []
cards = []
lock = Lock()


# Noble object
class Noble:
    def __init__(self, vp, dmd, sap, emr, rby, onx):
        self.card_id = len(cards)  # noble ID
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
        self.gem_type = gem_type  # gem tyoe of card
        self.diamond = dmd  # diamonds needed
        self.sapphire = sap  # sapphires needed
        self.emerald = emr  # emeralds needed
        self.ruby = rby  # rubies needed
        self.onyx = onx  # onyx needed


class Game:
    def __init__(self, username):
        self.session_id = ""  # game ID
        self.players = [["p0", username]]  # 2D list (player_id, username)  # TODO: randomize on game start
        self.player_turn = ""  # who's turn is it?  # TODO: randomize on game start
        self.player_cards = [["p0"]]  # 2D list
        self.player_reserved_cards = [["p0"]]  # 2D list (face down cards)
        self.user_reserved_cards = [["p0"]]  # 2D list (face up cards)
        self.player_chips = [["p0", 0, 0, 0, 0, 0, 0]]  # 2D list of player chips
        self.field_cards = [[], [], []]  # list of card objects
        self.cards_remaining = [40, 30, 20]  # list of # of remaining cards for each field stack
        self.field_chips = [4, 4, 4, 4, 4, 5]  # list indicating remaining chips on the field  # TODO: increase on join
        self.player_nobles = [["p0"]]  # 2D list of player Noble objects
        self.field_nobles = []  # list of field Noble objects
        self.victory = []  # list of victorious player(s)
        self.card_order = []  # order of card objects  # TODO: randomize on game start
        self.noble_order = []  # order of noble objects  # TODO: randomize on game start


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
    game = Game(request.args.get('username'))
    with lock:
        ret = lobby.new_game(game, games)
    return ret


# join existing game
@srv.route('/join_game', methods=['POST'])
def join_game():
    with lock:
        ret = lobby.join_game(request.args, games)
    return ret


# drop out of game
@srv.route('/drop_out', methods=['POST'])
def drop_out():
    with lock:
        ret = lobby.drop_out(request.args, games)
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

file = open("nobles", "r")
if not file:
    print("ERROR: Cannot locate Nobles database!")
    sys.exit(1)
while True:
    ln = file.readline()
    if len(ln) == 0:
        break
    if len(ln) < 13:
        print("ERROR: Formatting of Nobles database invalid!")
        sys.exit(1)
    new_noble = Noble(int(ln[1]), int(ln[3]), int(ln[5]), int(ln[7]), int(ln[9]), int(ln[11]))
    nobles.append(new_noble)
file.close()

file = open("cards", "r")
if not file:
    print("ERROR: Cannot locate card database!")
    sys.exit(1)
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
file.close()

srv.run(port=srv_prt)
