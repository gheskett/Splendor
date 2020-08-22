import * as globals from "../globals.js";
import eventHandler from "../scenes/eventHandler.js";
export class card {
	constructor(board, cardID) {
		this.board = board;
		this.cardID = cardID;

		this.cardMap = {
			onyx: "brown",
			ruby: "red",
			emerald: "green",
			sapphire: "blue",
			diamond: "white",
		};

		this.spriteCostMap = {};
		for (var color in this.cardMap) {
			this.spriteCostMap[color] = this.cardMap[color] + "_circle_x64";
		}
	}

	getCardName(color) {
		return "card_" + color + "_731x1024";
	}

	drawCard(x, y, width, height, isReserved) {
		this.group = this.board.add.group();

		if (this.cardID == null) {
			this.group.add(this.board.add.sprite(x, y, "card_outline_x1024").setScale(this.board.scales));
			this.board.cardObjects.push(this.group);
			return;
		}

		var dicEntry = this.board.server.lookUpCard(this.board.cardsDatabase, this.cardID);

		const gemScale = 48 / 128;
		const gemLength = 128 * gemScale;
		const gemHalfLength = gemLength / 2;

		var upperCornerX = x - width * 0.5;
		var upperCornerY = y - height * 0.5;

		var cardColor = this.cardMap[dicEntry["gem_type"]];
		this.group.add(this.board.add.sprite(x, y, this.getCardName(cardColor)).setScale(this.board.scales));
		this.group.add(
			this.board.add
				.sprite(
					upperCornerX + width - gemHalfLength,
					upperCornerY + gemHalfLength + 5,
					cardColor + "_symbol_x128"
				)
				.setScale(gemScale)
		);

		var prestige = dicEntry["prestige_points"];

		if (prestige !== 0) {
			var numHalfLength = 64 / 2;
			this.group.add(
				this.board.add
					.sprite(upperCornerX + numHalfLength - 8, upperCornerY + numHalfLength - 3, prestige + "x128")
					.setScale(64 / 128)
			);
		}

		if (isReserved) {
			var numHalfLength = 64 / 2;
			this.group.add(
				this.board.add
					.sprite(
						x + width * 0.5 - numHalfLength - 8,
						y + width * 0.5 - numHalfLength + 14,
						"r" + dicEntry["rank"] + "x128"
					)
					.setScale(80 / 128)
			);
		}

		this.drawCost(upperCornerX, upperCornerY + height, dicEntry, 30 / 64);
		this.board.cardObjects.push(this.group);

		if (this.board.gameState != null) {
			if (this.board.gameState.player_turn === globals.playerID) {
				const player = this.board.gameState.players[globals.playerID.toString()];
				const buyBehavior = this.purchaseable(dicEntry);
				const hoverRect = this.board.add.zone(x, y, 731, 1024).setScale(this.board.scales).setDepth(0);
				const hoverScale = 1.2;
				const adjustedScale = 0.8;
				hoverRect.setInteractive();
				this.board.input.setTopOnly(false);

				const purchaseButton = this.board.add
					.image(x, y - 20, "purchase_button")
					.setScale(this.board.scales * adjustedScale)
					.setVisible(false)
					.setFrame(3)
					.setDepth(1);
				const reserveButton = this.board.add
					.image(x, y + 25, "reserve_button")
					.setScale(this.board.scales * adjustedScale)
					.setVisible(false)
					.setFrame(1)
					.setDepth(1);

				this.group.addMultiple([hoverRect, purchaseButton, reserveButton]);

				if (isReserved) {
					reserveButton.setActive(false);
				}

				this.board.boardEvents.on("disable_interactive", disabled => {
					if (disabled) {
						hoverRect.disableInteractive();
						purchaseButton.disableInteractive();
						if (!isReserved) reserveButton.disableInteractive();
					} else {
						hoverRect.setInteractive();
						if (buyBehavior === "free_buy" || buyBehavior === "regular_buy" || buyBehavior === "joker_buy")
							purchaseButton.setInteractive({useHandCursor: true});
						if (player.private_reserved_cards.length < 3 && !isReserved)
							reserveButton.setInteractive({useHandCursor: true});
					}
				});

				const thisCard = this;

				hoverRect.on("pointerover", function () {
					thisCard.changeScale(hoverScale);
					purchaseButton.setVisible(true);
					if (!isReserved) reserveButton.setVisible(true);
				});

				hoverRect.on("pointerout", function (pointer) {
					thisCard.changeScale(hoverScale, true);
					purchaseButton.setVisible(false);
					reserveButton.setVisible(false);
				});
				if (buyBehavior === "free_buy") {
					purchaseButton.setFrame(0).setInteractive({useHandCursor: true});
				} else if (buyBehavior === "regular_buy") {
					purchaseButton.setFrame(1).setInteractive({useHandCursor: true});
				} else if (buyBehavior === "joker_buy") {
					purchaseButton.setFrame(2).setInteractive({useHandCursor: true});
				}

				if (player.private_reserved_cards != null) {
					if (player.private_reserved_cards.length < 3 && !isReserved)
						reserveButton.setFrame(0).setInteractive({useHandCursor: true});
				} else if (!isReserved) {
					reserveButton.setFrame(0).setInteractive({useHandCursor: true});
				}

				purchaseButton.on("pointerover", function () {
					this.setTint(0xdfdfdf).setScale(thisCard.board.scales * adjustedScale * hoverScale * 1.05);
				});

				purchaseButton.on("pointerdown", function () {
					this.setTint(0xcccccc).setScale(thisCard.board.scales * adjustedScale * hoverScale * 0.95);
				});

				purchaseButton.on("pointerout", function () {
					this.setScale(thisCard.board.scales * hoverScale * adjustedScale);
					this.clearTint();
				});

				purchaseButton.on("pointerup", function () {
					this.setScale(thisCard.board.scales * hoverScale * adjustedScale);
					this.clearTint();

					let returned_chips = {diamond: 0, sapphire: 0, emerald: 0, ruby: 0, onyx: 0, joker: 0};

					if (buyBehavior !== "free_buy" && player.player_chips["joker"] > 0) {
						thisCard.board.returnBox.createReturnChips("buy_card", thisCard.cardID);
						eventHandler.emit("disable_interactive", true);
						thisCard.board.boardEvents.on("chips_returned", new_return => {
							returned_chips = new_return;
							thisCard.buy(returned_chips);
						});
					} else {
						returned_chips = thisCard.board.calculateReturn(thisCard.cardID);
						thisCard.buy(returned_chips);
					}
				});

				reserveButton.on("pointerover", function () {
					this.setTint(0xdfdfdf).setScale(thisCard.board.scales * adjustedScale * hoverScale * 1.05);
				});

				reserveButton.on("pointerdown", function () {
					this.setTint(0xcccccc).setScale(thisCard.board.scales * adjustedScale * hoverScale * 0.95);
				});

				reserveButton.on("pointerout", function () {
					this.setScale(thisCard.board.scales);
					this.clearTint();
				});

				reserveButton.on("pointerup", function () {
					this.setScale(thisCard.board.scales);
					this.clearTint();

					let returned_chips = {diamond: 0, sapphire: 0, emerald: 0, ruby: 0, onyx: 0, joker: 0};

					if (1 + thisCard.sumObj(player.player_chips) > 10) {
						thisCard.board.returnBox.createReturnChips("chip_overflow_2");
						eventHandler.emit("disable_interactive", true);
						thisCard.board.boardEvents.on("chips_returned", new_return => {
							returned_chips = new_return;
							thisCard.reserve(returned_chips);
						});
					} else {
						thisCard.reserve(returned_chips);
					}
				});
			}
		}
	}

