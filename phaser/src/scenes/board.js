import { card } from "../classes/card.js"
import { serverManager } from "../classes/serverManager.js"
import { noble } from "../classes/noble.js"
import eventHandler from "./eventHandler.js"
import * as globals from "../globals.js"

import whiteRectangle from "../assets/images/white_rectangle.png"

const numRows = 3;
const numColumns = 4;

export default class board extends Phaser.Scene {
  constructor(config) {
    super(config)
  }

  init() {
    this.cards = [[], [], []];
    this.scales = .1875;

    //TODO: this should be auto-detected
    this.centerX = 1012;
    this.upperBit = 59;
    this.server = new serverManager();
    this.nobles = [];

    this.tokenSprites = {
      "diamond": "white",
      "sapphire": "blue",
      "emerald": "green",
      "ruby": "red",
      "onyx": "brown",
      "joker": "gold"
    };

    for (var i in this.tokenSprites) {
      this.tokenSprites[i] += "_token_x64"
    }
  }

  preload() {

    this.load.image("whiteRectangle", whiteRectangle);

    const fExtension = ".png";

    const sizes = ["64", "128", "256"];
    const colors = ["blue", "brown", "green", "red", "white", "gold"];

    this.load.path = "src/assets/images/boardAssets/"

    for (var size of sizes) {

      for (var i = 0; i < 10; i++) {
        var name = i + "x" + size;
        this.load.image(name, name + fExtension);
      }

      var shapes = ["circle", "rectangle", "symbol", "token"];

      for (var color of colors) {

        for (var shape of shapes) {
          var name = color + "_" + shape + "_x" + size;
          this.load.image(name, name + fExtension);
        }

      }
    }

    for (var color of colors) {

      if (color != "gold") {
        var name = "card_" + color + "_731x1024";
        this.load.image(name, name + fExtension);
      }

    }

    for (var i = 1; i < 4; i++) {
      var name = "cardback_r" + i + "_731x1024";
      this.load.image(name, name + fExtension);
    }

    this.load.image("noble_front", "noble_front_x731" + fExtension);
  }

