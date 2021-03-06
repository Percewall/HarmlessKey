<template>
	<div>
		<div v-if="overencumbered" class='content' style="display: block;">
			<OverEncumbered/>
		</div>
		<div class="content" v-else>
			<div class="info mb-3">
				<Crumble />

				<router-link to="/campaigns"><i class="fas fa-arrow-left"></i> Back</router-link>

				<h2 class="mt-3">Edit your campaign</h2>
				<b-row class="mt-3">
					<b-col class="mb-2">
						<input class="form-control" 
							autocomplete="off"
							v-validate="'required'" 
							data-vv-as="Encounter Name" 
							type="text" name="name" 
							v-model="campaign.campaign"/>
						<p class="validate red" v-if="errors.has('name')">{{ errors.first('name') }}</p>

						<input class="form-control mt-2"
							autocomplete="off" 
							v-validate="'url'" type="text" 
							name="backbround" 
							data-vv-as="Background"
							v-model="campaign.background" 
							placeholder="Background URL"/>
						<p class="validate red" v-if="errors.has('background')">{{ errors.first('background') }}</p>

						<el-switch
							class="mt-2"
							v-model="campaign.advancement"
							active-color="#2c97de"
							inactive-color="#2c97de"
							active-value="milestone"
							inactive-value="experience"
							active-text="Milestone"
							inactive-text="Experience">
						</el-switch>

						<div class="mt-3 gray-hover pointer" @click="setPrivate(!campaign.private)">
							<span :class="{ 'green': !campaign.private }">
								<i class="fas fa-eye"></i>
								Public
							</span>
							/
							<span :class="{ 'red': campaign.private }">
								<i class="fas fa-eye-slash"></i>
								Private
							</span>
						</div>

						<button class="btn mt-3" @click="edit()">Save</button>
					</b-col>
					<b-col sm="3" v-if="campaign.background">
						<div class="img-container"><img :src="campaign.background" /></div>
					</b-col>
				</b-row>
			</div>
			
			<h2>Add players</h2>
			<b-row>
				<b-col md="6">
					<b-card header="All Players">
						<ul class="entities hasImg" v-if="players && campaign">
							<li v-for="(player, key) in players" 
							:key="key" 
							class="d-flex justify-content-between">
								<div class="d-flex justify-content-left">
									<span v-if="player.avatar" class="img" :style="{ backgroundImage: 'url(\'' + player.avatar + '\')' }"></span>
									<span v-else class="img"><img src="@/assets/_img/styles/player.svg" /></span>
									{{ player.character_name }}
								</div>
								
								<span v-if="inOtherCampaign(key)">
									<span class="d-none d-md-inline ml-1 gray-hover"><small>Different Campaign</small></span>
									<i class="ml-3 far fa-ellipsis-v ml-3 d-inline d-sm-none"></i>
								</span>

								<span v-else-if="checkPlayer(key) >= 0">
									<i class="fas fa-check"></i>
									<span class="d-none d-md-inline ml-1 gray-hover"><small>Added</small></span>
								</span>

								<div v-else class="actions bg-gray">
									<a class="gray-hover"
									v-b-tooltip.hover 
									title="Add Character" 
									@click="addPlayer(key)">
										<i class="fas fa-plus"></i>
									</a>
								</div>
								
							</li>
						</ul>
						<div v-else class="loader"><span>Loading Players...</span></div>
					</b-card>
				</b-col>

				<b-col md="6">
					<b-card header="Players in Campaign">
						<template v-if="players && campaign">
							<ul class="entities hasImg" v-if="campaign.players">
								<li v-for="(player, key) in campaign.players" :key="key" class="d-flex justify-content-between">
									<div class="d-flex justify-content-left" :class="{ 'red': inOtherCampaign(key) }">
										<span v-if="players[key].avatar" class="img" :style="{ backgroundImage: 'url(\''+ players[key].avatar + '\')' }"></span>
										<span v-else class="img"><img src="@/assets/_img/styles/player.svg" /></span>
										{{ players[key].character_name }}
										<span v-if="inOtherCampaign(key)" class="d-none d-md-inline ml-1 gray-hover"><small>Different Campaign</small></span>
									</div>
									
									<div class="actions bg-gray">
										<a class="gray-hover" v-b-tooltip.hover title="Remove Character" @click="removePlayer(key)">
											<i class="fas fa-minus"></i>
										</a>
									</div>
									<i class="ml-3 far fa-ellipsis-v ml-3 d-inline d-sm-none"></i>
								</li>
							</ul>
						</template>
						<div v-else class="loader"><span>Loading Players...</span></div>
					</b-card>
				</b-col>
			</b-row>
		</div>
	</div>
