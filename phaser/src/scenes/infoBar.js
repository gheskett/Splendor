import Phaser from "phaser"
import eventHandler from "./eventHandler.js"
import "../classes/infoBox.js"
import infoName from "../assets/html/info_bar_username.html"
import * as globals from "../globals.js"

export default class infoBar extends Phaser.Scene {

    constructor(config) {
        super(config);
    }

    preload() {
        this.load.html("infoName", infoName);
        this.load.path = "src/assets/images/infoBarAssets/";
        this.load.spritesheet("uiTokens", "ui_tokens.svg", { frameWidth: 104 });
        this.load.spritesheet("infoCards", "info_cards.svg", { frameWidth: 36, frameHeight: 48 });
        this.load.spritesheet("reserveCards", "reserve_cards.svg", { frameWidth: 40, frameHeight: 56 });
        this.load.svg("crown", "crown.svg");
    }

    create() {

        //#region Initial Variables

        this.infoBarOn = false;
        const thisInfoBar = this;
        const gameWidth = this.cameras.main.width, gameHeight = this.cameras.main.height;
        const width = (1 - globals.notChat) * gameWidth;
        const boxWidth = 366, boxHeight = 224;

        let infoBoxes = [];
        let numPlayers = 0;

        //#endregion Initial Variable



        eventHandler.on("new_info_bar", function () {
            fetch(globals.fullAddr + "/api/get_game_state?" + new URLSearchParams({
                session_id: globals.lobbyID,
                player_id: globals.playerID
            }))
                .then(handleErrors)
                .then(result => {
                    if (result.exists) {

                        numPlayers = result.player_order.length;
                        createBoxes(result);
                        thisInfoBar.infoBarOn = true;
                    } else {
                        console.warn(result.most_recent_action);
                    }
                })
                .catch(error => {
                    console.error(error);
                });
        });

        eventHandler.on("update_game", function (data) {
            if (thisInfoBar.infoBarOn) {
                if (data.player_order.length !== numPlayers) {
                    numPlayers = data.player_order.length;
                    createBoxes(data);
                } else {
                    updateBoxes(data);
                }
            }
        });

        eventHandler.on("terminate_info_bar", function () {
            thisInfoBar.infoBarOn = false;
            for (let i = 0; i < infoBoxes.length; i++) {
                infoBoxes[i].kill();
            }
            infoBoxes = [];
        });

        function createBoxes(data) {
            for (let i = 0; i < infoBoxes.length; i++) {
                infoBoxes[i].kill();
            }
            infoBoxes = [];
            for (let i = 0; i < data.player_order.length; i++) {
                infoBoxes[i] = thisInfoBar.add.infoBox(width / 2,
                    i * gameHeight * .245 + 40 + boxHeight / 2);
            }
            updateBoxes(data);
        }

        function updateBoxes(data) {
            for (let i = 0; i < infoBoxes.length; i++) {
                let currentPlayerID = data.player_order[i];     
                let updateInfo = data.players[currentPlayerID.toString()];
                updateInfo.isTurn = (data.player_turn === currentPlayerID) ? true : false;
                infoBoxes[i].update(updateInfo);
            }
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