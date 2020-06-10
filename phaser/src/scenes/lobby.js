import Phaser from "phaser"
import eventHandler from "./eventHandler.js"
import * as constants from "../constants.js"

import sessionIDText from "../assets/html/session_id_text.html"
import lobbyBox from "../assets/html/lobby_box.html"
import changeUsernameForm from "../assets/html/change_username_form.html"
import confirmForm from "../assets/html/confirm_form.html"

import exitButton from "../assets/images/exit.svg"
import startGame from "../assets/images/start_game.png"
import blackRectangleHTML from "../assets/html/dim.html"

export default class lobby extends Phaser.Scene {
    constructor(config) {
        super(config);
    }

    preload() {
        this.load.html("lobbyIDText", sessionIDText);
        this.load.html("lobbyBox", lobbyBox);
        this.load.html("changeUsernameForm", changeUsernameForm);
        this.load.html("dimmingObject", blackRectangleHTML);
        this.load.html("confirmForm", confirmForm);
        this.load.svg("exitButton", exitButton);
        this.load.spritesheet("startGame", startGame, {
            frameWidth: 400,
            frameHeight: 120
        });
    }

    create() {

        this.scene.sendToBack();

        //#region Initial Variables
        const thisLobby = this;
        const DIM = 0.75
        const lobbyColors = ['linear-gradient(to top, rgb(175, 0, 0), rgb(255, 60, 55))',
                             'linear-gradient(to top, rgb(0, 90, 200), rgb(47, 143, 255))',
                             'linear-gradient(to top, rgb(190, 0, 190), rgb(255, 47, 255))',
                             'linear-gradient(to top, rgb(0, 161, 0), rgb(47, 209, 47))']
        const gameWidth = this.cameras.main.width, gameHeight = this.cameras.main.height;
        var lobbyIDText = this.add.dom(gameWidth / 2, 100).createFromCache("lobbyIDText").setOrigin(0.5, 1);
        var lobbyBoxes = [];
        lobbyIDText.getChildByID("idValue").innerHTML = this.lobbyID;

        var lobbyBoxUserIDs = [];
        var hostID;

        var dimmingObject = this.add.dom(0, 0).createFromCache("dimmingObject").setOrigin(0).setAlpha(DIM).setVisible(false).setDepth(1);
        var changeUsernameForm = this.add.dom(gameWidth / 2, gameHeight / 2 - 80).createFromCache("changeUsernameForm").setVisible(false).setDepth(2);
        var leaveConfirmation = this.add.dom(gameWidth / 2, gameHeight / 2 - 80).createFromCache("confirmForm").setVisible(false).setDepth(2);
        leaveConfirmation.getChildByID("confirmationText").innerHTML = "Leave Game?";
        var startConfirmation = this.add.dom(gameWidth / 2, gameHeight / 2 - 80).createFromCache("confirmForm").setVisible(false).setDepth(2);
        startConfirmation.getChildByID("confirmationText").innerHTML = "Start Game?";

        const exitLobby = this.add.image(gameWidth - 50, 50, "exitButton").setInteractive({useHandCursor: true}).setDepth(0);
        var startGame = this.add.image(gameWidth / 2, gameHeight - 150, "startGame", 1).setDepth(0);

        var HTMLgroup = thisLobby.add.group([lobbyIDText, dimmingObject, changeUsernameForm, leaveConfirmation, startConfirmation]);
        
        HTMLgroup.getChildren().forEach(element => {
            element.setVisible(false);
        });

        //#endregion Initial Variables

        eventHandler.on("new_lobby", function(data) {
            thisLobby.lobbyID = data.lobbyID;
            thisLobby.playerID = data.playerID;
            thisLobby.username = data.username;
            lobbyIDText.getChildByID("idValue").innerHTML = thisLobby.lobbyID;
            lobbyIDText.setVisible(true);
            thisLobby.scene.setVisible(true);
            thisLobby.scene.bringToTop();

            if (lobbyBoxes.length > 0 && lobbyBoxes.length === lobbyBoxUserIDs.length) {
                var loc = lobbyBoxUserIDs.indexOf(thisLobby.playerID);
                lobbyBoxes[loc].getChildByID("pencil").style.display = "inline-block";
                lobbyBoxes[loc].getChildByID("userContainer").style.border = "10px solid gold";
                lobbyBoxes[loc].addListener("click");
                lobbyBoxes[loc].on("click", function(event) {
                    if (event.target.id === "pencil") {
                        changeUsernameForm.setVisible(true);
                        toggleLobbyElements(false);
                    }
                });
                changeUsernameForm.getChildByName("usernameField").value = thisLobby.username;
            }

            if (thisLobby.playerID === hostID && lobbyBoxUserIDs.length > 1) {
                startGame.setFrame(0);
                startGame.setInteractive({useHandCursor: true});
            } else {
                startGame.setFrame(1);
                startGame.disableInteractive();
            }
        });

        eventHandler.on("update_lobby", function (data) {
            console.log("test:", data);
            for (var i = 0; i < lobbyBoxes.length; i++) {
                lobbyBoxes[i].destroy();
            }
            lobbyBoxes = [];
            lobbyBoxUserIDs = [];
             for (var i = 0; i < Object.keys(data.players).length; i++) {

                var currentPlayerID = data.players[Object.keys(data.players)[i]].player_id;
                var currentUsername = data.players[Object.keys(data.players)[i]].username;
                lobbyBoxUserIDs[i] = currentPlayerID;
                lobbyBoxes[i] = thisLobby.add.dom(((i % 2) * (gameWidth / 2)), (i >= 2 ? 300 : 0) + 200).createFromCache("lobbyBox").setOrigin(0).setDepth(0);

                if (thisLobby.playerID === currentPlayerID) {
                    lobbyBoxes[i].getChildByID("pencil").style.display = "inline-block";
                    lobbyBoxes[i].getChildByID("userContainer").style.border = "10px solid gold";
                    lobbyBoxes[i].addListener("click");
                    lobbyBoxes[i].on("click", function(event) {
                        if (event.target.id === "pencil") {
                            changeUsernameForm.setVisible(true);
                            toggleLobbyElements(false);
                        }
                    });
                    changeUsernameForm.getChildByName("usernameField").value = currentUsername;
                }

                lobbyBoxes[i].getChildByID("usernameValue").innerHTML = currentUsername;
                lobbyBoxes[i].getChildByID("playerValue").innerHTML = i + 1;
                lobbyBoxes[i].getChildByID("userContainer").style.background = lobbyColors[currentPlayerID];

                if (data.host_id === currentPlayerID) {
                    lobbyBoxes[i].getChildByID("host").style.display = "inline-block";
                    lobbyBoxes[i].getChildByID("playerValue").innerHTML += " (Host)";
                }
            }

            hostID = data.host_id;
            if (thisLobby.playerID === hostID && lobbyBoxUserIDs.length > 1) {
                startGame.setFrame(0);
                startGame.setInteractive({useHandCursor: true});
            } else {
                startGame.setFrame(1);
                startGame.disableInteractive();
            }

        });

        eventHandler.on("terminate_lobby", function() {
            for (var i = 0; i < lobbyBoxes.length; i++) {
                lobbyBoxes[i].destroy();
            }
            lobbyBoxes = [];
            lobbyBoxUserIDs = [];
            HTMLgroup.getChildren().forEach(element => {
                element.setVisible(false);
            });
            //thisLobby.scene.setVisible(false);
            thisLobby.scene.sendToBack();
        });


        //#region Exit Button Behavior

        exitLobby.on('pointerover', function() {
            this.setTint(0xdfdfdf).setScale(1.05);
        });

        exitLobby.on('pointerdown', function() {
            this.setTint(0xcccccc).setScale(.95);
        });

        exitLobby.on('pointerout', function() {
            this.setScale(1);
            this.clearTint();
        });

        exitLobby.on('pointerup', function() {
            this.setScale(1);
            this.clearTint();
            leaveConfirmation.setVisible(true);
            toggleLobbyElements(false);
        });

        leaveConfirmation.addListener("click");
        leaveConfirmation.on("click", function (event) {

            if (event.target.name === "confirm") {

                var args = {
                    player_id: thisLobby.playerID,
                    session_id: thisLobby.lobbyID,
                }
                fetch(constants.fullAddr + "/api/drop_out/", {
                    method: "POST",
                    headers: constants.headers,
                    body: JSON.stringify(args)
                }).then(handleErrors)
                .then(result => {
                    console.log(result);
                    if (result === "OK") {
                        eventHandler.emit("new_main_menu");
                        eventHandler.emit("terminate_lobby");
                    } else {
                        console.warn(result);
                    }
                }).catch(error => {
                    console.error(error);
                });

                this.setVisible(false);
                toggleLobbyElements(true);
            
            }

            if (event.target.name === "cancel") {

                this.setVisible(false);
                toggleLobbyElements(true);

            }

        });

        //#endregion Exit Button Behavior

        //#region Start Game Button Behavior

        startGame.on('pointerover', function() {
            this.setTint(0xdfdfdf).setScale(1.05);
        });

        startGame.on('pointerdown', function() {
            this.setTint(0xcccccc).setScale(.95);
        });

        startGame.on('pointerout', function() {
            this.setScale(1);
            this.clearTint();
        });

        startGame.on('pointerup', function() {
            this.setScale(1);
            this.clearTint();
            startConfirmation.setVisible(true);
            toggleLobbyElements(false);
        });

        startConfirmation.addListener("click");
        startConfirmation.on("click", function (event) {

            if (event.target.name === "confirm") {

                var args = {
                    player_id: thisLobby.playerID,
                    session_id: thisLobby.lobbyID,
                }
                fetch(constants.fullAddr + "/api/start_game/", {
                    method: "POST",
                    headers: constants.headers,
                    body: JSON.stringify(args)
                }).then(handleErrors)
                .then(result => {
                    console.log(result);
                    if (result === "OK") {
                        eventHandler.emit("new_main_menu");
                        eventHandler.emit("terminate_lobby");
                    } else {
                        console.warn(result);
                    }
                }).catch(error => {
                    console.error(error);
                });

                this.setVisible(false);
                toggleLobbyElements(true);
            
            }

            if (event.target.name === "cancel") {

                this.setVisible(false);
                toggleLobbyElements(true);

            }

        });

        //#endregion Start Game Button Behavior

        //#region Form Behavior

        changeUsernameForm.addListener("click");
        changeUsernameForm.on("click", function (event) {

            console.log(event);
            var newName = this.getChildByName("usernameField").value;

            if (event.target.name === "change") {

                var args = {
                    player_id: thisLobby.playerID,
                    username: newName,
                    session_id: thisLobby.lobbyID
                }
                fetch(constants.fullAddr + "/api/change_username/", {
                    method: "POST",
                    headers: constants.headers,
                    body: JSON.stringify(args)
                }).then(handleErrors)
                .then(result => {
                    console.log(result);
                    if (result === "OK") {
                        thisLobby.username = newName
                        console.log("Username Changed to " + newName);
                    } else {
                        console.warn("Username Change Failed", result);
                    }
                }).catch(error => {
                    console.error("Error: ", error);
                });
                
                this.setVisible(false);
                toggleLobbyElements(true);
            
            }

            if (event.target.name === "cancel") {
                this.getChildByName("usernameField").value = thisLobby.username;

                this.setVisible(false);
                toggleLobbyElements(true);

            }
        });

        //#endregion Form Behavior

        /**
         * @param {boolean} enable
         * Enables/Disables Lobby Elements
         */
        function toggleLobbyElements(enable) {
            if (enable) {
                dimmingObject.setVisible(false);
            } 
            else {
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

}