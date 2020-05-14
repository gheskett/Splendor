import random
import flask
import json


def check_victory(game):
    highest_vp = 0
    lowest_count = -1
    for _, value in game.players.items():
        if value.victory_points >= highest_vp:
            highest_vp = value.victory_points

    if highest_vp < 15:
        return

    for _, value in game.players.items():
        tmp = 0
        for x in range(0, 5):
            tmp += value.player_num_gem_cards[x]
            if lowest_count < 0 or tmp < lowest_count:
                lowest_count = tmp

    for _, value in game.players.items():
        if value.victory_points != highest_vp:
            continue
        tmp = 0
        for x in range(0, 5):
            tmp += value.player_num_gem_cards[x]
            if lowest_count < 0 or tmp < lowest_count:
                lowest_count = tmp
        if tmp == lowest_count:
            game.victory.append(value.player_id)

    if len(game.victory) > 0:
        game.player_turn = -2


def comma_parse(total, index, num, bef):
    if total - index <= 0:
        return ""
    if bef:
        return str(num) + " "
    if total - index == 1:
        return " "
    if total == 2:
        return " and "
    if total - index == 2:
        return ", and "
    return ", "


def token_str(total, lst):
    ret = ""
    index = 0
    gems = ["Diamond", "Sapphire", "Emerald", "Ruby", "Onyx", "Wild"]
    for x in range(0, 6):
        if lst[x] > 0:
            ret += comma_parse(total, index, lst[x], True)
            ret += gems[x]
            ret += comma_parse(total, index, lst[x], False)
            index += 1

    if total == 0:
        ret += "no"
    ret += "token"

    return ret


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
    if game.player_turn >= 0:
        return flask.jsonify("ERROR: Game already started!")

    num_players = len(game.players)
    if num_players >= 4:
        game.field_chips = [3+num_players, 3+num_players, 3+num_players, 3+num_players, 3+num_players, 5]
    else:
        game.field_chips = [2+num_players, 2+num_players, 2+num_players, 2+num_players, 2+num_players, 5]
    game.field_cards = [[], [], []]
    game.field_nobles = []
    game.cards_remaining = [game.total_cards[0], game.total_cards[1], game.total_cards[2]]
    game.victory = []

    for _, value in game.players.items():
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

    for _ in range(0, 4):
        if game.cards_remaining[0] > 0:
            game.field_cards[0].append(game.card_order[0][game.total_cards[0] - game.cards_remaining[0]])
            game.cards_remaining[0] -= 1
        if game.cards_remaining[1] > 0:
            game.field_cards[1].append(game.card_order[1][game.total_cards[1] - game.cards_remaining[1]])
            game.cards_remaining[1] -= 1
        if game.cards_remaining[2] > 0:
            game.field_cards[2].append(game.card_order[2][game.total_cards[2] - game.cards_remaining[2]])
            game.cards_remaining[2] -= 1

    game.player_turn = game.player_order[0]

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

    if game.player_turn == -3:
        return_game["is_started"] = False
        return_game["exists"] = True
        return flask.jsonify(game=return_game)

    started = True
    if game.player_turn < 0:
        started = False

    if player_id is None:
        player_id = -1

    player_id = int(player_id)

    players = {}
    for _, value in game.players.items():
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
        "is_started": started,
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

    return flask.jsonify(return_game)


