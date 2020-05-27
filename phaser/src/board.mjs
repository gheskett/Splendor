export class boardScene extends Phaser.Scene {
  constructor()
  {
    super('boardScene')
  }

  preload() {
    console.log("board preload")
    const fs = require('fs');
    for(var sprite in fs.readdirSync("./assets_tmp"));
    {
      this.load.image(sprite.replace(".png", ""), sprite);
    }
  }
    
  create() {
    const SELECTED = 1
    const NOT_SELECTED = 0.95
  
    const bg = this.add.image(0, 0, "bg").setOrigin(0).setScale(3);
    const title = this.add.image(720, 150, "title").setScale(1.5);
  
    const newGame = this.add.sprite(720, 420, "newGame").setInteractive().setAlpha(NOT_SELECTED);
    const joinGame = this.add.image(720, 550, "joinGame").setInteractive().setAlpha(NOT_SELECTED);
  
    newGame.on('pointerover',function(pointer){
    newGame.setAlpha(SELECTED).setScale(1.05);
    });
  
    newGame.on('pointerout',function(pointer){
      newGame.setAlpha(NOT_SELECTED).setScale(1);
    });
  
    joinGame.on('pointerover',function(pointer){
      joinGame.setAlpha(SELECTED).setScale(1.05);
    });
    
    joinGame.on('pointerout',function(pointer){
      joinGame.setAlpha(NOT_SELECTED).setScale(1);
    });
  
  }
}


  