	drawCost(x, y, serverCost, scale) {
		x += 8;
		y -= 4;

		for (var gemtype in this.spriteCostMap) {
			var cost = serverCost[gemtype];
			if (cost === 0) {
				continue;
			}

			this.group.addMultiple([
				this.board.add.sprite(x + 16, y - 16, this.spriteCostMap[gemtype]).setScale(scale),
				this.board.add.sprite(x + 16, y - 16, cost + "x128").setScale(scale / 2),
			]);

			//TODO: this probably needs to be spaced better
			y -= 64 * scale + 4;
		}
	}

	changeScale(scale, down = false) {
		if (down) {
			for (let i = 0; i < this.group.getLength(); i++) {
				let childScale = this.group.getChildren()[i].scale;
				this.group.getChildren()[i].setScale(childScale * (1 / scale));
			}
		} else {
			for (let i = 0; i < this.group.getLength(); i++) {
				let childScale = this.group.getChildren()[i].scale;
				this.group.getChildren()[i].setScale(childScale * scale);
			}
		}
	}

	purchaseable(serverCost) {
		let costDeltas = [Infinity, Infinity, Infinity, Infinity, Infinity];
		let cardDeltas = [Infinity, Infinity, Infinity, Infinity, Infinity];
		const chipOrder = new Map([
			[0, "diamond"],
			[1, "sapphire"],
			[2, "emerald"],
			[3, "ruby"],
			[4, "onyx"],
			[5, "joker"],
		]);
		const player = this.board.gameState.players[globals.playerID.toString()];

		for (let i = 0; i < costDeltas.length; i++) {
			let playerWorth = player.player_num_gem_cards[chipOrder.get(i)] + player.player_chips[chipOrder.get(i)];
			let cardWorth = player.player_num_gem_cards[chipOrder.get(i)];
			cardDeltas[i] = serverCost[chipOrder.get(i)] - cardWorth;
			if (cardDeltas[i] < 0) cardDeltas[i] = 0;
			costDeltas[i] = serverCost[chipOrder.get(i)] - playerWorth;
			if (costDeltas[i] < 0) costDeltas[i] = 0;
		}

		const costDifference = this.sumArr(costDeltas);
		const cardDifference = this.sumArr(cardDeltas);

		if (cardDifference === 0) {
			return "free_buy";
		} else if (costDifference === 0) {
			return "regular_buy";
		} else if (costDifference <= player.player_chips["joker"]) {
			return "joker_buy";
		}

		return "no_buy";
	}

