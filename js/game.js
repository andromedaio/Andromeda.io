var Game = {};

var layer;
var dustList = [];
var weaponArray = [];
function addWeapon(lifespan, velocity, bulletTime, damage) {
    weaponArray.push({lifespan: lifespan, velocity: velocity, bulletTime: bulletTime, damage: damage});
}
addWeapon(2000, 900, 100, Game.bulletDamage[0]);
addWeapon(2000, 900, 50, Game.bulletDamage[1]);
addWeapon(2000, 900, 150, Game.bulletDamage[2]);


var firedBullets = new Map();
var playerMap = new Map();
var bulletID = 0;
var burstLittleEmitter;
var burstBig;

shop = {
    shopMenu: null,
    scrollBarBackground: null,
    scrollBar: null,
    scrollBarX: 0,
    scrollBarY: 0,
    scrollBarWidth: 0,
    scrollBarHeight: 20,
    scrollBarColor: null,
    scrollBarHover: false
};
Game.dragX = 0;
Game.dragY = 0;
Game.screenResized = false;


//This variable represents the amount of ships in the game
//It is used when assigning new players a ship
const numberOfShipSprites = 15;

Game.init = function(){
    Client.connect();
    console.log('Game.init');
    // Disable scroll bars
    //document.documentElement.style.overflow = 'hidden'; // firefox, chrome
    //document.body.scroll = "no";    // ie only
    // Run game in background
    this.game.stage.disableVisibilityChange = true;

    Game.screenResized = true;
    Game.showFPS = false;

    Game.leaderboard = [null, null, null, null, null, null];

    // Game.playerSize = 64;           // sq. px. size
    Game.isSafe = false;            // local player is in safe zone
    Game.maxNormVelocity = 200;     // maximum body acceleration
    Game.maxBoost = 5000;           // max boost capacity
    Game.maxBoostVelocity = 400;    // maximum body acceleration when boosting
    Game.normalAccel = 300;         // normal player acceleration speed
    Game.boostAccelMult = 10;       // boost acceleration multiplier
    Game.normalAngVel = 300;        // normal player rotation speed
    Game.boostRotMult = 0.5;        // boost rotation mutliplier
    Game.boostCost = 1;             // how much boost costs when active
    Game.boostRefillCost = 1;

    Game.tierShipCosts = [5000, 10000, 20000, 30000, 40000];
    Game.buyWeaponCost = [1000, 3000, 2000];
    Game.bulletDamage = [6, 2, 10];
    Game.maxWeaponAmmo = [50, 250, 100];
    Game.bulletReloadCostList = [50, 25, 100];

    Game.inShop = false;
};


Game.preload = function() {
    console.log('Game.preload');

    game.load.onLoadStart.addOnce(loadStart, this);
    this.game.stage.disableVisibilityChange = true;

    // Load map assets
    this.game.load.tilemap('map', 'assets/map/neontest.json', null, Phaser.Tilemap.TILED_JSON);
    this.game.load.image('tiles', 'assets/map/largetilesheet.png');
    this.game.load.image('safe_zone', 'assets/map/grid.png');
    this.game.load.image('neon', 'assets/map/tilemapneonsmall.png');

    // Load ship assets
    this.game.load.image('ship1','assets/sprites/neon/Ship1.png');
    this.game.load.image('ship2','assets/sprites/neon/Ship2.png');
    this.game.load.image('ship3','assets/sprites/neon/Ship3.png');
    this.game.load.image('ship4','assets/sprites/neon/Ship4.png');
    this.game.load.image('ship5','assets/sprites/neon/Ship5.png');
    this.game.load.image('ship6','assets/sprites/neon/Ship6.png');
    this.game.load.image('ship7','assets/sprites/neon/Ship7.png');
    this.game.load.image('ship8','assets/sprites/neon/Ship8.png');
    this.game.load.image('ship9','assets/sprites/neon/Ship9.png');
    this.game.load.image('ship10','assets/sprites/neon/Ship10.png');
    this.game.load.image('ship11','assets/sprites/neon/Ship11.png');
    this.game.load.image('ship12','assets/sprites/neon/Ship12.png');
    this.game.load.image('ship13','assets/sprites/neon/Ship13.png');
    this.game.load.image('ship14','assets/sprites/neon/Ship14.png');
    this.game.load.image('ship15','assets/sprites/neon/Ship15.png');

    // Load dust asset
    //thsis.game.load.spritesheet('dust', 'assets/sprites/neon/Dust.png',500,500,30);
    this.game.load.image('dust', 'assets/sprites/neon/Dust Single.png');

    // Load Particles
    // this.game.load.image('trail', 'assets/sprites/w_trail.png');
    this.game.load.image('trail', 'assets/sprites/w_bubble.png');
    this.game.load.image('spark', 'assets/sprites/neon/spark.png');
    this.game.load.image('sparksmall', 'assets/sprites/neon/bluespark.png');

    // Load weapon assets
    this.game.load.image('bullet', 'assets/sprites/neon/GreenShot.png');
    this.game.load.image('bullet1', 'assets/sprites/neon/RedShot.png');
    this.game.load.image('bullet2', 'assets/sprites/neon/BlueShot.png');

    this.game.load.image('ship0', 'assets/sprites/neon/squaresquare.png');

    this.game.load.image('arrow', 'assets/sprites/neon/arrow.png');
};

//Helper function for the loading screen
function loadStart() {
    var shiploadsprite = game.add.sprite(game.world.centerX - game.world.width*0.03, game.world.centerY, 'shipload');
    shiploadsprite.height = 75;
    shiploadsprite.width = 75;
    game.stage.backgroundColor = '#000000';
    game.add.text(game.world.centerX+game.world.width*0.03,game.world.centerY, 'Loading...', { fill: '#ffffff' });
    //var sprite = game.add.sprite(game.world.centerX,game.world.centerY,'loadingSprite');
    //sprite.animations.add('spin');
    //sprite.animations.play('spin',10,true);
};

var sprite;


