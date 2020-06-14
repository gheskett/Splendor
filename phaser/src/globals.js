//#region constants

export const ioc = require('socket.io-client');
export const ip = "http://localhost";
export const port = 36251;
export const fullAddr = ip + ":" + port;
export const headers = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*"
};
export const notChat = 0.8;
export const lobbyColors = ['linear-gradient(to top, rgb(175, 0, 0), rgb(255, 60, 55))',
  'linear-gradient(to top, rgb(0, 90, 200), rgb(47, 143, 255))',
  'linear-gradient(to top, rgb(190, 0, 190), rgb(255, 47, 255))',
  'linear-gradient(to top, rgb(0, 161, 0), rgb(47, 209, 47))'];

//#endregion constants

//#region variables
/** @global @type {integer}  */
export var playerID;
export function setPlayerID (value) {
  playerID = value;
}

/** @global @type {string}  */
export var lobbyID;
export function setLobbyID (value) {
  lobbyID = value;
}

/** @global @type {Array <string>}  */
export var usernames = ["", "", "", ""];
export function setUsername (value, index) {
  usernames[index] = value;
}

//#endregion variables