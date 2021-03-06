<template>
	<div class="content">
		<Crumble />

		<h1 v-if="campaign" class="mb-3 d-flex justify-content-between">
			{{ campaign.campaign }}
			<span @click="broadcast()" class="live" :class="{'active': broadcasting['.value'] == campaignId }">live</span>
		</h1>

		<OverEncumbered v-if="overencumbered" />

		<template v-else-if="tier">
			<b-row>
			<!-- SHOW ENCOUNTERS -->
			<b-col lg="7">
				<h2 class="d-flex justify-content-between">
					<span>
						<span>
						Encounters
						<span v-if="encounters">( 
							<span :class="{ 'green': true, 'red': Object.keys(encounters).length >= tier.benefits.encounters }">
								{{ Object.keys(encounters).length }}
							</span> / 
							<i v-if="tier.benefits.encounters == 'infinite'" class="far fa-infinity"></i>
							<template v-else>{{ tier.benefits.encounters }}</template>
						) </span>
					</span>
					</span>
					<a v-if="Object.keys(encounters).length < tier.benefits.encounters || tier.benefits.encounters == 'infinite'" v-b-tooltip.hover title="Add Encounter" @click="add = !add"><i class="fas fa-plus green"></i></a>
				</h2>

				<b-input-group v-if="add && (Object.keys(encounters).length < tier.benefits.encounters || tier.benefits.encounters == 'infinite')" class="mb-2">
					<b-form-input
						autocomplete="off" 
						type="text" 
						:class="{'input': true, 'error': errors.has('newEncounter') }"
						v-model="newEncounter"
						v-validate="'required'" 
						data-vv-as="New Encounter"
						name="newEncounter" 
						placeholder="Encounter Title"
						@change="addEncounter()"></b-form-input>
					<b-input-group-append>
						<button class="btn" @click="addEncounter()"><i class="fas fa-plus"></i> Add</button>
					</b-input-group-append>				
				</b-input-group>
				<p class="validate red" v-if="add && errors.has('newEncounter')">{{ errors.first('newEncounter') }}</p>

				<OutOfSlots 
					v-else-if="tier && Object.keys(encounters).length >= tier.benefits.encounters"
					type = 'encounters'
				/>

				<div class="first-encounter" v-if="Object.keys(encounters).length === 0">
					<h2>Create encounter</h2>
					<input type="text" 
						class="form-control" 
						autocomplete="off"
						v-model="newEncounter" 
						v-validate="'required'"
						data-vv-as="Encounter Title" 
						name="firstEncounter"
						placeholder="Encounter title"
					/>
					<p class="validate red" v-if="errors.has('firstEncounter')">{{ errors.first('firstEncounter') }}</p>
					
					<button class="btn btn-lg bg-green btn-block my-4" @click="addEncounter()">Create encounter</button>
				</div>

				<!-- ACTIVE ENCOUNTERS -->
				<hk-table
					class="mb-4"
					:items="_active"
					:columns="activeColumns"
				>
					<template slot="encounter" slot-scope="data">
						<router-link v-if="data.row.entities" :to="'/run-encounter/' + campaignId + '/' + data.row.key" v-b-tooltip.hover title="Run Encounter">
							{{ data.item }}
						</router-link>
						<template v-else>
							{{ data.item }}
						</template>
					</template>
					<template slot="entities" slot-scope="data">
						<router-link :to="'/encounters/' + campaignId + '/' + data.row.key" v-b-tooltip.hover title="Edit">
							<span class="gray-light" v-if="data.row.entities">
								{{ Object.keys(data.row.entities).length }}
							</span>
							<template v-else><i class="fas fa-plus"></i> Add</template>
						</router-link>
					</template>

					<span slot="status" slot-scope="data" v-if="data.row.round > 0" class="red">In progress</span>
					<template slot="turn" slot-scope="data">{{ data.row.turn + 1 }}</template>

					<template slot="actions" slot-scope="data">
						<div class="actions">
							<router-link v-if="data.row.entities" :to="'/run-encounter/' + campaignId + '/' + data.row.key" v-b-tooltip.hover title="Run Encounter">
								<i class="fas fa-play"></i>
							</router-link>
							<a v-else class="disabled">
								<i class="fas fa-play"></i>
							</a>
							<router-link class="mx-1 " :to="'/encounters/' + campaignId + '/' + data.row.key" v-b-tooltip.hover title="Edit">
								<i class="fas fa-pencil-alt"></i>
							</router-link>
							<a v-b-tooltip.hover title="Delete" @click="deleteEncounter(data.row.key,data.row.encounter)">
								<i class="fas fa-trash-alt"></i>
							</a>
						</div>
					</template>
				</hk-table>

				<!-- FINISHED ENCOUNTERS -->
				<template v-if="_finished != 0">
					<h2>Finished Encounters</h2>
					
					<hk-table
						class="mb-4"
						:items="_finished"
						:columns="finishedColumns"
						:perPage="6"
						:currentPage="currentPage"
					>
						<template slot="encounter" slot-scope="data">
							<router-link class="gray-light" :to="'/run-encounter/' + campaignId + '/' + data.row.key" v-b-tooltip.hover title="Run Encounter">
								{{ data.item }}
							</router-link>
						</template>

						<template slot="actions" slot-scope="data">
							<div class="actions">
								<router-link v-b-tooltip.hover title="View" :to="'/run-encounter/' + campaignId + '/' + data.row.key"><i class="fas fa-eye"></i></router-link>
								<a v-b-tooltip.hover title="Unfinish" @click="reset(data.row.key, hard=false)"><i class="fas fa-trash-restore-alt"></i></a>
								<a v-b-tooltip.hover title="Reset" @click="reset(data.row.key)"><i class="fas fa-undo"></i></a>
								<a v-b-tooltip.hover title="Delete" class="ml-2" @click="deleteEncounter(data.row.key, data.row.encounter)"><i class="fas fa-trash-alt"></i></a>
							</div>
						</template>
					</hk-table>

				</template>
				
				<div v-if="encounters === undefined" class="loader"><span>Loading encounters...</span></div>
			</b-col>

				<!-- PLAYERS -->
				<b-col lg="5">
					<h2>Players</h2>
					<Players :userId="user.uid" :campaignId="campaignId" />
				</b-col>
			</b-row>
		</template>
	</div>
