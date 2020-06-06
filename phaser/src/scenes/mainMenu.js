import Phaser from "phaser"

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
        this.fullAddr = data.fullAddr;
        this.headers = data.headers;
        console.log(this.client);
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
        var thisMainMenu = this;

        //#region Game Variables
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
        //#endregion Game Variables

        //#region Server Listeners

        // Called whenever game elements are updated ('/api/get_game_state' equivalent)
        this.client.on("/io/update_game/", (data) =>
        {
            console.log(data)
        });

        // Called whenever somebody sends a message to the server ('/api/get_messages' equivalent)
        this.client.on("/io/update_chat/", (data) =>
        {
            console.log(data)
        });

        //#endregion Server Listeners

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
                fetch(thisMainMenu.fullAddr + "/api/new_game/", {
                    method: "POST",
                    headers: thisMainMenu.headers,
                    body: JSON.stringify(args)
                }).then(handleErrors)
                .then(result => {
                    console.log(result);
                    if (result.player_id !== -1) {
                        this.getChildByName("usernameField").value = "";
                        enterLobby(result.player_id, result.session_id, result.username);
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
                fetch(thisMainMenu.fullAddr + "/api/join_game/", {
                    method: "POST",
                    headers: thisMainMenu.headers,
                    body: JSON.stringify(args)
                }).then(handleErrors)
                .then(result => {
                    console.log(result);
                    if (result.player_id !== -1) {
                        this.getChildByName("usernameField").value = "";
                        this.getChildByName("lobbyIdField").value = "";
                        enterLobby(result.player_id, result.session_id, result.username);
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

        /**
         * @param {integer} playerID 
         * @param {string} sessionID 
         * @param {string} name 
         * Enters a game lobby
         */
        function enterLobby(playerID, sessionID, name) {
            var sceneData = {
                client: thisMainMenu.client, 
                fullAddr: thisMainMenu.fullAddr, 
                headers: thisMainMenu.headers,
                playerID: playerID,
                lobbyID: sessionID,
                username: name
            };
            thisMainMenu.scene.start("lobby", sceneData)
        }

    }

}