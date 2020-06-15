import Phaser from "phaser"
import * as globals from "../globals.js"
import coverGame from "../assets/images/white_rectangle.png"

const eventHandler = new Phaser.Events.EventEmitter();
export default eventHandler;

export class eventManger extends Phaser.Scene {

    constructor() {
        super({ key: "eventManager" })
    }

    init() {
        this.client = globals.ioc.connect(globals.fullAddr);
    }

    preload() {
        this.load.image("coverGame", coverGame);
    }

    create() {

        const events = this;

        const coverGame = this.add.image(0, 0, "coverGame").setOrigin(0);

        this.scene.launch("mainMenu", { client: events.client });
        this.scene.launch("lobby");
        this.scene.launch("chat");
        this.scene.launch("board");

        eventHandler.on("main_menu_ready", function () {
            eventHandler.emit("new_main_menu");
            coverGame.setVisible(false);
        });

        //#region Server Listeners

        //Called immediately when connection is made between the client and python server
        this.client.on("connect", () => {
            console.log("Connected to API server!")
            // Connected, yay!
        });

        // Called immediately if client loses connection with server
        this.client.on('disconnect', () => {
            console.log("Lost connection to API server!")
            // Disconnected, oh no!

            eventHandler.emit("terminate_lobby");
            eventHandler.emit("terminate_chat");
            eventHandler.emit("terminate_board");
            eventHandler.emit("termainate_main_menu");
            eventHandler.emit("new_main_menu");
            // TODO: send connection error message to client, return to homepage, clear out old game variables
        });

        // Called whenever lobby specific elements are updated ('/api/is_game_started' equivalent)
        this.client.on("/io/update_lobby/", (data) => {
            //console.log(data);
            eventHandler.emit("update_lobby", data);
        });

        // Called whenever game elements are updated ('/api/get_game_state' equivalent)
        this.client.on("/io/update_game/", (data) => {
            //console.log(data);
            eventHandler.emit("update_game", data);
        });

        // Called whenever somebody sends a message to the server ('/api/get_messages' equivalent)
        this.client.on("/io/update_chat/", (data) => {
            //console.log(data);
            eventHandler.emit("update_chat", data);
        });

        //#endregion Server Listeners

    }
}