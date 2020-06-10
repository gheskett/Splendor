import { drawCost } from "./Card.mjs"

export class noble {
    constructor(board, nobleID)
    {
        this.board = board;
        this.nobleID = nobleID;

        const size = 64;

        this.cardMap = {
            "onyx": "brown",
            "ruby": "red",
            "emerald": "green",
            "sapphire": "blue",
            "diamond": "white"
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
        drawCostNoble(x - length * .5, y + length * .5, cardInfo, this.cardMap, this.board, .5);

        var prestige = cardInfo["prestige_points"];
        var size = 128;
        var numScale = .5;
        var halfSize = size / 2 * numScale;
        this.board.add.sprite(x + length *.5 - halfSize + 2, y - length * .5 + halfSize, prestige + "x" + size).setScale(numScale);
    }
}

export function drawCostNoble(x, y, serverCost, gemToSprite, board, scale)
{
    x += 10;
    y -= 13;
    for (var gemtype in gemToSprite)
    {
        console.log("Drawing: " + gemtype);
        var cost = serverCost[gemtype];
        if (cost == 0)
        {
            continue;
        }

        board.add.sprite(x + 16, y - 16, gemToSprite[gemtype]).setScale(scale);
        board.add.sprite(x + 16, y - 16, cost + "x128").setScale(scale / 2);

        //TODO: this probably needs to be spaced better
        y -= 64 * scale + 4;
    }
}
