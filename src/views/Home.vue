<template>
	<div class="home" v-if="diceColors.length > 0" v-on:scroll="handleScroll">
		<section id="top">
			<Top />
			<span 
				class="die" 
				:style="{ 
					backgroundImage: 'url(' + require('@/assets/_img/logo/logo-icon-no-shield-' + diceColors[0] + '.svg') + ')',
					transform: `rotate(${scrolled}deg)`
				}">
			</span>
		</section>
		<section id="overview">
			<Overview />
			<span 
				class="die" 
				:style="{ 
					backgroundImage: 'url(' + require('@/assets/_img/logo/logo-icon-no-shield-' + diceColors[1] + '.svg') + ')',
					transform: `rotate(${scrolled}deg)`
				}">
			</span>
		</section>
		<section id="general">
			<General />
			<span 
				class="die" 
				:style="{ 
					backgroundImage: 'url(' + require('@/assets/_img/logo/logo-icon-no-shield-' + diceColors[2] + '.svg') + ')',
					transform: `rotate(${scrolled}deg)`
				}">
			</span>
		</section>
		<section id="builder">
			<Builder />
			<span 
				class="die" 
				:style="{ 
					backgroundImage: 'url(' + require('@/assets/_img/logo/logo-icon-no-shield-' + diceColors[3] + '.svg') + ')',
					transform: `rotate(${scrolled}deg)`
				}">
			</span>
		</section>
		<section id="share">
			<Share />
			<span 
				class="die" 
				:style="{ 
					backgroundImage: 'url(' + require('@/assets/_img/logo/logo-icon-no-shield-' + diceColors[4] + '.svg') + ')',
					transform: `rotate(${scrolled}deg)`
				}">
			</span>
		</section>
		<section id="campaign">
			<Campaign />
		</section>
		<Footer />
		<div class="patreon bg-black d-flex justify-content-end">
			Like what we do?
			<a href="https://www.patreon.com/join/harmlesskey" target="_blank" class="ml-2 btn bg-patreon-red"><i class="fab fa-patreon black"></i> Support us on Patreon</a>
		</div>
	</div>
</template>

<script>
	import Top from '@/components/home/Top.vue'
	import Overview from '@/components/home/Overview.vue'
	import General from '@/components/home/General.vue'
	import Share from '@/components/home/Share.vue'
	import Builder from '@/components/home/Builder.vue'
	import Campaign from '@/components/home/Campaign.vue'
	import Footer from '@/components/Footer.vue'

	export default {
		name: 'home',
		components: {
			Top,
			Overview,
			General,
			Share,
			Builder,
			Campaign,
			Footer
		},
		data() {
			return {
				scrolled: 0
			}
		},
		metaInfo: {
			title: 'Combat Tracker D&D | Harmless Key',
			meta: [
				{ vmid: 'description', name: 'description', content: 'Initiative tracker for D&D 5e. Our tool keeps track of everything in encounters so even during combat you can give your players the attention they deserve.' }
			]
		},
		computed: {
			diceColors() {
				let array = [
					'blue',
					'cyan',
					'green',
					'orange',
					'red',
					'yellow'
				];

				//Shuffle the array
				for(let i = array.length - 1; i > 0; i--){
					const j = Math.floor(Math.random() * i);
					const temp = array[i];
					array[i] = array[j];
					array[j] = temp;
				}
				return array;
			}
		},
		methods: {
			handleScroll(e) {
				this.scrolled = e.target.scrollTop;
			}
		}
	}
</script>

<style lang="scss" scoped>

.home {
	padding-bottom: 55px;
	overflow-y: scroll;
	height: 100vh;

	&::-webkit-scrollbar {
		display: none;
	}
	section {
		position: relative;
	}
	.die {
		left: 50%;
		margin-left: -50px;
		position: absolute;
		bottom: -50px;
		display: inline-block;
		width: 100px; 
		height: 100px;
		background-size: 100px;
		background-position: center;
		background-repeat: no-repeat;
		z-index: 99;
	}
	.patreon {
		position: fixed;
		bottom: 0;
		width: 100%;
		padding: 10px;
		height: 55px;
		line-height: 33px;
		z-index: 100;
	}
}


</style>