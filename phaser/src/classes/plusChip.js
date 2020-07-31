import Phaser from "phaser";
import * as globals from "../globals.js";
import eventHandler from "../scenes/eventHandler.js";
export class plusChip extends Phaser.GameObjects.Image {
	/**
	 * @param {Phaser.Scene} scene
	 * @param {integer} x
	 * @param {integer} y
	 * @param {Phaser.Textures.Texture} texture
	 * @param {integer | string} frame
	 * @param {boolean} plus
	 * @param {integer} id
	 */

	constructor(scene, x, y, texture, plus, id) {
		super(scene, x, y, texture);

		this.plus = plus;
		this.id = id;

		this.setFrame(1);

		this.createButton();
	}

	createButton() {
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
		const allowedFor2 = 4;
		button.chipAmt = board.server.lookUpFieldChips(board.gameState, chipOrder.get(button.id));
		button.playerAmt = button.sumObj(board.gameState.players[globals.playerID.toString()].player_chips);
		button.totalCache = 0;
		let canDo2 = false;

		if (button.plus) {
			if (button.chipAmt >= allowedFor2) {
				canDo2 = true;
			}

			if (button.chipAmt >= 1 && button.playerAmt < 10) {
				button.setInteractive({
					hitArea: button,
					pixelPerfect: true,
					useHandCursor: true,
				});
				button.setFrame(0);
				board.input.enableDebug(button);

				eventHandler.on("update_chip_cache", function () {
					button.totalCache = button.sumArr(board.cachedChips);

					/*
          If 3 chips are selected, 2 chips of one type are selected,
          1 chip of this type is selected and taking 2 chips is not possible,
          or the number of selected chips will make the player have 10 chips,
          then disable this button
          */
					if (
						button.totalCache >= 3 ||
						board.cachedChips.includes(2) ||
						(board.cachedChips[button.id] === 1 && !canDo2) ||
						button.playerAmt + button.totalCache >= 10
					) {
						button.doActive(false);
					} else {
						button.doActive(true);
					}
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
					board.cachedChips[button.id] += 1;
					this.setScale(1);
					this.clearTint();
					if (button.chipAmt - board.cachedChips[button.id] <= 0) {
						board.f_chips[button.id].setTexture("circle_outline_x128").setScale(0.5);
					}
					board.f_chipNumbers[button.id].setTexture(
						(button.chipAmt - board.cachedChips[button.id]).toString() + "x64"
					);
					eventHandler.emit("update_chip_cache");
				});
			}
		}
	}

	/**
	 * @param {boolean} active
	 */

	doActive(active) {
		if (active) {
			this.setInteractive();
			this.setFrame(0);
		} else {
			this.disableInteractive();
			this.setFrame(1);
		}
	}

	sumObj(obj) {
		const sum = Object.values(obj).reduce((a, b) => a + b, 0);
		return sum;
	}

	/**
	 * @param {Array<integer>} arr
	 */

	sumArr(arr) {
		const sum = arr.reduce((a, b) => a + b, 0);
		return sum;
	}
}
