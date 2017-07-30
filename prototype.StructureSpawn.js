const utils = require('utils');

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
	else {

		// Grab counts for all the roles
		let num_harvesters = utils.countCreeps('harvester');
		let num_builders = utils.countCreeps('builder');
		let num_upgraders = utils.countCreeps('upgrader');
		let num_drones = utils.countCreeps('drone');

		// Crazy default parts
		//let parts = [WORK, WORK, WORK, WORK, CARRY, CARRY, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE];
		//let parts = [WORK, WORK, CARRY, CARRY, MOVE, MOVE, MOVE, MOVE];
		let parts = [WORK, WORK, WORK, WORK, CARRY, CARRY, CARRY, CARRY, MOVE, MOVE, MOVE, MOVE];
		let cost = 4 * 100 + 4 * 50 + 4 * 50;

		// Check the balance based on magic numbers that have no basis in reality
		if (num_harvesters < 6) {
			utils.spawnCreep(this, 'harvester', parts, cost);
		}
		else if (num_builders < 0) {
			utils.spawnCreep(this, 'builder', parts, cost);
		}
		else if (num_upgraders < 2) {
			utils.spawnCreep(this, 'upgrader', parts, cost);
		}
		else if (num_drones < 12 && Memory.last_external_death + 1200 < Game.time) {
			parts = [WORK, WORK, CARRY, CARRY, CARRY, MOVE, MOVE, MOVE, MOVE, MOVE];
			cost = 2 * 100 + 3 * 50 + 5 * 50;
			utils.spawnCreep(this, 'drone', parts, cost);
		}

		// If everything is dead (but we still have a spawn for some reason), try to rebuild!
		if (!this.spawning && Memory.pop_count == 0) {
			utils.spawnCreep(this, 'harvester', [WORK, CARRY, MOVE, MOVE], 250);
		}
	}
}
