class Player extends CharacterEntity{
    constructor(x, y, values){
        super();
        this.name = values.name ? values.name : 'Unknown';
        this.class = values.class ? values.class : 'dmg';
        this.display = 'You';
        
        this.hp = classesInfo[this.class].hp;
        this.maxHp = classesInfo[this.class].hp;

        this.x = x;
        this.y = y;
        this.vel = {x: 0, y: 0};
        this.grounded = false;
        this.size = {
            x: 50,
            y: 100
        }
        this.color = values.color ? values.color : getRandomColor();
        this.weaponId = classesInfo[this.class].weaponId;
        this.remainder = {x: 0, y: 0};
        this.runAcceleration = 10;
        this.runSpeed = this.class == 'heal' ? 5 : 4;
        this.runReduce = 22; 
        this.flyReduce = 12;    
        this.fallSpeed = 5.6;
        this.fallSideAcceleration = 10;
        this.directionChangeMult = 1.6;
        this.jumpSpeed = this.class == 'heal' ? -7 : -5;
        this.killStreak = 0;
        this.godMode = false;
        this.team = 'blue';

        this.changeWeapon(this.weaponId);

        // this.changeNameDiv(name);

        this.gunImage = this.weapon.img;

    }
    changeNameDiv(name){
        let div = document.getElementById('tab_playerInfo');
        div.style.display = 'block';
        div.innerText = name;
    }
    update(){
        // weapon
        if (this.isDead) return;

        let gunPos = {
            x: this.x + this.size.x / 2,
            y: this.y + this.size.y / 2.5
        }

        this.x = Math.floor(this.x);
        this.y = Math.floor(this.y);

        const mouseX = mousePos.x + CAMERA.offset.x - canvas.getBoundingClientRect().left;
        const mouseY = mousePos.y + CAMERA.offset.y - canvas.getBoundingClientRect().top;
    
        this.weaponAngle = Math.atan2(mouseY - gunPos.y, mouseX - gunPos.x);
        this.weaponDegrees =  this.weaponAngle * (180 / Math.PI);

        if (this.shooting) this.shoot();

        if (this.class == 'heal') this.constantHeal();

        // physics 
                
        // movement
        let timeSinceGrouned = Date.now() - this.groundedTime;
        if (pressedKeys['w'] || pressedKeys[' ']){ // jump
            if (this.grounded || timeSinceGrouned < this.groundedCooldown){
                this.vel.y = this.jumpSpeed;
                this.groundedTime = timeSinceGrouned;
                // this.vel.x += this.solidSpeed.x;
                // this.vel.y += this.solidSpeed.y;
            }
        }

        if (pressedKeys['a'] && !pressedKeys['d']){ // left
            let mult = 1;
            if(this.vel.x > 0)
            {
                mult = this.directionChangeMult;
            }
            if (this.grounded){
                this.vel.x = approach(this.vel.x, -this.runSpeed, this.runAcceleration * mult * dt);
            }else{
                this.vel.x = approach(this.vel.x, -this.runSpeed, this.fallSideAcceleration * mult * dt);
            }
        }

        if (pressedKeys['d'] && !pressedKeys['a']){ // right
            let mult = 1;
            if(this.vel.x < 0)
            {
                mult = this.directionChangeMult;
            }
            if (this.grounded){
                this.vel.x = approach(this.vel.x, this.runSpeed, this.runAcceleration  * mult * dt);
            }else{
                this.vel.x = approach(this.vel.x, this.runSpeed, this.fallSideAcceleration  * mult * dt);
            }
        }


        // gravity
        if (!this.groundedTime || timeSinceGrouned > this.groundedCooldown)
        this.vel.y = approach(this.vel.y, this.fallSpeed, gravity * dt);


         // Friction
         if(!pressedKeys['a'] && !pressedKeys['d']) {
            if(this.grounded){
                player.vel.x = approach(this.vel.x, 0, this.runReduce * dt);
            }
            else{
                player.vel.x = approach(player.vel.x, 0, this.flyReduce * dt);
            }
        }   

        // execute movement
        
        this.remainder.x += this.vel.x * dt * DELTA_SPEED_CORRECTION;
        let moveX = Math.round(this.remainder.x);
        if(moveX != 0)
        {
            this.remainder.x -= moveX;
            let moveSign = Math.sign(moveX);
            let collisionHappenedX = false;
            let playerRect = getSolidRect(this);
    
            // Move the player in X until collision or moveX is exausted
            while(moveX != 0)
            {
                // console.log(moveX)
                playerRect.pos.x += moveSign;

                
                // Test collision against Solids
                for(let solidIdx = 0; solidIdx < COLLISIONBOXES.length; solidIdx++)
                {
                    let solid = COLLISIONBOXES[solidIdx];
                    let solidData = {
                        x: solid.x,
                        y: solid.y,
                        size: {
                            x: solid.width,
                            y: solid.height
                        }
                    }
                    let solidRect = getSolidRect(solidData);
                    if(rectCollision(solidRect, playerRect)){
                        collisionHappenedX = true;
                        break;
                    }

                }  
                if (!collisionHappenedX){
                    this.x += moveSign;
                    moveX -= moveSign;
                }else{
                    this.vel.x = 0;
                    this.remainder.x = 0;
                    break;
                }
                // Move the Player
                // console.log(moveSign)
            }
        }
        if (this.grounded){
            this.grounded = false;
            this.groundedTime = Date.now();      
        }
        // Move Y
            let playerRect = getSolidRect(this);

            if (!this.groundedTime || timeSinceGrouned > this.groundedCooldown) this.remainder.y += this.vel.y * dt * DELTA_SPEED_CORRECTION;
            else this.remainder.y += 0;
            
            let moveY = Math.round(this.remainder.y);
            if(moveY != 0)
            {
                this.remainder.y -= moveY;
                let moveSign = Math.sign(moveY);
                let collisionHappenedY = false;
      
             // Move the player in Y until collision or moveY is exausted
                while(moveY)
                {
                    playerRect.pos.y += moveSign;
      
                    // Test collision against Solids
                    for(let solidIdx = 0; solidIdx < COLLISIONBOXES.length; solidIdx++)
                    {
                        let solid = COLLISIONBOXES[solidIdx];
                        let solidData = {
                            x: solid.x,
                            y: solid.y,
                            size: {
                                x: solid.width,
                                y: solid.height
                            }
                        }
                        let solidRect = getSolidRect(solidData);  
                        if(rectCollision(playerRect, solidRect)) {
                        // Moving down/falling
                            if(this.vel.y > 0)
                            {
                                this.grounded = true;
                            }
                            
                            this.vel.y = 0;
                            collisionHappenedY = true;
                            break;
                        }
                    }
      
                    // Move the Player
                    if (!collisionHappenedY){
                        this.y += moveSign;
                        moveY -= moveSign;
                    }else{
                        if (moveSign < 0){
                            this.vel.y = 0;
                        }
                        break;
                    }
                }
            }     
    }
    tp(x, y){
        this.x = x - this.size.x / 2;
        this.y = y - this.size.y / 2;
    }
    interact(){
        if (this.interacionWith) this.interacionWith.interact();
    }
    confirmKill(){
        if (this.killStreak > 4) this.killStreak = 0; 
        this.playKillSound();
        this.kills++;
        this.killStreak++;
        if (this.killStreak == 5) {
            this.dominating++;
            bigMessage(0, this.name);
        }
    }
    playKillSound(){
        // stop all kill audio
        loadedAudio['gun_hit'].stop();
        for (let i = 1; i <= 5; i++){
            loadedAudio[i+'_kills'].stop();
        }
        loadedAudio[(this.killStreak+1)+'_kills'].play();
    }

}
function getSolidRect(solid){
    return {
        pos: {
            x: solid.x,
            y: solid.y,
        },
        size: {
            x: solid.size.x,
            y: solid.size.y
        }
    }
}