	reserve(return_obj) {
		const args = {
			player_id: globals.playerID,
			session_id: globals.lobbyID,
			reserved_card: this.cardID,
			returned_chips: return_obj,
		};
		fetch(globals.fullAddr + "/api/reserve_card/", {
			method: "POST",
			headers: globals.headers,
			body: JSON.stringify(args),
		})
			.then(this.handleErrors)
			.then(result => {
				if (result === "OK") {
				} else {
					console.warn(result);
				}
			})
			.catch(error => {
				console.error(error);
			});
	}

	buy(return_obj) {
		let noble = -1;
		const dicEntry = this.board.server.lookUpCard(this.board.cardsDatabase, this.cardID);
		const playerCards = this.board.gameState.players[globals.playerID.toString()].player_num_gem_cards;
		if (this.board.gameState.field_nobles != null) {
			for (let i = 0; i < this.board.gameState.field_nobles.length; i++) {
				let thisNoble = this.board.server.lookUpNoble(
					this.board.noblesDatabase,
					this.board.gameState.field_nobles[i]
				);
				thisNoble[dicEntry.gem_type] -= 1;
				if (
					playerCards.diamond >= thisNoble.diamond &&
					playerCards.sapphire >= thisNoble.sapphire &&
					playerCards.emerald >= thisNoble.emerald &&
					playerCards.ruby >= thisNoble.ruby &&
					playerCards.onyx >= thisNoble.onyx
				) {
					noble = thisNoble.noble_id;
					break;
				}
			}
		}

		const args = {
			player_id: globals.playerID,
			session_id: globals.lobbyID,
			purchased_card: this.cardID,
			returned_chips: return_obj,
			noble_acquired: noble,
		};
		fetch(globals.fullAddr + "/api/buy_card/", {
			method: "POST",
			headers: globals.headers,
			body: JSON.stringify(args),
		})
			.then(this.handleErrors)
			.then(result => {
				if (result === "OK") {
				} else {
					console.warn(result);
				}
			})
			.catch(error => {
				console.error(error);
			});
	}

	sumObj(obj) {
		const sum = Object.values(obj).reduce((n, x) => n + x, 0);
		return sum;
	}

	/**
	 * @param {Array<integer>} arr
	 */

	sumArr(arr) {
		const sum = arr.reduce((n, x) => n + x, 0);
		return sum;
	}

	handleErrors(response) {
		if (!response.ok) {
			throw Error(response.statusText);
		}
		return response.json();
	}
}
