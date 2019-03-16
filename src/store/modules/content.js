import { db, auth } from '@/firebase'

const campaigns_ref = db.ref('campaigns/')
const encounters_ref = db.ref('encounters')
const players_ref = db.ref('players')
const npcs_ref = db.ref('npcs')
const users_ref = db.ref('users')

export const content_module = {
	state: {
		user: {},
		userInfo: undefined,
		
		tier: undefined,
		overencumbered: undefined,
		content_count: {},
		
		slide: {},

		campaign: {},
		campaigns: {},
		allEncounters: {},
		encounters: {},
		players: {},
		npcs: {},

	},
	getters: {
		getUser: function(state) {
			return state.user;
		},
		userInfo: function(state) {
			return state.userInfo;
		},
		tier: function(state) {
			return state.tier;
		},
		getSlide: function(state) {
			return state.slide;
		},
		encounters: function( state ) {
			return state.encounters
		},
		allEncounters: function( state ) {
			return state.allEncounters
		},
		players: function( state ) {
			return state.players
		},
		npcs: function( state ) {
			return state.npcs
		},
		campaign: function( state ) {
			return state.campaign
		},
		campaigns: function( state ) {
			return state.campaigns
		},
		tier: function( state ) {
			return state.tier
		},
		overencumbered: function( state ) {
			return state.overencumbered
		},
		content_count: function( state ) {
			return state.content_count
		},
		

	},
	mutations: {
		SET_USER(state) {
			state.user = auth.currentUser;
		},
		SET_USERINFO(state, payload) {
			state.userInfo = payload;
		},
		SET_TIER(state, payload) {
			state.tier = payload;
		},
		setSlide(state, value) {
			if(state.slide.type != value.type) {
				state.slide = false
				setTimeout(() => state.slide = value, 100);
			}
			else {
				state.slide = false
			}
		},
		SET_PLAYERS(state, payload) {
			if (payload)
				state.players = payload
		},
		SET_NPCS(state, payload) {
			if (payload)
				state.npcs = payload
		},
		SET_CAMPAIGN(state, payload) {
			if (payload)
				state.campaign = payload
		},
		SET_CAMPAIGNS(state, payload) {
			if (payload)
				state.campaigns = payload
		},
		SET_ENCOUNTERS(state, payload) {
			if (payload)
				state.encounters = payload
		},
		SET_ALLENCOUNTERS(state, payload) {
			if (payload)
				state.allEncounters = payload
		},
		CHECK_ENCUMBRANCE(state) {
			let campaign_keys = Object.keys(state.allEncounters)
			let count = {}
			count.campaigns = campaign_keys.length
			count.players = Object.keys(state.players).length
			count.npcs = Object.keys(state.npcs).length
			count.encounters = 0
			for (let key in state.allEncounters) {
				let n = Object.keys(state.allEncounters[key]).length
				if (n > count.encounters) {
					count.encounters = n
				}
			}
			state.content_count = count
			let benefits = state.tier.benefits
			if (count.campaigns > benefits.campaigns ||
					count.encounters > benefits.encounters ||
					count.npcs > benefits.npcs ||
					count.players > benefits.players )
				state.overencumbered = true
			else
				state.overencumbered = false
		},
	},
	actions: {
		setUser({ commit }) {
			commit('SET_USER');
		},
		setUserInfo({ commit, state }) {
			let user = users_ref.child(state.user.uid)
			user.on('value', snapshot => {
				commit('SET_USERINFO', snapshot.val())
				
				//Fetch patron info with email
				let email = snapshot.val().email
				let patrons = db.ref('patrons').orderByChild('email').equalTo(email)

				patrons.on('value' , (snapshot) => {
					//Fetch tier info with patron info

					//PATRONS
					if(snapshot.val()) {
						let key = Object.keys(snapshot.val())[0]
						let tiers = db.ref(`tiers/${snapshot.val()[key].tier_id}`)
						tiers.on('value', (snapshot) => {
							commit('SET_TIER', snapshot.val())
							commit('CHECK_ENCUMBRANCE');
						})
					} else {
						//NO PATRON
						let tiers = db.ref(`tiers/basic`)
						tiers.on('value' , (snapshot) => {
							commit('SET_TIER', snapshot.val())
							commit('CHECK_ENCUMBRANCE');
						});
					}

				})

				
			});
		},
		setSlide({ commit }, value) {
			commit('setSlide', value);
		},
		setCampaignId({ commit }, value) {
			commit('SET_CAMPAIGN_ID', value)
		},
		setEncounterId({ commit }, value) {
			commit('SET_ENCOUNTER_ID', value)
		},
		fetchEncounter({ commit, state}, { cid, eid }) {
			commit("SET_CAMPAIGN_ID", cid)
			commit("SET_ENCOUNTER_ID", eid)
			const uid = state.user.uid;
			const path = `${uid}/${cid}/${eid}`;
			const encounter = encounters_ref.child(path);
			encounter.on('value', snapshot => {
				commit('SET_ENCOUNTER', snapshot.val())
			})
		},
		fetchEncounters({ commit, state }, { cid }) {
			const uid = state.user.uid
			const path = `${uid}/${cid}`;
			let encounters = encounters_ref.child(path)
			encounters.on('value', snapshot => {
				commit('SET_ENCOUNTERS', snapshot.val())
			})
		},
		fetchAllEncounters({ commit, state }) {
			const uid = state.user.uid
			let encounters = encounters_ref.child(uid)
			encounters.on('value', snapshot => {
				commit('SET_ALLENCOUNTERS', snapshot.val())
			})
		},
		fetchPlayers({ commit, state }) {
			const uid = state.user.uid
			const players = players_ref.child(uid)
			players.on('value', snapshot => {
				commit('SET_PLAYERS', snapshot.val())
			})
		},
		fetchNpcs({ commit, state }) {
			const uid = state.user.uid
			const npcs = npcs_ref.child(uid)
			npcs.on('value', snapshot => {
				commit('SET_NPCS', snapshot.val())
			})
		},
		fetchCampaign({ commit, state }, { cid }) {
			commit("SET_CAMPAIGN_ID", cid)
			
			const uid = state.user.uid;
			const path = `${uid}/${cid}`;
			const campaign = campaigns_ref.child(path);
			campaign.on('value', snapshot => {
				commit('SET_CAMPAIGN', snapshot.val())
			})
		},
		fetchCampaigns({ commit, state }) {
			const uid = state.user.uid
			let campaigns = campaigns_ref.child(uid)
			campaigns.on('value', snapshot => {
				commit('SET_CAMPAIGNS', snapshot.val())
			})
		},
	},
};