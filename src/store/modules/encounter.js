import { db } from '@/firebase'
import Vue from 'vue'

const encounters_ref = db.ref('encounters')

const state = {
	entities: {},

	targeted: undefined,
	encounter: undefined,
	campaignId: undefined,
	encounterId: undefined,
	path: undefined,
}

const getters = {
	entities: function( state ) {
		return state.entities
	},
	active: function( state ) {
		return state.active
	},
	idle: function( state ) {
		return state.idle
	},
	down: function( state ) {
		return state.down
	},
	targeted: function( state ) {
		return state.targeted
	},
	encounter: function( state ) {
		return state.encounter
	},
	campaignId: function( state ) {
		return state.campaignId
	},
	encounterId: function( state ) {
		return state.encounterId
	},
	path: function( state ) {
		return state.path
	},
	turn: function( state ) {
		if (state.encounter) {
			return state.encounter.turn
		}
		return undefined
	},
	round: function( state ) {
		if (state.encounter) {
			return state.encounter.round
		}
		return undefined
	},
}

const mutations = {
	ADD_ENTITY(state, {rootState, key}) {
		let db_entity = state.encounter.entities[key]
		let entity = {
			name: db_entity.name,
			id: db_entity.id,
			initiative: db_entity.initiative,
			entityType: db_entity.entityType,
			maxHp: db_entity.maxHp,
			tempHp: db_entity.tempHp,
			curHp: db_entity.curHp,
			ac: parseInt(db_entity.ac),
			ac_bonus: db_entity.ac_bonus,
			active: db_entity.active,
			npc: db_entity.npc,
		}
		if (db_entity.down) {
			entity.down = db_entity.down
		}
		else {
			entity.down = false
		}
		if (db_entity.addNextRound) {
			entity.addNextRound = db_entity.addNextRound
		}
		else {
			entity.addNextRound = false
		}
		if (db_entity.saves) {
			entity.saves = db_entity.saves
		}
		else {
			entity.saves = {}
		}
		if (db_entity.stable) {
			entity.stable = db_entity.stable
		}
		else {
			entity.stable = false
		}
		if (db_entity.dead) {
			entity.dead = db_entity.dead
		}
		else {
			entity.dead = false
		}
		if (db_entity.conditions) {
			entity.conditions = db_entity.conditions
		}
		else {
			entity.conditions = {}
		}
		if(db_entity.transformed) {
			entity.transformed = true
			entity.transformedMaxHp = db_entity.transformed.maxHp
			entity.transformedCurHp = db_entity.transformed.curHp
			entity.transformedAc = db_entity.transformed.ac
		}
		else {
			entity.transformed = false
		}
		switch(true) {
			case (entity.entityType == 'player'):
				let db_player = rootState.content.players[key]

				if(db_player.avatar) {
					entity.img = db_player.avatar;
				}
				else {
					entity.img = require('@/assets/_img/styles/player.svg');
				}
				entity.ac = parseInt(db_player.ac)
				entity.maxHp = parseInt(db_player.maxHp)
				entity.strength = db_player.strength
				entity.dexterity = db_player.dexterity
				entity.constitution = db_player.constitution
				entity.intelligence = db_player.intelligence
				entity.wisdom = db_player.wisdom
				entity.charisma = db_player.charisma
				break
			case ((entity.entityType == 'npc') && (entity.npc == 'custom')):
				let db_npc = rootState.content.npcs[entity.id]
				if(db_npc.avatar) {
					entity.img = db_npc.avatar;
				}
				else {
					entity.img = require('@/assets/_img/styles/monster.svg');
				}
				entity.size = db_npc.size
				entity.type = db_npc.type
				entity.subtype = db_npc.subtype
				entity.alignment = db_npc.alignment
				entity.challenge_rating = db_npc.challenge_rating
				entity.hit_dice = db_npc.hit_dice
				entity.speed = db_npc.speed
				entity.senses = db_npc.senses
				entity.languages = db_npc.languages

				entity.strength = db_npc.strength
				entity.dexterity = db_npc.dexterity
				entity.constitution = db_npc.constitution
				entity.intelligence = db_npc.intelligence
				entity.wisdom = db_npc.wisdom
				entity.charisma = db_npc.charisma

				entity.strength_save = db_npc.strength_save
				entity.dexterity_save = db_npc.dexterity_save
				entity.constitution_save = db_npc.constitution_save
				entity.intelligence_save = db_npc.intelligence_save
				entity.wisdom_save = db_npc.wisdom_save
				entity.charisma_save = db_npc.charisma_save

				entity.damage_vulnerabilities = db_npc.damage_vulnerabilities
				entity.damage_resistances = db_npc.damage_resistances
				entity.damage_immunities = db_npc.damage_immunities
				entity.condition_immunities = db_npc.condition_immunities

				entity.special_abilities = db_npc.special_abilities
				entity.actions = db_npc.actions
				entity.legendary_actions = db_npc.legendary_actions
				break
			case ((entity.entityType == 'npc') && (entity.npc == 'api')):
				break
		}
		Vue.set(state.entities, key, entity)
	},
	CLEAR_ENTITIES(state) {
		state.entities = {}
	},	
	SET_CAMPAIGN_ID(state, value) {
		state.campaignId = value
	},
	SET_ENCOUNTER_ID(state, value) {
		state.encounterId = value
	},
	SET_ENCOUNTER(state, payload) {
		state.encounter = payload
	},
	SET_TARGETED(state, payload) {
		if(state.targeted == undefined || state.targeted != payload) {
			state.targeted = payload
		}
		else {
			state.targeted = undefined
		}
	},
	START_ENCOUNTER(state) {
		encounters_ref.child(state.path).update({
			round: 1
		})
	},
	SET_PATH(state, path) {
		state.path = path
	},
	SET_ACTIVE(state, {key, active}) {
		state.entities[key].active = active
		encounters_ref.child(`${state.path}/entities/${key}`).update({
			active: active
		})
	},
	SET_INITIATIVE(sate, {key, initiative}) {
		state.entities[key].initiative = initiative
		encounters_ref.child(`${state.path}/entities/${key}`).update({
			initiative: parseInt(initiative),
		})
	},
	SET_CONDITION(state, {action, key, condition}) {
		if(action == 'add') {
			Vue.set(state.entities[key].conditions, condition, true)
			encounters_ref.child(`${state.path}/entities/${key}/conditions/${condition}`).set('true');
		}
		else if(action == 'remove') {
			Vue.delete(state.entities[key].conditions, condition)
			encounters_ref.child(`${state.path}/entities/${key}/conditions/${condition}`).remove();
		}
	},
	SET_SAVE(state, {key, check, number}) {
		if(check == 'reset') {
			//RESET SAVES
			Vue.set(state.entities[key], 'saves', {})
			encounters_ref.child(`${state.path}/entities/${key}/saves`).remove();

			//REMOVE STABLE
			Vue.set(state.entities[key], 'stable', false)
			encounters_ref.child(`${state.path}/entities/${key}/stable`).remove();
		}
		else if(check == 'unset') {
			Vue.delete(state.entities[key].saves, number)
			encounters_ref.child(`${state.path}/entities/${key}/saves/${number}`).remove();
		}
		else {
			var n = parseInt(number + 1);
			Vue.set(state.entities[key].saves, n, check)
			encounters_ref.child(`${state.path}/entities/${key}/saves/${n}`).set(check);
		}
	},
	SET_STABLE(state, {key, action}) {
		if(action == 'set') {
			//RESET SAVES
			Vue.set(state.entities[key], 'saves', {})
			encounters_ref.child(`${state.path}/entities/${key}/saves`).remove();

			//REMOVE DEAD
			Vue.delete(state.entities[key], 'dead')
			encounters_ref.child(`${state.path}/entities/${key}/dead`).remove();

			//SET STABLE
			Vue.set(state.entities[key], 'stable', 'true')
			encounters_ref.child(`${state.path}/entities/${key}/stable`).set('true');
		}
		else if(action == 'unset') {
			Vue.delete(state.entities[key], 'stable')
			encounters_ref.child(`${state.path}/entities/${key}/stable`).remove();
		}
	},
	EDIT_ENTITY(state, {key, entity}) {
		state.entities[key].name = entity.name
		state.entities[key].initiative = entity.initiative
		state.entities[key].ac_bonus = entity.ac_bonus
		state.entities[key].tempHp = entity.tempHp

		encounters_ref.child(`${state.path}/entities/${key}`).set(entity);
	},
	REMOVE_ENTITY(state, {key}) {
		Vue.delete(state.entities, key)
		encounters_ref.child(`${state.path}/entities/${key}`).remove();
	},
	SET_DOWN(state, {key, value}) {
		state.entities[key].down = value
		if (value) {
			encounters_ref.child(`${state.path}/entities/${key}/down`).set(true)
		} else {
			encounters_ref.child(`${state.path}/entities/${key}/down`).remove()
		}
	},
	ADD_NEXT_ROUND(state, {key, action, value}) {
		if(action == 'tag') {
			state.entities[key].addNextRound = value
		}
		else if(action == 'set') {
			Vue.set(state.entities[key], 'active', true)
			encounters_ref.child(`${state.path}/entities/${key}/active`).set(true)
			encounters_ref.child(`${state.path}/entities/${key}/addNextRound`).remove()
		}
	},
	SET_HP(state, {key, pool, newHp}) {
		if(pool == 'temp') {
			//if the damage was higher then the amount of tempHp, remove the tempHp
			if(newHp <= 0) {
				state.entities[key].tempHp = undefined
				encounters_ref.child(`${state.path}/entities/${key}/tempHp`).remove()
			}
			//if the damage was lower than the amount of tempHp, set a new tempHp
			else {
				state.entities[key].tempHp = newHp
				encounters_ref.child(`${state.path}/entities/${key}/tempHp`).set(newHp);
			}
		}
		else if(pool == 'transformed') {
			if(newHp <= 0) {
				state.entities[key].transformed = false;
				encounters_ref.child(`${state.path}/entities/${key}/transformed`).remove()
			}
			else {
				state.entities[key].transformedCurHp = newHp;
				encounters_ref.child(`${state.path}/entities/${key}/transformed/curHp`).set(newHp);
			}
		}
		else {
			state.entities[key].curHp = newHp
			encounters_ref.child(`${state.path}/entities/${key}/curHp`).set(newHp);
		}
	},
	SET_DEAD(state, {key, action}) {
		if(action == 'set') {
			//SET DEAD
			state.entities[key].dead = true
			encounters_ref.child(`${state.path}/entities/${key}/dead`).set(true);
		}
		else if(action == 'unset') {
			Vue.delete(state.entities[key], 'dead')
			encounters_ref.child(`${state.path}/entities/${key}/dead`).remove();
		}
	},
}

