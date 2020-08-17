import Phaser from 'phaser';
import eventHandler from './eventHandler.js';
import '../classes/infoBox.js';
import infoName from '../assets/html/info_bar_username.html';
import playerTurn from '../assets/html/player_turn.html';
import * as globals from '../globals.js';

export default class infoBar extends Phaser.Scene {
	constructor(config) {
		super(config);
	}

	preload() {
		this.load.html('infoName', infoName);
		this.load.html('playerTurn', playerTurn);
		this.load.path = 'src/assets/images/infoBarAssets/';
		this.load.spritesheet('uiTokens', 'ui_tokens.svg', { frameWidth: 104 });
		this.load.spritesheet('infoCards', 'info_cards.svg', { frameWidth: 36, frameHeight: 48 });
		this.load.spritesheet('reserveCards', 'reserve_cards.svg', { frameWidth: 40, frameHeight: 56 });
		this.load.svg('crown', 'crown.svg');
	}

	create() {
		//#region Initial Variables

		this.infoBarOn = false;
		const thisInfoBar = this;
		const gameWidth = this.cameras.main.width,
			gameHeight = this.cameras.main.height;
		const width = (1 - globals.notChat) * gameWidth;
		const boxWidth = 366,
			boxHeight = 224;

		let infoBoxes = [];
		let numPlayers = 0;

		const turnText = this.add
			.dom(gameWidth / 2, 25)
			.createFromCache('playerTurn')
			.setVisible(false)
			.setOrigin(0);

		//#endregion Initial Variable

		eventHandler.on('new_info_bar', function () {
			fetch(
				globals.fullAddr +
					'/api/get_game_state?' +
					new URLSearchParams({
						session_id: globals.lobbyID,
						player_id: globals.playerID,
					})
			)
				.then(handleErrors)
				.then((result) => {
					if (result.exists) {
						numPlayers = result.player_order.length;
                        createBoxes(result);
                        if (result.player_turn >= 0)
                            updateTurnText(result.players[result.player_turn.toString()]);
                        else
                            updateTurnText(null);
						turnText.setVisible(true);
						thisInfoBar.infoBarOn = true;
					} else {
						console.warn(result.most_recent_action);
					}
				})
				.catch((error) => {
					console.error(error);
				});
		});

		eventHandler.on('update_game', function (data) {
			if (thisInfoBar.infoBarOn) {
				if (data.player_order.length !== numPlayers) {
					numPlayers = data.player_order.length;
					createBoxes(data);
				} else {
					updateBoxes(data);
				}
				if (data.player_turn >= 0)
					updateTurnText(data.players[data.player_turn.toString()]);
				else
					updateTurnText(null);
			}
		});

		eventHandler.on('terminate_info_bar', function () {
			thisInfoBar.infoBarOn = false;
			for (let i = 0; i < infoBoxes.length; i++) {
				infoBoxes[i].kill();
			}
			infoBoxes = [];
			turnText.setVisible(false);
		});

		function createBoxes(data) {
			for (let i = 0; i < infoBoxes.length; i++) {
				infoBoxes[i].kill();
			}
			infoBoxes = [];
			for (let i = 0; i < data.player_order.length; i++) {
				infoBoxes[i] = thisInfoBar.add.infoBox(width / 2, i * gameHeight * 0.245 + 40 + boxHeight / 2);
			}
			updateBoxes(data);
		}

		function updateBoxes(data) {
			for (let i = 0; i < infoBoxes.length; i++) {
				let currentPlayerID = data.player_order[i];
				let updateInfo = data.players[currentPlayerID.toString()];
				updateInfo.isTurn = data.player_turn === currentPlayerID ? true : false;
				infoBoxes[i].update(updateInfo);
			}
		}

		function updateTurnText(data) {
            if (data === null) {
				turnText.getChildByID('turnValue').innerHTML = "The game is over!";
				turnText.getChildByID('turnValue').style.color = 'rgb(199, 199, 15)';
				turnText.getChildByID('turnText').innerHTML = "";
            }
            else if (data.player_id === globals.playerID) {
                turnText.getChildByID('turnValue').innerHTML = "YOUR TURN!";
                turnText.getChildByID('turnValue').style.color = 'yellow';
                turnText.getChildByID('turnText').innerHTML = "";
            } else {
                turnText.getChildByID('turnValue').innerHTML = data.username;
                turnText.getChildByID('turnValue').style.color = globals.playerColors[data.player_id];
                turnText.getChildByID('turnText').innerHTML = "'s Turn";
            }
			turnText.setX(gameWidth / 2 - turnText.width / 2);
		}

		function handleErrors(response) {
			if (!response.ok) {
				throw Error(response.statusText);
			}
			return response.json();
		}
	}

	update() {
		if (this.infoBarOn && this.scene.manager.getScenes().length !== this.scene.getIndex()) {
			this.scene.bringToTop();
		}
	}
}
