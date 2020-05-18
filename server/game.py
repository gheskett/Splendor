import random
import flask
import json

gems = ["Diamond", "Sapphire", "Emerald", "Ruby", "Onyx", "Joker"]
gem_ids = ["diamond", "sapphire", "emerald", "ruby", "onyx", "joker"]


def check_victory(game):
    highest_pp = 0
    lowest_count = -1
    for _, value in game.players.items():
        if value.prestige_points >= highest_pp:
            highest_pp = value.prestige_points

    if highest_pp < 15:
        return

    for _, value in game.players.items():
        tmp = 0
        for x in range(0, 5):
            tmp += value.player_num_gem_cards[x]
            if lowest_count < 0 or tmp < lowest_count:
                lowest_count = tmp

    for _, value in game.players.items():
        if value.prestige_points != highest_pp:
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

        game.most_recent_action += "\n\nThe game is over! Winner"
        if len(game.victory) > 1:
            game.most_recent_action += "s"
        game.most_recent_action += ": "
        for x in range(0, len(game.victory)):
            game.most_recent_action += game.players[game.victory[x]].username
            if x != len(game.victory) - 1:
                game.most_recent_action += ", "


def next_turn(game):
    p_index = 0
    for p_index in range(0, len(game.player_order)):
        if game.player_order[p_index] == game.player_turn:
            break
    if p_index == len(game.player_order) - 1:
        p_index = 0
    else:
        p_index += 1
    game.player_turn = game.player_order[p_index]

    if game.player_turn == game.player_order[0]:
        check_victory(game)


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
        value.prestige_points = 0

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
        return_game["host_id"] = game.host_id

        players = {}
        for _, value in game.players.items():
            player = {"player_id": value.player_id,
                      "username": value.username
                      }
            players[player["player_id"]] = player
        return_game["players"] = players
        return flask.jsonify(return_game)

    started = True
    if game.player_turn < 0:
        started = False

    if player_id is None:
        player_id = -1

    player_id = int(player_id)

    players = {}
    for _, value in game.players.items():
        player_gems = {}
        player_gem_cards = {}
        for x in range(0, len(value.player_chips)):
            player_gems[gem_ids[x]] = value.player_chips[x]
        for x in range(0, len(value.player_num_gem_cards)):
            player_gem_cards[gem_ids[x]] = value.player_num_gem_cards[x]
        player = {"player_id": value.player_id,
                  "username": value.username,
                  "player_cards": value.player_cards,
                  "player_reserved_cards": value.player_reserved_cards,
                  "private_reserved_cards": None,
                  "player_chips": player_gems,
                  "player_nobles": value.player_nobles,
                  "player_num_gem_cards": player_gem_cards,
                  "prestige_points": value.prestige_points
                  }

        if player_id == value.player_id:
            player["private_reserved_cards"] = value.private_reserved_cards
        players[player["player_id"]] = player

    field_gems = {}
    for x in range(0, len(game.field_chips)):
        field_gems[gem_ids[x]] = game.field_chips[x]
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
        "field_chips": field_gems,
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

    if len(grabbed_chips) != 6 or not isinstance(grabbed_chips, dict):
        return flask.jsonify("ERROR: grabbed_chips has incorrect syntax!\nValue should be a dictionary length 6.")
    if len(returned_chips) != 6 or not isinstance(returned_chips, dict):
        return flask.jsonify("ERROR: returned_chips has incorrect syntax!\nValue should be a dictionary length 6.")

    grabbed_chips = [grabbed_chips['diamond'], grabbed_chips['sapphire'], grabbed_chips['emerald'],
                     grabbed_chips['ruby'], grabbed_chips['onyx'], grabbed_chips['joker']]
    returned_chips = [returned_chips['diamond'], returned_chips['sapphire'], returned_chips['emerald'],
                      returned_chips['ruby'], returned_chips['onyx'], returned_chips['joker']]

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

        if grabbed_chips[x] < 0:
            return flask.jsonify("ERROR: Player cannot take negative chips!")

        if returned_chips[x] < 0:
            return flask.jsonify("ERROR: Player cannot return negative chips!")

        if returned_chips[x] > game.players[player_id].player_chips[x] + grabbed_chips[x]:
            return flask.jsonify("ERROR: Player cannot return chips they do not have or did not pick up!")

        if grabbed_chips[x] > 2 or grabbed_chips[x] < 0:
            return flask.jsonify("ERROR: Player cannot take more than two or less than zero of the same chips!")

        if grabbed_chips[x] == 1:
            if x == 5:
                return flask.jsonify("ERROR: Player cannot take jokers with the grab_chips function!")
            if game.field_chips[x] <= 0:
                return flask.jsonify("ERROR: Player tried to take unavailable chips from field!")

        if grabbed_chips[x] == 2:
            if x == 5:
                return flask.jsonify("ERROR: Player cannot take jokers with the grab_chips function!")
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

    game.most_recent_action = player.username + " grabbed " + token_str(grb_cnt, grabbed_chips)
    if grabbed != 1:
        game.most_recent_action += "s"
    if returned > 0:
        game.most_recent_action += ", while returning " + token_str(ret_cnt, returned_chips)
        if returned != 1:
            game.most_recent_action += "s"
    game.most_recent_action += "!"

    next_turn(game)

    return flask.jsonify("OK")