Game.create = function(){
    console.log('Game.create');

    //***
    //*** Uncomment for optimization but make sure the background
    //*** outside of the map is not visible otherwise trippy shit happens
    //***
    //game.renderer.clearBeforeRender = false;
    //game.renderer.roundPixels = true;

    game.time.advancedTiming = true;

    // Enable Phaser Arcade game physics engine
    //this.game.physics.startSystem(Phaser.Physics.ARCADE);
    Game.physics.startSystem(Phaser.Physics.ARCADE);

    // Create reference list of all players in game
    Game.shipTrails = game.add.group();
    Game.playerMap = {};
    Game.ammoMap = {};
    Game.allPlayersAdded = false;
    Game.localPlayerInstantiated = false;
    Game.bulletsCreated = false;

    // Set up scaling management
    this.game.scale.scaleMode = Phaser.ScaleManager.SHOW_ALL;
    this.game.scale.pageAlignHorizontally = true;
    this.game.scale.pageAlignVertically = true;
    //console.log(this.game.scale.width + " width");
    //this.game.scale.setGameSize(window.outerWidth * 1.1, window.innerHeight * 1.1);
    // this.game.scale.setMinMax(640,480/*,1920,1080*/);

    // Handle window resizing events every 50ms
    window.addEventListener('resize',function(event){
        clearTimeout(window.resizedFinished);
        window.resizedFinished = setTimeout(function(){
            //console.log('Resize finished');
            Game.rescale();
            //console.log("Resize width: " + Game.width + ", Resize height: " + Game.height);
            Game.screenResized = true;
        }, 50);
    });

    // Set up tile mapping and layer system
    //Name of tilesheet in json, name in game.js
    Game.map = this.game.add.tilemap('map');
    Game.map.addTilesetImage('largetilesheet','tiles');
    Game.map.addTilesetImage('tilemapneonsmall','neon');

    //Order of these statements impacts the order of render
    Game.background = Game.map.createLayer('Backgroundlayer');

    // safeZoneLayer = map.createLayer('Zonelayer');
    Game.safeZone = game.add.sprite(3235,3240,'safe_zone');
    Game.safeZone.width = 1205;
    Game.safeZone.height = 1205;
    Game.safeZone.anchor.setTo(0.5,0.5);
    Game.safeZone.alpha = 0.6;
    Game.layer = Game.map.createLayer('Groundlayer');
    Game.map.setCollisionBetween(0, 4000, true, 'Groundlayer');
    Game.layer.resizeWorld();

    // Enable Phaser Arcade game physics engine
    this.game.physics.startSystem(Phaser.Physics.ARCADE);
    Game.safeZone.enableBody = true;
    Game.physics.enable(Game.safeZone, Phaser.Physics.ARCADE);

    // Create Local player & all active remote players
    Client.askNewPlayer();
    Client.getPlayer();

    Game.rescale();

    this.game.camera.bounds = new Phaser.Rectangle(-this.game.world.width,-this.game.world.height,
        this.game.world.width*3, this.game.world.height*3);

    Game.playerHUD = {
        "health": 0,
        "bullets": 0,
        "boost": 0,
        "currency": 0
    };

    Game.cursors = this.game.input.keyboard.addKeys( { 'up': Phaser.KeyCode.W, 'down': Phaser.KeyCode.S,
        'left': Phaser.KeyCode.A, 'right': Phaser.KeyCode.D } );
    this.game.input.keyboard.addKeyCapture([Phaser.Keyboard.SPACEBAR]);
    Game.pointer = new Phaser.Pointer(this.game, 0);

    //bullet.body.setSize(bullet.width,bullet.height,0.5,0.5);
    // publicBulletInfo.bullets.bodies.setCircle(10);
    // Input
    /*cursors = game.input.keyboard.createCursorKeys();
    game.input.keyboard.addKeyCapture([Phaser.Keyboard.SPACEBAR]);*/
    // console.log("Got to creation");
    Game.playerDestroyed = false;

    //generate dust for the player
    generateDustForClient(Client.getPlayerID());
    // console.log("DustList size: " + dustList.length);
    // console.log("Testing the dust list to verify that it loaded correctly, " +
    //     "dust x position: " + dustList[100].positionx);
    Game.playerDestroyed = false;

    burstLittleEmitter = game.add.emitter(0, 0,100);
    burstLittleEmitter.makeParticles('spark');
    burstBig = game.add.emitter(0, 0,20);
    burstBig.makeParticles('sparksmall');


    shop.shopMenu = Game.add.graphics(0,0);
    shop.scrollBarBackground = Game.add.graphics(0,0);
    shop.scrollBar = Game.add.graphics(0,0);
};

/*
window.addEventListener("focus", function(event)
{
    game.input.keyboard.start();
    console.log('in focus');
}, false);*/

Game.focused = true;
window.addEventListener("blur", function(event) {
    game.input.keyboard.reset();
    Client.setFocus(false);
    Game.focused = false;
}, false);
window.addEventListener("focus", function(event) {
    Client.askUpdate();
    Client.setFocus(true);
    Game.focused = true;
}, false);

Game.update = function()
{
    // Establish collision detection between groups
    // This is the dust that is spawned when a player dies
    deathDustMap.forEach(function (dust) {
        playerMap.forEach(function (player) {
            Game.physics.arcade.overlap(dust, player, dustCollisionDeath);
        });
    });

    // This for the dust that starts in your game
    playerMap.forEach(function (player) {
        Game.physics.arcade.overlap(dustList, player, dustCollision);
    });

    Game.physics.arcade.collide(Game.layer, dustList);

    Game.physics.arcade.collide(Game.layer, Game.playerMap[Client.getPlayerID()]);

    if (Game.physics.arcade.overlap(Game.safeZone, Game.playerMap[Client.getPlayerID()], Game.enterSafeZone)){}
    else {
        Game.exitSafeZone();
    }

    //Bullet collision
    var bulletErase = [];
    if(firedBullets.size > 0 && !document.hidden && typeof Game.ammoMap[Client.getPlayerID()] !== 'undefined' && Client.getPlayerID() !== -1) {
        firedBullets.forEach(function (bullet) {
            playerMap.forEach(function (player, key) {
                //when the current player is hit with a bullet
                if(key !== bullet.player) {
                    Game.physics.arcade.overlap(player, bullet, function (player, bullet) {
                        bulletErase.push(bullet);
                        player.damage(bullet.damage);
                    });
                }
            });
            //safezone
            Game.physics.arcade.overlap(bullet, Game.safeZone, function (bullet) {
                //burstLittle(bullet.x, bullet.y);
                bulletErase.push(bullet);
            });
            //layer
            Game.physics.arcade.overlap(Game.layer, bullet, function (bullet, layer) {
                if(layer.index !== -1) {
                    //burstLittle(bullet.x, bullet.y);
                    bulletErase.push(bullet);
                }
            });
        });

        Game.physics.arcade.overlap(dustList, playerMap, dustCollision);

        for(var e in bulletErase){
            firedBullets.delete(bulletErase[e].id);
            bulletErase[e].destroy();
        }
    }


    // Get forward/backward input
    if (Game.cursors.up.isDown && !Game.inShop)
    {
        Game.setPlayerAcceleration(Game.normalAccel, game.input.keyboard.isDown(Phaser.Keyboard.SHIFT))
    }
    else if (Game.cursors.down.isDown && !Game.inShop)
    {
        Game.setPlayerAcceleration(-Game.normalAccel, game.input.keyboard.isDown(Phaser.Keyboard.SHIFT))
    }
    else
    {
        Game.setPlayerAcceleration(0, false);
    }
    if (Game.cursors.left.isDown && Game.cursors.right.isDown && !Game.inShop) {
        if (Game.cursors.left.isDown && Game.cursors.left.timeDown > Game.cursors.right.timeDown) {
            Client.sendRotation(-300);
        }
        else {
            Client.sendRotation(300);
        }
    }
    else if (Game.cursors.left.isDown && !Game.inShop) {
        Client.sendRotation(-300);
    }
    else if (Game.cursors.right.isDown && !Game.inShop) {
        Client.sendRotation(300);
    }
    else
    {
        Client.sendRotation(0);
    }

    if ((game.input.keyboard.isDown(Phaser.KeyCode.Q) || game.input.keyboard.isDown(Phaser.KeyCode.L)) && !Game.inShop) {
        showPlayerNames();
    }
    else {
        removePlayerNames();
    }

    // Get firing input
    if (!Game.isSafe && game.input.keyboard.isDown(Phaser.Keyboard.SPACEBAR))
    {
        fireBullet(Client.getPlayerID());
    }

    if (Game.allPlayersAdded) {
        if (Game.isSafe) {
            Game.showBasePrompts();

            if (game.input.keyboard.isDown(Phaser.KeyCode.E)) {
                //Game.requestShipUpgrade();
                Game.holdingE = true;
            }
            else {
                Game.holdingE = false;
            }
            if (Game.inShop && !Game.holdingE) {
                Game.updateShop();
                Game.playerMap[Client.id].body.maxVelocity.set(0);
            }
            else {
                Game.clearShop();
                if (Game.playerMap[Client.id].body.maxVelocity === 0)
                    Game.playerMap[Client.id].body.maxVelocity.set(Game.maxNormVelocity);
            }
            if (game.input.keyboard.isDown(Phaser.KeyCode.R)) {
                Game.reloadWeapon();
            }
            if (game.input.keyboard.isDown(Phaser.KeyCode.B)) {
                Game.refillBoost();
            }
            if (game.input.keyboard.isDown(Phaser.KeyCode.V)){
                // Game.playerMap[Client.id].shipName = 'ship0';
                // Game.updatePlayerShip(Client.id,'ship0');
                // Client.sendShipChange('ship0');
                // Game.playerMap[Client.id].maxHealth = 500;
                // Game.playerMap[Client.id].heal(500);
                // Game.MaxBoost
                shipTierAssign('ship15');
            }
            if (game.input.keyboard.isDown(Phaser.KeyCode.NUMPAD_1)) {
                Client.changeWeapon(Game.maxWeaponAmmo[0], 0);
            }
            if (game.input.keyboard.isDown(Phaser.KeyCode.NUMPAD_2)) {
                Client.changeWeapon(Game.maxWeaponAmmo[1], 1);
            }
            if (game.input.keyboard.isDown(Phaser.KeyCode.NUMPAD_3)) {
                Client.changeWeapon(Game.maxWeaponAmmo[2], 2);
            }
        }
        else {
            Game.unshowBasePrompts();
            if (Game.inShop) {
                Game.clearShop();
                Game.inShop = false;
            }
        }
    }

    if (game.input.keyboard.isDown(Phaser.Keyboard.ESC) && Game.playerMap[Client.id] !== undefined)
    {
        Game.playerMap[Client.id].kill();
    }

    if (game.input.keyboard.isDown(Phaser.Keyboard.F) && game.input.keyboard.isDown(Phaser.Keyboard.P) && game.input.keyboard.isDown(Phaser.Keyboard.S))
    {
        Game.showFPS = !Game.showFPS;
    }

    // Sync the transform of remote instances of this player
    // Send transform also handles the amount of health and the hud display
    // Inside of the health tracker when a player dies dust is dropped
    Game.sendTransform();
};

