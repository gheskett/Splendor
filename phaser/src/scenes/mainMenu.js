import Phaser from "phaser"
import {Scene} from "phaser"

export default class mainMenu extends Scene {
    constructor(config) {
        super(config);
    }

    create() {
        this.add.text(20, 20, "test");
    }

}