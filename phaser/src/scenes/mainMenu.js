import Phaser from "phaser"
import newGame from "../assets/new_game.svg"
import joinGame from "../assets/join_game.svg"
import titleLogo from "../assets/title.svg"
import background from "../assets/pattern-background-frost-texture.jpg"
import newGameForm from "../assets/new_game_form.html"
import joinGameForm from "../assets/join_game_form.html"
import blackRectangle from "../assets/black_rectangle.png"



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
        console.log(this.client);
        var thisMainMenu = this;

        //#region Game Variables
        this.add.text(20, 20, "test");
        const gameWidth = this.cameras.main.width, gameHeight = this.cameras.main.height;

        const SELECTED = 1
        const NOT_SELECTED = 0.90
        const DIM = 0.75

        const bg = this.add.image(0, 0, "bg").setOrigin(0).setScale(3);
        const title = this.add.image(gameWidth / 2, 150, "title").setScale(1.5);
        const dimmingObject = this.add.image(0, 0, "dimmingObject").setOrigin(0).setAlpha(DIM).setVisible(false).setDepth(1);

        const newGame = this.add.image(gameWidth / 2, 420, "newGame").setInteractive().setAlpha(NOT_SELECTED);
        const joinGame = this.add.image(gameWidth / 2, 550, "joinGame").setInteractive().setAlpha(NOT_SELECTED);

        var newGameForm = this.add.dom(gameWidth / 2, gameHeight / 2 - 80).createFromCache("newGameForm").setVisible(false);
        var joinGameForm = this.add.dom(gameWidth / 2, gameHeight / 2 - 80).createFromCache("joinGameForm").setVisible(false);
        //#endregion Game Variables

        //#region Server Listeners

        // Called whenever lobby specific elements are updated ('/api/is_game_started' equivalent)
        this.client.on("/io/update_lobby/", (data) =>
        {
            console.log(data)
            // TODO: if is_started is true, start game
        });

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
                }).then(response => response.json()
                ).then(result => {
                    console.log(result);
                })

                this.setVisible(false);
                playButtonEnable(true);
            
            }

            //Enable play buttons and remove username form on cancel
            if (event.target.name === "cancel") {

            this.setVisible(false);
            playButtonEnable(true);

            }

        });

        joinGameForm.addListener("click");
        joinGameForm.on("click", function (event) {

            var username = this.getChildByName("usernameField").value;
            var lobbyID = this.getChildByName("lobbyIdField").value;

            if (event.target.name === "join") {
            
                console.log(thisMainMenu.client);

                var args = {
                    sid: thisMainMenu.client.id,
                    username: username,
                    session_id: lobbyID
                }
                fetch(thisMainMenu.fullAddr + "/api/join_game/", {
                    method: "POST",
                    headers: thisMainMenu.headers,
                    body: JSON.stringify(args)
                }).then(response => response.json()
                ).then(result => {
                    console.log(result);
                })
                
                this.setVisible(false);
                playButtonEnable(true);
            
            }

            //Enable play buttons and remove username form on cancel
            if (event.target.name === "cancel") {

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
            newGame.setInteractive();
            joinGame.setInteractive();
            dimmingObject.setVisible(false);
            } 
            else {
            newGame.disableInteractive();
            joinGame.disableInteractive();
            dimmingObject.setVisible(true);
            }
        }
            }

}