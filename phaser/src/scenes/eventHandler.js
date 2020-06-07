import Phaser from "phaser"

const eventHandler = new Phaser.Events.EventEmitter();
export default eventHandler;

export class eventManger extends Phaser.Scene {

    constructor() {
        super({key: "eventManager"})
    }

    init(data) {
        this.ioc = data.ioc;
        this.client = data.ioc.connect( data.fullAddr );
        this.fullAddr = data.fullAddr;
        this.headers = data.headers;
    }

    create(serverData) {

        const events = this;
        var scenesReady = 0;

        this.scene.launch("mainMenu", {client: events.client, fullAddr: events.fullAddr, headers: events.headers});
        this.scene.launch("lobby", {client: events.client, fullAddr: events.fullAddr, headers: events.headers});

        eventHandler.on("main_menu_ready", function() {
            eventHandler.emit("new_main_menu");
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

            // TODO: send connection error message to client, return to homepage, clear out old game variables
        });

        // Called whenever lobby specific elements are updated ('/api/is_game_started' equivalent)
        this.client.on("/io/update_lobby/", (data) => {
            //console.log(data);
            eventHandler.emit("update_lobby", data);
        });

        // Called whenever game elements are updated ('/api/get_game_state' equivalent)
        this.client.on("/io/update_game/", (data) => {
            console.log(data);
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