import {card} from "../classes/card.js";
import {serverManager} from "../classes/serverManager.js";
import {noble} from "../classes/noble.js";
import {takeChips} from "../classes/takeChips.js";
import {returnChips} from "../classes/returnChips.js";
import eventHandler from "./eventHandler.js";
import "../classes/plusChip.js";
import * as globals from "../globals.js";

import gameBackground from "../assets/images/game_bg.png";

const numRows = 3;
const numColumns = 4;

export default class board extends Phaser.Scene {
	constructor(config) {
		super(config);
	}

	init() {
		this.cards = [[], [], [], []];
		this.scales = 0.1875;

		//TODO: this should be auto-detected
		this.centerX = 1012;
		this.upperBit = 150;
		this.server = new serverManager();
		this.nobles = [];

		this.tokenSprites = {
			diamond: "white",
			sapphire: "blue",
			emerald: "green",
			ruby: "red",
			onyx: "brown",
			joker: "gold",
		};

		for (var i in this.tokenSprites) {
			this.tokenSprites[i] += "_token_x64";
		}
	}

	preload() {
		this.load.image("gameBackground", gameBackground);
		this.load.html("returnChips", "src/assets/html/return_chips.html");

		const fExtension = ".png";

		const sizes = ["64", "128", "256"];
		const colors = ["blue", "brown", "green", "red", "white", "gold"];
		const rsvd = ["r1", "r2", "r3"];

		this.load.path = "src/assets/images/boardAssets/";

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

			for (var rank of rsvd) {
				var name = rank + "x" + size;
				this.load.image(name, name + fExtension);
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
		this.load.spritesheet("plus_signs", "plus_signs" + fExtension, {
			frameWidth: 32,
		});
		this.load.spritesheet("minus_signs", "minus_signs" + fExtension, {
			frameWidth: 32,
		});
		this.load.spritesheet("take_chips", "take_chips" + fExtension, {
			frameWidth: 128,
			frameHeight: 64,
		});
		this.load.spritesheet("purchase_button", "purchase_button" + fExtension, {
			frameWidth: 768,
			frameHeight: 192,
		});
		this.load.spritesheet("reserve_button", "reserve_button" + fExtension, {
			frameWidth: 768,
			frameHeight: 192,
		});
	}

	create() {
		//The `thisBoard` constant is used to avoid potential conflicts with buttons, fetches, and events
		const thisBoard = this;
		thisBoard.boardOn = false;
		thisBoard.updatable = false;
		thisBoard.gameState = null;
		thisBoard.f_cardbacks = [];
		thisBoard.f_nobles = [];
		thisBoard.f_chips = [];
		thisBoard.f_chipNumbers = [];
		thisBoard.f_UI = [];
		thisBoard.cardObjects = [];
		thisBoard.scene.sendToBack();

		//#region Game Variables

		const gameWidth = this.cameras.main.width,
			gameHeight = this.cameras.main.height;

		const DIM = 0.75;

		thisBoard.boardEvents = new Phaser.Events.EventEmitter();

		const exitBoard = this.add
			.image(globals.notChat * gameWidth - 25, 25, "exitButton")
			.setInteractive({useHandCursor: true})
			.setDepth(0);

		thisBoard.returnBox = this.add.existing(
			new returnChips(thisBoard, gameWidth / 2, gameHeight / 2, "returnChips")
		);

		var leaveConfirmation = this.add
			.dom(gameWidth / 2, gameHeight / 2 - 80)
			.createFromCache("confirmForm")
			.setVisible(false)
			.setDepth(2);
		leaveConfirmation.getChildByID("confirmationText").innerHTML = "Leave Game?";
		var dimmingObject = this.add
			.dom(0, 0)
			.createFromCache("dimmingObject")
			.setOrigin(0)
			.setAlpha(DIM)
			.setVisible(false)
			.setDepth(1);
		var HTMLgroup = thisBoard.add.group([dimmingObject, leaveConfirmation, thisBoard.returnBox]);

		var interactiveGroup = thisBoard.add.group([exitBoard]);

		this.add.image(0, 0, "gameBackground").setOrigin(0).setDepth(-1);

		HTMLgroup.getChildren().forEach(element => {
			element.setVisible(false);
		});
		interactiveGroup.getChildren().forEach(element => {
			element.disableInteractive();
		});

		eventHandler.on("disable_interactive", disabled => {
			thisBoard.boardEvents.emit("disable_interactive", disabled);
			toggleBoardElements(!disabled);
			if (thisBoard.boardOn && !disabled) {
				interactiveGroup.getChildren().forEach(element => {
					element.setInteractive({useHandCursor: true});
				});
			} else if (disabled) {
				interactiveGroup.getChildren().forEach(element => {
					element.disableInteractive();
				});
			}
		});

		//#endregion Game Variables

		draw_board();

		//#region Idk whatever Nathan did so idk what to name the region, but it should be renamed

		function draw_board() {
			for (i = 0; i < thisBoard.f_cardbacks.length; ++i) thisBoard.f_cardbacks[i].destroy();
			for (i = 0; i < thisBoard.f_nobles.length; ++i) thisBoard.f_nobles[i].destroy();
			for (i = 0; i < thisBoard.f_chips.length; ++i) thisBoard.f_chips[i].destroy();
			for (i = 0; i < thisBoard.f_chipNumbers.length; ++i) thisBoard.f_chipNumbers[i].destroy();
			for (i = 0; i < thisBoard.f_UI.length; ++i) thisBoard.f_UI[i].destroy();
			for (i = 0; i < thisBoard.cardObjects.length; ++i) thisBoard.cardObjects[i].destroy(true);
			thisBoard.boardEvents.removeAllListeners();

			thisBoard.f_cardbacks = [];
			thisBoard.f_nobles = [];
			thisBoard.f_chips = [];
			thisBoard.f_chipNumbers = [];
			thisBoard.f_UI = [];
			thisBoard.cardObjects = [];

			thisBoard.cachedChips = [0, 0, 0, 0, 0];

			const spacingX = 16;
			const spacingY = 8;

			var width = 731 * thisBoard.scales;
			var height = 1024 * thisBoard.scales;

			var spacedWidth = width + spacingX;
			var spacedHeight = height + spacingY;

			var flippedCardStartX = thisBoard.centerX - spacedWidth * (numColumns / 2) + 0.5 * spacedWidth;
			var flippedCardStartY = thisBoard.upperBit + 0.5 * spacedHeight;
			var cardMid = flippedCardStartY + spacedHeight;

			for (var row = 0; row < numRows; row++) {
				//Display cards
				if (!thisBoard.gameState || thisBoard.gameState.cards_remaining[row] > 0) {
					thisBoard.f_cardbacks.push(
						thisBoard.add
							.sprite(
								flippedCardStartX - spacedWidth - 16,
								flippedCardStartY + spacedHeight * (numRows - 1 - row),
								"cardback_r" + (row + 1) + "_731x1024"
							)
							.setScale(thisBoard.scales)
					);
				} else {
					thisBoard.f_cardbacks.push(
						thisBoard.add
							.sprite(
								flippedCardStartX - spacedWidth - 16,
								flippedCardStartY + spacedHeight * (numRows - 1 - row),
								"card_outline_x1024"
							)
							.setScale(thisBoard.scales)
					);
				}

				for (var column = 0; column < numColumns; column++) {
					if (thisBoard.gameState != null && thisBoard.cardsDatabase != undefined) {
						thisBoard.cards[row][column] = new card(
							thisBoard,
							thisBoard.gameState.field_cards[row][column]
						);
					} else thisBoard.cards[row][column] = new card(thisBoard, -1);

					thisBoard.cards[row][column].drawCard(
						flippedCardStartX + spacedWidth * column,
						flippedCardStartY + spacedHeight * (numRows - 1 - row),
						width,
						height,
						false
					);
				}
			}

			if (thisBoard.gameState != null && thisBoard.cardsDatabase != undefined && globals.playerID >= 0) {
				let curPlayer = thisBoard.gameState.players[globals.playerID];
				for (let count = 0; count < curPlayer.private_reserved_cards.length; ++count) {
					thisBoard.cards[numRows][count] = new card(thisBoard, curPlayer.private_reserved_cards[count]);
					thisBoard.cards[numRows][count].drawCard(
						flippedCardStartX + 46 + spacedWidth * 1.2 * count,
						flippedCardStartY + 60 + spacedHeight * numRows,
						width,
						height,
						true
					);
				}
			}

			var numNobles = 5;
			if (thisBoard.gameState != null) numNobles = thisBoard.gameState.field_nobles.length;
			var scale = thisBoard.scales;
			var nobleHeight = 731 * scale;
			let nobleX = thisBoard.centerX + spacedWidth * (numColumns / 2) + 0.5 * nobleHeight + 20;
			let nobleY = cardMid - (numNobles / 2) * nobleHeight + nobleHeight / 2;

			for (var i = 0; i < numNobles; i++) {
				if (thisBoard.gameState != null && thisBoard.noblesDatabase != undefined)
					thisBoard.nobles[i] = new noble(thisBoard, thisBoard.gameState.field_nobles[i]);
				else thisBoard.nobles[i] = new noble(thisBoard, -1);
				thisBoard.nobles[i].drawNoble(nobleX, nobleY + i * nobleHeight, nobleHeight, scale * 0.934);
			}

			thisBoard.isTurn = false;
			if (thisBoard.gameState) {
				if (thisBoard.gameState.player_turn === globals.playerID) {
					thisBoard.isTurn = true;
				}
			}

			const chipHeight = 64 + 32;
			const buttonDist = 48;

			var tokenX = flippedCardStartX - spacedWidth * 1.5 - chipHeight * 0.5 - 32;
			var tokenY = cardMid + chipHeight * 0.5 - chipHeight * 3;
			let chipNum = 0;

			if (thisBoard.isTurn) {
				thisBoard.f_UI.push(
					thisBoard.add.existing(new takeChips(thisBoard, tokenX, tokenY - 84, "take_chips"))
				);
			}

			for (var chip in thisBoard.tokenSprites) {
				var num = thisBoard.server.lookUpFieldChips(thisBoard.gameState, chip);
				if (num > 0) {
					thisBoard.f_chips.push(thisBoard.add.sprite(tokenX, tokenY, thisBoard.tokenSprites[chip]));
				} else {
					thisBoard.f_chips.push(thisBoard.add.sprite(tokenX, tokenY, "circle_outline_x128").setScale(0.5));
					num = 0;
				}

				thisBoard.f_chipNumbers.push(thisBoard.add.sprite(tokenX, tokenY, num + "x64"));

				if (thisBoard.isTurn && chipNum < 5) {
					thisBoard.f_UI.push(thisBoard.add.plusChip(tokenX + buttonDist, tokenY, chipNum));
					thisBoard.f_UI.push(thisBoard.add.minusChip(tokenX - buttonDist, tokenY, chipNum));
				}

				tokenY += chipHeight;
				chipNum++;
			}
		}

		//#endregion Idk whatever Nathan did so idk what to name the region, but it should be renamed

		//What to do when a new board is created
		eventHandler.on("new_board", function (data) {
			thisBoard.boardOn = true;

			thisBoard.scene.bringToTop();

			interactiveGroup.getChildren().forEach(element => {
				element.setInteractive({useHandCursor: true});
			});

			fetch(globals.fullAddr + "/api/get_cards_database" + new URLSearchParams({}))
				.then(handleErrors)
				.then(result => {
					thisBoard.cardsDatabase = result;
				})
				.then(function () {
					fetch(globals.fullAddr + "/api/get_nobles_database")
						.then(handleErrors)
						.then(result => {
							thisBoard.noblesDatabase = result;
						})
						.then(function () {
							fetch(
								globals.fullAddr +
									"/api/get_game_state?" +
									new URLSearchParams({
										session_id: globals.lobbyID,
										player_id: globals.playerID,
									})
							)
								.then(handleErrors)
								.then(result => {
									if (result.exists) {
										eventHandler.emit("update_game", result);

										thisBoard.scene.bringToTop();

										interactiveGroup.getChildren().forEach(element => {
											element.setInteractive({useHandCursor: true});
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
				});
		});

		//Called whenever something happens in game
		eventHandler.on("update_game", function (data) {
			//only do something if the board is active and the session exists (Phaser is stupid)
			if (thisBoard.boardOn && data.exists) {
				thisBoard.gameState = data;
				if (thisBoard.updatable || thisBoard.gameState.is_started) {
					if (thisBoard.gameState.is_started) thisBoard.updatable = true;
					else thisBoard.updatable = false;

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
		exitBoard.on("pointerover", function () {
			this.setTint(0xdfdfdf).setScale(1.05);
		});

		exitBoard.on("pointerdown", function () {
			this.setTint(0xcccccc).setScale(0.95);
		});

		exitBoard.on("pointerout", function () {
			this.setScale(1);
			this.clearTint();
		});

		exitBoard.on("pointerup", function () {
			this.setScale(1);
			this.clearTint();
			leaveConfirmation.setVisible(true);
			eventHandler.emit("disable_interactive", true);
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
				};
				fetch(globals.fullAddr + "/api/drop_out/", {
					method: "POST",
					headers: globals.headers,
					body: JSON.stringify(args),
				})
					.then(handleErrors)
					.then(result => {
						if (result === "OK") {
							eventHandler.emit("new_main_menu");
							eventHandler.emit("terminate_chat");
							eventHandler.emit("terminate_board");
							eventHandler.emit("terminate_info_bar");
						} else {
							console.warn(result);
						}
					})
					.catch(error => {
						console.error(error);
					});

				this.setVisible(false);
				eventHandler.emit("disable_interactive", false);
			} else if (event.target.name === "cancel") {
				this.setVisible(false);
				eventHandler.emit("disable_interactive", false);
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
			} else {
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

	calculateReturn(cardID) {
		let needed_chips = {diamond: 0, sapphire: 0, emerald: 0, ruby: 0, onyx: 0, joker: 0};
		const chipOrder = new Map([
			[0, "diamond"],
			[1, "sapphire"],
			[2, "emerald"],
			[3, "ruby"],
			[4, "onyx"],
			[5, "joker"],
		]);
		const player = this.gameState.players[globals.playerID.toString()];
		let jokers = 0;

		for (let i = 0; i < Object.keys(needed_chips).length - 1; i++) {
			let cardCost = this.server.lookUpCard(this.cardsDatabase, cardID)[chipOrder.get(i)];
			let cardWorth = player.player_num_gem_cards[chipOrder.get(i)];
			let adjustedCost = cardCost - cardWorth;
			if (adjustedCost < 0) {
				adjustedCost = 0;
			}

			if (adjustedCost > player.player_chips[chipOrder.get(i)]) {
				jokers += adjustedCost - player.player_chips[chipOrder.get(i)];
				adjustedCost -= adjustedCost - player.player_chips[chipOrder.get(i)];
			}
			needed_chips[chipOrder.get(i)] = adjustedCost;
		}

		needed_chips.joker = jokers;

		return needed_chips;
	}
}