</template>

<script>
	import Crumble from '@/components/crumble/MyContent.vue'
	import OverEncumbered from '@/components/OverEncumbered.vue'
	import { mapGetters, mapActions } from 'vuex'
	import { db } from '@/firebase'

	export default {
		name: 'EditCampaign',
		metaInfo: {
			title: 'Campaigns'
		},
		components: {
			Crumble,
			OverEncumbered,
		},
		data() {
			return {
				user: this.$store.getters.getUser,
				campaignId: this.$route.params.campid,
				newCampaign: ''
			}
		},
		computed: {
			...mapGetters([
				'campaigns',
				'campaign',
				'players',
				'npcs',
				'playerInCampaign',
				'allEncounters',
				'overencumbered'
			]),

		},
		mounted() {
			this.fetchCampaign({
				cid: this.campaignId, 
			});
			this.fetchNpcs();
		},
		methods: {
			...mapActions([
				'fetchCampaign',
				'fetchNpcs',
			]),
			edit() {
				this.$validator.validateAll().then((result) => {
					if (result) {
						db.ref(`campaigns/${this.user.uid}/${this.campaignId}`).update(
							this.campaign
						);
						this.$snotify.success('Name changed.', 'Critical hit!', {
							position: "rightTop"
						});
					}
				})
			},
			addPlayer(id) {
				db.ref(`campaigns/${this.user.uid}/${this.campaignId}/players`).child(id).set({
					curHp: this.players[id].maxHp
				});
				db.ref(`players/${this.user.uid}/${id}`).update({campaign_id: this.campaignId});
				if (this.players[id].companions !== undefined) {
					for (let key in this.players[id].companions) {
						
						db.ref(`campaigns/${this.user.uid}/${this.campaignId}/companions`).child(key).set({
							curHp: this.npcs[key].maxHp,
						})
					}
				}
			},
			removePlayer(playerId) {
				// Get companions of player
				let companions = this.players[playerId].companions;

				//First remove player from all encounters
				for(let encounterId in this.allEncounters[this.campaignId]) {
					//Remove player from encouner
					db.ref(`encounters/${this.user.uid}/${this.campaignId}/${encounterId}/entities`).child(playerId).remove();
					if (companions !== undefined) {					
						for (let companionId of Object.keys(companions)) {
							db.ref(`encounters/${this.user.uid}/${this.campaignId}/${encounterId}/entities`).child(companionId).remove();
						}
					}
				}

				//Then remove from campaign
				db.ref(`campaigns/${this.user.uid}/${this.campaignId}/players`).child(playerId).remove();
				if (companions !== undefined) {
					for (let companionId of Object.keys(companions)) {
						db.ref(`campaigns/${this.user.uid}/${this.campaignId}/companions`).child(companionId).remove();
					}
				}
				if (this.players[playerId].campaign_id == this.campaignId) {
					db.ref(`players/${this.user.uid}/${playerId}/campaign_id`).remove();
				}
			},
			checkPlayer(playerId) {
				if (this.campaign.players === undefined)
					return -1

				return (Object.keys(this.campaign.players).indexOf(playerId));
			},
			inOtherCampaign(playerId) {
				if (this.campaigns[this.players[playerId].campaign_id] === undefined) {
					this.players[playerId].campaign_id = undefined;
				}
				return (this.players[playerId].campaign_id !== undefined && this.players[playerId].campaign_id !== this.campaignId)
			},
			setPrivate(value) {
				//Has to be removed on false
				if(value === false) {
					db.ref(`campaigns/${this.user.uid}/${this.campaignId}/private`).remove();
				} else {
					db.ref(`campaigns/${this.user.uid}/${this.campaignId}/private`).set(value);
				}
			}
		}
	}
</script>

<style lang="scss" scoped>
	.img-container {
		width: 100%;

		img {
			width: 100%;
		}
	}
	.nav { 
		background:#191919;
	}
	#add {
		padding: 15px 10px;
		grid-area: add;
	}
	.tab-content {
		padding:15px 10px;
	}
	#added {
		padding: 15px 10px;
		grid-area:added;
	}
	.monster {
		padding:15px;
		position:fixed;
		right:0;
		top:80px;
		height: calc(100vh - 80px);
		width:330px;
		z-index:99;
		overflow: scroll;
		border-left:solid 1px #000;
		box-shadow: 0 10px 8px #000;
	}

	.slideInRight {
		transition-duration: 0.1s;
	}

	.slideOutRight {
		transition-duration: 0.1s;
	}
	.faded {
		opacity: .3;
	}
</style>