let floor_level = 700;
let invisibleColor = 'rgba(0, 0, 0, 0)';
const MAP = [
    // walls
    {type: 'block', x: 0, y: floor_level, width: 3980, height: 500, color: '#733511'},
    {type: 'block', x: -10, y: floor_level-2000, width: 10, height: 2000, color: invisibleColor},
    {type: 'block', x: 3980, y: floor_level-2000, width: 10, height: 2000, color: invisibleColor},
    {type: 'block', x: 0, y: -1000, width: 3980, height: 10, color: invisibleColor},

    // other
    {type: 'tile', x: 250, y: floor_level-50, name: 'box'},
    {type: 'tile', x: 950, y: floor_level-50},
    {type: 'tile', x: 50, y: floor_level-450, name: 'box'},
    {type: 'tile', x: 100, y: floor_level-450, name: 'box'},
    {type: 'tile', x: 150, y: floor_level-450, name: 'box'},
    {type: 'tile', x: 200, y: floor_level-450, name: 'box'},
    {type: 'tile', x: 250, y: floor_level-450, name: 'box'},
    {type: 'tile', x: 300, y: floor_level-450, name: 'box'},

    {type: 'spike', x: 300, y: floor_level-50},
    {type: 'spike', x: 350, y: floor_level-50},
    {type: 'spike', x: 400, y: floor_level-50},
    {type: 'spike', x: 450, y: floor_level-50},
    {type: 'spike', x: 500, y: floor_level-50},
    {type: 'spike', x: 550, y: floor_level-50},
    {type: 'spike', x: 600, y: floor_level-50},
    {type: 'spike', x: 650, y: floor_level-50},
    {type: 'spike', x: 700, y: floor_level-50},
    {type: 'spike', x: 750, y: floor_level-50},
    {type: 'spike', x: 800, y: floor_level-50},
    {type: 'spike', x: 850, y: floor_level-50},
    {type: 'spike', x: 900, y: floor_level-50},

    {type: 'cannon', x: 0, y: floor_level-212, width: 300, height: 212},
    {type: 'cannon', x: 3680, y: floor_level-212, width: 300, height: 212, o: 0},

]