# player reserves card from field
def reserve_card(args, games):
    player_id = args.get('player_id')
    session_id = args.get('session_id')
    reserved_card = args.get('reserved_card')
    returned_chips = args.get('returned_chips')

    if player_id is None or session_id is None or reserved_card is None or returned_chips is None:
        return flask.jsonify("ERROR: Missing important arguments!\nExpected: 'session_id', 'player_id', "
                             "'reserved_card', 'returned_chips'")

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

    if len(returned_chips) != 6 or not isinstance(returned_chips, dict):
        return flask.jsonify("ERROR: returned_chips has incorrect syntax!\nValue should be a dictionary length 6.")

    returned_chips = [returned_chips['diamond'], returned_chips['sapphire'], returned_chips['emerald'],
                      returned_chips['ruby'], returned_chips['onyx'], returned_chips['joker']]

    player = game.players[player_id]
    if len(player.private_reserved_cards) + 1 > 3:
        return flask.jsonify("ERROR: Player cannot reserve more than 3 cards at a time!")

    total_chips = 1  # joker token for reserving card
    if game.field_chips[5] <= 0:
        total_chips = 0
    returned = 0
    for x in range(0, 6):
        total_chips += player.player_chips[x]
        returned += returned_chips[x]

        if returned_chips[x] < 0:
            return flask.jsonify("ERROR: Player cannot return negative chips!")

    if total_chips - returned > 10:
        return flask.jsonify("ERROR: Player may not hold more than ten chips at the end of their turn!")
    if returned > 0 and total_chips - returned < 10:
        return flask.jsonify("ERROR: Player should not be returning chips when they don't need to!")

    index = [-1, -1]
    if 0 > reserved_card >= -3:
        index[0] = (reserved_card * -1) - 1
        if game.cards_remaining[index[0]] <= 0:
            return flask.jsonify("ERROR: No more cards are left in this deck!")
        reserved_card = game.card_order[index[0]][game.total_cards[index[0]] - game.cards_remaining[index[0]]]

    if index[0] == -1:
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

    if index[1] != -1:
        if game.cards_remaining[index[0]] > 0:
            game.field_cards[index[0]][index[1]] = game.card_order[index[0]][game.total_cards[index[0]]
                                                                             - game.cards_remaining[index[0]]]
        else:
            game.field_cards[index[0]][index[1]] = None

    game.most_recent_action = player.username + " reserved a card of rank " + str(index[0] + 1)

    if game.field_chips[5] > 0:
        player.player_chips[5] += 1
        game.field_chips[5] -= 1
        game.most_recent_action += " and earned a " + gems[5] + " token"

    game.most_recent_action += "!"

    game.cards_remaining[index[0]] -= 1

    if returned > 0:
        for x in range(0, 6):
            player.player_chips -= returned_chips[x]

    next_turn(game)

    return flask.jsonify("OK")


