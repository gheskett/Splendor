import Phaser from "phaser";
import newGame from "./assets/new_game.svg";
import joinGame from "./assets/join_game.svg";
import titleLogo from "./assets/title.svg"
import background from "./assets/pattern-background-frost-texture.jpg"
import { boardScene } from "./board.mjs"

const config = {
  type: Phaser.AUTO,
  parent: "phaser-example",
  width: 1440,
  height: 900,
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH
  },
  scene: [{
   preload: preload,
   create: create
  },
  boardScene],
  dom: {
    createContainer: false,
  }
};

const game = new Phaser.Game(config);

function preload() {
  console.log("Orig preload started")

  this.load.svg("newGame", newGame);
  this.load.svg("joinGame", joinGame);
  this.load.svg("title", titleLogo);
  this.load.image("bg", background);
}

function create() {

  console.log("orig create started")

  const SELECTED = 1
  const NOT_SELECTED = 0.95

  const bg = this.add.image(0, 0, "bg").setOrigin(0).setScale(3);
  const title = this.add.image(720, 150, "title").setScale(1.5);

  const newGame = this.add.sprite(720, 420, "newGame").setInteractive().setAlpha(NOT_SELECTED);
  const joinGame = this.add.image(720, 550, "joinGame").setInteractive().setAlpha(NOT_SELECTED);

  newGame.on('pointerover',function(pointer){
  newGame.setAlpha(SELECTED).setScale(1.05);
  });

  newGame.on('pointerout',function(pointer){
    newGame.setAlpha(NOT_SELECTED).setScale(1);
  });

  newGame.on("pointerdown", function(pointer){
    this.scene.start("boardScene");
  }, this);

  joinGame.on('pointerover',function(pointer){
    joinGame.setAlpha(SELECTED).setScale(1.05);
  });
  
  joinGame.on('pointerout',function(pointer){
    joinGame.setAlpha(NOT_SELECTED).setScale(1);
  });

}
