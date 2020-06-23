import Phaser from "phaser"

export default class infoBox extends Phaser.GameObjects.Container {

    constructor(scene, x, y) {
        super(scene, x, y);

        this.createBox(scene);

    }

    /**
     * @param {Phaser.Scene} scene
     */
    createBox(scene) {


        //#region Box settings

        const width = 366; const height = 224; const stroke = 4;
        const TLcorner = {
            x: -1 * (width / 2 - stroke),
            y: -1 * (height / 2 - stroke)
        };
        const infoColors = [[0xEF8F8F, 0x801B1B], [0x9ED0F4, 0x1B3780], [0xCDB5E4, 0x6E0194], [0x91DF94, 0x116815]];

        const textSettings = {
            fontFamily: "Raleway, serif",
            fontSize: "28px",
            color: "white",
            stroke: "black",
            strokeThickness: 4
        };

        const tokenInfo = {
            amount: 6,
            width: 26,
            height: 26,
            seperation: 10,
            l_edge_dist: 5,
            t_edge_dist: 5
        };

        const tokenText = {
            l_edge_dist: tokenInfo.width + tokenInfo.l_edge_dist + 8,
            t_edge_dist: tokenInfo.t_edge_dist - 5
        };

        const cardInfo = {
            amount: 5,
            width: 19,
            height: 26,
            seperation: 10,
            l_edge_dist: tokenInfo.width + tokenInfo.l_edge_dist + 40,
            t_edge_dist: 5
        };

        const cardText = {
            l_edge_dist: cardInfo.width + cardInfo.l_edge_dist + 8,
            t_edge_dist: cardInfo.t_edge_dist - 5
        };

        const reserveInfo = {
            amount: 3,
            width: 40,
            height: 56,
            seperation: 12,
            l_edge_dist: cardInfo.width + cardInfo.l_edge_dist + 40,
            t_edge_dist: 12
        }

        const nobleInfo = {
            amount: 5,
            width: 64,
            height: 30,
            seperation: 11,
            l_edge_dist: reserveInfo.width + reserveInfo.l_edge_dist + 20,
            t_edge_dist: 11
        }

        const lineInfo = {
            width: 5,
            l_edge_dist: nobleInfo.width + nobleInfo.l_edge_dist + 5,
        }

        const PPinfo = {
            l_edge_dist: (lineInfo.width + lineInfo.l_edge_dist + width - stroke) / 2,
            t_edge_dist: 30
        }

        //#endregion Box settings

        //#region Element creation

        //Add background for box with appropriate color
        this.bg = scene.add.rectangle(0, 0, width - (stroke * 2), height - (stroke * 2),
            infoColors[0][0]).setStrokeStyle(stroke, infoColors[0][1]);
        this.add(this.bg);

        //Create tokens and text
        this.tokens = [[]];
        for (let i = 0; i < tokenInfo.amount; i++) {

            this.tokens[i] = [];

            this.tokens[i][0] = scene.add.image(TLcorner.x + tokenInfo.l_edge_dist, TLcorner.y
                + tokenInfo.t_edge_dist + (i * (tokenInfo.seperation + tokenInfo.height)),
                "uiTokens", i).setOrigin(0).setDisplaySize(tokenInfo.width, tokenInfo.height);
            this.add(this.tokens[i][0]);

            this.tokens[i][1] = scene.add.text(TLcorner.x + tokenText.l_edge_dist, TLcorner.y
                + tokenText.t_edge_dist + (i * (tokenInfo.seperation + tokenInfo.height)),
                "0", textSettings).setOrigin(0);
            this.add(this.tokens[i][1]);

            console.log(this.tokens);

        }

        //Create cards and text
        this.cards = [[]];
        for (let i = 0; i < cardInfo.amount; i++) {

            this.cards[i] = [];

            this.cards[i][0] = scene.add.image(TLcorner.x + cardInfo.l_edge_dist, TLcorner.y
                + cardInfo.t_edge_dist + (i * (cardInfo.seperation + cardInfo.height)),
                "infoCards", i).setOrigin(0).setDisplaySize(cardInfo.width, cardInfo.height);
            this.add(this.cards[i][0]);

            this.cards[i][1] = scene.add.text(TLcorner.x + cardText.l_edge_dist, TLcorner.y
                + cardText.t_edge_dist + (i * (cardInfo.seperation + cardInfo.height)),
                "0", textSettings).setOrigin(0);
            this.add(this.cards[i][1]);
        }

        //Create reserve cards
        this.reserves = [];
        for (let i = 0; i < reserveInfo.amount; i++) {
            this.reserves[i] = scene.add.image(TLcorner.x + reserveInfo.l_edge_dist, TLcorner.y
                + reserveInfo.t_edge_dist + (i * (reserveInfo.seperation + reserveInfo.height)),
                "reserveCards", i).setOrigin(0).setDisplaySize(reserveInfo.width, reserveInfo.height);
            this.add(this.reserves[i]);
        }

        //Create noble pictures
        this.nobles = [];
        for (let i = 0; i < nobleInfo.amount; i++) {
            this.nobles[i] = scene.add.image(TLcorner.x + nobleInfo.l_edge_dist, TLcorner.y
                + nobleInfo.t_edge_dist + (i * (nobleInfo.seperation + nobleInfo.height)),
                "crown").setOrigin(0).setDisplaySize(nobleInfo.width, nobleInfo.height);
            this.add(this.nobles[i]);
        }

        //Create Dividing Line
        this.line = scene.add.rectangle(TLcorner.x + lineInfo.l_edge_dist, TLcorner.y,
            lineInfo.width, height - (stroke * 2), infoColors[0][1]).setOrigin(0);
        this.add(this.line);

        //Create PP text
        this.add(scene.add.text(TLcorner.x + PPinfo.l_edge_dist, TLcorner.y + PPinfo.t_edge_dist, "PP:", {
            fontFamily: "Raleway, serif",
            fontSize: "40px",
            color: "white",
            stroke: "black",
            strokeThickness: 6,
            align: "center"
        }).setOrigin(0.5));

        //Create PP value
        this.PPvalue = scene.add.text(TLcorner.x + PPinfo.l_edge_dist, 0, "0", {
            fontFamily: "Raleway, serif",
            fontSize: "72px",
            color: "white",
            stroke: "black",
            strokeThickness: 10,
            align: "center"
        }).setOrigin(0.5);
        this.add(this.PPvalue);

        //#endregion Element creation


    }

}

Phaser.GameObjects.GameObjectFactory.register("infoBox", function (x, y) {
    const box = new infoBox(this.scene, x, y);
    this.displayList.add(box);
    return box;
});