window.addEventListener("keypress", function(event) {
    if (event.code === 'KeyE' && Game.isSafe) {
        Game.inShop = !Game.inShop;
    }
});

Game.updateShop = function() {
    shop.shopMenu.clear();
    var color = Game.rgbToHex(50, 50, 50);
    shop.shopMenu.beginFill(color, 1);
    shop.shopMenu.moveTo(0, 0);
    shop.shopMenu.drawRect(window.innerWidth/8, window.innerHeight/8, window.innerWidth*3/4, window.innerHeight*3/4);
    shop.shopMenu.endFill();
    shop.shopMenu.x = 0;
    shop.shopMenu.y = 0;
    Game.world.bringToTop(shop.shopMenu);
    shop.shopMenu.fixedToCamera = true;

    var maxBoxDimensions = 250;
    var minBoxDimensions = 175;


    shop.scrollBarBackground.clear();
    color = Game.rgbToHex(75, 75, 75);
    shop.scrollBarBackground.beginFill(color, 1);
    shop.scrollBarBackground.moveTo(0, 0);
    shop.scrollBarBackground.drawRect(window.innerWidth/8 + 15, window.innerHeight/8 + shop.shopMenu.height - 35, shop.shopMenu.width - 30, 20);
    shop.scrollBarBackground.endFill();
    shop.scrollBarBackground.x = 0;
    shop.scrollBarBackground.y = 0;
    Game.world.bringToTop(shop.scrollBarBackground);
    shop.scrollBarBackground.fixedToCamera = true;

    shop.scrollBar.clear();
    shop.scrollBar.inputEnabled = true;
    shop.scrollBar.input.enableDrag();
    shop.scrollBar.events.onDragStart.add(onDragDown, this);
    shop.scrollBar.events.onDragUpdate.add(onDragUpdate, this);
    shop.scrollBar.events.onDragStop.add(onDragStop, this);
    shop.scrollBar.events.onInputOver.add(function() {
        shop.scrollBarHover = true;
    });
    shop.scrollBar.events.onInputOut.add(function() {
        shop.scrollBarHover = false;
    });
    if (shop.scrollBarHover) {
        shop.scrollBarColor = Game.rgbToHex(15, 15, 15);
    }
    else {
        shop.scrollBarColor = Game.rgbToHex(30, 30, 30);
    }
    shop.scrollBar.beginFill(shop.scrollBarColor, 1);
    shop.scrollBar.moveTo(0, 0);
    shop.scrollBarWidth = 100;
    shop.scrollBar.drawRect(window.innerWidth/8 + 15 + shop.scrollBarX, window.innerHeight/8 + shop.shopMenu.height - 35 + shop.scrollBarY, shop.scrollBarWidth , shop.scrollBarHeight);
    shop.scrollBar.endFill();
    shop.scrollBar.x = 0;
    shop.scrollBar.y = 0;
    Game.world.bringToTop(shop.scrollBar);
    shop.scrollBar.fixedToCamera = true;
};
function onDragDown(sprite, pointer) {
    Game.dragX = pointer.x - (window.innerWidth/8 + 15 + shop.scrollBarX);
}
function onDragUpdate(sprite, pointer) {
    if (pointer.x - Game.dragX >= window.innerWidth/8 + 15 && pointer.x - Game.dragX <= window.innerWidth/8 + shop.shopMenu.width - 15 - shop.scrollBarWidth)
        shop.scrollBarX = (pointer.x - Game.dragX) - (window.innerWidth/8 + 15);
    else {
        if (pointer.x - Game.dragX < window.innerWidth/8 + 15)
            shop.scrollBarX = 0;
        else
            shop.scrollBarX = shop.scrollBarBackground.width - shop.scrollBarWidth;
    }
}
function onDragStop(sprite, pointer) {
    if (pointer.x - Game.dragX >= window.innerWidth/8 + 15 && pointer.x - Game.dragX <= shop.shopMenu.width - 30 - shop.scrollBarWidth)
        shop.scrollBarX = (pointer.x - Game.dragX) - (window.innerWidth/8 + 15);
    else {
        if (pointer.x - Game.dragX < window.innerWidth/8 + 15)
            shop.scrollBarX = 0;
        else
            shop.scrollBarX = shop.scrollBarBackground.width - shop.scrollBarWidth;
    }
}

Game.clearShop = function() {
    shop.shopMenu.clear();
    shop.scrollBarBackground.clear();
    shop.scrollBar.clear();
};


Game.render = function(){
    /*if (Game.allPlayersAdded) {
        game.debug.body(Game.playerMap[Client.getPlayerID()]);
    }*/
    if (Game.showFPS)
    {
        game.debug.text(game.time.fps, 2, 14, "#00ff00");
    }
};


Game.enterSafeZone = function(safeZone, player){
    Game.isSafe = true;
    // Client.sendCollect(5);
};

Game.exitSafeZone = function() {
    Game.isSafe = false;
};

Game.updateScore = function(id, value) {
    if (Game.playerMap[id] !== undefined) {
        Game.playerMap[id].score = value;
    }
    // Game.playerHUD["currency"] = value;
};

Game.updateName = function(id, name){  //This never gets called?
    Game.playerMap[id].name = name;
    //console.log("It the name boi: " + Game.playerMap[id].name);
};

function fireBullet(id) {
    if (game.time.now > Game.ammoMap[Client.id].bulletTime && Client.weaponId !== -1) {
        var bullet = Game.ammoMap[Client.id].getFirstExists(false);

        if (Game.playerMap[Client.id] !== undefined && bullet && Client.ammo > 0) {
            Client.ammo--;
            bullet.reset(Game.playerMap[Client.getPlayerID()].body.x + Game.playerMap[Client.player.id].width/2 + (Game.playerMap[Client.player.id].width/2 * Math.cos(Game.playerMap[Client.player.id].rotation)), Game.playerMap[Client.player.id].body.y + Game.playerMap[Client.player.id].height/2 + (Game.playerMap[Client.player.id].height/2 * Math.sin(Game.playerMap[Client.player.id].rotation)));
            bullet.lifespan = weaponArray[Client.weaponId].lifespan;
            bullet.rotation = Game.playerMap[Client.player.id].rotation;
            bullet.damage = weaponArray[Client.weaponId].damage;
            game.physics.arcade.velocityFromRotation(Game.playerMap[Client.player.id].rotation, weaponArray[Client.weaponId].velocity, bullet.body.velocity);
            Game.ammoMap[Client.id].bulletTime = game.time.now + weaponArray[Client.weaponId].bulletTime;
            bullet.id = bulletID;
            bullet.player = id;
            firedBullets.set(bullet.id, bullet);
            bulletID++;
            bullet.events.onDestroy.add(function() {
                burstLittle(bullet.x, bullet.y);
                firedBullets.delete(bullet.id);
                bullet.destroy();
            }, this);
            Client.changeAmmo(Client.ammo);
            Client.sendFire(Game.playerMap[Client.player.id].body.x + Game.playerMap[Client.player.id].width/2, Game.playerMap[Client.player.id].body.y + Game.playerMap[Client.player.id].height/2, Game.playerMap[Client.player.id].rotation, Client.weaponId, Client.id);
        }
    }
}

