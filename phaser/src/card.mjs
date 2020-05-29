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

    drawCard(x, y, width, height) {
        var dicEntry = this.board.lookUpCard(this.cardID);
        
        var upperCornerX = x - width * .5;
        var upperCornerY = y - height * .5;
        
        var cardColor = this.cardMap[dicEntry["gem_type"]];
        this.board.add.sprite(x, y, this.getCardName(cardColor)).setScale(this.board.scales);
        this.board.add.sprite(upperCornerX + width - 64 * this.board.scales - 5, upperCornerY + 64 * this.board.scales + 5, cardColor + "_circle_x128").setScale(this.board.scales);

        var prestige = dicEntry["prestige_points"];
        if (prestige != 0)
        {
            this.board.add.sprite(upperCornerX + 15, upperCornerY + 20, prestige + "x128").setScale(this.board.scales);
        }

        var costY = upperCornerY + height;
        for (var gemtype in this.cardMap)
        {
            var cost = dicEntry[gemtype];
            if (cost == 0)
            {
                continue;
            }

            var gemColor = this.cardMap[gemtype];
            
            this.board.add.sprite(upperCornerX + 16, costY - 16, gemColor + "_circle_x64").setScale(this.board.scales);
            this.board.add.sprite(upperCornerX + 16, costY - 16, cost + "x64").setScale(this.board.scales);

            //TODO: this probably needs to be spaced better
            costY -= 64 * this.board.scales;
        }
    }
}