</template>

<script>
	import _ from 'lodash'
	import OverEncumbered from '@/components/OverEncumbered.vue';
	import OutOfSlots from '@/components/OutOfSlots.vue';
	import Crumble from '@/components/crumble/MyContent.vue';
	import PlayerLink from '@/components/PlayerLink.vue';
	import Players from '@/components/campaign/Players.vue';

	import { mapGetters, mapActions } from 'vuex'
	import { db } from '@/firebase'

	export default {
		name: 'EditCampaign',
		metaInfo: {
			title: 'Encounters'
		},
		components: {
			Crumble,
			PlayerLink,
			OverEncumbered,
			OutOfSlots,
			Players
		},
		data() {
			return {
				user: this.$store.getters.getUser,
				campaignId: this.$route.params.campid,
				newEncounter: '',
				copy: window.location.host + '/track-encounter/' + this.$store.getters.getUser.uid,
				add: false,
				currentPage: 1,
				collapsed: false,
				activeColumns: {
					encounter: {
						label: 'Encounter',
						maxContent: true,
						sortable: true
					},
					entities: {
						label: 'Entities',
						center: true
					},
					status: {
						label: 'Status',
						truncate: true,
						hide: 'sm'
					},
					round: {
						label: 'Round',
						center: true,
						truncate: true,
						hide: 'md'
					},
					turn: {
						label: 'Turn',
						center: true,
						truncate: true,
						hide: 'md'
					},
                    actions: {
						label: '<i class="far fa-ellipsis-h"></i>',
						noPadding: true,
						right: true
                    }
				},
				finishedColumns: {
					encounter: {
						label: 'Encounter',
					},
					actions: {
						label: '<i class="far fa-ellipsis-h"></i>',
						noPadding: true,
						right: true
                    }
				}
			}
		},
		firebase() {
			return {
				broadcasting: {
					source: db.ref(`broadcast/${this.user.uid}/live`),
					asObject: true
				}
			}
		},
		mounted() {
			this.fetchEncounters({
				cid: this.campaignId, 
			}),
			this.fetchCampaign({
				cid: this.campaignId, 
			}),
			this.setCurHp();
			this.removeGhostPlayers();
		},
		computed: {
			...mapGetters([
				'tier',
				'encounters',
				'overencumbered',
				'content_count',
				'campaign',
				'players',
				'playerInCampaign',
				'side_collapsed',
			]),
			_active: function() {
				return _.chain(this.encounters)
				.filter(function(encounter, key) {
					encounter.key = key
					return encounter.finished == false;
				})
				.orderBy(function(encounter){
					if (encounter.order == undefined) {
						encounter.order = 0
					}
					return parseInt(encounter.timestamp)
				} , 'asc')
				.value()
			},
			_finished: function() {
				return _.chain(this.encounters)
				.filter(function(encounter, key) {
					encounter.key = key
					return encounter.finished == true;
				})
				.orderBy(function(encounter){
					return parseInt(encounter.timestamp)
				} , 'asc')
				.value()
			},
			noCurHp() {
				//Checks if all players have their curHp set
				//If not, it is set on mounted
				let check = false;
				if(this.campaign) {
					for(var key in this.campaign.players) {
						if(this.campaign.players[key].curHp == undefined) {
							check = true;
						}
					}
				}
				return check;
			}
		},
		watch: {
			campaign() {
				this.checkAdvancement();
			}
		},
		methods: {
			...mapActions([
				'fetchEncounters',
				'fetchCampaign',
			]),
			addEncounter() {
				this.$validator.validateAll().then((result) => {
					if (result && (Object.keys(this.encounters).length < this.tier.benefits.encounters || this.tier.benefits.encounters == 'infinite')) {
						db.ref('encounters/' + this.user.uid + '/' + this.campaignId).push({
							encounter: this.newEncounter, 
							round: 0, 
							turn: 0, 
							finished: false,
							timestamp: Date.now()
						});
						this.newEncounter = '';
						this.$snotify.success('Encounter added.', 'Critical hit!', {
							position: "rightTop"
						});
						this.$validator.reset();
						this.add = false;
					} 
					else {
						//console.log('Not valid');
					}
				})
			},
			deleteEncounter(key, encounter) {
				this.$snotify.error('Are you sure you want to delete "' + encounter + '"?', 'Delete encounter', {
					timeout: 5000,
					buttons: [
					{
						text: 'Yes', action: (toast) => { 
							db.ref('encounters/' + this.user.uid + '/' + this.campaignId).child(key).remove(); 
							this.$snotify.remove(toast.id); 
						}, bold: false 
					},
					{
						text: 'No', action: (toast) => { 
							this.$snotify.remove(toast.id); 
						}, 
						bold: false },
					]
				});
			},
			reset(id, hard=true) {
				if (hard){
					for(let key in this.encounters[id].entities) {
						let entity = this.encounters[id].entities[key]

						//Remove values
						delete entity.tempHp
						delete entity.transformed
						delete entity.stabilized
						delete entity.down
						delete entity.ac_bonus
						delete entity.meters
						delete entity.hidden

						if(entity.entityType == 'npc') {
							entity.curHp = entity.maxHp
						}
						entity.initiative = 0;


						db.ref(`encounters/${this.user.uid}/${this.campaignId}/${id}/entities/${key}`).set(entity);

						//CLEAR LOG
						localStorage.removeItem(id);
					}
					db.ref(`encounters/${this.user.uid}/${this.campaignId}/${id}/xp_awarded`).remove();
					db.ref(`encounters/${this.user.uid}/${this.campaignId}/${id}/currency_awarded`).remove();
					db.ref(`encounters/${this.user.uid}/${this.campaignId}/${id}/turn`).set(0);
					db.ref(`encounters/${this.user.uid}/${this.campaignId}/${id}/round`).set(0);
				}

				db.ref(`encounters/${this.user.uid}/${this.campaignId}/${id}/finished`).set(false);

			},
			broadcast() {
				//Save this is the current campaign that is being broadcasted

				if(this.broadcasting['.value'] == this.campaignId) {
					db.ref(`broadcast/${this.user.uid}/live`).remove()
				} else {
					db.ref(`broadcast/${this.user.uid}/live`).set(this.campaignId)
				}
			},
			setCurHp() {
				if(this.noCurHp) {
					//Stores player with curHp under campaign
					for(var key in this.campaign.players) {
						if(this.campaign.players[key].curHp === undefined) {
							db.ref(`campaigns/${this.user.uid}/${this.campaignId}/players/${key}`).update({
								curHp: this.players[key].maxHp
							});
						}
					}
					this.noCurHp = false;
				}
			},
			checkAdvancement() {
				if(!this.campaign.advancement) {
					this.$snotify.warning('Are you using Experience or Milestone as advancment for this campaign?' ,'Set advancement', {
						timeout: 0,
						buttons: [
						{
							text: 'Experience', action: (toast) => { 
								db.ref(`campaigns/${this.user.uid}/${this.campaignId}/advancement`).set('experience'); 
								this.$snotify.remove(toast.id); 
							}, bold: false 
						},
						{
							text: 'Milestone', action: (toast) => { 
								db.ref(`campaigns/${this.user.uid}/${this.campaignId}/advancement`).set('milestone');
								this.$snotify.remove(toast.id); 
							}, 
							bold: false },
						]
					});
				}
			},
			removeGhostPlayers() {
				const players = Object.keys(this.players);
				for(let key in this.campaign.players) {
					if(!players.includes(key)) {
						// eslint-disable-next-line
						console.error('Ghost Player Removed: ', key);
						db.ref(`campaigns/${this.user.uid}/${this.campaignId}/players/${key}`).remove();
					}
				}
			}
		}
	}
</script>

<style lang="scss" scoped>
.container-fluid {
	padding: 20px;
	
	.first-encounter {
		h2 {
			margin-top: 50px;
			text-transform: none;
			text-align: center;
			font-size: 30px;
		}
		.form-control {
			text-align: center;
			height: 50px;
			font-size: 20px;
		}
	}
	.loader {
		margin-top: 20px;
	}
	.live {
		cursor: pointer;
	}
	.copy {
		word-wrap: break-word;
	}
	.broadcast {
		cursor: pointer;
		margin: 20px 0;
		padding: 20px;

		&.bg-green {
			color: #fff;
			animation: blink normal 3s infinite ease-in-out;
		}
		h3 {
			margin-bottom: 5px;
		}
	}
}

.actions {
	a.disabled {
		color: #494747 !important;
		cursor: default !important;
		&:hover {
			background-color: transparent;
		}
	}
}

</style>