# player grabs chips from field
def grab_chips(args, games):
    player_id = args.get('player_id')
    session_id = args.get('session_id')
    grabbed_chips = args.get('grabbed_chips')
    returned_chips = args.get('returned_chips')

    if player_id is None or session_id is None or grabbed_chips is None or returned_chips is None:
        return flask.jsonify("ERROR: Missing important arguments!\nExpected: 'session_id', 'player_id', "
                             "'grabbed_chips', 'returned_chips'")

    player_id = int(player_id)
    grabbed_chips = json.loads(grabbed_chips)
    returned_chips = json.loads(returned_chips)

    if session_id not in games.keys():
        return flask.jsonify("ERROR: Could not find game!")

    game = games[session_id]
    if player_id not in game.players.keys():
        return flask.jsonify("ERROR: Could not find player in game!")

    if game.player_turn == -3:
        return flask.jsonify("ERROR: The game has not been started yet!")

    if game.player_turn == -2:
        return flask.jsonify("ERROR: The game is over!")

    if game.player_turn != player_id:
        return flask.jsonify("ERROR: It is not " + game.players[player_id].username + "'s turn!")

    if len(grabbed_chips) != 6:
        return flask.jsonify("ERROR: grabbed_chips has incorrect syntax!\nValue should be a list of int length 6."
                             "\nExample: [1, 0, 1, 1, 0, 0]")
    if len(returned_chips) != 6:
        return flask.jsonify("ERROR: returned_chips has incorrect syntax!\nValue should be a list of int length 6."
                             "\nExample: [0, 1, 0, 0, 2, 0]")

    grabbed, returned, field_ch, player_ch, ret_cnt, grb_cnt = 0, 0, 0, 0, 0, 0
    is_two = False
    for x in range(0, 6):
        grabbed += grabbed_chips[x]
        returned += returned_chips[x]
        player_ch += game.players[player_id].player_chips[x]
        if x != 5 and game.field_chips[x] > 0:
            field_ch += 1
        if returned_chips[x] > 0:
            ret_cnt += 1
        if grabbed_chips[x] > 0:
            grb_cnt += 1

        if returned_chips[x] > game.players[player_id].player_chips[x] + grabbed_chips[x]:
            return flask.jsonify("ERROR: Player cannot return chips they do not have or did not pick up!")

        if grabbed_chips[x] > 2 or grabbed_chips[x] < 0:
            return flask.jsonify("ERROR: Player cannot take more than two or less than zero of the same chips!")

        if grabbed_chips[x] == 1:
            if x == 5:
                return flask.jsonify("ERROR: Player cannot take wilds with the grab_chips function!")
            if game.field_chips[x] <= 0:
                return flask.jsonify("ERROR: Player tried to take unavailable chips from field!")

        if grabbed_chips[x] == 2:
            if x == 5:
                return flask.jsonify("ERROR: Player cannot take wilds with the grab_chips function!")
            if game.field_chips[x] < 4:
                return flask.jsonify("ERROR: Player cannot take two of the same gem type if there are less than four "
                                     "available!")
            is_two = True

    if grabbed != 2 and is_two:
        return flask.jsonify("ERROR: Player can only take two total chips if they take two chips from the same gem "
                             "type!")
    if grabbed != 3 and not is_two and not (grabbed < 3 and grabbed == field_ch):
        return flask.jsonify("ERROR: Player must take three chips total when taking chips of the different gem types, "
                             "unless there are not enough different chips on the field!")

    if returned > 0:
        if player_ch + grabbed - returned < 10:
            return flask.jsonify("ERROR: Player should not be returning chips if they don't have to!")
        if returned > 3:
            return flask.jsonify("ERROR: Player should be returning at most three chips in a turn of grab_chips!")

    if player_ch + grabbed - returned > 10:
        return flask.jsonify("ERROR: Player must be holding at most ten chips at end of turn!")

    player = game.players[player_id]
    for x in range(0, 6):
        player.player_chips[x] += grabbed_chips[x]
        player.player_chips[x] -= returned_chips[x]
        game.field_chips[x] += returned_chips[x]
        game.field_chips[x] -= grabbed_chips[x]

    p_index = 0
    for p_index in range(0, len(game.player_order)):
        if game.player_order[p_index] == player_id:
            break
    if p_index == len(game.player_order) - 1:
        p_index = 0
    else:
        p_index += 1
    game.player_turn = game.player_order[p_index]

    game.most_recent_action = player.username + " grabbed " + token_str(grb_cnt, grabbed_chips)
    if grabbed != 1:
        game.most_recent_action += "s"
    if returned > 0:
        game.most_recent_action += ", while returning " + token_str(ret_cnt, returned_chips)
        if returned != 1:
            game.most_recent_action += "!"
    game.most_recent_action += "!"

    if game.player_turn == game.player_order[0]:
        check_victory(game)

    return flask.jsonify("OK")


