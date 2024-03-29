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
        this.chatOn = false;
        const thisChat = this;
        const maxMessages = 50;
        const serverColor = "yellow";
        const gameWidth = this.cameras.main.width, gameHeight = this.cameras.main.height;

        const chatForm = this.add.dom(gameWidth * globals.notChat, 0).createFromCache("chatForm").setOrigin(0).setVisible(false).setDepth(0);

        //#endregion Initial Variable

        eventHandler.on("new_chat", function () {
            chatForm.setVisible(true);

            fetch(globals.fullAddr + "/api/get_messages?" + new URLSearchParams({
                session_id: globals.lobbyID
            }))
                .then(handleErrors)
                .then(result => {
                    if (result.length >= 1) {
                        var messagesInfo = [];
                        for (var i = 0; i < result.length; i++) {
                            messagesInfo.push({ message: "", playerID: -1, name: "", index: -1 })
                            if (!result[i].is_game_event) {
                                messagesInfo[i].playerID = result[i].player_id;
                                messagesInfo[i].name = globals.usernames[result[i].player_id];
                            }
                            messagesInfo[i].index = result[i].index;
                            messagesInfo[i].message = result[i].message.trim();
                        }

                        makeChat(messagesInfo);

                        thisChat.chatOn = true;

                    }
                })
                .catch(error => {
                    console.error(error);
                });

        });

        eventHandler.on("update_chat", function (data) {
            if (thisChat.chatOn && (data.player_id !== globals.playerID || data.is_game_event)) {
                var messageInfo = { message: "", playerID: -1, name: "", index: -1 };
                if (!data.is_game_event) {
                    messageInfo.playerID = data.player_id;
                    messageInfo.name = globals.usernames[data.player_id];
                }
                messageInfo.index = data.index;
                messageInfo.message = data.message.trim();
                makeChat([messageInfo]);
            }
        });

        eventHandler.on("terminate_chat", function () {
            chatForm.setVisible(false);
            chatForm.getChildByID("chatLog").innerHTML = "";
            thisChat.chatOn = false;
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
                    if (result === "OK") {
                        makeChat([{ message: msg.msg, playerID: globals.playerID, name: globals.usernames[globals.playerID] }]);
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

        //#region Unfocus text area on click

        thisChat.input.on("pointerdown", function (pointer) {
            if (pointer.currentlyOver) {
                if (!pointer.currentlyOver.includes(chatForm)) {
                    chatForm.getChildByID("msg").blur();
                }
            } else {
                chatForm.getChildByID("msg").blur();
            }
        });

        //#endregion Unfocus text area on click


        /**
        * Creates a message or many messages
        * @param {Array<Object>}
        */

        function makeChat(messages) {

            for (var i = 0; i < messages.length; i++) {
                var content = document.createElement("p");

                if (messages[i].playerID === -1) {
                    content.innerHTML = "<i>" + messages[i].message + "</i>";
                    content.style.color = serverColor;
                } else {
                    var userpart = document.createElement("span");
                    userpart.style.color = globals.playerColors[messages[i].playerID];
                    userpart.innerHTML = messages[i].name + ": ";
                    content.appendChild(userpart);
                    content.appendChild(document.createTextNode(messages[i].message));
                }

                if (chatForm.getChildByID("chatLog").children.length >= maxMessages) {
                    chatForm.getChildByID("chatLog").childNodes[0].remove()
                }

                chatForm.getChildByID("chatLog").appendChild(content);

            }

            if (chatForm.getChildByID("logContainer").scrollHeight > chatForm.getChildByID("logContainer").clientHeight) {
                chatForm.getChildByID("logContainer").style.height = 895 * 100 / 1080 + "%";
            } else {
                chatForm.getChildByID("logContainer").style.height = 918 * 100 / 1080 + "%";
            }

            chatForm.getChildByID("logContainer").scrollTop = chatForm.getChildByID("logContainer").scrollHeight;
        }

        function handleErrors(response) {
            if (!response.ok) {
                throw Error(response.statusText);
            }
            return response.json();
        }

    }
}
