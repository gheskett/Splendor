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
    this.centerX = 720;
    this.centerY = 450;
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

    var flippedCardStartX = this.centerX - spacedWidth * (numColumns / 2) + .5 * spacedWidth - 8;
    var flippedCardStartY = 30 + .5 * spacedHeight;
    
    for (var row = 0; row < numRows; row++)
    {
      //Display backwards cards
      //TODO: empty cards
      this.add.sprite(flippedCardStartX - spacedWidth, flippedCardStartY + spacedHeight * row, "cardback_r" + (3 - row) + "_731x1024").setScale(this.scales);

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
    for (var i = 0; i < numNobles; i++)
    {
      //TODO: get data from server
      this.nobles[i] = new noble(this, 0);
      //TODO: fix me
      this.nobles[i].drawNoble(flippedCardStartX + numColumns * width - width * .5 + nobleHeight * .5,
        flippedCardStartY + i * nobleHeight + nobleHeight * .5 - height * .5, nobleHeight, scale);
    }

    const chipHeight = 64 + 32;

    var tokenX = this.centerX - spacedWidth * 3 - chipHeight * .5;
    var tokenY = 30 + chipHeight * .5;
    for (var chip in this.tokenSprites)
    {
      var num = this.server.lookUpFieldChips(chip);
      this.add.sprite(tokenX, tokenY, this.tokenSprites[chip]);
      this.add.sprite(tokenX, tokenY, num + "x64");
      tokenY += chipHeight;
    }
  }
}


  