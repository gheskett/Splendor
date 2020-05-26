import Phaser from "phaser";
import newGame from "./assets/new_game.svg";
import joinGame from "./assets/join_game.svg";
import titleLogo from "./assets/title.svg"
import background from "./assets/pattern-background-frost-texture.jpg"
import usernameForm from "./assets/username_form.html"

const config = {
  type: Phaser.AUTO,
  parent: "phaser-example",
  width: 1440,
  height: 900,
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH
  },
  scene: {
    preload: preload,
    create: create
  },
  dom: {
    createContainer: true,
  }
};

const game = new Phaser.Game(config);

function preload() {
  this.load.svg("newGame", newGame);
  this.load.svg("joinGame", joinGame);
  this.load.svg("title", titleLogo);
  this.load.image("bg", background);
  this.load.html("usernameForm", usernameForm);
}

function create() {
  //#region Game Variables
  const gameWidth = 1440, gameHight = 900;

  const SELECTED = 1
  const NOT_SELECTED = 0.90

  const bg = this.add.image(0, 0, "bg").setOrigin(0).setScale(3);
  const title = this.add.image(gameWidth / 2, 150, "title").setScale(1.5);

  const newGame = this.add.image(gameWidth / 2, 420, "newGame").setInteractive().setAlpha(NOT_SELECTED);
  const joinGame = this.add.image(gameWidth / 2, 550, "joinGame").setInteractive().setAlpha(NOT_SELECTED);

  var usernameForm = this.add.dom(gameWidth / 2, gameHight / 2).createFromCache("usernameForm").setVisible(false);
  //#endregion Game Variables

  //#region Mouse-button behavior
  newGame.on('pointerover', function() {
    this.setAlpha(SELECTED).setScale(1.05);
  });

  newGame.on('pointerdown', function() {
    this.setTint(0xdddddd);
    this.setScale(.95);
  });

  newGame.on('pointerout', function() {
    this.setAlpha(NOT_SELECTED).setScale(1);
    this.clearTint();
  });

  joinGame.on('pointerdown', function() {
    this.setTint(0xdddddd);
    this.setScale(.95);
  });

  joinGame.on('pointerover', function() {
    this.setAlpha(SELECTED).setScale(1.05);
  });
  
  joinGame.on('pointerout', function() {
    this.setAlpha(NOT_SELECTED).setScale(1);
    this.clearTint();
  });
  //#endregion Mouse-button behavior

  //#region Button Click Behavior
  newGame.on('pointerup', function() {
    this.setAlpha(NOT_SELECTED).setScale(1);
    this.clearTint();
    usernameForm.setVisible(true);
    playButtonEnable(false);
  });

  joinGame.on('pointerup', function() {
    this.setAlpha(NOT_SELECTED).setScale(1);
    this.clearTint();
  });
  //#endregion Button Click Behavior

  usernameForm.addListener("click");
  usernameForm.on("click", function (event) {

    var inputText = this.getChildByName("usernameField");
    if (event.target.name === "start") {
      
      this.setVisible(false);
      playButtonEnable(true);
      
    }

    //Enable play buttons and remove username form on cancel
    if (event.target.name === "cancel") {

      this.setVisible(false);
      playButtonEnable(true);

    }

  });

  /**
   * @param {boolean} enable
   * Enables/disables the play button input
   */
  function playButtonEnable(enable) {
    if (enable) {
      newGame.setInteractive();
      joinGame.setInteractive();
    } 
    else {
      newGame.disableInteractive();
      joinGame.disableInteractive();
    }
  }

}
