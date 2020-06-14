import { card } from "./card";

export class serverManager {
  lookUpCard(database, cardId) {
    //TODO: actual numbers
    if (cardId == -1) {
      return {
        "card_id" : 0,
        "rank" : 1,
        "prestige_points" : 0,
        "gem_type" : "diamond",
        "diamond" : 0,
        "sapphire" : 0,
        "emerald" : 0,
        "ruby" : 0,
        "onyx" : 0
      };
    }

    let card = database[cardId]

    return {
      "card_id" : card.card_id,
      "rank" : card.rank,
      "prestige_points" : card.prestige_points,
      "gem_type" : card.gem_type,
      "diamond" : card.diamond,
      "sapphire" : card.sapphire,
      "emerald" : card.emerald,
      "ruby" : card.ruby,
      "onyx" : card.onyx
    };
  }

  lookUpNoble(database, nobleId) {
    //TODO: actual numbers
    if (nobleId == -1) {
      return {
        "noble_id" : 0,
        "prestige_points" : 0,
        "diamond" : 0,
        "sapphire" : 0,
        "emerald" : 0,
        "ruby" : 0,
        "onyx" : 0
      };
    }

    let noble = database[nobleId]

    return {
      "noble_id" : noble.noble_id,
      "prestige_points" : noble.prestige_points,
      "diamond" : noble.diamond,
      "sapphire" : noble.sapphire,
      "emerald" : noble.emerald,
      "ruby" : noble.ruby,
      "onyx" : noble.onyx
    };
  }

  lookUpFieldChips(game, chipType) {
    if (game == null)
      return 0;
    return game.field_chips[chipType];
  }
}