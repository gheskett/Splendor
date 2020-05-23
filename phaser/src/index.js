import Phaser from "phaser";
import newGame from "./assets/new_game.svg";
import joinGame from "./assets/join_game.svg";
import titleLogo from "./assets/title.svg"
import background from "./assets/pattern-background-frost-texture.jpg"

const config = {
  type: Phaser.AUTO,
  parent: "phaser-example",
  width: 800,
  height: 600,
  scene: {
    preload: preload,
    create: create
  }
};

const game = new Phaser.Game(config);

function preload() {
  this.load.svg("newGame", newGame);
  this.load.svg("joinGame", joinGame);
  this.load.svg("title", titleLogo);
  this.load.image("bg", background);
}

function create() {

  const SELECTED = 1
  const NOT_SELECTED = 0.7

  const bg = this.add.image(0, 0, "bg").setOrigin(0).setScale(1.5);
  const title = this.add.image(400, 100, "title");

  const newGame = this.add.sprite(400, 300, "newGame").setInteractive().setAlpha(NOT_SELECTED);
  const joinGame = this.add.image(400, 400, "joinGame").setInteractive().setAlpha(NOT_SELECTED);

  newGame.on('pointerover',function(pointer){
  newGame.setAlpha(SELECTED);
  });

  newGame.on('pointerout',function(pointer){
    newGame.setAlpha(NOT_SELECTED);
  });

  joinGame.on('pointerover',function(pointer){
    joinGame.setAlpha(SELECTED);
  });
  
  joinGame.on('pointerout',function(pointer){
    joinGame.setAlpha(NOT_SELECTED);
  });

}
