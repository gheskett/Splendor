export function drawCost(x, y, serverCost, gemToSprite, board, scale) {
    x += 8;
    y -= 4;
    //console.log(gemToSprite)
    for (var gemtype in gemToSprite) {
        //console.log("Drawing: " + gemtype);
        var cost = serverCost[gemtype];
        if (cost === 0) {
            continue;
        }

        board.f_cards.push(board.add.sprite(x + 16, y - 16, gemToSprite[gemtype]).setScale(scale));
        board.f_cards.push(board.add.sprite(x + 16, y - 16, cost + "x128").setScale(scale / 2));

        //TODO: this probably needs to be spaced better
        y -= 64 * scale + 4;
    }
}


export class card {
    constructor(board, cardID) {
        this.board = board;
        this.cardID = cardID;

        this.cardMap = {
            "onyx": "brown",
            "ruby": "red",
            "emerald": "green",
            "sapphire": "blue",
            "diamond": "white"
        };

        this.spriteCostMap = {};
        for (var color in this.cardMap) {
            this.spriteCostMap[color] = this.cardMap[color] + "_circle_x64";
        }
    }

    getCardName(color) {
        return "card_" + color + "_731x1024";
    }

    drawCard(x, y, width, height, isReserved) {
        if (this.cardID == null) {
            this.board.f_cards.push(this.board.add.sprite(x, y, "card_outline_x1024").setScale(this.board.scales));
            return;
        }

        var dicEntry = this.board.server.lookUpCard(this.board.cardsDatabase, this.cardID);
        
        const gemScale = 48 / 128;
        const gemLength = 128 * gemScale;
        const gemHalfLength = gemLength / 2;

        var upperCornerX = x - width * .5;
        var upperCornerY = y - height * .5;
        
        var cardColor = this.cardMap[dicEntry["gem_type"]];
        this.board.f_cards.push(this.board.add.sprite(x, y, this.getCardName(cardColor)).setScale(this.board.scales));
        this.board.f_cards.push(this.board.add.sprite(upperCornerX + width - gemHalfLength,
            upperCornerY + gemHalfLength + 5, cardColor + "_symbol_x128")
            .setScale(gemScale));

        var prestige = dicEntry["prestige_points"];

        if (prestige != 0) {
            var numHalfLength = 64 / 2;
            this.board.f_cards.push(this.board.add.sprite(upperCornerX + numHalfLength - 8, upperCornerY + numHalfLength - 3, prestige + "x128").setScale(64 / 128));
        }

        if (isReserved) {
            var numHalfLength = 64 / 2;
            this.board.f_cards.push(this.board.add.sprite(x + width * 0.5 - numHalfLength - 8, y + width * 0.5 - numHalfLength + 14, "r" + dicEntry["rank"] + "x128").setScale(80 / 128));
        }

        drawCost(upperCornerX, upperCornerY + height, dicEntry, this.spriteCostMap, this.board, 30 / 64);
    }
}