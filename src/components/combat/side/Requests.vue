<template>
	<div>
		<h2>Player requests</h2>
		<transition-group 
			tag="ul" 
			class="requests"
			name="requests" 
			enter-active-class="animated fadeInDown" 
			leave-active-class="animated fadeOutRight"
		>
			<li v-for="(request, i) in _requests" class="request" :key="`request-${request.key}`">
				<Request :request="request" :i="i" />
			</li>
		</transition-group>
	</div>
</template>

<script>
	import _ from 'lodash';
	import { mapGetters } from 'vuex';
	import Request from '@/components/combat/side/RequestItem.vue';

	export default {
		name: 'Requests',
		components: {
			Request
		},
		data() {
			return {

			}
		},
		computed: {
			...mapGetters([
				'encounter'
			]),
			_requests() {
				return _.chain(this.encounter.requests)
					.filter(function(request, key) {
						request.key = key
						return request;
					})
					.orderBy(function(request) {
						return parseInt(request.timestamp)
					} , 'desc')
					.value()
			},
		}
	}
</script>

<style lang="scss" scoped>
	ul.requests {
		padding: 0 5px 0 0;
		list-style: none;

		li.request {
			padding:10px 3px;
			border-bottom: solid 1px #494747;
		}
	}
	.fadeInDown, .fadeOutRight {
		animation-duration: 0.5s !important;
		animation-delay: .2s;
	}
</style>