Game.updateBullets = function(x, y, rotation, weaponId, id) {
    if (!document.hidden && typeof Game.ammoMap[id] !== 'undefined') {
        var bullet = Game.ammoMap[id].getFirstExists(false);

        if (bullet) {
            bullet.reset(x + (Game.playerMap[id].width/2 * Math.cos(Game.playerMap[id].rotation)), y + (Game.playerMap[id].height/2 * Math.sin(Game.playerMap[id].rotation)));
            bullet.lifespan = weaponArray[weaponId].lifespan;
            bullet.damage = weaponArray[weaponId].damage;
            bullet.rotation = rotation;
            bullet.id = bulletID;
            bullet.player = id;
            firedBullets.set(bullet.id, bullet);
            bulletID++;
            game.physics.arcade.velocityFromRotation(rotation, weaponArray[weaponId].velocity, bullet.body.velocity);
            bullet.events.onDestroy.add(function() {
                burstLittle(bullet.x, bullet.y);
                firedBullets.delete(bullet.id);
                bullet.destroy();
            }, this);
        }
    }
};

Game.updateAmmo = function(id, ammo, weaponId) {
    if (Game.ammoMap[id] === undefined)
    {
        Game.ammoMap[id] = game.add.group();
    }
    else
    {
        Game.ammoMap[id].removeAll(true);
    }
    // Game.ammoMap[id] = game.add.group();
    Game.ammoMap[id].enableBody = true;
    Game.ammoMap[id].physicsBodyType = Phaser.Physics.ARCADE;
    if (weaponId === 0)
        Game.ammoMap[id].createMultiple(ammo, 'bullet');
    if (weaponId === 1)
        Game.ammoMap[id].createMultiple(ammo, 'bullet1');
    if (weaponId === 2)
        Game.ammoMap[id].createMultiple(ammo, 'bullet2');
    Game.ammoMap[id].setAll('scale.x', 1.5);
    Game.ammoMap[id].setAll('scale.y', 1.5);
    Game.ammoMap[id].setAll('anchor.x', 0.5);
    Game.ammoMap[id].setAll('anchor.y', 0.5);
    //Game.ammoMap[id].setAll('bounce', 0, 0);
    Game.ammoMap[id].forEach(function(bullet) {
        bullet.body.setSize(bullet.width * Game.ammoMap[id].scale.x,
            bullet.height * Game.ammoMap[id].scale.y);
    });    // rescale bodies
    Game.ammoMap[id].bulletTime = 0;

    if (Game.ammoMap.length === Game.playerMap)
        Game.bulletsCreated = true;
    Game.bulletsCreated = true;

    //if (Game.ammoMap.length === Game.playerMap)
    //    Game.bulletsCreated = true;

};

// Sync position and rotation of remote instances of player
Game.sendTransform = function() {
    //console.log('Game sendTransform');
    if(Client.getPlayerID() !== -1 && Game.localPlayerInstantiated && Game.focused/*&& Game.playerMap.length > 0*/) {
        Game.playerMap[Client.getPlayerID()].shipTrail.x = Game.playerMap[Client.getPlayerID()].x - (Game.playerMap[Client.getPlayerID()].width/2 * Math.cos(Game.playerMap[Client.getPlayerID()].rotation));
        Game.playerMap[Client.getPlayerID()].shipTrail.y = Game.playerMap[Client.getPlayerID()].y - (Game.playerMap[Client.getPlayerID()].height/2 * Math.sin(Game.playerMap[Client.getPlayerID()].rotation));
        // Game.playerMap[Client.getPlayerID()].shipTrail.rotation = Game.playerMap[Client.getPlayerID()].rotation;

        var player = Game.playerMap[Client.getPlayerID()];

        Game.updateHUD(player);

        Client.sendTransform(player.x, player.y, player.rotation, player.health, player.isBoosting);
    }
};


// Update the position and rotation of a given remote player
Game.updateTransform = function(id, x, y, rotation, health, isBoosting) {
    if (Game.allPlayersAdded && Game.playerMap[id] !== undefined) {
        var player = Game.playerMap[id];
        player.x = x;
        player.y = y;
        player.rotation = rotation;
        player.health = health;

        // Update player's trail emitter
        player.shipTrail.x = x - (Game.playerMap[id].width/2 * Math.cos(Game.playerMap[id].rotation));
        player.shipTrail.y = y - (Game.playerMap[id].height/2 * Math.sin(Game.playerMap[id].rotation));
        // player.shipTrail.rotation = rotation;

        if (player.shipTrail.isBoosting !== isBoosting) {
            if (isBoosting) {
                player.shipTrail.setScale(0.5, 0.8, 0.5, 0.8, 1000, Phaser.Easing.Quintic.Out);
            }
            else {
                player.shipTrail.setScale(0.05, 0.4, 0.05, 0.4, 2000, Phaser.Easing.Quintic.Out);
            }
            player.shipTrail.isBoosting = isBoosting;
        }

        Game.playerMap[id] = player;
        // console.log('player name='+Game.playerMap[id].name);
        if (id === Client.id && player.health <= 0) {
            Game.playerMap[id].destroy();
        }
    }
};

