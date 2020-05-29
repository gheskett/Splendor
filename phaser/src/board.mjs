import { card } from "./card.mjs"

const numRows = 3;
const numColumns = 4;

export class boardScene extends Phaser.Scene {
  constructor()
  {
    super('boardScene')

    this.cards = [[], [], []];
    this.scales = .19;

    //TODO: this should be auto-detected
    this.centerX = 720;
    this.centerY = 450;
  }

  preload() {
    const fExtension = ".png";

    const sizes = ["64", "128", "256"];
    const colors = ["blue", "brown", "green", "red", "white", "gold"];

    this.load.path = "src/assets_tmp/"

    for (var size of sizes)
    {
      for (var i = 0; i < 10; i++)
      {
        var name = i + "x" + size;
        this.load.image(name, name + fExtension);
      }

      var shapes = ["circle", "rectangle", "symbol", "token"];

      for (var color of colors)
      {
        for (var shape of shapes)
        {
          var name = color + "_" + shape + "_x" + size;
          this.load.image(name, name + fExtension);
        }
      }
    }

    for (var color of colors)
    {
      if (color != "gold")
      {
        var name = "card_" + color + "_731x1024";
        this.load.image(name, name + fExtension);
      }
    }

    for (var i = 1; i < 4; i++)
    {
      var name = "cardback_r" + i + "_731x1024";
      this.load.image(name, name + fExtension);
    }

    this.load.image("noble_front", "noble_front_x731" + fExtension);
  }
    
  create() {
    var width = 731 * this.scales;
    var height = 1024 * this.scales;

    var flippedCardStartX = this.centerX - width * (numColumns / 2) + .5 * width;
    var flippedCardStartY = 30 + .5 * height;
    
    for (var row = 0; row < numRows; row++)
    {
      this.add.sprite(flippedCardStartX - width, flippedCardStartY + height * row, "cardback_r" + (row + 1) + "_731x1024").setScale(this.scales);

      for (var column = 0; column < numColumns; column++)
      {
        //just display jnk data for now
        this.cards[row][column] = new card(this, 0);

        this.cards[row][column].drawCard(flippedCardStartX + width * column, 
          flippedCardStartY + height * row, width, height);
      }
    }

    //TODO: get numbers from server
    var numNobles = 5;
    var scale = (height * numRows) / (numNobles * 731);
    var nobleHeight = 731 * scale;
    console.log("scale: " + scale);
    for (var i = 0; i < numNobles; i++)
    {
      this.add.sprite(flippedCardStartX + numColumns * width - width * .5 + nobleHeight * .5,
         flippedCardStartY + i * nobleHeight + nobleHeight * .5 - height * .5, "noble_front").setScale(scale);
    }
  }

  lookUpCard(cardId)
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
}


  