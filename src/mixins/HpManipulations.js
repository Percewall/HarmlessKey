import { db } from '@/firebase';
import { mapActions, mapGetters } from 'vuex';
import { remindersMixin } from '@/mixins/reminders';

export const setHP = {
	mixins: [remindersMixin],
	data() {
		return {
			demo: this.$route.name === "Demo",
			userId: this.$store.getters.getUser.uid,
			campaignId: this.$route.params.campid,
		}
	},
	firebase() {
		return {
			settings: {
				source: db.ref(`settings/${this.userId}/encounter`),
				asObject: true,
			}
		}
	},
	computed: {
		...mapGetters([
			'encounter',
		]),
	},
	methods: {
		...mapActions([
			'set_save',
			'set_stable',
			'set_hp',
			'set_dead',
			'set_log',
			'set_meters'
		]),
		setHP(amount, crit, target, current, type, log = true, notify = true, undo = false) {
			amount = parseInt(amount);

			if(type == 'damage') {
				this.isDamage(target, crit, current, amount, log, notify, undo)
			}
			else {
				this.isHealing(target, current, amount, log, notify, undo)
			}
		},
		isDamage(target, crit, current, amount, log, notify, undo) {
			var maxHp = parseInt(target.maxHp);
			var curHp = parseInt(target.curHp);
			var tempHp = parseInt(target.tempHp);
			var transCurHp = parseInt(target.transformedCurHp);
			var type = 'damage';
			var over = 0;
			var rest_amount = amount;

			//Death saves at 0 hp, if automate is on
			if(curHp == 0 && this.settings.automate !== false && (target.entityType === 'player' || target.entityType === 'companion')) {
				var n = parseInt(Object.keys(target.saves).length)
				this.set_save({
					key: target.key,
					check: 'fail',
					index: n
				})
				if(crit) {
					n = parseInt(Object.keys(target.saves).length)

					this.set_save({
						key: target.key,
						check: 'fail',
						index: n
					})
				}
			}

			//First check if there is tempHp and put damage in there first.
			if(tempHp) {
				let newTemp = parseInt(tempHp - amount);

				//Adjust the rest amount
				rest_amount = (newTemp < 0) ? -newTemp : 0;

				//Set the new HP
				this.set_hp({
					key: target.key,
					pool: 'temp',
					newHp: newTemp,
				});
			}
			//Then check if the target is transformed and put rest damage in the transformation
			if(target.transformed == true) {
				var newTrans = parseInt(transCurHp - rest_amount);

				//Adjust the rest amount
				rest_amount = (newTrans < 0) ? -newTrans : 0

				//Set the new HP
				this.set_hp({
					key: target.key,
					pool: 'transformed',
					newHp: newTrans,
				});
			}
			//If there is damage left after taking it from the tempHp and/or the transformation
			if(rest_amount > 0) {
				var newhp = parseInt(curHp - rest_amount);

				if(newhp <= 0) {
					this.set_stable({
						key: target.key,
						action: 'unset',
					});
				}
			
				//When there is an overkill
				if(newhp < 0) { 
					newhp = 0;

					if(tempHp) {
						over = parseInt(rest_amount + tempHp - curHp); //overkill
						amount = parseInt(curHp + tempHp);
					}
					else {
						over = parseInt(rest_amount - curHp); //overkill
						amount = curHp;
					}
					//Character dies if the overkill is >= maxHp
					if(over >= maxHp && (target.entityType === 'player' || target.entityType === 'companion')) {
						this.set_dead({
							key: target.key,
							action: 'set',
						})
					}
				}
				this.set_hp({
					key: target.key,
					newHp: newhp,
				})

				//Check if a reminder is triggered on damage taken
				this.checkReminders(target, 'damage');
				
			}

			//Notification
			if(notify) {
				this.$snotify.error(
					current.name + ' did ' + amount + ' ' + type + ' to ' + target.name,
					'Damage done!', 
					{
						position: "centerTop"
					}
				);
			}

			//Add to log
			if(log == true) {
				this.addLog(type, crit, target, current, amount, over);
			}

			//Add to damagemeters
			//undo holds the value of ovherhealing, if there was any
			if(undo) {
				amount = -amount
				over = (undo !== true) ? -undo : 0;
				type = 'healing'
			}
			
			//Campaign wide damage meters (no need to go through store)
			if(!this.demo) {
				if(!undo) {
					this.set_meters({key: current.key, type: 'damage', amount}) //Damage done
					this.set_meters({key: current.key, type: 'overkill', amount: over}) //Over damage done
					this.set_meters({key: target.key, type: 'damageTaken', amount}) //Damage taken
					this.set_meters({key: target.key, type: 'overkillTaken', amount: over}) //Over damage taken
	
					if(current.entityType === 'player' || current.entityType === 'companion') {
						this.damageMeters(current.key, 'damage', amount, current.entityType); //Damage done
						this.damageMeters(current.key, 'overkill', over, current.entityType); //Over damage done
						this.damageMeters(target.key, 'damageTaken', amount, current.entityType); //damage taken
						this.damageMeters(target.key, 'overkillTaken', over, current.entityType); //Over damage taken
					}
				} 
				//To undo, run same function with opposite types 
				else {
					this.set_meters({key: current.key, type: 'healing', amount}) //Undo damage done
					this.set_meters({key: current.key, type: 'overhealing', amount: over}) //Undo Over damage done
					this.set_meters({key: target.key, type: 'healingTaken', amount}) //Undo damage taken
					this.set_meters({key: target.key, type: 'overhealingTaken', amount: over}) //Undo Over damage taken
	
					if(current.entityType === 'player' || current.entityType === 'companion') {
						this.damageMeters(current.key, 'healing', amount, current.entityType); //Undo Damage done
						this.damageMeters(current.key, 'overhealing', over, current.entityType); //Undo Over damage done
						this.damageMeters(target.key, 'healingTaken', amount, current.entityType); //Undo damage taken
						this.damageMeters(target.key, 'overhealingTaken', over, current.entityType); //Undo Over damage taken
					}
				}
			}
		},
		isHealing(target, current, amount, log, notify, undo) {
			if(target.transformed == true) {
				var maxHp = parseInt(target.transformedMaxHp);
				var curHp = parseInt(target.transformedCurHp);
				var pool = 'transformed';
			}
			else {
				maxHp = parseInt(target.maxHp);
				curHp = parseInt(target.curHp);
				pool = '';
			}
			var newhp = parseInt(curHp + amount);
			var type = 'healing'
			var over = 0

			//If the target is a player and the curHp was 0, saves need to be reset
			if((target.entityType === 'player' || target.entityType === 'companion') && curHp === 0) {
				this.set_save({
					key: target.key,
					check: 'reset'
				})
				this.set_dead({
					key: target.key,
					action: 'unset',
				})
			}

			if(newhp > maxHp) { 
				newhp = maxHp;
				over = amount - maxHp + curHp; //overhealing
				amount = maxHp - curHp;
			}
			
			//Heal the target
			this.set_hp({
				key: target.key,
				pool: pool,
				newHp: newhp,
			})

			//Notification
			if(notify) {
				this.$snotify.success(
					current.name + ' did ' + amount + ' ' + type + ' to ' + target.name, 
					'Healing done!', 
					{
						position: "centerTop",
					}
				);
			}
			//Add to log
			if(log == true) {
				this.addLog(type, false, target, current, amount, over)
			}
			
			//Add to damagemeters
			//undo holds the value of overdamage, if there was any
			if(undo) {
				amount = -amount
				over = (undo !== true) ? -undo : 0;
				type = 'damage'
			}

			//Campaign wide healing meters (no need to go through store)
			if(!this.demo) {
				if(!undo) {
					this.set_meters({key: current.key, type: 'healing', amount}) //Healing done
					this.set_meters({key: current.key, type: 'overhealing', amount: over}) //Over healing done
					this.set_meters({key: target.key, type: 'healingTaken', amount}) //Healing taken
					this.set_meters({key: target.key, type: 'overhealingTaken', amount: over}) //Over healing taken

					if((current.entityType === 'player' || current.entityType === 'companion')) {
						this.damageMeters(current.key, 'healing', amount, current.entityType); //Healing done
						this.damageMeters(current.key, 'overhealing', over, current.entityType); //Over healing done
						this.damageMeters(target.key, 'healingTaken', amount, current.entityType); //Healing taken
						this.damageMeters(target.key, 'overhealingTaken', over, current.entityType); //Over healing taken
					}
				}
				//To undo, run same function with opposite types 
				else {
					this.set_meters({key: current.key, type: 'damage', amount}) //Undo Healing done
					this.set_meters({key: current.key, type: 'overkill', amount: over}) //Undo Over Healing done
					this.set_meters({key: target.key, type: 'damageTaken', amount}) //Undo Healing taken
					this.set_meters({key: target.key, type: 'overkillTaken', amount: over}) //Undo Over Healing taken

					if((current.entityType === 'player' || current.entityType === 'companion')) {
						this.damageMeters(current.key, 'damage', amount, current.entityType); //Undo Healing done
						this.damageMeters(current.key, 'overkill', over, current.entityType); //Undo Over healing done
						this.damageMeters(target.key, 'damageTaken', amount, current.entityType); //Undo Healing taken
						this.damageMeters(target.key, 'overkillTaken', over, current.entityType); //Undo overhealing taken
					}
				}
			}
		},
		addLog(type, crit, target, current, amount, over) {
			var d = new Date();
			var time = d.getHours() + ":" + d.getMinutes() + ":" + d.getSeconds();

			if(localStorage.getItem(this.encounterId)) {
				this.log = JSON.parse(localStorage.getItem(this.encounterId));
			}
			else {
				this.log = []
			}

			var newLog = {
				round: this.encounter.round,
				turn: this.encounter.turn + 1,
				by: current.key,
				time: time,
				type: type,
				crit: crit,
				damageType: this.damageType,
				target: target.key,
				amount: amount,
				over: over
			}
			
			this.set_log({
				action: 'set',
				value: newLog
			})
		},
		async damageMeters(key, type, amount, entityType) {
			let db_name = entityType + 's';
			//Get the current healing done/taken
			let targetMeters = db.ref(`campaigns/${this.userId}/${this.campaignId}/${db_name}/${key}/meters/${type}`);
			let currentAmount = await targetMeters.once('value').then(function(snapshot) {
				return snapshot.val()
			})
			if(currentAmount === null) { currentAmount = 0; } //if there is no healing done/taken yet
			let newAmount = parseInt(currentAmount) + parseInt(amount); //calculate the new amount

			//Set the new amount
			db.ref(`campaigns/${this.userId}/${this.campaignId}/${db_name}/${key}/meters/${type}`).set(newAmount);
		}
	}
}