Game.updateHUD = function(player){
    //player.shield.x = player.x - ((window.innerWidth / 2) - 20);
    //player.shield.y = player.y - ((window.innerHeight / 2) - 20);

    //player.shield.destroy();
    //player.shield = Game.add.text(0, 0, '', {font: 'Lucida Console', fontSize: this.game.camera.width * .01, fill: '#fff' });
    player.shield.x = (this.game.camera.width / 2) - ((this.game.camera.width / 2) - 20);
    player.shield.y = (this.game.camera.height / 2) - ((this.game.camera.height / 2) - 20);
    Game.world.bringToTop(player.shield);
    Game.world.moveDown(player.shield);
    player.shield.fixedToCamera = true;

    player.nameHover.setText(player.name);
    player.nameHover.x = (this.game.camera.width / 2) - (player.nameHover.width / 2);
    player.nameHover.y = (this.game.camera.height / 2) - 60;
    Game.world.bringToTop(player.nameHover);
    Game.world.moveDown(player.nameHover);
    player.nameHover.fixedToCamera = true;

    player.scoreHover.setText('Score: ' + player.score);
    player.scoreHover.x = (this.game.camera.width / 2) - (player.scoreHover.width / 2);
    player.scoreHover.y = (this.game.camera.height / 2) - 90;
    Game.world.bringToTop(player.scoreHover);
    Game.world.moveDown(player.scoreHover);
    player.scoreHover.fixedToCamera = true;

    // if(player.prevHealth != player.health || player.prevAmmo != Client.ammo) {
    Game.playerHUD["boost"] = player.boost;
    Game.playerHUD["bullets"] = Client.ammo;
    player.prevAmmo = Client.ammo;
    Game.playerHUD["currency"] = player.score;


    player.shield.setText('Shield:\n' +
        'Bullets: ' + Game.playerHUD["bullets"] + '/' + Game.maxWeaponAmmo[Client.weaponId] +'\n' +
        'Boost: ' + Game.playerHUD["boost"] + '/' + Game.maxBoost +'\n' +
        'Dust: ' + Game.playerHUD["currency"]);
    // }
    player.shield.fontSize = this.game.camera.width * .023;

    player.centerPointer.bringToTop();
    player.centerPointer.x = player.x;
    player.centerPointer.y = player.y;
    player.centerPointer.rotation = game.physics.arcade.angleToXY(player, Game.safeZone.x, Game.safeZone.y);

    Game.updateHealthBar(player);
    if (Game.allPlayersAdded)
    {
        Game.updateLeaderboard();
    }
};
var healthTime = true;
Game.updateHealthBar = function(player) {
    if(healthTime && player !== undefined) {
        setTimeout(function () {
            player.heal(5);
            healthTime = true;
        }, 1000);
        healthTime = false;
    }
    //player.damage(.05);
    if(player.health === 0){
        //Game.playerKilled(player);
        player.healthBar.clear();
    }
    else if (Game.isSafe){
        player.healthBar.safe = true;
        player.healthBar.clear();
        var x = player.health / 100;
        var xHealth = (player.health / 100) * 100;
        var color = Game.rgbToHex(0, 255, 0);
        //Game.healthBar.x = 10;
        //Game.healthBar.y = 10;
        player.healthBar.beginFill(color);
        player.healthBar.lineStyle(this.game.camera.width * .02, color, 1);
        player.healthBar.moveTo(0, 0);
        player.healthBar.lineTo((this.game.camera.width * .001) * xHealth, 0);
        player.healthBar.endFill();
    }
    else if (player.prevHealth != player.health || player.healthBar.safe || Game.screenResized){
        player.healthBar.safe = false;
        player.healthBar.clear();
        var x = player.health / 100;
        var xHealth = (player.health / 100) * 100;
        var color = Game.rgbToHex((2.0 * x) * 255, (2.0 * (1 - x)) * 255, 0);
        //Game.healthBar.x = 10;
        //Game.healthBar.y = 10;
        player.healthBar.beginFill(color);
        player.healthBar.lineStyle(this.game.camera.width * .02, color, 1);
        player.healthBar.moveTo(0, 0);
        player.healthBar.lineTo((this.game.camera.width * .001) * xHealth, 0);
        player.healthBar.endFill();
        if(Game.screenResized)
            Game.screenResized = false;
        if(player.prevHealth > player.health) {
            shake();
        }
    }

    player.healthBar.x = player.shield.x + (this.game.camera.width * .10);
    player.healthBar.y = player.shield.y + (this.game.camera.width * .09 * .12);
    player.prevHealth = player.health;
    Game.world.bringToTop(player.healthBar);
    Game.world.moveDown(player.healthBar);
    player.healthBar.fixedToCamera = true;

    Game.world.bringToTop(shop.shopMenu);
    Game.world.bringToTop(shop.scrollBarBackground);
    Game.world.bringToTop(shop.scrollBar);
};


Game.updateLeaderboard = function() {
    Game.checkLeaderboard();
    Game.setLeaderboard();
};

Game.checkLeaderboard = function() {
    for (var p in Game.playerMap) {
        if (Game.leaderboard[1] === null ||
            (Game.playerMap[p].score > Game.leaderboard[1].score
                && Game.leaderboard[1] !== Game.playerMap[p]))
        {
            // console.log('#1 = '+Game.playerMap[p].name);
            Game.removeFromLeaderboard(p);
            Game.leaderboard[5] = Game.leaderboard[4];
            Game.leaderboard[4] = Game.leaderboard[3];
            Game.leaderboard[3] = Game.leaderboard[2];
            Game.leaderboard[2] = Game.leaderboard[1];
            Game.leaderboard[1] = Game.playerMap[p];
        }
        else if (Game.leaderboard[2] === null ||
            (Game.playerMap[p].score > Game.leaderboard[2].score
                && Game.leaderboard[2] !== Game.playerMap[p]))
        {
            if (Game.leaderboard[1] !== Game.playerMap[p])
            {
                // console.log('#2 = ' + Game.playerMap[p].name);
                Game.removeFromLeaderboard(p);
                Game.leaderboard[5] = Game.leaderboard[4];
                Game.leaderboard[4] = Game.leaderboard[3];
                Game.leaderboard[3] = Game.leaderboard[2];
                Game.leaderboard[2] = Game.playerMap[p];
            }
        }
        else if (Game.leaderboard[3] === null ||
            (Game.playerMap[p].score > Game.leaderboard[3].score
                && Game.leaderboard[3] !== Game.playerMap[p]))
        {
            if (Game.leaderboard[1] !== Game.playerMap[p]
                && Game.leaderboard[2] !== Game.playerMap[p])
            {
                // console.log('#3 = ' + Game.playerMap[p].name);
                Game.removeFromLeaderboard(p);
                Game.leaderboard[5] = Game.leaderboard[4];
                Game.leaderboard[4] = Game.leaderboard[3];
                Game.leaderboard[3] = Game.playerMap[p];
            }
        }
        else if (Game.leaderboard[4] === null ||
            (Game.playerMap[p].score > Game.leaderboard[4].score
                && Game.leaderboard[4] !== Game.playerMap[p]))
        {
            if (Game.leaderboard[1] !== Game.playerMap[p]
                && Game.leaderboard[2] !== Game.playerMap[p]
                && Game.leaderboard[3] !== Game.playerMap[p])
            {
                // console.log('#4 = ' + Game.playerMap[p].name);
                Game.removeFromLeaderboard(p);
                Game.leaderboard[5] = Game.leaderboard[4];
                Game.leaderboard[4] = Game.playerMap[p];
            }
        }
        else if (Game.leaderboard[5] === null ||
            (Game.playerMap[p].score > Game.leaderboard[5].score
                && Game.leaderboard[5] !== Game.playerMap[p]))
        {
            if (Game.leaderboard[1] !== Game.playerMap[p]
                && Game.leaderboard[2] !== Game.playerMap[p]
                && Game.leaderboard[3] !== Game.playerMap[p]
                && Game.leaderboard[4] !== Game.playerMap[p])
            {
                console.log('#5 = ' + Game.playerMap[p].name);
                Game.removeFromLeaderboard(p);
                Game.leaderboard[5] = Game.playerMap[p];
            }
        }
    }
};

Game.removeFromLeaderboard = function(id) {
    for(var i in Game.leaderboard)
    {
        if (Game.leaderboard[i] === Game.playerMap[id])
        {
            Game.leaderboard[i] = null;
        }
    }
};

Game.setLeaderboard = function() {
    Game.playerMap[Client.id].scoreboard.x = (this.game.camera.width / 2) + ((this.game.camera.width / 2) - 20);
    Game.playerMap[Client.id].scoreboard.y = (this.game.camera.height / 2) - ((this.game.camera.height / 2) - 20);
    Game.world.bringToTop(Game.playerMap[Client.id].scoreboard);
    Game.world.moveDown(Game.playerMap[Client.id].scoreboard);
    Game.playerMap[Client.id].scoreboard.fixedToCamera = true;

    Game.world.bringToTop(shop.shopMenu);
    Game.world.bringToTop(shop.scrollBarBackground);
    Game.world.bringToTop(shop.scrollBar);

    Game.playerMap[Client.id].scoreboard.setText(
        '#1 '+ (Game.leaderboard[1] !== null ? Game.leaderboard[1].score+'-'+Game.leaderboard[1].name : '_______')+
        '\n#2 ' + (Game.leaderboard[2] !== null ? Game.leaderboard[2].score+'-'+Game.leaderboard[2].name : '_______')+
        '\n#3 ' + (Game.leaderboard[3] !== null ? Game.leaderboard[3].score+'-'+Game.leaderboard[3].name : '_______')+
        '\n#4 ' + (Game.leaderboard[4] !== null ? Game.leaderboard[4].score+'-'+Game.leaderboard[4].name : '_______')+
        '\n#5 ' + (Game.leaderboard[5] !== null ? Game.leaderboard[5].score+'-'+Game.leaderboard[5].name : '_______'));

    Game.playerMap[Client.id].scoreboard.fontSize = this.game.camera.width * .023;
};

