import Phaser from "phaser"
import sessionIDText from "../assets/html/session_id_text.html"
import lobbyBox from "../assets/html/lobby_box.html"
import changeUsernameForm from "../assets/html/change_username_form.html"
import confirmForm from "../assets/html/confirm_form.html"

import exitButton from "../assets/images/exit.svg"
import blackRectangleHTML from "../assets/html/dim.html"

export default class lobby extends Phaser.Scene {
    constructor(config) {
        super(config);
    }

    init(data) {
        this.client = data.client;
        this.fullAddr = data.fullAddr;
        this.headers = data.headers;
        this.playerID = data.playerID;
        this.lobbyID = data.lobbyID;
        this.username = data.username;
    }

    preload() {
        this.load.html("lobbyIDText", sessionIDText);
        this.load.html("lobbyBox", lobbyBox);
        this.load.html("changeUsernameForm", changeUsernameForm);
        this.load.html("dimmingObject", blackRectangleHTML);
        this.load.html("confirmForm", confirmForm);
        this.load.svg("exitButton", exitButton);
    }

    create() {
        var thisLobby = this;

        //#region Game Variables
        const DIM = 0.75

        var numOfPlayers = -1;
        const lobbyColors = ['linear-gradient(to top, rgb(175, 0, 0), rgb(255, 60, 55))',
                             'linear-gradient(to top, rgb(0, 90, 200), rgb(47, 143, 255))',
                             'linear-gradient(to top, rgb(190, 0, 190), rgb(255, 47, 255))',
                             'linear-gradient(to top, rgb(0, 161, 0), rgb(47, 209, 47))']
        // "rgb(0, 119, 255)", "rgb(200, 0, 200)", "rgb(0, 185, 0)"]
        const gameWidth = this.cameras.main.width, gameHeight = this.cameras.main.height;
        const lobbyIDText = this.add.dom(gameWidth / 2, 100).createFromCache("lobbyIDText").setOrigin(0.5, 1);
        var lobbyBoxes = [];
        lobbyIDText.getChildByID("idValue").innerHTML = this.lobbyID;

        const dimmingObject = this.add.dom(0, 0).createFromCache("dimmingObject").setOrigin(0).setAlpha(DIM).setVisible(false).setDepth(1);
        const changeUsernameForm = this.add.dom(gameWidth / 2, gameHeight / 2 - 80).createFromCache("changeUsernameForm").setVisible(false).setDepth(2);
        var leaveConfirmation = this.add.dom(gameWidth / 2, gameHeight / 2 - 80).createFromCache("confirmForm").setVisible(false).setDepth(2);
        leaveConfirmation.getChildByID("confirmationText").innerHTML = "Leave Game?";
        const exitLobby = this.add.image(gameWidth - 50, 50, "exitButton").setInteractive({useHandCursor: true}).setDepth(0);

        //#endregion Game Variables

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
                    session_id: thisLobby.lobbyID,
                    player_id: thisLobby.playerID
                }
                fetch(thisLobby.fullAddr + "/api/drop_out/", {
                    method: "POST",
                    headers: thisLobby.headers,
                    body: JSON.stringify(args)
                }).then(handleErrors)
                .then(result => {
                    console.log(result);
                    if (result === "OK") {
                        thisLobby.scene.start("mainMenu");
                    } else {
                        console.warn(result.most_recent_action);
                    }
                }).catch(error => {
                    console.error(error);
                });

                this.setVisible(false);
                toggleLobbyElements(true);
            
            }

            //Enable play buttons and remove username form on cancel
            if (event.target.name === "cancel") {

                this.setVisible(false);
                toggleLobbyElements(true);

            }

        });


        //#endregion Exit Button Behavior


        //#region Update Lobby on join

        fetch(this.fullAddr + "/api/is_game_started?" + new URLSearchParams({
            session_id: thisLobby.lobbyID,
        })).then(handleErrors)
        .then(result => {
            if (result.exists) {
                updateLobby(result);
            } else {
                console.warn(result.most_recent_action);
            }
        }).catch(error => {
            console.error("Error: ", error);
        });

        //#endregion Update Lobby on join

        //#region Server Listeners

        // Called whenever lobby specific elements are updated ('/api/is_game_started' equivalent)
        thisLobby.client.on("/io/update_lobby/", updateLobby);

        //#endregion Server Listeners

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
                fetch(thisLobby.fullAddr + "/api/change_username/", {
                    method: "POST",
                    headers: thisLobby.headers,
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
                //toggleLobbyElements(true);
            
            }

            //Enable play buttons and remove username form on cancel
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

        function updateLobby(data) {
            console.log(data);
            for (var i = 0; i < lobbyBoxes.length; i++) {
                lobbyBoxes[i].destroy();
            }
            lobbyBoxes = [];
             for (var i = 0; i < Object.keys(data.players).length; i++) {

                var currentPlayerID = data.players[Object.keys(data.players)[i]].player_id;
                var currentUsername = data.players[Object.keys(data.players)[i]].username;
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
            numOfPlayers = Object.keys(data.players).length;
        }

        function handleErrors(response) {
            if (!response.ok) {
                throw Error(response.statusText);
            }
            return response.json();
        }

    }

}