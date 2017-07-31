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
	'drone': 12, // Should be broken into harvesters and couriers
};

const CREEP_PARTS = {
	'harvester': [
		[WORK, WORK, WORK, CARRY, MOVE],
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
		[TOUGH, TOUGH, MOVE, MOVE, TOUGH, ATTACK, MOVE, MOVE, ATTACK, ATTACK, MOVE, MOVE],
		[TOUGH, TOUGH, MOVE, MOVE, ATTACK, ATTACK, MOVE, MOVE],
		[TOUGH, TOUGH, ATTACK, MOVE, MOVE, MOVE],
		[ATTACK, MOVE],
	],
	'drone': [
		[WORK, WORK, WORK, CARRY, CARRY, CARRY, CARRY, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE],
		[WORK, WORK, CARRY, CARRY, CARRY, MOVE, MOVE, MOVE, MOVE, MOVE],
		[WORK, CARRY, CARRY, MOVE, MOVE, MOVE],
	],
};

function UNIT_COST(a) { return _.sum(a, (x) => BODYPART_COST[x]); }

function makeName(role, workroom)
{
	return `${role}_${workroom}_${Memory.creep_counter}`;
}

StructureSpawn.prototype.run = function () {
	if (Memory.creep_counter > 9999) {
		Memory.creep_counter -= 10000;
	}
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
				let name = this.createCreep(parts, makeName(t,this.room.name), { role: t, cost: UNIT_COST(parts), home: this.room.name, work: this.room.name });
				if (name != ERR_NOT_ENOUGH_RESOURCES) {
					console.log(`Spawning ${name}`)
					Memory.creep_counter++;
					Memory.pop_count++;
				}
				found_match = true;
				break;
			}
		}
	}

	if (!this.spawning && !found_match) {
		// We go by room so we will try to fill out our closest room friends first
		let num_spawns = this.room.find(FIND_MY_SPAWNS).length;
		let counter = 0;
		for (let i in Memory.exterior_rooms) {
			// Only supply 2 rooms worth of duderinos unless we have 2 spawns
			if (counter >= 2 && num_spawns < 2)
			{
				break;
			}
			counter++;
			//if (Memory.exterior_rooms[i].last_death + 600 > Game.time) {
			//	continue;
			//}
			for (let t in EXTERIOR_CREEP_MAXIMUMS) {
				if (Memory.exterior_rooms[i].creeps[t] && Memory.exterior_rooms[i].creeps[t].length >= EXTERIOR_CREEP_MAXIMUMS[t]) {
					continue
				}
				let parts = _.find(CREEP_PARTS[t], b => UNIT_COST(b) <= this.room.energyCapacityAvailable);
				let name = this.createCreep(parts, makeName(t,i), { role: t, cost: UNIT_COST(parts), home: this.room.name, work: i });
				if (name != ERR_NOT_ENOUGH_RESOURCES) {
					console.log(`Spawning ${name}`)
					if (!Memory.exterior_rooms[i].creeps[t]) {
						Memory.exterior_rooms[i].creeps[t] = [name];
					}
					else {
						Memory.exterior_rooms[i].creeps[t].push(name);
					}
					Memory.creep_counter++;
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
		let name = this.createCreep(parts, makeName('bootstrap',this.room.name), { role: 'bootstrap', cost: UNIT_COST(parts), home: this.room.name, work: this.room.name });
		if (name != ERR_NOT_ENOUGH_RESOURCES) {
			console.log(`Spawning ${name}`)
			Memory.creep_counter++;
			Memory.pop_count++;
		}
	}
}
