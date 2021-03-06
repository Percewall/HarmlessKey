import { dice } from '@/mixins/dice.js';

export const spells = {
	mixins: [dice],
	data() {
		return {
		}
	},
	methods: {
		rollSpell(spell, castLevel, casterLevel, toHitModifier, advantage) {
			let returnRoll = {
				actions: [],
				damageTypes: []
			};
			const actions = spell.actions;
			const scaleType = spell.level_scaling;
			const spellLevel = spell.level;

			let i = 0;
			// LOOP OVER ALL ACTIONS
			for(let action of actions) {
				let type = action.type;
				let toHit = false;
				returnRoll.actions[i] = { type, rolls: [] };

				//If the action type is a spell attack, melee weapon or ranged weapon, roll to hit
				if(type === 'Melee Weapon' || type === 'Ranged Weapon' || type === 'Spell Attack') {
					returnRoll.actions[i].toHit = this.__rollToHit__(toHitModifier, advantage);
					toHit = true;
				}
				if(type === 'Spell Save') {
					returnRoll.actions[i].save = action.save;
				}

				for(let modifier of action.modifiers) {
					let subtype = modifier.subtype;
					let dice_type = modifier.dice_type;
					let dice_count = modifier.dice_count;
					let fixed_val = (modifier.fixed_val) ? modifier.fixed_val : 0;
					let modifierRoll = undefined;
					let scaledRoll = undefined;
					let scaledModifier = undefined;
					let missSave = (toHit) ? modifier.miss_mod : modifier.save_fail_mod; //what happens on miss/failed save

					//Create a list with al damage types for this action
					//Only if it is not a healing spell
					if(type !== 'Healing Spell' && subtype) {
						if(!returnRoll.damageTypes.includes(subtype)) {
							returnRoll.damageTypes.push(subtype);
						}
					}

					//Check if the spell scales with the current roll
					let tiers = modifier.level_tiers;
					if(tiers) {
						scaledModifier = this.__levelScaling__(tiers, castLevel, spellLevel, casterLevel, scaleType);
					
						//Roll the scaledModifier
						if(scaledModifier) {
							scaledRoll = this.rollD(scaledModifier.dice_type, scaledModifier.dice_count, scaledModifier.fixed_val);
						}
					}
					
					//Roll the modifier
					//If the modifier scales with character level, overwrite the modifierRoll with the scaledRoll
					if(scaleType === 'Character Level' && scaledModifier) {
						modifierRoll = scaledRoll;
						scaledRoll = undefined; //Only return the scaled modifierRoll
					} else {
						modifierRoll = this.rollD(dice_type, dice_count, fixed_val);
					}

					//Push the rolled modifier to the array with all rolled modifiers
					returnRoll.actions[i].rolls.push({
						modifierRoll,
						subtype: modifier.subtype,
						scaledRoll,
						missSave
					});
				}
				i++;
			}
			return returnRoll;
		},
		returnDamageTypeIcon(type) {
			if(type === 'Acid') { return 'fas fa-tint'; }
			if(type === 'Bludgeoning') { return 'fas fa-hammer-war';  }
			if(type === 'Cold') { return 'far fa-snowflake'; }
			if(type === 'Fire') { return 'fas fa-flame'; }
			if(type === 'Force') { return 'fas fa-sparkles'; }
			if(type === 'Lightning') { return 'fas fa-bolt'; }
			if(type === 'Necrotic') { return 'fas fa-skull'; }
			if(type === 'Piercing') { return 'far fa-bow-arrow'; }
			if(type === 'Poison') { return 'fas fa-flask-poison'; }
			if(type === 'Psychic') { return 'fas fa-brain'; }
			if(type === 'Radiant') { return 'fas fa-sun'; }
			if(type === 'Slashing') { return 'fas fa-sword'; }
			if(type === 'Thunder') { return 'far fa-waveform-path'; }
		},
		__levelScaling__(tiers, castLevel, spellLevel, casterLevel, scaleType) {
			let scaledModifier = undefined;

			//SPELL SCALE
			if(scaleType === 'Spell Scale') {
				let scale = tiers[0].level;
				let dice_type = tiers[0].dice_type;
				let dice_count = tiers[0].dice_count;
				let fixed_val = tiers[0].fixed_val;

				//Calculate the increase based on spell level, on what level the spell is cast and the scale
				let increase = parseInt(Math.floor((castLevel - spellLevel) / scale));

				//If there is an increase, 
				if(increase) {
					scaledModifier = {};
					scaledModifier.dice_count = increase * dice_count;
					scaledModifier.dice_type = dice_type;

					//Check if there is a fixed value
					//If there is one, add it for every scale level
					//If the spell scales with 1 and is cast 3 levels higer, multiply the fixed value by 3
					scaledModifier.fixed_val = (fixed_val) ? increase * fixed_val : 0;
				}
			}
			//CHARACTER LEVEL
			if(scaleType === 'Character Level') {
				tiers.sort((a, b) => (parseInt(a.level) > parseInt(b.level)) ? 1 : -1)

				for(let tier of tiers) {
					if(parseInt(casterLevel) >= parseInt(tier.level)) {
						scaledModifier = {
							dice_count: tier.dice_count,
							dice_type: tier.dice_type,
						};
						if(tier.fixed_val) {
							scaledModifier.fixed_val = tier.fixed_val;
						}
					}
				}
			}
			return scaledModifier;
		},
		__rollToHit__(modifier, advantage) {
			let rolls = {};
			let toHit = [];

			if(advantage) {
				for(let i = 0; i <= 1; i++) {
					toHit[i] =  this.rollD(20, 1, modifier); //Roll the to hit, d20 + attack bonus
				}

				//Define the position of the highest and lowest rolls in the array
				rolls.highest = (toHit[0].throws[0] >= toHit[1].throws[0]) ? toHit[0] : toHit[1];
				rolls.lowest = (toHit[0].throws[0] >= toHit[1].throws[0]) ? toHit[1]: toHit[0];
			} 
			//Roll once where there is no advantage/disadvantage
			else {
				rolls.singleRoll = this.rollD(20, 1, modifier); //Roll the to hit, d20 + attack bonus
			}
			return rolls;
		}
	}
}
