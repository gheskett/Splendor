//#region constants

export const ioc = require('socket.io-client');
// export const ip = 'http://localhost';
export const ip = window.location.protocol + "//" + window.location.hostname;
export const port = 36251;
export const fullAddr = ip + ':' + port;
// console.log(fullAddr);
export const headers = {
	'Content-Type': 'application/json',
	'Access-Control-Allow-Origin': '*',
};
export const notChat = 0.8;
export const lobbyColors = [
	'linear-gradient(to top, rgb(150, 0, 0), rgb(255, 70, 70))',
	'linear-gradient(to top, rgb(20, 80, 180), rgb(47, 143, 255))',
	'linear-gradient(to top, rgb(110, 0, 140), rgb(188, 0, 255))',
	'linear-gradient(to top, rgb(20, 105, 15), rgb(20, 170, 0))',
];
export const playerColors = ['rgb(255, 70, 70)', 'rgb(47, 143, 255)', 'rgb(223, 31, 255)', 'rgb(20, 170, 0)'];

//#endregion constants

//#region variables
/** @global @type {integer} The player id of this player */
export var playerID;
export function setPlayerID(value) {
	playerID = value;
}

setPlayerID(-1);

/** @global @type {string}  The id of the lobby */
export var lobbyID;
export function setLobbyID(value) {
	lobbyID = value;
}

/** @global @type {Array <string>}  Array converting player id to username */
export var usernames = ['', '', '', ''];
export function setUsername(value, index) {
	usernames[index] = value;
}

//#endregion variables
