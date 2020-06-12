import Phaser from "phaser"
import eventHandler from "./eventHandler.js"
import * as constants from "../constants.js"

import chatForm from "../assets/html/chat_form.html"

export default class chat extends Phaser.Scene {

    constructor(config) {
        super(config);
    }

    preload() {
        this.load.html("chatForm", chatForm);
    }

    create() {
        this.scene.bringToTop();

        //#region Initial Variables
        var chatOn = false;
        const thisChat = this;
        const BG_DIM = 0.8;
        const gameWidth = this.cameras.main.width, gameHeight = this.cameras.main.height;

        var chatForm = this.add.dom(gameWidth * constants.notChat, gameHeight).createFromCache("chatForm").setOrigin(0, 1).setVisible(true);
        chatForm.getChildByID("msg").addEventListener("keypress", function(event) {
            if(event.which === 13 && !event.shiftKey) {
                event.preventDefault(); // Prevents the addition of a new line in the text field (not needed in a lot of cases)
                const msg = event.target.value;
                if (msg.trim() != "") {
                    eventHandler.emit("local_message", {msg: msg.trim()});
                } 
                event.target.value = "";
            }
        });
        //#endregion Initial Variable

        eventHandler.on("new_chat", function() {

        });

        eventHandler.on("update_chat", function (data) {

        });

        eventHandler.on("terminate_chat", function() {

        });

        eventHandler.on("local_message", function(msg) {
            
        });

    }
}
