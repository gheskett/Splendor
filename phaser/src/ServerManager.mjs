import * as constants from "./Constants.mjs"

export class ServerManager {
  function lookUpCard(cardId)
  {
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

  function lookUpNoble(nobleID)
  {
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

  function lookUpFieldChips(chipType)
  {
    return 1;
  }

  async function getAssetNames()
  {
    let response = await fetch(constants.fullAddr + "/api/get_assets/", {
      method: "GET",
      headers: constants.headers
    });
    let data = await response.json();
    return data;
  }
}