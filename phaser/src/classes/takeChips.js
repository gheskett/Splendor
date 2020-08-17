import Phaser from "phaser";
import * as globals from "../globals.js";
import eventHandler from "../scenes/eventHandler.js";
import {returnChips} from "../classes/returnChips.js";

export class takeChips extends Phaser.GameObjects.Image {
	/**
	 * @param {Phaser.Scene} scene
	 * @param {integer} x
	 * @param {integer} y
	 * @param {Phaser.Textures.Texture} texture
	 */

	constructor(scene, x, y, texture) {
		super(scene, x, y, texture);

		this.setFrame(1);

		this.createTakeChips();
	}

	createTakeChips() {
		const board = this.scene;
		const button = this;
		const chipOrder = new Map([
			[0, "diamond"],
			[1, "sapphire"],
			[2, "emerald"],
			[3, "ruby"],
			[4, "onyx"],
			[5, "joker"],
		]);
		button.f_chipsArr = [0, 0, 0, 0, 0];

		for (let i = 0; i < button.f_chipsArr.length; i++) {
			button.f_chipsArr[i] = board.server.lookUpFieldChips(board.gameState, chipOrder.get(i));
			if (button.f_chipsArr[i] < 0)
				button.f_chipsArr[i] = 0;
		}
		button.f_chipTotal = button.sumArr(button.f_chipsArr);
		button.availableChips = button.f_chipsArr.reduce((n, x) => n + (x > 0 ? 1 : 0), 0);

		button.playerAmt = button.sumObj(board.gameState.players[globals.playerID.toString()].player_chips);
		button.totalCache = 0;

		button.doActive(button.canTakeChips());

		board.boardEvents.on("disable_interactive", disabled => {
			if (disabled) {
				button.disableInteractive();
			} else {
				button.totalCache = button.sumArr(board.cachedChips);
				button.doActive(button.canTakeChips());
			}
		});

		board.boardEvents.on("update_chip_cache", function () {
			button.totalCache = button.sumArr(board.cachedChips);
			button.doActive(button.canTakeChips());
		});

		button.on("pointerover", function () {
			this.setTint(0xdfdfdf).setScale(1.05);
		});

		button.on("pointerdown", function () {
			this.setTint(0xcccccc).setScale(0.95);
		});

		button.on("pointerout", function () {
			this.setScale(1);
			this.clearTint();
		});

		button.on("pointerup", function () {
			this.setScale(1);
			this.clearTint();

			let returned_chips = {diamond: 0, sapphire: 0, emerald: 0, ruby: 0, onyx: 0, joker: 0};

			if (button.totalCache + button.playerAmt > 10) {
				board.returnBox.createReturnChips("chip_overflow");
				eventHandler.emit("disable_interactive", true);
				board.boardEvents.on("chips_returned", new_return => {
					returned_chips = new_return;
					button.submitPress(returned_chips);
				});
			} else {
				this.submitPress(returned_chips);
			}
		});
	}

	submitPress(returned_chips) {
		const board = this.scene;
		const button = this;
		const args = {
			player_id: globals.playerID,
			session_id: globals.lobbyID,
			grabbed_chips: {
				diamond: board.cachedChips[0],
				sapphire: board.cachedChips[1],
				emerald: board.cachedChips[2],
				ruby: board.cachedChips[3],
				onyx: board.cachedChips[4],
				joker: 0,
			},
			returned_chips: returned_chips,
		};
		fetch(globals.fullAddr + "/api/grab_chips/", {
			method: "POST",
			headers: globals.headers,
			body: JSON.stringify(args),
		})
			.then(button.handleErrors)
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

	canTakeChips() {
		const board = this.scene;
		const button = this;
		const allowedFor2 = 4;

		/*
		If only 2 chip types are left on the field, and the player has 2 selected, 
		If only 1 chip type is left and the player has 1 selected, but less than 4 of those chips were available,
		If no chips are on the field
		If 3 chip types are selected,
		If 2 gems of 1 type are selected,
		Allow
		*/

		return (
			(button.availableChips === 2 && button.totalCache === 2) ||
			(button.availableChips === 1 && button.totalCache === 1 && button.f_chipTotal < allowedFor2) ||
			button.availableChips === 0 ||
			button.totalCache === 3 ||
			board.cachedChips.includes(2)
		);
	}

	doActive(active) {
		if (active) {
			this.setInteractive({useHandCursor: true});
			this.setFrame(0);
		} else {
			this.disableInteractive();
			this.setFrame(1);
		}
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
