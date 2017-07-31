const utils = require('utils');

const INTERIOR_CREEP_MAXIMUMS = {
    'harvester': 3, // Should be 3*NUM_SOURCES
    'courier': 2,
    'worker': 2,
    'upgrader': 1,
};
const EXTERIOR_CREEP_MAXIMUMS = {
    'soldier': 2,
    'princess': 1,
	'drone': 12,
};

const CREEP_PARTS = {
	'harvester': [
		[WORK, WORK, CARRY, MOVE],
		[WORK, CARRY, MOVE],
	],
	'courier': [
		
		[CARRY, CARRY, CARRY, CARRY, MOVE, MOVE, MOVE, MOVE],
		[CARRY, CARRY, MOVE, MOVE],
	],
	'worker': [
		[WORK, WORK, WORK, WORK, CARRY, CARRY, CARRY, CARRY, MOVE, MOVE, MOVE, MOVE],
		[WORK, WORK, CARRY, CARRY, MOVE, MOVE, MOVE, MOVE],
	],
	'upgrader': [
		[WORK, WORK, WORK, WORK, CARRY, CARRY, CARRY, CARRY, MOVE, MOVE, MOVE, MOVE],
		[WORK, WORK, CARRY, CARRY, MOVE, MOVE, MOVE, MOVE],
	],
	'princess': [
		[CLAIM, CLAIM, MOVE, MOVE],
		[CLAIM, MOVE],
    ],
    'soldier': [
        [ATTACK, ATTACK, TOUGH, TOUGH, MOVE, MOVE, MOVE, MOVE],
        [ATTACK, TOUGH, TOUGH, MOVE, MOVE, MOVE],
        [ATTACK, MOVE],
    ],
	'drone': [
		[WORK, WORK, WORK, CARRY, CARRY, CARRY, CARRY, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE],
		[WORK, WORK, CARRY, CARRY, CARRY, MOVE, MOVE, MOVE, MOVE, MOVE],
		[WORK, CARRY, CARRY, MOVE, MOVE, MOVE],
	],
};

function UNIT_COST(a) { return _.sum(a, (x) => BODYPART_COST[x]); }

StructureSpawn.prototype.run = function () {
    // If we're spawning, put up a thing so we know what is happening
    if (this.spawning) {
        let spawningCreep = Game.creeps[this.spawning.name];
        this.room.visual.text(
            '🛠️' + spawningCreep.memory.role,
            this.pos.x + 1,
            this.pos.y,
            { align: 'left', opacity: 0.8 });
    }
    let found_match = false;
    if (!this.spawning) {
        let num_creeps = _.countBy(Memory.creeps, 'role');

        for (let t in INTERIOR_CREEP_MAXIMUMS) {
            if (!num_creeps[t] || num_creeps[t] < INTERIOR_CREEP_MAXIMUMS[t]) {
                let parts = _.find(CREEP_PARTS[t], b => UNIT_COST(b) <= this.room.energyCapacityAvailable);
                let name = this.createCreep(parts, undefined, { role: t, cost: UNIT_COST(parts), home: this.room.name, work: this.room.name });
                if (name != ERR_NOT_ENOUGH_RESOURCES) {
                    console.log(`Spawning new ${t}: ${name}`)
                    Memory.pop_count++;
                }
                found_match = true;
                break;
            }
        }
    }

    if (!this.spawning && !found_match) {
        // We go by room so we will try to fill out our closest room friends first
        for (let i in Memory.exterior_rooms) {
            if (Memory.exterior_rooms[i].last_death + 1200 > Game.time) {
                continue;
            }
            for (let t in EXTERIOR_CREEP_MAXIMUMS) {
                if (Memory.exterior_rooms[i].creeps[t] && Memory.exterior_rooms[i].creeps[t].length >= EXTERIOR_CREEP_MAXIMUMS[t]) {
                    continue
                }
                let parts = _.find(CREEP_PARTS[t], b => UNIT_COST(b) <= this.room.energyCapacityAvailable);
                let name = this.createCreep(parts, undefined, { role: t, cost: UNIT_COST(parts), home: this.room.name, work: i });
                if (name != ERR_NOT_ENOUGH_RESOURCES) {
                    console.log(`Spawning new ${t}: ${name} for ${i}`)
                    if (!Memory.exterior_rooms[i].creeps[t]) {
                        Memory.exterior_rooms[i].creeps[t] = [name];
                    }
                    else {
                        Memory.exterior_rooms[i].creeps[t].push(name);
                    }
                    Memory.pop_count++;
                }
                found_match = true;
                break;
            }
            if (found_match) {
                break;
            }
        }
    }

    // If everything is dead (but we still have a spawn for some reason), try to rebuild!
    if (!this.spawning && Memory.pop_count == 0) {
        let parts = [WORK, CARRY, MOVE, MOVE];
        let name = this.createCreep(parts, undefined, { role: 'bootstrap', cost: UNIT_COST(parts), home: this.room.name, work: this.room.name });
        if (name != ERR_NOT_ENOUGH_RESOURCES) {
            console.log(`Spawning new ${t}: ${name}`)
            Memory.pop_count++;
        }
    }
}
