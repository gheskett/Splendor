import Phaser from "phaser"
import sessionIDText from "../assets/html/session_id_text.html"
import lobbyBox from "../assets/html/lobby_box.html"

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
    }

    create() {
        var thisLobby = this;

        var numOfPlayers = -1;
        const lobbyColors = ["red", "rgb(0, 119, 255)", "rgb(200, 0, 200)", "rgb(0, 185, 0)"]
        const gameWidth = this.cameras.main.width, gameHeight = this.cameras.main.height;
        var lobbyIDText = this.add.dom(gameWidth / 2, 100).createFromCache("lobbyIDText").setOrigin(0.5, 1);
        var lobbyBoxes = [];
        lobbyIDText.getChildByID("idValue").innerHTML = this.lobbyID;

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

        //#region Server Listeners

        // Called whenever lobby specific elements are updated ('/api/is_game_started' equivalent)
        thisLobby.client.on("/io/update_lobby/", updateLobby);

        //#endregion Server Listeners

        function updateLobby(data) {
            console.log(data);
            
            if (numOfPlayers !== Object.keys(data.players).length) {
                lobbyBoxes = [];
                for (var i = 0; i < Object.keys(data.players).length; i++) {
                    lobbyBoxes[i] = thisLobby.add.dom(((i % 2) * (gameWidth / 2)), (i >= 2 ? 300 : 0) + 200).createFromCache("lobbyBox").setOrigin(0);

                    if (data.host_id === i) {
                        lobbyBoxes[i].getChildByID("host").style.display = "inline-block";
                    }

                    if (thisLobby.playerID === i) {
                        lobbyBoxes[i].getChildByID("pencil").style.display = "inline-block";
                        lobbyBoxes[i].getChildByID("userContainer").style.border = "10px solid gold";
                    }

                    lobbyBoxes[i].getChildByID("usernameValue").innerHTML = data.players[Object.keys(data.players)[i]].username;
                    lobbyBoxes[i].getChildByID("playerValue").innerHTML = i + 1;
                    lobbyBoxes[i].getChildByID("userContainer").style.background = lobbyColors[i];
                }
                numOfPlayers = Object.keys(data.players).length;
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