Game.updateSize = function(id, size)
{
    Game.playerMap[id].width = size;
    Game.playerMap[id].height = size;
};

Game.setTrail = function(id, trailSet) {
    if (Game.allPlayersAdded) {
        var player = Game.playerMap[id];
        player.shipTrail.visible = trailSet;
    }
};

function showPlayerNames() {
    for (var i in Game.playerMap) {
        if (Game.playerMap[i] != null && i !== Client.id) {
            Game.playerMap[i].nameHover.visible = true;
            Game.playerMap[i].nameHover.setText(Game.playerMap[i].name);
            Game.playerMap[i].nameHover.x = Game.playerMap[i].x - (Game.playerMap[i].nameHover.width / 2);
            Game.playerMap[i].nameHover.y = Game.playerMap[i].y - 60;
            Game.playerMap[i].scoreHover.visible = true;
            Game.playerMap[i].scoreHover.setText(Game.playerMap[i].score);
            Game.playerMap[i].scoreHover.x = Game.playerMap[i].x - (Game.playerMap[i].scoreHover.width / 2);
            Game.playerMap[i].scoreHover.y = Game.playerMap[i].y - 90;
        }
    }
}

function removePlayerNames() {
    for (var i in Game.playerMap) {
        if (Game.playerMap[i] != null && Game.playerMap[i].nameHover != null && i !== Client.id) {
            Game.playerMap[i].nameHover.visible = false;
            Game.playerMap[i].scoreHover.visible = false;
        }
    }
}

Game.showBasePrompts = function(){
    Game.playerMap[Client.id].centerPointer.visible = false;
    Game.playerMap[Client.id].safePromptHover.visible = true;
    Game.playerMap[Client.id].safePromptHover.setText(
        'Store [E]\n'
        + Game.calcAmmoRefillPrompt()
        + Game.calcBoostRefillPrompt());
       /* + 'Refill ammo: '+(Game.bulletReloadCostList[Client.weaponId]*Game.maxWeaponAmmo[Client.weaponId]
        * ((Game.maxWeaponAmmo[Client.weaponId]-Client.ammo)/Game.maxWeaponAmmo[Client.weaponId]))+'[R]\n'*/
        /*+ 'Refill 1 boost: '+Game.boostRefillCost+'[B]');*/
    Game.playerMap[Client.id].safePromptHover.x = (this.game.camera.width / 2);
    Game.playerMap[Client.id].safePromptHover.y = (this.game.camera.height / 2) + .1*this.game.camera.height;
    Game.playerMap[Client.id].safePromptHover.fixedToCamera = true;
};

Game.calcAmmoRefillPrompt = function()
{
    if (Client.ammo >= Game.maxWeaponAmmo[Client.weaponId])
    {
        return 'Ammo full!\n';
    }
    else if (Client.score <= 0)
    {
        return 'No money for ammo!\n';
    }
    else if (Client.score >= Math.ceil(Game.bulletReloadCostList[Client.weaponId]*Game.maxWeaponAmmo[Client.weaponId]
            * ((Game.maxWeaponAmmo[Client.weaponId]-Client.ammo)/Game.maxWeaponAmmo[Client.weaponId])))
    {
        return 'Refill all ammo: '+Math.ceil(Game.bulletReloadCostList[Client.weaponId]*Game.maxWeaponAmmo[Client.weaponId]
            * ((Game.maxWeaponAmmo[Client.weaponId]-Client.ammo)/Game.maxWeaponAmmo[Client.weaponId]))+' [R]\n';
    }
    else
    {
        return 'Refill '+Math.ceil(Client.score/Game.bulletReloadCostList[Client.weaponId])+' ammo: '+Client.score+' [R]\n';
    }
};

Game.calcBoostRefillPrompt = function()
{
    if (Game.playerMap[Client.id].boost >= Game.maxBoost)
    {
        return 'Boost full!\n';
    }
    else if (Client.score <= 0)
    {
        return 'No money for boost!';
    }
    else if (Client.score >= Math.ceil(Game.boostRefillCost*Game.maxBoost
            * ((Game.maxBoost-Game.playerMap[Client.id].boost)/Game.maxBoost)))
    {
        return 'Refill all boost: '+Math.ceil(Game.boostRefillCost*Game.maxBoost
            * ((Game.maxBoost-Game.playerMap[Client.id].boost)/Game.maxBoost))+' [B]\n';
    }
    else
    {
        return 'Refill '+Math.ceil(Client.score/Game.boostRefillCost)+' boost: '+Client.score+' [B]\n';
    }
};

Game.unshowBasePrompts = function(){
    Game.playerMap[Client.id].safePromptHover.visible = false;
    Game.playerMap[Client.id].centerPointer.visible = true;
};

Game.reloadWeapon = function(){
    if (Client.ammo >= Game.maxWeaponAmmo[Client.weaponId])
    {
        // Ammo already full
    }
    else if (Client.score <= 0)
    {
       // No money to reload
    }
    else if (Client.score >= Math.ceil(Game.bulletReloadCostList[Client.weaponId]*Game.maxWeaponAmmo[Client.weaponId]
            * ((Game.maxWeaponAmmo[Client.weaponId]-Client.ammo)/Game.maxWeaponAmmo[Client.weaponId])))
    {
        Client.sendCollect(-Math.ceil(Game.bulletReloadCostList[Client.weaponId]*Game.maxWeaponAmmo[Client.weaponId]
            * ((Game.maxWeaponAmmo[Client.weaponId]-Client.ammo)/Game.maxWeaponAmmo[Client.weaponId])));
        Client.ammo = Game.maxWeaponAmmo[Client.weaponId];

        Client.refillAmmo(Client.ammo);
    }
    else
    {
        Client.ammo += Math.ceil(Client.score/Game.bulletReloadCostList[Client.weaponId]);
        if (Client.ammo > Game.maxWeaponAmmo[Client.weaponId])
        {
            Client.ammo = Game.maxWeaponAmmo[Client.weaponId];
        }
        Client.sendCollect(-Client.score);
        Client.refillAmmo(Client.ammo);
    }

    /*if (Game.playerMap[Client.id].score >= (Game.bulletReloadCostList[Client.weaponId]*Game.maxWeaponAmmo[Client.weaponId]
            * ((Game.maxWeaponAmmo[Client.weaponId]-Client.ammo)/Game.maxWeaponAmmo[Client.weaponId]))
            && Client.ammo < Game.maxWeaponAmmo[Client.weaponId])
    {
        Client.sendCollect(-(Game.bulletReloadCostList[Client.weaponId]*Game.maxWeaponAmmo[Client.weaponId]
            * ((Game.maxWeaponAmmo[Client.weaponId]-Client.ammo)/Game.maxWeaponAmmo[Client.weaponId])));
        Client.ammo += Game.maxWeaponAmmo[Client.weaponId];
        if (Client.ammo > Game.maxWeaponAmmo[Client.weaponId])
        {
            Client.ammo = Game.maxWeaponAmmo[Client.weaponId];
        }
        Client.refillAmmo(Client.ammo);
    }*/
};

