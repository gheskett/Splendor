import Phaser from "phaser";
import * as globals from "../globals.js";
import eventHandler from "../scenes/eventHandler.js";

export class returnChips extends Phaser.GameObjects.DOMElement {
	/**
	 * Return Chips HTML element
	 * @param {Phaser.Scene} scene
	 * @param {integer} x
	 * @param {integer} y
	 * @param {string} cache
	 * @param {string} use
	 */

	constructor(scene, x, y, cache) {
		super(scene, x, y);
		this.createFromCache(cache);
		this.setPosition(x, y);
		this.setDepth(2);
	}

	createReturnChips(use) {
		const chipReturn = this;
		const board = chipReturn.scene;
		const chipOrder = new Map([
			[0, "diamond"],
			[1, "sapphire"],
			[2, "emerald"],
			[3, "ruby"],
			[4, "onyx"],
			[5, "joker"],
		]);
		const inverseChipMap = {
			diamond: 0,
			sapphire: 1,
			emerald: 2,
			ruby: 3,
			onyx: 4,
			joker: 5,
		};
		this.setVisible(true);
		this.removeAllListeners();

		if (use === "chip_overflow") {
			const chipsNeeded =
				chipReturn.sumObj(board.gameState.players[globals.playerID.toString()].player_chips) +
				chipReturn.sumArr(board.cachedChips) -
				10;
			chipReturn.getChildByID("return_title").innerHTML = "Too Many Gems!";
			chipReturn.getChildByID("return_subtitle").innerHTML = "Please return " + chipsNeeded.toString();
			if (chipsNeeded === 1) {
				chipReturn.getChildByID("return_subtitle").innerHTML += " gem";
			} else {
				chipReturn.getChildByID("return_subtitle").innerHTML += " gems";
			}
			chipReturn.getChildByID("submit_chips").disabled = true;

			let og_chipNums = [];
			let og_chipValues = [];
			let plusButtons = [];
			let minusButtons = [];
			let returnNums = [];
			let returnValues = [0, 0, 0, 0, 0, 0];
			for (
				let i = 0;
				i < chipReturn.getChildByID("chip_container").getElementsByClassName("chip_and_num").length;
				i++
			) {
				og_chipNums[i] = chipReturn
					.getChildByID("chip_container")
					.getElementsByClassName("chip_and_num")
					.item(i).lastElementChild;
				og_chipValues[i] =
					board.gameState.players[globals.playerID.toString()].player_chips[chipOrder.get(i)] +
					(i < 5 ? board.cachedChips[i] : 0);
				og_chipNums[i].innerHTML = og_chipValues[i].toString();

				if (og_chipValues[i] >= 1) {
					plusButtons[i] = chipReturn
						.getChildByID("plus_minus_container")
						.getElementsByClassName("plus_minus")
						.item(i).lastElementChild;
					plusButtons[i].disabled = false;
				} else {
					plusButtons[i] = chipReturn
						.getChildByID("plus_minus_container")
						.getElementsByClassName("plus_minus")
						.item(i).lastElementChild;
					plusButtons[i].disabled = true;
				}
				minusButtons[i] = chipReturn
					.getChildByID("plus_minus_container")
					.getElementsByClassName("plus_minus")
					.item(i).firstElementChild;
				minusButtons[i].disabled = true;

				returnNums[i] = chipReturn.getChildByID("num_container").children.item(i);
				returnNums[i].innerHTML = returnValues[i].toString();
			}

			chipReturn.addListener("click").on("click", function (event) {
				let pressedButton = {type: "", id: -1};
				if (event.target.parentNode.className === "plus_minus") {
					pressedButton.type = event.target.className;
					pressedButton.id = inverseChipMap[event.target.parentNode.id.split("_").pop()];
				} else if (event.target.id === "submit_chips") {
					pressedButton.type = "submit";
				} else if (event.target.id === "cancel_chips") {
					pressedButton.type = "cancel";
				}

				if (pressedButton.type === "plus") {
					returnValues[pressedButton.id] += 1;
					returnNums[pressedButton.id].innerHTML = returnValues[pressedButton.id].toString();

					if (returnValues[pressedButton.id] >= og_chipValues[pressedButton.id]) {
						plusButtons[pressedButton.id].disabled = true;
					}

					minusButtons[pressedButton.id].disabled = false;

					if (chipReturn.sumArr(returnValues) >= chipsNeeded) {
						plusButtons.forEach(element => {
							element.disabled = true;
						});
						chipReturn.getChildByID("submit_chips").disabled = false;
					}
				} else if (pressedButton.type === "minus") {
					returnValues[pressedButton.id] -= 1;
					returnNums[pressedButton.id].innerHTML = returnValues[pressedButton.id].toString();

					if (returnValues[pressedButton.id] < og_chipValues[pressedButton.id]) {
						plusButtons[pressedButton.id].disabled = false;
					}

					if (returnValues[pressedButton.id] <= 0) {
						minusButtons[pressedButton.id].disabled = true;
					}

					if (chipReturn.sumArr(returnValues) < chipsNeeded) {
						for (
							let i = 0;
							i <
							chipReturn.getChildByID("plus_minus_container").getElementsByClassName("plus_minus").length;
							i++
						) {
							if (returnValues[i] < og_chipValues[i]) {
								plusButtons[i].disabled = false;
							}
						}
					}

					chipReturn.getChildByID("submit_chips").disabled = true;
				} else if (pressedButton.type === "submit") {
					const returnObj = {
						diamond: returnValues[0],
						sapphire: returnValues[1],
						emerald: returnValues[2],
						ruby: returnValues[3],
						onyx: returnValues[4],
						joker: returnValues[5],
					};

					board.boardEvents.emit("chips_returned", returnObj);
					chipReturn.reset();
				} else if (pressedButton.type === "cancel") {
					board.boardEvents.off("chips_returned");
					chipReturn.reset();
				}
			});
		}
	}

	reset() {
		this.removeAllListeners();
		this.setVisible(false);
		eventHandler.emit("disable_interactive", false);
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
}
