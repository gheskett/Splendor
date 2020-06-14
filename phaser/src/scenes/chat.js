import Phaser from "phaser"
import eventHandler from "./eventHandler.js"
import * as globals from "../globals.js"

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
        const maxMessages = 50;
        const playerColors = ["rgb(175, 0, 0)",
            "rgb(0, 90, 200)",
            "rgb(190, 0, 190)",
            "rgb(0, 161, 0)"
        ];
        const serverColor = "rgb(210, 210, 210)";
        const gameWidth = this.cameras.main.width, gameHeight = this.cameras.main.height;

        const chatForm = this.add.dom(gameWidth * globals.notChat, 0).createFromCache("chatForm").setOrigin(0).setVisible(false);

        //#endregion Initial Variable

        eventHandler.on("new_chat", function () {
            chatOn = true;
            chatForm.setVisible(true);

            fetch(globals.fullAddr + "/api/get_messages?" + new URLSearchParams({
                session_id: globals.lobbyID,
                num_messages: maxMessages
            })).then(handleErrors)
                .then(result => {
                    if (result.length >= 1) {
                        var messagesInfo = [];
                        for (var i = 0; i < result.length; i++) {
                            messagesInfo.push({message: "", playerID: -1, name: ""})
                            if (!result[i].is_game_event) {
                                messagesInfo[i].playerID = result[i].player_id;
                                messagesInfo[i].name = globals.usernames[result[i].player_id];
                            }
                            messagesInfo[i].message = result[i].message;   
                        }

                        makeChat(messagesInfo);

                    }
                })
                .catch(error => {
                    console.error(error);
                });

        });

        eventHandler.on("update_chat", function (data) {

        });

        eventHandler.on("terminate_chat", function () {

        });

        eventHandler.on("local_message", function (msg) {

            var args = {
                player_id: globals.playerID,
                session_id: globals.lobbyID,
                message: msg.msg
            }

            fetch(globals.fullAddr + "/api/send_message/", {
                method: "POST",
                headers: globals.headers,
                body: JSON.stringify(args)
            }).then(handleErrors)
                .then(result => {
                    console.log(result);
                    if (result === "OK") {
                        makeChat([{message: msg.msg, playerID: globals.playerID, name: globals.usernames[globals.playerID]}]);
                    } else {
                        console.warn(result);
                    }
                }).catch(error => {
                    console.error(error);
                });

        });

        chatForm.getChildByID("msg").addEventListener("keypress", function (event) {
            if (event.which === 13 && !event.shiftKey) {
                event.preventDefault(); // Prevents the addition of a new line in the text field (not needed in a lot of cases)
                const msg = event.target.value;
                if (msg.trim() != "") {
                    eventHandler.emit("local_message", { msg: msg.trim() });
                }
                event.target.value = "";
            }
        });


        /**
        * Creates a message or many messages
        * @param {Array<Object>}
        */

        function makeChat(messages) {

            for (var i = 0; i < messages.length; i++) {
                var content = document.createElement("p");

                if (messages[i].playerID === -1) {
                    content.innerHTML = messages[i].message;
                    content.style.color = serverColor;
                } else {
                    var userpart = document.createElement("span");
                    userpart.style.color = playerColors[messages[i].playerID];
                    userpart.innerHTML = messages[i].name + ": ";
                    content.appendChild(userpart);
                    content.appendChild(document.createTextNode(messages[i].message));
                }

                chatForm.getChildByID("chatLog").appendChild(content);

                if (chatForm.getChildByID("chatLog").children.length > maxMessages) {
                    chatForm.getChildByID("chatLog").firstChild.remove();
                }

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
