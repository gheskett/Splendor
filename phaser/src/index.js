import Phaser from "phaser"
import mainMenu from "./scenes/mainMenu.js"

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
var client;

const game = new Phaser.Game(config);

function preload() {
  client = ioc.connect( fullAddr );
  game.scene.add("mainMenu", mainMenu);
}

function create() {
  //#region Server Listeners

  // Called immediately when connection is made between the client and python server
  client.on("connect", () =>
  {
      console.log("Connected to API server!")
      // Connected, yay!
  });
  
  // Called immediately if client loses connection with server
  client.on('disconnect', () =>
  {
      console.log("Lost connection to API server!")
      // Disconnected, oh no!

      // TODO: send connection error message to client, return to homepage, clear out old game variables
  });

  // Called whenever lobby specific elements are updated ('/api/is_game_started' equivalent)
  this.client.on("/io/update_lobby/", (data) =>
  {
      console.log(data)
      // TODO: if is_started is true, start game
  });

  // Called whenever game elements are updated ('/api/get_game_state' equivalent)
  this.client.on("/io/update_game/", (data) =>
  {
      console.log(data)
  });

  // Called whenever somebody sends a message to the server ('/api/get_messages' equivalent)
  this.client.on("/io/update_chat/", (data) =>
  {
      console.log(data)
  });

  //#endregion Server Listeners

  this.scene.start("mainMenu", {client: client, fullAddr: fullAddr, headers:headers});
}