# player buys card from field
def buy_card(args, games, cards, nobles):
    player_id = args.get('player_id')
    session_id = args.get('session_id')
    purchased_card = args.get('purchased_card')
    returned_chips = args.get('returned_chips')
    noble_acquired = args.get('noble_acquired')

    if player_id is None or session_id is None or purchased_card is None or returned_chips is None \
            or noble_acquired is None:
        return flask.jsonify("ERROR: Missing important arguments!\nExpected: 'session_id', 'player_id', "
                             "'purchased_card', 'returned_chips', 'noble_acquired'")

    player_id = int(player_id)
    purchased_card = int(purchased_card)
    returned_chips = json.loads(returned_chips)
    noble_acquired = int(noble_acquired)

    if session_id not in games.keys():
        return flask.jsonify("ERROR: Could not find game!")

    game = games[session_id]
    if player_id not in game.players.keys():
        return flask.jsonify("ERROR: Could not find player in game!")

    if game.player_turn == -3:
        return flask.jsonify("ERROR: The game has not been started yet!")

    card = None
    noble = None
    for x in range(0, len(cards)):
        if cards[x].card_id == purchased_card:
            card = cards[x]
            break
    if card is None:
        return flask.jsonify("ERROR: Requested card does not exist in game!")

    if noble_acquired > 0:
        for x in range(0, len(nobles)):
            if nobles[x].noble_id == noble_acquired:
                noble = nobles[x]
                break
        if noble is None:
            return flask.jsonify("ERROR: Acquired noble does not exist in game!")

    if game.player_turn == -2:
        return flask.jsonify("ERROR: The game is over!")

    if game.player_turn != player_id:
        return flask.jsonify("ERROR: It is not " + game.players[player_id].username + "'s turn!")

    if len(returned_chips) != 6 or not isinstance(returned_chips, dict):
        return flask.jsonify("ERROR: returned_chips has incorrect syntax!\nValue should be a dictionary length 6.")

    returned_chips = [returned_chips['diamond'], returned_chips['sapphire'], returned_chips['emerald'],
                      returned_chips['ruby'], returned_chips['onyx'], returned_chips['joker']]

    player = game.players[player_id]

    # is card present in game?
    card_location = [-1, -1]
    noble_location = -1
    for x in range(0, len(game.field_cards)):
        for y in range(0, len(game.field_cards[x])):
            if purchased_card == game.field_cards[x][y]:
                card_location = [x, y]
                break
        if card_location[0] != -1:
            break

    # is card present in reserved stash?
    if card_location[0] == -1:
        for x in range(0, len(player.private_reserved_cards)):
            if purchased_card == player.private_reserved_cards[x]:
                card_location = [len(game.field_cards), x]

    if card_location[0] == -1:
        return flask.jsonify("ERROR: The current player does not have access to purchase this card!")

    # is noble present in game?
    if noble is not None:
        for x in range(0, len(game.field_nobles)):
            if noble_acquired == game.field_nobles[x]:
                noble_location = x
                break
        if noble_location == -1:
            return flask.jsonify("ERROR: The desired noble is not currently up for grabs!")

    chip_offset = [card.diamond, card.sapphire, card.emerald, card.ruby, card.onyx, 0]
    gem_type = card.gem_type

    # is card request valid?
    for x in range(0, 6):
        if x != 5:
            chip_offset[x] -= player.player_num_gem_cards[x]
            if chip_offset[x] < 0:
                chip_offset[x] = 0
        if returned_chips[x] < 0:
            return flask.jsonify("ERROR: Player cannot return negative chips!")
        if returned_chips[x] > player.player_chips[x]:
            return flask.jsonify("ERROR: Player cannot return chips they don't have!")

    for x in range(0, 5):
        chip_offset[x] -= returned_chips[x]
        if chip_offset[x] < 0:
            return flask.jsonify("ERROR: Player tried to return more " + gems[x] + " chips than needed!")
        if chip_offset[x] > 0:
            chip_offset[5] += chip_offset[x]
            chip_offset[x] = 0

    if chip_offset[5] < returned_chips[5]:
        return flask.jsonify("ERROR: Player tried to return more " + gems[5] + " chips than needed!")
    if chip_offset[5] > returned_chips[5]:
        return flask.jsonify("ERROR: Player has not selected the necessary chips required to buy card!")

    # is noble request valid?
    if noble is not None:
        noble_req = [noble.diamond, noble.sapphire, noble.emerald, noble.ruby, noble.onyx]
        for x in range(0, 5):
            if player.player_num_gem_cards[x] + (1 if gem_type == x else 0) < noble_req[x]:
                return flask.jsonify("ERROR: Player unqualified to acquire noble!")
    else:
        for x in range(0, len(game.field_nobles)):
            noble_req = None
            for y in range(0, len(nobles)):
                if nobles[y].noble_id == game.field_nobles[x]:
                    noble_req = [nobles[y].diamond, nobles[y].sapphire, nobles[y].emerald, nobles[y].ruby,
                                 nobles[y].onyx]
                    break
            if noble_req is None:
                print("ERROR: Field nobles acquired a noble ID that does not exist! ID=" + str(game.field_nobles[x]),
                      flush=True)
                return flask.jsonify("ERROR: Fatal server error, please see server!")
            acquirable = True
            for y in range(0, 5):
                if player.player_num_gem_cards[y] + (1 if gem_type == y else 0) < noble_req[y]:
                    acquirable = False
                    break

            if acquirable:
                return flask.jsonify("ERROR: Player can and must acquire a noble!")

    # checks passed, change actual game data
    if noble is not None:
        player.player_nobles.append(noble_acquired)
        game.field_nobles.pop(noble_location)
        player.prestige_points += noble.pp

    player.player_cards.append(purchased_card)
    if card_location[0] == len(game.field_cards):
        player.private_reserved_cards.pop(card_location[1])
        player.player_reserved_cards.pop(card_location[1])
    else:
        if game.cards_remaining[card_location[0]] > 0:
            game.field_cards[card_location[0]][card_location[1]] = \
                game.card_order[card_location[0]][game.total_cards[card_location[0]]
                                                  - game.cards_remaining[card_location[0]]]
            game.cards_remaining[card_location[0]] -= 1
        else:
            game.field_cards[card_location[0]][card_location[1]] = None

    player.player_num_gem_cards[gem_type] += 1
    player.prestige_points += card.pp

    for x in range(0, 6):
        player.player_chips[x] -= returned_chips[x]
        game.field_chips[x] += returned_chips[x]

    game.most_recent_action = player.username + " purchased a"
    if gem_type == 2 or gem_type == 4:
        game.most_recent_action += "n"
    game.most_recent_action += " " + gems[gem_type] + " card"
    if card_location[0] == len(game.field_cards):
        game.most_recent_action += " from their reserved stash"
    if card.pp > 0:
        game.most_recent_action += " worth " + str(card.pp) + " prestige point"
        if card.pp > 1:
            game.most_recent_action += "s"
    if noble is not None:
        game.most_recent_action += " and acquired a noble tile"
        if noble.pp > 0:
            game.most_recent_action += " worth " + str(noble.pp) + " prestige point"
            if noble.pp > 1:
                game.most_recent_action += "s"
    game.most_recent_action += "!"

    next_turn(game)

    return flask.jsonify("OK")
