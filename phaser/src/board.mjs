import { card } from "./Card.mjs"
import { ServerManager } from "./ServerManager.mjs";
import { noble } from "./Noble.mjs";
import * as constants from "./Constants.mjs";

const numRows = 3;
const numColumns = 4;

export class BoardScene extends Phaser.Scene {
  constructor(fullAddr)
  {
    super('boardScene')

    this.fullAddr = fullAddr;
    this.cards = [[], [], []];
    this.scales = .1875;

    //TODO: this should be auto-detected
    this.centerX = 1012;
    this.centerY = 575;
    this.server = new ServerManager();
    this.nobles = [];
    
    this.tokenSprites = {
      "diamond": "white",
      "sapphire": "blue",
      "emerald": "green",
      "ruby": "red",
      "onyx": "brown",
      "joker": "gold"
  };

    for (var i in this.tokenSprites)
    {
      this.tokenSprites[i] += "_token_x64"
    }
  }

  preload() {
    const fExtension = ".png";

    const sizes = ["64", "128", "256"];
    const colors = ["blue", "brown", "green", "red", "white", "gold"];

    this.load.path = "src/assets/"

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
    const spacingX = 16;
    const spacingY = 8;

    var width = 731 * this.scales;
    var height = 1024 * this.scales;

    var spacedWidth = width + spacingX;
    var spacedHeight = height + spacingY;

    this.cameras.main.setBackgroundColor('#FFFFFF')

    let upperBit = 100;
    var flippedCardStartX = this.centerX - spacedWidth * (numColumns / 2) + .5 * spacedWidth;
    var flippedCardStartY = upperBit + .5 * spacedHeight;
    let cardMid = flippedCardStartY + spacedHeight;
    
    for (var row = 0; row < numRows; row++)
    {
      //Display backwards cards
      //TODO: empty cards
      this.add.sprite(flippedCardStartX - spacedWidth - 16, flippedCardStartY + spacedHeight * row, "cardback_r" + (3 - row) + "_731x1024").setScale(this.scales);

      for (var column = 0; column < numColumns; column++)
      {
        //just display jnk data for now
        this.cards[row][column] = new card(this, 0);

        this.cards[row][column].drawCard(flippedCardStartX + spacedWidth * column, 
          flippedCardStartY + spacedHeight * row, width, height);
      }
    }

    //TODO: get numbers from server
    var numNobles = 5;
    var scale = this.scales;
    console.log(scale);
    var nobleHeight = 731 * scale;
    let nobleX = this.centerX + spacedWidth * (numColumns / 2) + .5 * nobleHeight + 20;
    let nobleY = cardMid - (numNobles / 2 * nobleHeight) + nobleHeight / 2;
    for (var i = 0; i < numNobles; i++)
    {
      //TODO: get data from server
      this.nobles[i] = new noble(this, 0);
      this.nobles[i].drawNoble(nobleX,
        nobleY + i * nobleHeight, nobleHeight, scale * 0.934);
    }

    const chipHeight = 64 + 32;

    var tokenX = flippedCardStartX - spacedWidth * 1.5 - chipHeight * .5 - 24;
    var tokenY = cardMid + chipHeight * .5 - chipHeight * 3;
    for (var chip in this.tokenSprites)
    {
      var num = this.server.lookUpFieldChips(chip);
      this.add.sprite(tokenX, tokenY, this.tokenSprites[chip]);
      this.add.sprite(tokenX, tokenY, num + "x64");
      tokenY += chipHeight;
    }
  }
}


  