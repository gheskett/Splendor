import Phaser from "phaser"

import mainMenu from "./scenes/mainMenu.js"
import lobby from "./scenes/lobby.js"
import {eventManger} from "./scenes/eventHandler.js"
import board from "./scenes/board.js"
import chat from "./scenes/chat.js"

const config = {
  type: Phaser.AUTO,
  parent: "phaser-example",
  width: 1920,
  height: 1080,
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH
  },
  scene: {
    preload: preload,
    create: create,
  },
  dom: {
    createContainer: true,
  }
};

const game = new Phaser.Game(config);

function preload() {
  this.scene.add("mainMenu", mainMenu);
  this.scene.add("lobby", lobby);
  this.scene.add("eventManager", eventManger);
  this.scene.add("board", board);
  this.scene.add("chat", chat);
}

function create() {
  this.scene.start("eventManager");
}
