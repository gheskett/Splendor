import Phaser from 'phaser';
import * as globals from '../globals.js';

class infoBox extends Phaser.GameObjects.Container {
	constructor(scene, x, y) {
		super(scene, x, y);

		this.createBox(scene);
	}

	/**
	 * @param {Phaser.Scene} scene
	 */
	createBox(scene) {
		const thisBox = this;

		//#region Box settings

		const width = 366;
		const height = 224;
		this.stroke = 4;
		const TLcorner = {
			x: -1 * (width / 2 - this.stroke),
			y: -1 * (height / 2 - this.stroke),
		};
		this.infoColors = [
			[0xef8f8f, 0x801b1b],
			[0x9ed0f4, 0x1b3780],
			[0xcdb5e4, 0x6e0194],
			[0x7ac47c, 0x084d0b],
		];
		this.setSize(width, height);

		const startColor = [204, 162, 12],
			endColor = [235, 199, 0];
		const tweenDuration = 1500;

		const textSettings = {
			fontFamily: 'Raleway, serif',
			fontSize: '28px',
			color: 'white',
			stroke: 'black',
			strokeThickness: 4,
		};

		const tokenInfo = {
			amount: 6,
			width: 26,
			height: 26,
			separation: 10,
			l_edge_dist: 5,
			t_edge_dist: 5,
		};

		const tokenText = {
			l_edge_dist: tokenInfo.width + tokenInfo.l_edge_dist + 8,
			t_edge_dist: tokenInfo.t_edge_dist - 6,
		};

		const cardInfo = {
			amount: 5,
			width: 19,
			height: 26,
			separation: 10,
			l_edge_dist: tokenInfo.width + tokenInfo.l_edge_dist + 40,
			t_edge_dist: 5,
		};

		const cardText = {
			l_edge_dist: cardInfo.width + cardInfo.l_edge_dist + 8,
			t_edge_dist: cardInfo.t_edge_dist - 6,
		};

		const reserveInfo = {
			amount: 3,
			width: 40,
			height: 56,
			separation: 12,
			l_edge_dist: cardInfo.width + cardInfo.l_edge_dist + 40,
			t_edge_dist: 12,
		};

		const nobleInfo = {
			amount: 5,
			width: 64,
			height: 30,
			separation: 11,
			l_edge_dist: reserveInfo.width + reserveInfo.l_edge_dist + 20,
			t_edge_dist: 11,
		};

		const lineInfo = {
			width: 4,
			l_edge_dist: nobleInfo.width + nobleInfo.l_edge_dist + 5,
		};

		const PPinfo = {
			l_edge_dist: (lineInfo.width + lineInfo.l_edge_dist + width - this.stroke) / 2,
			t_edge_dist: 30,
		};

		const nameInfo = {
			t_edge_dist: 6,
		};

		//#endregion Box settings

		//#region Element creation

		//Add background for box with appropriate color
		this.bg = scene.add
			.rectangle(0, 0, width - this.stroke * 2, height - this.stroke * 2, this.infoColors[0][0])
			.setStrokeStyle(this.stroke, this.infoColors[0][1]);
		this.add(this.bg);

		//Create tokens and text
		this.tokens = [[]];
		for (let i = 0; i < tokenInfo.amount; i++) {
			this.tokens[i] = [];

			this.tokens[i][0] = scene.add
				.image(
					TLcorner.x + tokenInfo.l_edge_dist,
					TLcorner.y + tokenInfo.t_edge_dist + i * (tokenInfo.separation + tokenInfo.height),
					'uiTokens',
					i
				)
				.setOrigin(0)
				.setDisplaySize(tokenInfo.width, tokenInfo.height);
			this.add(this.tokens[i][0]);

			this.tokens[i][1] = scene.add
				.text(
					TLcorner.x + tokenText.l_edge_dist,
					TLcorner.y + tokenText.t_edge_dist + i * (tokenInfo.separation + tokenInfo.height),
					'0',
					textSettings
				)
				.setOrigin(0);
			this.add(this.tokens[i][1]);
		}

		//Create cards and text
		this.cards = [[]];
		for (let i = 0; i < cardInfo.amount; i++) {
			this.cards[i] = [];

			this.cards[i][0] = scene.add
				.image(
					TLcorner.x + cardInfo.l_edge_dist,
					TLcorner.y + cardInfo.t_edge_dist + i * (cardInfo.separation + cardInfo.height),
					'infoCards',
					i
				)
				.setOrigin(0)
				.setDisplaySize(cardInfo.width, cardInfo.height);
			this.add(this.cards[i][0]);

			this.cards[i][1] = scene.add
				.text(
					TLcorner.x + cardText.l_edge_dist,
					TLcorner.y + cardText.t_edge_dist + i * (cardInfo.separation + cardInfo.height),
					'0',
					textSettings
				)
				.setOrigin(0);
			this.add(this.cards[i][1]);
		}

		//Create reserve cards
		this.reserves = [];
		for (let i = 0; i < reserveInfo.amount; i++) {
			this.reserves[i] = scene.add
				.image(
					TLcorner.x + reserveInfo.l_edge_dist,
					TLcorner.y + reserveInfo.t_edge_dist + i * (reserveInfo.separation + reserveInfo.height),
					'reserveCards',
					i
				)
				.setOrigin(0)
				.setDisplaySize(reserveInfo.width, reserveInfo.height);
			this.add(this.reserves[i]);
		}

		//Create noble pictures
		this.nobles = [];
		for (let i = 0; i < nobleInfo.amount; i++) {
			this.nobles[i] = scene.add
				.image(
					TLcorner.x + nobleInfo.l_edge_dist,
					TLcorner.y + nobleInfo.t_edge_dist + i * (nobleInfo.separation + nobleInfo.height),
					'crown'
				)
				.setOrigin(0)
				.setDisplaySize(nobleInfo.width, nobleInfo.height);
			this.add(this.nobles[i]);
		}

		//Create Dividing Line
		this.line = scene.add
			.rectangle(
				TLcorner.x + lineInfo.l_edge_dist,
				TLcorner.y,
				lineInfo.width,
				height - this.stroke * 2,
				this.infoColors[0][1]
			)
			.setOrigin(0);
		this.add(this.line);

		//Create PP text
		this.add(
			scene.add
				.text(TLcorner.x + PPinfo.l_edge_dist, TLcorner.y + PPinfo.t_edge_dist, 'PP:', {
					fontFamily: 'Raleway, serif',
					fontSize: '40px',
					color: 'white',
					stroke: 'black',
					strokeThickness: 6,
					align: 'center',
				})
				.setOrigin(0.5)
		);

		//Create PP value
		this.PPvalue = scene.add
			.text(TLcorner.x + PPinfo.l_edge_dist, 0, '0', {
				fontFamily: 'Raleway, serif',
				fontSize: '72px',
				color: 'white',
				stroke: 'black',
				strokeThickness: 10,
				align: 'center',
			})
			.setOrigin(0.5);
		this.add(this.PPvalue);

		this.nameHTML = scene.add
			.dom(TLcorner.x + this.x, TLcorner.y + this.y + nameInfo.t_edge_dist)
			.createFromCache('infoName')
			.setOrigin(0, 1);

		this.hoverDetector = scene.add
			.rectangle(this.x, this.y, width - this.stroke * 2, height - this.stroke * 2, 0xdddddd)
			.setStrokeStyle(this.stroke, 0x999999);

		//#endregion Element creation

		this.hoverDetector.setInteractive();

		this.defaultx = this.x;
		this.defaulty = this.y;
		this.onhover = false;

		this.hoverDetector.on(
			'pointerover',
			function () {
				this.setScale(2).setPosition(scene.cameras.main.width / 2, scene.cameras.main.height / 2);
				this.onhover = true;
			},
			this
		);

		this.hoverDetector.on(
			'pointerout',
			function () {
				this.setScale(1).setPosition(this.defaultx, this.defaulty);
				this.onhover = false;
			},
			this
		);

		this.isTurn = false;

		this.tween = scene.tweens.addCounter({
			from: 0,
			to: 1,
			ease: 'Sine.easeInOut',
			duration: tweenDuration,
			repeat: -1,
			yoyo: true,
			onUpdate: function () {
				if (thisBox.isTurn) {
					let colors = [];
					for (let i = 0; i < 3; i++) {
						colors[i] = (1 - this.getValue()) * startColor[i] + this.getValue() * endColor[i];
					}
					thisBox.bg.strokeColor = Phaser.Display.Color.GetColor(colors[0], colors[1], colors[2]);
					thisBox.line.fillColor = Phaser.Display.Color.GetColor(colors[0], colors[1], colors[2]);
					thisBox.bg.lineWidth =
						(1 - this.getValue()) * (thisBox.stroke + 1) + this.getValue() * (thisBox.stroke + 5);
				}
			},
		});
	}

