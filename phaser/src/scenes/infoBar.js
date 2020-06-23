import Phaser from "phaser"
import eventHandler from "./eventHandler.js"
import "../classes/infoBox.js"
import * as globals from "../globals.js"

export default class infoBar extends Phaser.Scene {

    constructor(config) {
        super(config);
    }

    preload() {
        this.load.path = "src/assets/images/infoBarAssets/";
        this.load.spritesheet("infoBoxBg", "info_box_bg.png", { frameWidth: 366, frameHeight: 224 });
        this.load.spritesheet("uiTokens", "ui_tokens.svg", { frameWidth: 256 });
        this.load.spritesheet("infoCards", "info_cards.svg", { frameWidth: 36, frameHeight: 48 });
        this.load.spritesheet("reserveCards", "reserve_cards.svg", { frameWidth: 40, frameHeight: 56 });
        this.load.svg("crown", "crown.svg");
    }

    create() {

        this.scene.bringToTop();

        //#region Initial Variables
        this.infoBarOn = false;
        const thisInfoBar = this;
        const gameWidth = this.cameras.main.width, gameHeight = this.cameras.main.height;

        //#endregion Initial Variable

        this.add.infoBox(500, 500);

        eventHandler.on("new_info_bar", function () {

        });

        eventHandler.on("update_info_bar", function (data) {

        });

        eventHandler.on("terminate_info_bar", function () {

        });

    }

    update(time, delta) {
        this.scene.bringToTop();
    }

}