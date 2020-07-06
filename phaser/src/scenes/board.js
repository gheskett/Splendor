import { card } from "../classes/card.js"
import { serverManager } from "../classes/serverManager.js"
import { noble } from "../classes/noble.js"
import eventHandler from "./eventHandler.js"
import * as globals from "../globals.js"

import gameBackground from "../assets/images/game_bg.png"

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

    this.load.image("gameBackground", gameBackground);

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

    var outline = "card_outline_x1024";
    this.load.image(outline, outline + fExtension);

    outline = "circle_outline_x128";
    this.load.image(outline, outline + fExtension);

    for (var i = 1; i < 4; i++) {
      var name = "cardback_r" + i + "_731x1024";
      this.load.image(name, name + fExtension);
    }

    this.load.image("noble_front", "noble_front_x731" + fExtension);
  }

  create() {

    //The `thisBoard` constant is used to avoid potential conflicts with buttons, fetches, and events
    const thisBoard = this;
    thisBoard.boardOn = false;
    thisBoard.updatable = false;
    thisBoard.gameState = null;
    thisBoard.f_cards = [];
    thisBoard.f_nobles = [];
    thisBoard.f_chips = [];
    thisBoard.scene.sendToBack();

    //#region Game Variables

    const gameWidth = this.cameras.main.width, gameHeight = this.cameras.main.height;

    var boardOn = false;
    const DIM = .75;

    const exitBoard = this.add.image(globals.notChat * gameWidth - 25, 25, "exitButton").setInteractive({ useHandCursor: true }).setDepth(0);
    var leaveConfirmation = this.add.dom(gameWidth / 2, gameHeight / 2 - 80).createFromCache("confirmForm").setVisible(false).setDepth(2);
    leaveConfirmation.getChildByID("confirmationText").innerHTML = "Leave Game?";
    var dimmingObject = this.add.dom(0, 0).createFromCache("dimmingObject").setOrigin(0).setAlpha(DIM).setVisible(false).setDepth(1);
    var HTMLgroup = thisBoard.add.group([dimmingObject, leaveConfirmation]);
    var interactiveGroup = thisBoard.add.group([exitBoard]);

    this.add.image(0, 0, "gameBackground").setOrigin(0).setDepth(-1);

    HTMLgroup.getChildren().forEach(element => {
      element.setVisible(false);
    });
    interactiveGroup.getChildren().forEach(element => {
      element.disableInteractive();
    });

    //#endregion Game Variables

    draw_board();

    //#region Idk whatever Nathan did so idk what to name the region, but it should be renamed

    function draw_board() {
      for (i = 0; i < thisBoard.f_cards.length; ++i)
        thisBoard.f_cards[i].destroy();
      for (i = 0; i < thisBoard.f_nobles.length; ++i)
        thisBoard.f_nobles[i].destroy();
      for (i = 0; i < thisBoard.f_chips.length; ++i)
        thisBoard.f_chips[i].destroy();

      thisBoard.f_cards = [];
      thisBoard.f_nobles = [];
      thisBoard.f_chips = [];

      const spacingX = 16;
      const spacingY = 8;

      var width = 731 * thisBoard.scales;
      var height = 1024 * thisBoard.scales;

      var spacedWidth = width + spacingX;
      var spacedHeight = height + spacingY;

      var flippedCardStartX = thisBoard.centerX - spacedWidth * (numColumns / 2) + .5 * spacedWidth;
      var flippedCardStartY = thisBoard.upperBit + .5 * spacedHeight;
      var cardMid = flippedCardStartY + spacedHeight;

      for (var row = 0; row < numRows; row++) {
        //Display cards
        if (!thisBoard.gameState || thisBoard.gameState.cards_remaining[row] > 0) {
          thisBoard.f_cards.push(thisBoard.add.sprite(flippedCardStartX - spacedWidth - 16, flippedCardStartY + spacedHeight * (numRows - 1 - row), "cardback_r" + (row + 1) + "_731x1024").setScale(thisBoard.scales));
        }
        else {
          thisBoard.f_cards.push(thisBoard.add.sprite(flippedCardStartX - spacedWidth - 16, flippedCardStartY + spacedHeight * (numRows - 1 - row), "card_outline_x1024").setScale(thisBoard.scales));
        }

        for (var column = 0; column < numColumns; column++) {
          if (thisBoard.gameState != null && thisBoard.cardsDatabase != undefined)
            thisBoard.cards[row][column] = new card(thisBoard, thisBoard.gameState.field_cards[row][column]);
          else
            thisBoard.cards[row][column] = new card(thisBoard, -1);

          thisBoard.cards[row][column].drawCard(flippedCardStartX + spacedWidth * column,
            flippedCardStartY + spacedHeight * (numRows - 1 - row), width, height);
        }
      }

      var numNobles = 5;
      if (thisBoard.gameState != null)
        numNobles = thisBoard.gameState.field_nobles.length
      var scale = thisBoard.scales;
      var nobleHeight = 731 * scale;
      let nobleX = thisBoard.centerX + spacedWidth * (numColumns / 2) + .5 * nobleHeight + 20;
      let nobleY = cardMid - (numNobles / 2 * nobleHeight) + nobleHeight / 2;

      for (var i = 0; i < numNobles; i++) {
        if (thisBoard.gameState != null && thisBoard.noblesDatabase != undefined)
          thisBoard.nobles[i] = new noble(thisBoard, thisBoard.gameState.field_nobles[i]);
        else
          thisBoard.nobles[i] = new noble(thisBoard, -1);
        thisBoard.nobles[i].drawNoble(nobleX,
          nobleY + i * nobleHeight, nobleHeight, scale * 0.934);
      }

      const chipHeight = 64 + 32;

      var tokenX = flippedCardStartX - spacedWidth * 1.5 - chipHeight * .5 - 24;
      var tokenY = cardMid + chipHeight * .5 - chipHeight * 3;
      for (var chip in thisBoard.tokenSprites) {
        var num = thisBoard.server.lookUpFieldChips(thisBoard.gameState, chip);
        if (num > 0) {
          thisBoard.f_chips.push(thisBoard.add.sprite(tokenX, tokenY, thisBoard.tokenSprites[chip]));
        }
        else {
          thisBoard.f_chips.push(thisBoard.add.sprite(tokenX, tokenY, "circle_outline_x128").setScale(0.5));
          num = 0;
        }

        thisBoard.f_chips.push(thisBoard.add.sprite(tokenX, tokenY, num + "x64"));
        tokenY += chipHeight;
      }
    }

    //#endregion Idk whatever Nathan did so idk what to name the region, but it should be renamed

    //What to do when a new board is created
    eventHandler.on("new_board", function (data) {

      thisBoard.boardOn = true;

      thisBoard.scene.bringToTop();

      interactiveGroup.getChildren().forEach(element => {
        element.setInteractive({ useHandCursor: true });
      });

      fetch(globals.fullAddr + "/api/get_cards_database" + new URLSearchParams({
      }))
        .then(handleErrors)
        .then(result => {
          thisBoard.cardsDatabase = result
        }).then(function () {

          fetch(globals.fullAddr + "/api/get_nobles_database")
            .then(handleErrors)
            .then(result => {
              thisBoard.noblesDatabase = result
            }).then(function () {

              fetch(globals.fullAddr + "/api/get_game_state?" + new URLSearchParams({
                session_id: globals.lobbyID,
                playerID: globals.playerID
              }))
                .then(handleErrors)
                .then(result => {
                  if (result.exists) {
                    eventHandler.emit("update_game", result);

                    thisBoard.scene.bringToTop();

                    interactiveGroup.getChildren().forEach(element => {
                      element.setInteractive({ useHandCursor: true });
                    });

                  } else {
                    console.warn(result);
                    return;
                  }
                })
                .catch(error => {
                  console.error(error);
                  return;
                });
            })
            .catch(error => {
              console.error(error);
              return;
            });
        })

    });

    //Called whenever something happens in game
    eventHandler.on("update_game", function (data) {

      //only do something if the board is active and the session exists (Phaser is stupid)
      if (thisBoard.boardOn && data.exists) {
        thisBoard.gameState = data;
        if (thisBoard.updatable || thisBoard.gameState.is_started) {
          if (thisBoard.gameState.is_started)
            thisBoard.updatable = true;
          else
            thisBoard.updatable = false;

          // TODO: draw_player(active_view);
          draw_board();
          // TODO: if (thisBoard.gameState.victory.length > 0) { draw_victory(); }
        }
      }

    });

    //What to do when a board is destroyed
    eventHandler.on("terminate_board", function () {
      thisBoard.boardOn = false;
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
        if (globals.playerID === null && globals.lobbyID === null) {
          eventHandler.emit("new_main_menu");
          eventHandler.emit("terminate_chat");
          eventHandler.emit("terminate_board");
          return;
        }
        var args = {
          player_id: globals.playerID,
          session_id: globals.lobbyID,
        }
        fetch(globals.fullAddr + "/api/drop_out/", {
          method: "POST",
          headers: globals.headers,
          body: JSON.stringify(args)
        }).then(handleErrors)
          .then(result => {
            if (result === "OK") {
              eventHandler.emit("new_main_menu");
              eventHandler.emit("terminate_chat");
              eventHandler.emit("terminate_board");
              eventHandler.emit("terminate_info_bar");
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


