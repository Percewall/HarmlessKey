<template>
	<div class="card">
		<div class="card-header d-flex justify-content-between">
			<span>Edit Spell Action</span>
			<a 
			class="gray-hover text-capitalize" 
			@click="save_action()">
				<i class="fas fa-edit green"></i>
				<span class="d-none d-md-inline ml-1">Save</span>
			</a>
		</div>
		<div class="card-body">
			<b-row>
				<!-- ACTION TYPE -->
				<b-col md="3">
					<label class="required" for="attack_type">Action Type</label>
					<b-form-select v-model="spell_action.type"
						id="action_type"
						name="action_type"
						title="Action Type"
						class="form-control mb-2"
						v-validate="'required'"
						data-vv-as="Action Type"
						@change="$forceUpdate()">
						<option :value="undefined" disabled>- Action Type -</option>
						<option v-for="({ label, value}) in attack_type"
							:key="value" :value="value" selected="selected">{{label}}</option>
					</b-form-select>
					<p class="validate red" v-if="errors.has('action_type')">{{ errors.first('action_type') }}</p>
				</b-col>
				<!-- ACTION NAME -->
				<b-col md="3">
					<label for="name">Action Name</label>
					<b-form-input v-model="spell_action.name"
						autocomplete="off"
						id="name"
						name="name"
						class="form-control mb-2"
						title="Action Name"
						v-validate="'max:100'"
						data-vv-as="Action Name"
						@keyup="$forceUpdate()"
						></b-form-input>
				</b-col>
				<!-- SAVE -->
				<b-col md="2">
					<label for="save">Save</label>
					<b-form-select v-model="spell_action.save"
						:disabled="spell_action.type != 'spell save'"
						id="save"
						name="save"
						title="Save"
						class="form-control mb-2"
						data-vv-as="Save"
						@change="$forceUpdate()">
						<option :value="undefined" disabled>- Save -</option>
						<option v-for="({ label, value}) in save"
							:key="value" :value="value">{{label}}</option>
					</b-form-select>
				</b-col>
				<!-- Free cast -->
				<b-col md="2">
					<label for="free">
						<span>Free</span>
						<a 
							class="ml-1"
							v-b-popover.hover.top="'Select this, if the spell action can be used without expending a spell slot.'" 
							title="Free"
						>
							<i class="fas fa-info-circle"></i>
						</a>
					</label>
					<div class="free d-flex justify-content-between" name="free">
						<a class="component_box" @click="setFree(spell_action)"
							:class="{'selected': spell_action.free === true}">
							<span>F</span>
						</a>
					</div>
				</b-col>
				<!-- Seperate cast -->
				<b-col md="2">
					<label for="seperate">
						<span>Sep.</span>
						<a 
							class="ml-1"
							v-b-popover.hover.top="'Select this, if the spell action can be rolled seperately from the rest of the actions.'" 
							title="Seperate"
						>
							<i class="fas fa-info-circle"></i>
						</a>
					</label>
					<div class="seperate d-flex justify-content-between" name="seperate">
						<a class="component_box" @click="setSeperate(spell_action)"
							:class="{'selected': spell_action.seperate === true}">
							<span>S</span>
						</a>
					</div>
				</b-col>
			</b-row>

			<!-- MODIFIERS, CONDITIONS & REMINDERS -->
			<ul class="nav nav-tabs" id="myTab" role="tablist">
				<li class="nav-item">
					<a class="nav-link active" 
						id="modifiers-tab" 
						data-toggle="tab" 
						role="tab" 
						href="#modifiers"
						aria-controls="modifiers" 
						aria-selected="true">
						<i class="fas fa-dice-d20"></i>
						<span class="d-none d-md-inline ml-1">Modifiers</span>
					</a>
				</li>
				<li class="nav-item">
					<a class="nav-link" 
						id="Conditions-tab" 
						data-toggle="tab" 
						role="tab" 
						href="#conditions"
						aria-controls="Conditions" 
						aria-selected="false">
						<i class="fas fa-flame"></i>
						<span class="d-none d-md-inline ml-1">Conditions</span>
					</a>
				</li>
				<li class="nav-item">
					<a class="nav-link" 
						id="notifications-tab" 
						data-toggle="tab" 
						role="tab" 
						href="#notifications"
						aria-controls="notifications" 
						aria-selected="false">
						<i class="fas fa-bell"></i>
						<span class="d-none d-md-inline ml-1">Notifications</span>
					</a>
				</li>
				<li class="nav-item">
					<a class="nav-link" 
						id="effects-tab" 
						data-toggle="tab" 
						role="tab" 
						href="#effects"
						aria-controls="effects" 
						aria-selected="false">
						<i class="fas fa-hand-holding-magic"></i>
						<span class="d-none d-md-inline ml-1">Effects</span>
					</a>
				</li>
			</ul>
			<div class="tab-content">
				<div class="tab-pane fade show active" 
					id="modifiers" 
					role="tabpanel" 
					aria-labelledby="Modifiers-tab"
				>
					<spell-action-modifiers 
						v-model="spell_action.modifiers" 
						:level_scaling="level_scaling"
						:level="level"
						:action_type="spell_action.type"
						@validation="setValidation"
					/>
				</div>
				<div class="tab-pane fade" 
					id="conditions" 
					role="tabpanel" 
					aria-labelledby="Conditions-tab"
				>
					<spell-action-conditions
						v-model="spell_action.conditions"
						:level_scaling="level_scaling"
						:level="level"
						:action_type="spell_action.type"
						@validation="setValidation"
					/>
				</div>
				<div class="tab-pane fade" 
					id="notifications" 
					role="tabpanel" 
					aria-labelledby="Notifications-tab"
				>
					<spell-action-notifications
						v-model="spell_action.notifications"
						:level_scaling="level_scaling"
						:level="level"
						:action_type="spell_action.type"
						@spellUpdate="spellUpdate()"
						@validation="setValidation"
					/>
				</div>
				<div class="tab-pane fade" 
					id="effects" 
					role="tabpanel" 
					aria-labelledby="effects-tab"
				>
					<spell-action-effects
						v-model="spell_action.effects"
						:level_scaling="level_scaling"
						:level="level"
						:action_type="spell_action.type"
						@spellUpdate="spellUpdate()"
						@validation="setValidation"
					/>
				</div>
			</div>
		</div>
	</div>
