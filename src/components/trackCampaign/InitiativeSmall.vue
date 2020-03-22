<template>
	<div v-if="targets && allEntities && players && campPlayers" class="initiative">
		<template v-for="(entity, index) in targets">
			<div v-if="allEntities[0].key == entity.key && turn > 0 " :key="`top-${index}`" class="top">
				Top of the round
			</div>
			<template>
				<!-- IMAGE -->
				<div class="img" :style="{ backgroundImage: 'url(\'' + img(entity) + '\')' }" :key="`image-${index}`"></div>

				<!-- NAME -->
				<div class="name" :key="`name-${index}`">
					<template v-if="entity.entityType === 'npc'">
						<template v-if="displayNPCField('name', entity)">
							{{ entity.name }}
						</template>
						<template v-else> ? ? ? </template>
					</template>
					<template v-else>{{ players[entity.key].character_name }}</template>
				</div>
			</template>
		</template>
	</div>
</template>

<script>
	import { db } from '@/firebase'
	import { general } from '@/mixins/general.js'

	import Health from '@/components/trackCampaign/Health.vue'

	export default {
		name: 'app',
		mixins: [general],
		components: {
			Health,
		},
		props: [
			'encounter',
			'targets',
			'allEntities',
			'turn',
			'campPlayers',
		],
		data() {
			return {
				userId: this.$route.params.userid,
				windowWidth: 0,
			}
		},
		firebase() {
			return {
				players: {
					source: db.ref(`players/${this.userId}`),
					asObject: true,
				},
				npcs: {
					source: db.ref(`npcs/${this.userId}`),
					asObject: true,
				},
				npcSettings: {
					source: db.ref(`settings/${this.userId}/track/npc`),
					asObject: true,
				},
				playerSettings: {
					source: db.ref(`settings/${this.userId}/track/player`),
					asObject: true,
				},
				conditions: {
					source: db.ref('conditions'),
					asObject: true,
				},
			}
		},
		mounted() {
			//For a responsive window size
			//in the html we bind a class based on that
			this.$nextTick(function() {
				window.addEventListener('resize', this.getWindowWidth);

				//Init
				this.getWindowWidth()
			})
		},
		methods: {
			getWindowWidth() {
				//Return the window width
				//used in the html to bind a class for small tables
        this.windowWidth = document.documentElement.clientWidth;
      },
			displayAc(entity) {
				var stats = {}
				var key = entity.key

				if(entity.transformed) {
						stats.ac = parseInt(entity.transformed.ac);
						stats.bonus = (entity.entityType == 'player') ? parseInt(this.campPlayers[key].ac_bonus) : parseInt(entity.ac_bonus);
				}
				else {
						if(entity.entityType == 'player') {
							stats = {
								ac: parseInt(this.players[key].ac),
								bonus: parseInt(this.campPlayers[key].ac_bonus),
							}
						} else {
							stats = {
								ac: parseInt(entity.ac),
								bonus: parseInt(entity.ac_bonus),
							}
						}
				}
				return stats
			},
			img(entity) {
				//Check what image should be displayed
				let encounterImg = entity.avatar; //img linked within the encounter

				if(encounterImg) {
					var img = encounterImg;
				} else {
					if(entity.id) {
						if(entity.entityType == 'player') {
							let playerImg = this.players[entity.id].avatar;

							if(playerImg) {
								img = playerImg
							} else {
								img = require('@/assets/_img/styles/player.svg');
							}
						}
						if(entity.entityType == 'npc') {						
							if(entity.npc == 'custom') {
								let npcImg = this.npcs[entity.id].avatar;

								img = (npcImg) ? npcImg : require('@/assets/_img/styles/monster.svg');
							} else {
								img = require('@/assets/_img/styles/monster.svg');
							}
						}
					} else {
						img = require('@/assets/_img/styles/monster.svg');
					}
				}
				return img
			},
			displayNPCField(field, entity) {
				const defaults = {name: true, health: false, ac: false};
				if (entity.settings && entity.settings[field] !== undefined) 
					return entity.settings[field];

				else if (this.npcSettings[field] == undefined)
					return defaults[field]; // Default value

				else 
					return this.npcSettings[field];
			}
		},
		beforeDestroy() {
			window.removeEventListener('resize', this.getWindowWidth);
		}
	}
</script>

<style lang="scss" scoped>
	.initiative {
		display: grid;
		grid-template-columns: 30px 1fr;
		grid-auto-rows: 30px;
		grid-row-gap: 2px;

		.top {
			text-align: center;
			border-bottom: solid 1px #fff;
			grid-column: span 2;
		}
		.img {
			background: #191919;
			width: 30px;
			height: 30px;
		}
		.name {
			padding: 5px;
		}
	}

	.table {
		border-collapse: separate; 
		border-spacing: 0 5px;

		tr:first-child {
			td {
				border-top: solid 1px #2c97de !important;
				border-bottom: solid 1px #2c97de !important;
			}
			td:first-child {
				border-left: solid 1px #2c97de !important;
			}
			td:last-child {
				border-right: solid 1px #2c97de !important;
			}
		}
		tr.top {
			td {
				font-size: 12px;
				padding: 10px 0 5px 0;
				border: none !important;
				border-bottom: solid 1px #fff !important;
			}
		}
		tr {
			td {
				background: rgba(38, 38, 38, .9);
			}
			td.ac, th.ac {
				width: 30px;
				text-align: center;
			}
			td.ac {
				font-weight: bold;
			}
			td.name {
				overflow: hidden;
				white-space: nowrap;
				text-overflow: ellipsis;
				max-width:0;
			}
			td.img {
				width: 45px;
				background-size: cover;
				background-position: center top;

				@media only screen and (max-width: 575px) {
					height: 32px;
					width: 32px;
				}
			}
		}
		tr td:first-child, thead th {
			color: #fff;
			background: none;
			text-shadow: 0 0 3px  #000;
		}
		tr td:first-child, thead th:first-child {
			text-align: center;
		}
	}
	.conditions {
		padding: 9px 10px;

		svg, .n {
			width: 24px;
			height: 24px;
			line-height: 20px;
			fill: #cc3e4a;
			padding: 2px;
			margin: 0;
			display: block;
			font-size: 16px;
			text-align: center;
			color: #cc3e4a;
		}
	}
	.entities-move {
		transition: transform .6s;
	}
</style>
