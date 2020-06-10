import Phaser from "phaser"

import mainMenu from "./scenes/mainMenu.js"
import lobby from "./scenes/lobby.js"
import {eventManger} from "./scenes/eventHandler.js"
import Phaser from "phaser";

import { BoardScene } from "./board.mjs"
import * as constants from "./Constants.mjs"


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

var ioc = require('socket.io-client');
const ip = "http://localhost"
const port = 36251
const fullAddr = ip + ":" + port
const headers = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*"
}

const game = new Phaser.Game(config);

function preload() {
  this.scene.add("mainMenu", mainMenu);
  this.scene.add("lobby", lobby);
  this.scene.add("eventManager", eventManger);
  this.scene.add("board", BoardScene);
}

function create() {
  this.scene.start("eventManager", {ioc: ioc, fullAddr: fullAddr, headers: headers});
}