const actions = {
	init_Encounter({ commit, rootState }, { cid, eid }) {
		commit("SET_CAMPAIGN_ID", cid)
		commit("SET_ENCOUNTER_ID", eid)
		commit("CLEAR_ENTITIES")
		const uid = rootState.content.user.uid;
		const path = `${uid}/${cid}/${eid}`;
		commit("SET_PATH", path)
		const encounter = encounters_ref.child(path);
		encounter.once('value', snapshot => {
			commit('SET_ENCOUNTER', snapshot.val())
			for (let key in snapshot.val().entities) {
				commit('ADD_ENTITY', {rootState, key})
			}
		})
	},

	track_Encounter({ commit, state }) {
		const path = state.path
		const encounter = encounters_ref.child(path);
		encounter.on('value', snapshot => {
			commit('SET_ENCOUNTER', snapshot.val())
			// commit('DEVIDE_BY_STATUS', snapshot.val())
		})
	},
	set_active({ commit }, payload) {
		commit("SET_ACTIVE", payload)
	},
	set_targeted({ commit }, payload) {
		commit('SET_TARGETED', payload);
	},
	set_initiative({ commit }, payload) {
		commit('SET_INITIATIVE', payload)
	},
	update_round({ commit, state}) {
		for (let key in state.entities) {
			let e = state.entities[key]
			if (e.curHp <= 0 && e.entityType != 'player') {
				commit('SET_DOWN', {key:key, value:true})
			}
			if (e.curHp > 0 && e.down == true) {
				commit('SET_DOWN', {key:key, value:false})
			}
			if(e.addNextRound == true) {
				commit('ADD_NEXT_ROUND', {key:key, action: 'set'})
			}
		}
	},
	set_condition({ commit }, payload) {
		commit('SET_CONDITION', payload)
	},
	set_save({ commit }, payload) {
		commit('SET_SAVE', payload)
	},
	set_stable({ commit }, payload) {
		commit('SET_STABLE', payload)
	},
	edit_entity({ commit }, payload) {
		commit('EDIT_ENTITY', payload)
	},
	add_entity({ commit, rootState }, key) {
		commit('ADD_ENTITY', {rootState, key})
	},
	remove_entity({ commit }, payload) {
		commit('REMOVE_ENTITY', payload)
	},
	add_next_round({ commit }, payload) {
		event.stopPropagation(); //So target is not unselected when clicked
		commit('ADD_NEXT_ROUND', payload)
	},
	set_hp({ commit }, payload) {
		commit('SET_HP', payload)
	},
	set_dead({ commit }, payload) {
		commit('SET_DEAD', payload)
	},
}

export const encounter_module = {
	state: state,
	getters: getters,
	mutations: mutations,
	actions: actions,
}
