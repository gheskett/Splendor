import { require } from "./require.js"

export class card {
    constructor(board, cardID) {
        this.board = board;
        this.cardID = cardID;

        this.cardMap = {
            "diamond": "white",
            "sapphire": "blue",
            "emerald": "green",
            "ruby": "red",
            "onyx": "brown"
        };
    }

    getCardName(color)
    {
        return "card_" + color + "_731x1024";
    }

    drawCard(x, y) {
        var dicEntry = board.lookUpCard(cardID);
        var assert = require('assert');
        assert(dicEntry["card_id"] == cardID);
        
        var cardColor = this.cardMap[dicEntry["gem_type"]];
        this.board.add.Sprite(x, y, getCardName(cardColor));

        var prestige = dicEntry["prestige_points"];
        if (prestige != 0)
        {
            //TODO: spacing
            this.board.add.Sprite(x, y, prestige + "x128");
        }

        var costY = y + 1024;
        for (var gemtype in this.cardMap)
        {
            var cost = dicEntry[gemtype];
            if (cost == 0)
            {
                continue;
            }

            var gemColor = this.cardMap[gemtype];
            
            this.board.add.Sprite(x, costY, gemColor + "_circle_x64");
            this.board.add.Sprite(x, costY, cost + "x64");

            //TODO: this probably needs to be spaced better
            costY -= 64;
        }
    }
}