class OtherPlayer extends CharacterEntity{
    constructor(data){
        super();
        this.display = data.name;
        this.x = data.pos.x;
        this.y = data.pos.y;
        this.size = data.size;
        this.weaponLoaded = false;
        this.color = data.color;
        this.hp = data.hp;
        this.maxhp = data.maxhp;
        this.weaponId = data.weaponId;
        this.weapon = WEAPONS[this.weaponId];
        this.weaponAngle = data.weaponAngle;
        this.weaponDegrees = data.weaponDegrees;
        this.weapon.scale = WEAPONS[this.weaponId].scale ? WEAPONS[this.weaponId].scale : DEFAULT_SIZE_SCALE;
        this.weapon.size = {
            x: this.weapon.img.width / this.weapon.scale,
            y: this.weapon.img.height / this.weapon.scale
        }
        this.gunImage = this.weapon.img;
        this.weaponLoaded = true;
    }
}