	update(data) {
		this.isTurn = data.isTurn;
		const chipOrder = new Map([
			[0, 'diamond'],
			[1, 'sapphire'],
			[2, 'emerald'],
			[3, 'ruby'],
			[4, 'onyx'],
			[5, 'joker'],
		]);
		this.bg.fillColor = this.infoColors[data.player_id][0];
		this.bg.strokeColor = this.infoColors[data.player_id][1];
		this.line.fillColor = this.infoColors[data.player_id][1];
		this.bg.lineWidth = this.stroke;
		this.nameHTML.getChildByID('nameText').innerHTML = data.username;

		if (data.player_id === globals.playerID) {
			this.nameHTML.getChildByID('nameText').style.color = 'yellow';
		} else {
			this.nameHTML.getChildByID('nameText').style.color = 'white';
		}

		for (let i = 0; i < this.tokens.length; i++) {
			this.tokens[i][1].setText(data.player_chips[chipOrder.get(i)].toString());
		}

		for (let i = 0; i < this.cards.length; i++) {
			let value = data.player_num_gem_cards[chipOrder.get(i)];
			if (value > 0) {
				this.cards[i][1].setText(value.toString());
				this.cards[i][0].setVisible(true);
				this.cards[i][1].setVisible(true);
			} else {
				this.cards[i][0].setVisible(false);
				this.cards[i][1].setVisible(false);
			}
		}

		for (let i = 0; i < this.reserves.length; i++) {
			if (data.player_reserved_cards[i] != null) {
				this.reserves[i].setTexture('reserveCards', data.player_reserved_cards[i] - 1);
				this.reserves[i].setVisible(true);
			} else {
				this.reserves[i].setVisible(false);
			}
		}

		for (let i = 0; i < this.nobles.length; i++) {
			if (data.player_nobles[i] != null) {
				this.nobles[i].setVisible(true);
			} else {
				this.nobles[i].setVisible(false);
			}
		}

		this.PPvalue.setText(data.prestige_points.toString());
	}

	kill() {
		this.hoverDetector.destroy();
		this.nameHTML.setVisible(false);
		this.nameHTML.destroy();
		this.tween.remove();
		this.destroy(true);
	}
}

Phaser.GameObjects.GameObjectFactory.register('infoBox', function (x, y) {
	const box = new infoBox(this.scene, x, y);
	this.displayList.add(box);
	return box;
});