Game.refillBoost = function(){
    if (Client.boost >= Game.playerMap[Client.id].boost)
    {
        // Boost already full
    }
    else if (Client.score <= 0)
    {
       // No money to reload
    }
    else if (Client.score >= (Game.boostRefillCost*Game.maxBoost
            * ((Game.maxBoost-Game.playerMap[Client.id].boost)/Game.maxBoost)))
    {
        Client.sendCollect(-Math.ceil(Game.boostRefillCost*Game.maxBoost
            * ((Game.maxBoost-Game.playerMap[Client.id].boost)/Game.maxBoost)));
        Game.playerMap[Client.id].boost = Game.maxBoost;
    }
    else
    {
        Game.playerMap[Client.id].boost += Math.ceil(Client.score/Game.boostRefillCost);
        if (Game.playerMap[Client.id].boost > Game.maxBoost)
        {
            Game.playerMap[Client.id].boost = Game.maxBoost;
        }
        Client.sendCollect(-Client.score);
    }

    /*if (Game.playerMap[Client.id].score >= Game.boostRefillCost && Game.playerMap[Client.id].boost < Game.maxBoost)
    {
        Client.sendCollect(-Game.boostRefillCost);
        Game.playerMap[Client.id].boost++;
        if (Game.playerMap[Client.id].boost > Game.maxBoost)
        {
            Game.playerMap[Client.id].boost = Game.maxBoost;
        }
    }*/
};

// Update the ship of another player
Game.updatePlayerShip = function(id, shipName){
    if (Game.allPlayersAdded){
        // console.log('we got to update playership, the player id is: '+ id + " " + shipName);
        Game.playerMap[id].loadTexture(shipName); // loadTexture draws the new sprite
    }
};

Game.removePlayer = function(id){
    // console.log('Game.removePlayer '+id+'--'+Game.playerMap[id].name);
    Game.removeFromLeaderboard(id);
    Game.ammoMap[id].removeAll(true);

    Game.playerMap[id].shipTrail.destroy();

    generateDustOnDeath(Game.playerMap[id].x, Game.playerMap[id].y, Game.playerMap[id].score);
    burst(Game.playerMap[id].x, Game.playerMap[id].y);

    playerMap.delete(id);
    Game.playerMap[id].destroy();
    Game.playerDestroyed = true;
    delete Game.playerMap[id];
};

Game.playerKilled = function(thePlayer){
    //Generate the dust dropped from death
    /*Game.removeFromLeaderboard(thePlayer.id);
    Game.playerMap[thePlayer.id].shipTrail.destroy();
    generateDustOnDeath(Game.playerMap[thePlayer.id].x, Game.playerMap[thePlayer.id].y, Game.playerMap[thePlayer.id].score);
    burst(Game.playerMap[thePlayer.id].x, Game.playerMap[thePlayer.id].y);
    playerMap.delete(thePlayer.id);
    thePlayer.destroy();
    Game.playerDestroyed = true;
    delete thePlayer;*/
};

Game.getCoordinates = function(layer, pointer) {
    Client.sendClick(pointer.worldX, pointer.worldY);
};

Game.setPlayerAcceleration = function(acceleration, isBoost){
    if (Game.allPlayersAdded && Game.playerMap[Client.id] !== undefined && Game.playerMap[Client.getPlayerID()].body !== undefined && Game.playerMap[Client.getPlayerID()].health > 0) {
        if (isBoost && Game.playerMap[Client.id].boost >= Game.boostCost) {
            Game.playerMap[Client.id].isBoosting = true;
            if (Game.playerMap[Client.id] !== undefined) {
                Game.playerMap[Client.id].shipTrail.setScale(0.5, 0.8, 0.5, 0.8, 1000, Phaser.Easing.Quintic.Out);
            }

            Game.playerMap[Client.id].body.maxVelocity.set(Game.maxBoostVelocity);
            // Game.playBoostPFX();

            // console.log('we boostin');
            Game.playerMap[Client.id].boost -= Game.boostCost;
            // game.physics.arcade.velocityFromRotation(rotation, weaponArray[weaponId].velocity, bullet.body.velocity);
            game.physics.arcade.accelerationFromRotation(Game.playerMap[Client.id].rotation,
                acceleration * Game.boostAccelMult, Game.playerMap[Client.id].body.acceleration);

            //game.physics.arcade.accelerationFromRotation(Game.playerMap[Client.id].rotation,
            //    acceleration, parallax);
        }
        else {
            Game.playerMap[Client.id].isBoosting = false;

            if (Game.playerMap[Client.id] !== undefined) {
                Game.playerMap[Client.id].shipTrail.setScale(0.05, 0.4, 0.05, 0.4, 2000, Phaser.Easing.Quintic.Out);
            }

            Game.playerMap[Client.id].body.maxVelocity.set(Game.maxNormVelocity);
            // Game.stopBoostPFX();

            game.physics.arcade.accelerationFromRotation(Game.playerMap[Client.id].rotation,
                acceleration, Game.playerMap[Client.id].body.acceleration);
        }
        /*if (Game.playerMap[Client.id].body.velocity === Game.playerMap[Client.id].body.maxVelocity)
        {
            console.log('at max velocity of '+Game.playerMap[Client.id].body.maxVelocity);
        }*/
    }
};

Game.playBoostPFX = function() {
    Game.playerMap[Client.id].shipTrail.start(false, 5000, 10);
};

Game.stopBoostPFX = function() {
    Game.playerMap[Client.id].shipTrail.kill();
};

Game.setPlayerRotation = function(id, angVelocity){
    if(Game.playerMap[id].body !== null)
        Game.playerMap[id].body.angularVelocity = angVelocity;
};