</template>

<script>
import spellActionModifiers from '@/components/contribute/spell/forms/spell-action-modifiers.vue';
import spellActionConditions from '@/components/contribute/spell/forms/spell-action-conditions.vue';
import spellActionNotifications from '@/components/contribute/spell/forms/spell-action-notifications.vue';
import spellActionEffects from '@/components/contribute/spell/forms/spell-action-effects.vue';

export default {
	name: 'edit-spell-action',
	props: {
		value: Object,
		level_scaling: String,
		level: Number,
		action_index: Number,
		spell: Object,
	},
	components: {
		spellActionModifiers,
		spellActionConditions,
		spellActionNotifications,
		spellActionEffects
	},
	computed: {
		spell_action: {
			get() {
				return this.value;
			},
			set(newValue) {
				this.$emit("input", newValue);
				return newValue;
			}
		},
		validator() {
			let val_key = `spell-action-${this.action_index}`;
			let ret = {}
			ret[val_key] = this.$validator;
			return ret;
		}
	},

	data() {
		return {
			attack_type: [
				{ label: "Melee Weapon", value: "melee weapon" },
				{ label: "Ranged Weapon", value: "ranged weapon" },
				{ label: "Spell Attack", value: "spell attack" },
				{ label: "Spell Save", value: "spell save" },
				{ label: "Healing Spell", value: "healing spell" },
				{ label: "Damage", value: "damage" },
				{ label: "Other", value: "other" },
			],
			save: [
				{ label: "None", value: "none" },
				{ label: "Strength", value: "strength" },
				{ label: "Dexterity", value: "dexterity" },
				{ label: "Constitution", value: "constitution" },
				{ label: "Intelligence", value: "intelligence" },
				{ label: "Wisdom", value: "wisdom" },
				{ label: "Charisma", value: "charisma" },
			],
			validators: {},
		};
	},
	methods: {
		async save_action() {
			if (await this.validate_validators() === true) {
				this.$emit("saved");
			} else {
				this.$snotify.error('Form Not Valid', 'Critical miss!', {
					position: "rightTop"
				});
			}
		},
		async validate_validators() {
			// loops through all available validators to check if the forms
			// are all valid. This happens async.
			for (let v in this.validators) {
				let validator = this.validators[v];
				 let temp = await validator.validateAll()
				 if (temp == false)
				 	return false;
			}
			return true;
		},
		spellUpdate() {
			this.$emit('spellUpdate')
		},
		setValidation(validators) {
			// receives validators from either modifiers, conditions, reminders
			for (let v in validators) {
				let new_key = Object.keys(this.validator)[0] + '-' + v;
				this.validators[new_key] = validators[v]
			}
			this.$emit('validation', this.validators)
		},
		setSeperate(spell_action) {
			if (spell_action.seperate == undefined) {
				spell_action.seperate = false
			}
			spell_action.seperate = !spell_action.seperate
			this.$forceUpdate(); //IMPORTANT
		},
		setFree(spell_action) {
			if (spell_action.free == undefined) {
				spell_action.free = false
			}
			spell_action.free = !spell_action.free
			this.$forceUpdate(); //IMPORTANT
		},
	},
	watch: {
		spell_action: {
			handler() {
				// Emits validators on every change
				this.$emit('validation', this.validators);
			},
			deep: true,
			immidiate: true,
		}
	},
};
</script>

<style lang="scss" scoped>
.tabs {
	width: 100%;
}

ul.nav-tabs {
	border-bottom: solid 3px #494747;
	height: 37px;
	margin: 20px 0;

	.nav-link {
		color: #b2b2b2 !important;
		height: 37px;
		border-bottom: solid 3px #494747 !important;

		&.active {
			color: #2c97de !important;
			background: none !important;
			border-color: #2c97de !important;
		}
	}
}
.tab-content {
	padding: 20px;
	position: relative;
}

.component_box {
	background: #000;
	width: 40px;
	text-align: center;
	line-height: 36px;
	height: 36px;
	font-size: 18px;
	span {
		color: white;
	}
}
.component_box.selected {
	background: #2c97de;
}
</style>
