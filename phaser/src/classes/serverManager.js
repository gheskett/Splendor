export class serverManager {
  lookUpCard(cardId) {
    //TODO: actual numbers
    return {
      "card_id" : 0,
      "rank" : 1,
      "prestige_points" : 2,
      "gem_type" : "diamond",
      "diamond" : 0,
      "sapphire" : 1,
      "emerald" : 2,
      "ruby" : 0,
      "onyx" : 0
    }
  }

  lookUpNoble(nobleID) {
    //TODO: actual numbers
    return {
      "card_id" : 0,
      "rank" : 1,
      "prestige_points" : 3,
      "gem_type" : "diamond",
      "diamond" : 0,
      "sapphire" : 1,
      "emerald" : 2,
      "ruby" : 3,
      "onyx" : 0
    }
  }

  lookUpFieldChips(chipType) {
    return 1;
  }
}