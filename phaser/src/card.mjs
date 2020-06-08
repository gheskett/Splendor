export function drawCost(x, y, serverCost, gemToSprite, board, scale)
{
    for (var gemtype in gemToSprite)
    {
        console.log("Drawing: " + gemtype);
        var cost = serverCost[gemtype];
        if (cost == 0)
        {
            continue;
        }

        console.log("Mapping: " + gemtype);
        console.log(gemToSprite[gemtype]);
        board.add.sprite(x + 16, y - 16, gemToSprite[gemtype]).setScale(scale);
        board.add.sprite(x + 16, y - 16, cost + "x128").setScale(scale / 2);

        //TODO: this probably needs to be spaced better
        y -= 64 * scale;
    }
}


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

        this.spriteCostMap = {};
        for (var color in this.cardMap)
        {
            this.spriteCostMap[color] = this.cardMap[color] + "_circle_x64";
        }
    }

    getCardName(color)
    {
        return "card_" + color + "_731x1024";
    }

    drawCard(x, y, width, height) {
        var dicEntry = this.board.server.lookUpCard(this.cardID);
        
        const gemScale = 48 / 128;
        const gemLength = 128 * gemScale;
        const gemHalfLength = gemLength / 2;

        var upperCornerX = x - width * .5;
        var upperCornerY = y - height * .5;
        
        var cardColor = this.cardMap[dicEntry["gem_type"]];
        this.board.add.sprite(x, y, this.getCardName(cardColor)).setScale(this.board.scales);
        this.board.add.sprite(upperCornerX + width - gemHalfLength - 5, 
            upperCornerY + gemHalfLength + 5, cardColor + "_symbol_x128")
            .setScale(gemScale);

        var prestige = dicEntry["prestige_points"];
        if (prestige != 0)
        {
            var numHalfLength = 64 / 2;
            this.board.add.sprite(upperCornerX + numHalfLength, upperCornerY + numHalfLength, prestige + "x128").setScale(64 / 128);
        }

        drawCost(upperCornerX, upperCornerY + height, dicEntry, this.spriteCostMap, this.board, 30 / 64);
    }
}