Game.addNewPlayer = function(id,x,y,rotation,shipName,name,score,color,size){
    console.log('Game.addNewPlayer '+id+'--'+name+'--'+shipName);

    Game.shipTrails[id] = game.add.emitter(x, y + size/2, 10);

    var newPlayer;
    // Create player sprite and assign the player a unique ship
    // If it is a new player
    if(shipName === 'unassignedShip'){//} && id === Client.id/*Client.getPlayerID()*/){
        var shipSelectionString = assignShip(id + 1);
        newPlayer = game.add.sprite(x,y,shipSelectionString);

        if (id === Client.id) {
            Client.sendShipChange(shipSelectionString);

            newPlayer.centerPointer = game.add.sprite(x,y,'arrow');
            newPlayer.centerPointer.startWidth = newPlayer.centerPointer.width;
            var cpW = newPlayer.centerPointer.width;
            var cpH = newPlayer.centerPointer.height;
            newPlayer.centerPointer.width = game.width*0.2083;
            newPlayer.centerPointer.height = newPlayer.centerPointer.width*(cpH/cpW);
            // newPlayer.addChild(newPlayer.centerPointer);
            // newPlayer.centerPointer.scale.setTo(4);
            newPlayer.centerPointer.anchor.setTo(0.3,0.5);
            newPlayer.centerPointer.alpha = 0.75;
        }
    }
    // If it is an existing player
    else {
        // console.log(name+'\'s shipName: '+shipName);
        newPlayer = game.add.sprite(x, y, shipName);
        // console.log('else statement - shipSelectionString: ' + shipName);
    }

    // Adjust player's squared size
    newPlayer.width = size;
    newPlayer.height = size;

    // Set player sprite origin to center
    newPlayer.anchor.set(0.5);
    // Set starting rotation of player instance
    newPlayer.rotation = rotation;

    newPlayer.name = name;

    // Enable appropriate player physics
    Game.physics.enable(newPlayer, Phaser.Physics.ARCADE);
    newPlayer.enableBody = true;                            //Here is what is needed for
    newPlayer.body.collideWorldBounds = true;
    newPlayer.body.drag.set(100);
    newPlayer.body.maxVelocity.set(Game.maxNormVelocity);

    //  Add an emitter for the ship's trail
    newPlayer.shipTrail = Game.shipTrails[id];
    newPlayer.shipTrail.gravity = 0;
    // newPlayer.shipTrail.z = -1000;
    newPlayer.shipTrail.width = 10;
    newPlayer.shipTrail.makeParticles('trail');
    newPlayer.shipTrail.setXSpeed(30, -30);
    newPlayer.shipTrail.setYSpeed(30, -30);
    newPlayer.shipTrail.setAlpha(1, 0.01, 800);
    newPlayer.shipTrail.setScale(0.05, 0.4, 0.05, 0.4, 2000, Phaser.Easing.Quintic.Out);
    newPlayer.shipTrail.start(false, 150, 10);
    newPlayer.shipTrail.isBoosting = false;

    // Set player sprite and trail color
    newPlayer.tint = color;
    newPlayer.shipTrail.setAll('tint', color);
    //newPlayer.maxHealth = 200;

    // Initialize player's health
    newPlayer.heal(100);


    /* newPlayer.shield.setText('Shield:\n' +
         'Bullets: ' + playerHUD["bullets"] + '\n' +
         'Boost: ' + playerHUD["boost"] + '\n' +
         'Currency: ' + playerHUD["currency"], { font: '100px Arial', fill: '#fff' }); */

    // Set the player's score
    // Game.playerHUD["currency"] = score;
    newPlayer.boost = Game.maxBoost;
    newPlayer.isBoosting = false;
    newPlayer.score = score;
    // newPlayer.isSafe = true;
    newPlayer.isMoving = false;

    /* newPlayer.shield.setText('Shield:\n' +
         'Bullets: ' + Game.playerHUD["bullets"] + '\n' +
         'Boost: ' + Game.playerHUD["boost"] + '\n' +
         'Currency: ' + Game.playerHUD["currency"], { font: '100px Arial', fill: '#fff' }); */

    // Local player should be instantiated first before remote players

    // Local player should be instantiated first before remote players
    newPlayer.id = id;
    Game.playerMap[id] = newPlayer;
    Game.playerMap[id].shield = Game.add.text(0, 0, '', {font: 'Lucida Console', fontSize: this.game.camera.width * .01, fill: '#fff' });
    Game.playerMap[id].nameHover = Game.add.text(0, 0, '', {font: 'Lucida Console', fontSize: this.game.camera.width * .01, fill: '#fff'});
    Game.playerMap[id].safePromptHover = Game.add.text(0, 0, '', {font: 'Lucida Console', fontSize: this.game.camera.width * .01, fill: '#fff', boundsAlignH: "center"});
    Game.playerMap[id].safePromptHover.anchor.set(0.5,0.5);
    Game.playerMap[id].scoreHover = Game.add.text(0, 0, '', {font: 'Lucida Console', fontSize: this.game.camera.width * .01, fill: '#fff'});
    Game.playerMap[id].healthBar = Game.add.graphics(0,0);
    Game.playerMap[id].healthBar.safe = false;
    Game.playerMap[id].prevHealth = -1;
    Game.playerMap[id].scoreboard = Game.add.text(0, 0, '', {font: 'Lucida Console', fontSize: this.game.camera.width * .01, fill: '#fff'/*, boundsAlignH: 'right'*/ });
    Game.playerMap[id].scoreboard.anchor.setTo(1, 0);

    playerMap.set(newPlayer.id, newPlayer);
    if (!Game.localPlayerInstantiated) {
        Game.localPlayerInstantiated = true;
    }

    // Set local camera to follow local player sprite
    this.game.camera.follow(Game.playerMap[Client.getPlayerID()], Phaser.Camera.FOLLOW_LOCKON);
    this.game.renderer.renderSession.roundPixels = true;
};

Game.setDeathBehavior = function(id) {
    Game.playerMap[id].events.onKilled.add(function() {
        Game.removeFromLeaderboard(id);
        Game.playerMap[id].shipTrail.destroy();
        // generateDustOnDeath(Game.playerMap[id].x, Game.playerMap[id].y, Game.playerMap[id].score);
        burst(Game.playerMap[id].x, Game.playerMap[id].y);
        playerMap.delete(id);
        var player = Game.playerMap[id];
        player.destroy();
        Game.playerDestroyed = true;
        delete player;

        Client.setClientScores(Game.playerMap[id].score);
        Client.disconnect();
        console.log('Switching to menu state');
        game.state.start('Menu');
        game.state.clearCurrentState();
    });
};


Game.setAllPlayersAdded = function(){
    Game.allPlayersAdded = true;
};

//This function creates a string name of the ship to be assigned to a new player
//T1 ship
function assignShip(amountOfPlayers) {
    //var shipNumber = amountOfPlayers % numberOfShipSprites;
    //Changed logic to provide one of the first three ships to new players
    var randomShip = randomInt(1,4); //range of 1 - 3
    if(randomShip == 3){
        randomShip = 7;
    }
    return 'ship' + randomShip;
}

Game.rescale = function(){
    console.log('Rescaling game to '+window.innerWidth+'x'+window.innerHeight);
    this.game.scale.setGameSize(window.innerWidth, window.innerHeight);

    Game.background.canvas = PIXI.CanvasPool.create(this, game.width, game.height);
    Game.background.context = Game.background.canvas.getContext('2d');
    Game.background.setTexture(new PIXI.Texture(new PIXI.BaseTexture(Game.background.canvas)));
    Game.layer.canvas = PIXI.CanvasPool.create(this, game.width, game.height);
    Game.layer.context =  Game.layer.canvas.getContext('2d');
    Game.layer.setTexture(new PIXI.Texture(new PIXI.BaseTexture(Game.layer.canvas)));

    /*Game.safeZone.sendToBack();
    Game.layer.sendToBack();
    Game.background.sendToBack();*/

    /*Game.background = Game.map.createLayer('Backgroundlayer');

    // safeZoneLayer = map.createLayer('Zonelayer');
    Game.safeZone = game.add.sprite(3235,3240,'safe_zone');
    Game.safeZone.width = 1205;
    Game.safeZone.height = 1205;
    Game.safeZone.anchor.setTo(0.5,0.5);
    Game.safeZone.alpha = 0.6;
    Game.layer = Game.map.createLayer('Groundlayer');
    Game.map.setCollisionBetween(0, 4000, true, 'Groundlayer');
    Game.layer.resizeWorld();*/

    if (Game.allPlayersAdded)
    {
        // Game.background = map.createLayer('Backgroundlayer');
        // Game.layer.resizeWorld();

        var cpW = Game.playerMap[Client.id].centerPointer.width;
        var cpH = Game.playerMap[Client.id].centerPointer.height;
        Game.playerMap[Client.id].centerPointer.width = game.width*0.2083;
        Game.playerMap[Client.id].centerPointer.height = Game.playerMap[Client.id].centerPointer.width*(cpH/cpW);

        // console.log('ratio = '+game.width/game.height+' -- resize to '+Game.playerMap[Client.id].centerPointer.width)
        if (Game.playerMap[Client.id].centerPointer.width > Game.playerMap[Client.id].centerPointer.startWidth)
        {
            Game.playerMap[Client.id].centerPointer.width = Game.playerMap[Client.id].centerPointer.startWidth;
        }
        else if (Game.playerMap[Client.id].centerPointer.width < 2*Game.playerMap[Client.id].width)
        {
            Game.playerMap[Client.id].centerPointer.width = 2*Game.playerMap[Client.id].width
        }
    }

    // // Make sure camera bounds are maintained
    this.game.camera.bounds = new Phaser.Rectangle(-this.game.world.width,-this.game.world.height,
        this.game.world.width*3, this.game.world.height*3);
};

Game.rgbToHex = function(r, g, b) {
    return parseInt("0x" + Game.componentToHex(r) + Game.componentToHex(g) + Game.componentToHex(b));
};

Game.componentToHex = function(c) {
    var hex = c.toString(16);
    return hex.length == 1 ? "0" + hex : hex;
};

//Particle methods:
// if you want to increase performance edit the final argument of
// bullet.start(true, 1000, null, 2
// this is->   burst  lifetime    amout of particle

//called on bullet removal
function burstLittle(x,y){
    //generating burst
    burstLittleEmitter.x = x;
    burstLittleEmitter.y = y;
    burstLittleEmitter.start(true, 500, null, 2);
}
//called on player death
function burst(x,y){
  //bullet burst
    burstBig.x = x;
    burstBig.y = y;
    burstBig.start(true, 3000, null, 25);

}
function shake(){
  //Set shake intensity and duration
    game.camera.shake(0.01, 100);
}