# player reserves card from field
def reserve_card(args, games, cards):
    player_id = args.get('player_id')
    session_id = args.get('session_id')
    reserved_card = args.get('reserved_card')
    returned_chips = args.get('returned_chips')

    if player_id is None or session_id is None or reserved_card is None or returned_chips is None:
        return flask.jsonify("ERROR: Missing important arguments!\nExpected: 'session_id', 'player_id', "
                             "'grabbed_chips', 'returned_chips'")

    player_id = int(player_id)
    reserved_card = int(reserved_card)
    returned_chips = json.loads(returned_chips)

    if session_id not in games.keys():
        return flask.jsonify("ERROR: Could not find game!")

    game = games[session_id]
    if player_id not in game.players.keys():
        return flask.jsonify("ERROR: Could not find player in game!")

    if game.player_turn == -3:
        return flask.jsonify("ERROR: The game has not been started yet!")

    if game.player_turn == -2:
        return flask.jsonify("ERROR: The game is over!")

    if game.player_turn != player_id:
        return flask.jsonify("ERROR: It is not " + game.players[player_id].username + "'s turn!")

    if len(returned_chips) != 6:
        return flask.jsonify("ERROR: returned_chips has incorrect syntax!\nValue should be a list of int length 6."
                             "\nExample: [0, 0, 1, 0, 0, 0]")

    player = game.players[player_id]
    if len(player.private_reserved_cards) >= 3:
        return flask.jsonify("ERROR: Player cannot reserve more than 3 cards at a time!")

    total_chips = 1  # wild token for reserving card
    returned = 0
    for x in range(0, 6):
        total_chips += player.player_chips[x]
        returned += returned_chips[x]

    if total_chips - returned > 10:
        return flask.jsonify("ERROR: Player may not hold more than ten chips at the end of their turn!")
    if returned > 0 and total_chips - returned < 10:
        return flask.jsonify("ERROR: Player should not be returning chips when they don't need to!")

    if 0 > reserved_card >= -3:
        index = (reserved_card * -1) - 1
        if game.cards_remaining[index] <= 0:
            return flask.jsonify("ERROR: No more cards are left in this deck!")
        reserved_card = game.card_order[index][game.total_cards[index] - game.cards_remaining[index]]
        game.field_cards[index].append(reserved_card)
        game.cards_remaining[index] -= 1

    index = [-1, -1]
    for x in range(0, len(game.field_cards)):
        for y in range(0, len(game.field_cards[x])):
            if game.field_cards[x][y] == reserved_card:
                index = [x, y]
                break
        if index[0] != -1:
            break

    if index[0] == -1:
        return flask.jsonify("ERROR: Card does not exist on the field at this time!")

    player.private_reserved_cards.append(reserved_card)
    player.player_reserved_cards.append(index[0]+1)
    game.field_cards[index[0]].pop(index[1])
    player.player_chips[5] += 1
    game.field_chips[5] -= 1

    if len(game.field_cards[index[0]]) < 4 and game.cards_remaining[index[0]] > 0:
        game.field_cards[index[0]].append(game.card_order[index[0]][game.total_cards[index[0]]
                                                                    - game.cards_remaining[index[0]]])
        game.cards_remaining[index[0]] -= 1

    if returned > 0:
        for x in range(0, 6):
            player.player_chips -= returned_chips[x]

    p_index = 0
    for p_index in range(0, len(game.player_order)):
        if game.player_order[p_index] == player_id:
            break
    if p_index == len(game.player_order) - 1:
        p_index = 0
    else:
        p_index += 1
    game.player_turn = game.player_order[p_index]

    game.most_recent_action = player.username + " reserved a card!"

    if game.player_turn == game.player_order[0]:
        check_victory(game)

    return flask.jsonify("OK")