  create() {

    //The `thisBoard` constant is used to aviod pontential conflicts with buttons, fetches, and events
    const thisBoard = this;
    thisBoard.scene.sendToBack();

    //#region Game Variables

    const gameWidth = this.cameras.main.width, gameHeight = this.cameras.main.height;

    var boardOn = false;
    const DIM = .75;

    const exitBoard = this.add.image(gameWidth - 50, 50, "exitButton").setInteractive({ useHandCursor: true }).setDepth(0);
    var leaveConfirmation = this.add.dom(gameWidth / 2, gameHeight / 2 - 80).createFromCache("confirmForm").setVisible(false).setDepth(2);
    leaveConfirmation.getChildByID("confirmationText").innerHTML = "Leave Game?";
    var dimmingObject = this.add.dom(0, 0).createFromCache("dimmingObject").setOrigin(0).setAlpha(DIM).setVisible(false).setDepth(1);
    var HTMLgroup = thisBoard.add.group([dimmingObject, leaveConfirmation]);
    var interactiveGroup = thisBoard.add.group([exitBoard]);

    const background = this.add.image(0, 0, "whiteRectangle").setOrigin(0).setDepth(-1);

    HTMLgroup.getChildren().forEach(element => {
      element.setVisible(false);
    });
    interactiveGroup.getChildren().forEach(element => {
      element.disableInteractive();
    });

    //#endregion Game Variables

    //#region Idk whatever Nathan did so idk what to name the region, but it should be renamed

    const spacingX = 16;
    const spacingY = 8;

    var width = 731 * thisBoard.scales;
    var height = 1024 * thisBoard.scales;

    var spacedWidth = width + spacingX;
    var spacedHeight = height + spacingY;

    var flippedCardStartX = thisBoard.centerX - spacedWidth * (numColumns / 2) + .5 * spacedWidth;
    var flippedCardStartY = this.upperBit + .5 * spacedHeight;
    var cardMid = flippedCardStartY + spacedHeight;

    for (var row = 0; row < numRows; row++) {
      //Display backwards cards
      //TODO: empty cards
      thisBoard.add.sprite(flippedCardStartX - spacedWidth - 16, flippedCardStartY + spacedHeight * row, "cardback_r" + (3 - row) + "_731x1024").setScale(thisBoard.scales);

      for (var column = 0; column < numColumns; column++) {
        //just display jnk data for now
        thisBoard.cards[row][column] = new card(thisBoard, 0);

        thisBoard.cards[row][column].drawCard(flippedCardStartX + spacedWidth * column,
          flippedCardStartY + spacedHeight * row, width, height);
      }
    }

    //TODO: get numbers from server
    var numNobles = 5;
    var scale = thisBoard.scales;
    var nobleHeight = 731 * scale;
    let nobleX = thisBoard.centerX + spacedWidth * (numColumns / 2) + .5 * nobleHeight + 20;
    let nobleY = cardMid - (numNobles / 2 * nobleHeight) + nobleHeight / 2;

    for (var i = 0; i < numNobles; i++) {
      //TODO: get data from server
      thisBoard.nobles[i] = new noble(thisBoard, 0);
      thisBoard.nobles[i].drawNoble(nobleX,
        nobleY + i * nobleHeight, nobleHeight, scale * 0.934);
    }

    const chipHeight = 64 + 32;

    var tokenX = flippedCardStartX - spacedWidth * 1.5 - chipHeight * .5 - 24;
    var tokenY = cardMid + chipHeight * .5 - chipHeight * 3;
    for (var chip in thisBoard.tokenSprites) {
      var num = thisBoard.server.lookUpFieldChips(chip);
      thisBoard.add.sprite(tokenX, tokenY, thisBoard.tokenSprites[chip]);
      thisBoard.add.sprite(tokenX, tokenY, num + "x64");
      tokenY += chipHeight;
    }

    //#endregion Idk whatever Nathan did so idk what to name the region, but it should be renamed

    //What to do when a new board is created
    eventHandler.on("new_board", function (data) {

      boardOn = true;

      thisBoard.scene.bringToTop();

      interactiveGroup.getChildren().forEach(element => {
        element.setInteractive({ useHandCursor: true });
      });

    });

    //Called whenever something happens in game
    eventHandler.on("update_game", function (data) {

      //only do something if the board is active and the session exists (Phaser is stupid)
      if (boardOn && data.exists) {

      }

    });

    //What to do when a board is destroyed
    eventHandler.on("terminate_board", function () {

      boardOn = false;
      HTMLgroup.getChildren().forEach(element => {
        element.setVisible(false);
      });
      interactiveGroup.getChildren().forEach(element => {
        element.disableInteractive();
      });

      thisBoard.scene.sendToBack();

    });


    //#region Exit Button Behavior
    exitBoard.on('pointerover', function () {
      this.setTint(0xdfdfdf).setScale(1.05);
    });

    exitBoard.on('pointerdown', function () {
      this.setTint(0xcccccc).setScale(.95);
    });

    exitBoard.on('pointerout', function () {
      this.setScale(1);
      this.clearTint();
    });

    exitBoard.on('pointerup', function () {
      this.setScale(1);
      this.clearTint();
      leaveConfirmation.setVisible(true);
      toggleBoardElements(false);
    });

    leaveConfirmation.addListener("click");
    leaveConfirmation.on("click", function (event) {

      if (event.target.name === "confirm") {
        if (thisBoard.playerID === null && thisBoard.lobbyID === null) {
          eventHandler.emit("new_main_menu");
          eventHandler.emit("terminate_board");
          return;
        }
        var args = {
          player_id: thisBoard.playerID,
          session_id: thisBoard.lobbyID,
        }
        fetch(globals.fullAddr + "/api/drop_out/", {
          method: "POST",
          headers: globals.headers,
          body: JSON.stringify(args)
        }).then(handleErrors)
          .then(result => {
            if (result === "OK") {
              eventHandler.emit("new_main_menu");
              eventHandler.emit("terminate_board");
            } else {
              console.warn(result);
            }
          }).catch(error => {
            console.error(error);
          });

        this.setVisible(false);
        toggleBoardElements(true);

      }

      if (event.target.name === "cancel") {

        this.setVisible(false);
        toggleBoardElements(true);

      }

    });
    //#endregion Exit Button Behavior

    /**
     * @param {boolean} enable
     * Enables/Disables Board Elements
     */
    function toggleBoardElements(enable) {
      if (enable) {
        dimmingObject.setVisible(false);
      }
      else {
        dimmingObject.setVisible(true);
      }
    }

    function handleErrors(response) {
      if (!response.ok) {
        throw Error(response.statusText);
      }
      return response.json();
    }

  }
}


