import Phaser from "phaser"
import eventHandler from "./eventHandler.js"
import * as constants from "../constants.js"

import newGame from "../assets/images/new_game.svg"
import joinGame from "../assets/images//join_game.svg"
import titleLogo from "../assets/images/title.svg"
import background from "../assets/images/pattern-background-frost-texture.jpg"
import newGameForm from "../assets/html/new_game_form.html"
import joinGameForm from "../assets/html/join_game_form.html"
import blackRectangle from "../assets/images/black_rectangle.png"

export default class mainMenu extends Phaser.Scene {
    constructor(config) {
        super(config);
    }
    
    init(data) {
        this.client = data.client;
    }

    preload() {
        this.load.svg("newGame", newGame);
        this.load.svg("joinGame", joinGame);
        this.load.svg("title", titleLogo);
        this.load.image("bg", background);
        this.load.image("dimmingObject", blackRectangle);
        this.load.html("newGameForm", newGameForm);
        this.load.html("joinGameForm", joinGameForm)
    }

    create() {
        this.scene.sendToBack();

        //#region Initial Variables
        const thisMainMenu = this;
        const gameWidth = this.cameras.main.width, gameHeight = this.cameras.main.height;

        const SELECTED = 1
        const NOT_SELECTED = 0.90
        const DIM = 0.75

        const bg = this.add.image(0, 0, "bg").setOrigin(0).setScale(3);
        const title = this.add.image(gameWidth / 2, 150, "title").setScale(1.5);
        const dimmingObject = this.add.image(0, 0, "dimmingObject").setOrigin(0).setAlpha(DIM).setVisible(false).setDepth(1);

        const newGame = this.add.image(gameWidth / 2, 420, "newGame").setInteractive({useHandCursor: true}).setAlpha(NOT_SELECTED);
        const joinGame = this.add.image(gameWidth / 2, 550, "joinGame").setInteractive({useHandCursor: true}).setAlpha(NOT_SELECTED);

        var newGameForm = this.add.dom(gameWidth / 2, gameHeight / 2 - 80).createFromCache("newGameForm").setVisible(false);
        var joinGameForm = this.add.dom(gameWidth / 2, gameHeight / 2 - 80).createFromCache("joinGameForm").setVisible(false);

        var HTMLgroup = this.add.group([newGameForm, joinGameForm]);
        HTMLgroup.getChildren().forEach(element => {
            element.setVisible(false);
        });

        var interactiveGroup = this.add.group([newGame, joinGame]);
        interactiveGroup.getChildren().forEach(element => {
            element.disableInteractive();
        });

        //#endregion Initial Variables

        eventHandler.on("new_main_menu", function() {
            thisMainMenu.scene.bringToTop();
            interactiveGroup.getChildren().forEach(element => {
                element.setInteractive({useHandCursor: true});
            });
        });

        eventHandler.on("terminate_main_menu", function() {
            HTMLgroup.getChildren().forEach(element => {
                element.setVisible(false);
            });
            interactiveGroup.getChildren().forEach(element => {
                element.disableInteractive();
            });
            thisMainMenu.scene.sendToBack();
        });

        //#region Mouse-button behavior
        newGame.on('pointerover', function() {
            this.setAlpha(SELECTED).setScale(1.05);
        });

        newGame.on('pointerdown', function() {
            this.setTint(0xdddddd);
            this.setScale(.95);
        });

        newGame.on('pointerout', function() {
            this.setAlpha(NOT_SELECTED).setScale(1);
            this.clearTint();
        });

        joinGame.on('pointerdown', function() {
            this.setTint(0xdddddd);
            this.setScale(.95);
        });

        joinGame.on('pointerover', function() {
            this.setAlpha(SELECTED).setScale(1.05);
        });
        
        joinGame.on('pointerout', function() {
            this.setAlpha(NOT_SELECTED).setScale(1);
            this.clearTint();
        });
        //#endregion Mouse-button behavior

        //#region Button Click Behavior
        newGame.on('pointerup', function() {
            this.setAlpha(NOT_SELECTED).setScale(1);
            this.clearTint();
            newGameForm.setVisible(true);
            playButtonEnable(false);
        });

        joinGame.on('pointerup', function() {
            this.setAlpha(NOT_SELECTED).setScale(1);
            this.clearTint();
            joinGameForm.setVisible(true);
            playButtonEnable(false);
        });
        
        //#endregion Button Click Behavior

        //#region Form Behavior

        newGameForm.addListener("click");
        newGameForm.on("click", function (event) {

            var username = this.getChildByName("usernameField").value;

            if (event.target.name === "start") {

                var args = {
                    sid: thisMainMenu.client.id,
                    username: username
                }
                fetch(constants.fullAddr + "/api/new_game/", {
                    method: "POST",
                    headers: constants.headers,
                    body: JSON.stringify(args)
                }).then(handleErrors)
                .then(result => {
                    //console.log(result);
                    if (result.player_id !== -1) {
                        this.getChildByName("usernameField").value = "";
                        eventHandler.emit("terminate_main_menu");
                        eventHandler.emit("new_lobby", {lobbyID: result.session_id, playerID: result.player_id, username: username});
                    } else {
                        console.warn(result.most_recent_action);
                    }
                }).catch(error => {
                    console.error(error);
                });

                this.setVisible(false);
                playButtonEnable(true);
            
            }

            //Enable play buttons and remove username form on cancel
            if (event.target.name === "cancel") {

                this.getChildByName("usernameField").value = "";

                this.setVisible(false);
                playButtonEnable(true);

            }

        });

        joinGameForm.addListener("click");
        joinGameForm.on("click", function (event) {

            var username = this.getChildByName("usernameField").value;
            var lobbyID = this.getChildByName("lobbyIdField").value;

            if (event.target.name === "join") {

                var args = {
                    sid: thisMainMenu.client.id,
                    username: username,
                    session_id: lobbyID
                }
                fetch(constants.fullAddr + "/api/join_game/", {
                    method: "POST",
                    headers: constants.headers,
                    body: JSON.stringify(args)
                }).then(handleErrors)
                .then(result => {
                    //console.log(result);
                    if (result.player_id !== -1) {
                        this.getChildByName("usernameField").value = "";
                        this.getChildByName("lobbyIdField").value = "";
                        eventHandler.emit("terminate_main_menu");
                        eventHandler.emit("new_lobby", {lobbyID: result.session_id, playerID: result.player_id, username: username});
                    } else {
                        console.warn(result.most_recent_action);
                    }
                }).catch(error => {
                    console.error("Error: ", error);
                });
                
                this.setVisible(false);
                playButtonEnable(true);
            
            }

            //Enable play buttons and remove username form on cancel
            if (event.target.name === "cancel") {

                this.getChildByName("usernameField").value = "";

                this.setVisible(false);
                playButtonEnable(true);

            }

        });
        //#endregion Form Behavior


        /**
         * @param {boolean} enable
         * Enables/disables the play button input
         */
        function playButtonEnable(enable) {
            if (enable) {
            newGame.setInteractive({useHandCursor: true});
            joinGame.setInteractive({useHandCursor: true});
            dimmingObject.setVisible(false);
            } 
            else {
            newGame.disableInteractive();
            joinGame.disableInteractive();
            dimmingObject.setVisible(true);
            }
        }

        function handleErrors(response) {
            if (!response.ok) {
                throw Error(response.statusText);
            }
            return response.json();
        }

        eventHandler.emit("main_menu_ready");

    }

}