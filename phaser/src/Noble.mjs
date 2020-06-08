import { drawCost } from "./Card.mjs"

export class noble {
    constructor(board, nobleID)
    {
        this.board = board;
        this.nobleID = nobleID;

        const size = 64;

        this.cardMap = {
            "diamond": "white",
            "sapphire": "blue",
            "emerald": "green",
            "ruby": "red",
            "onyx": "brown"
        };

        for (var gemType in this.cardMap)
        {
            this.cardMap[gemType] = this.cardMap[gemType] + "_rectangle_x" + size;
        }
    }

    drawNoble(x, y, length, scale)
    {
        this.board.add.sprite(x, y, "noble_front").setScale(scale);

        var cardInfo = this.board.server.lookUpNoble(this.nobleID);
        drawCost(x - length * .5, y + length * .5, cardInfo, this.cardMap, this.board, .5);

        var prestige = cardInfo["prestige_points"];
        var size = 128;
        var numScale = .5;
        var halfSize = size / 2 * numScale;
        this.board.add.sprite(x + length *.5 - halfSize, y - length * .5 + halfSize, prestige + "x" + size).setScale(numScale);
    }
}