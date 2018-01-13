'use strict';

(function($) {
	$(document).ready(function() {

		var ARRAY_WIDTH = 6;
		var ARRAY_HEIGHT = 6;
		var MIN_ITEM_VALUE = 0;
		var MAX_ITEM_VALUE = 4;
		var INITIAL_DROPS_COUNTER = 10;
		var DROP_POP_DELAY = 1000;

		Vue.use(Vuex);

		var store = new Vuex.Store({
			state: {
				itemsArray: [],
				directions: [
					{ top: 0, left: -1 },
					{ top: -1, left: 0 },
					{ top: 0, left: 1 },
					{ top: 1, left: 0 },
					// { top: -1, left: -1 },
					// { top: 1, left: 1 }
				],
				dropsCount: 0,
				gameStarted: false
			},
			mutations: {
				GENERATE_ITEMS_ARRAY: function (state, options) {
					var itemsArray = [];

					for (var i = 0; i < ARRAY_HEIGHT; i++) {
						var itemsRow = [];
						for (var j = 0; j < ARRAY_WIDTH; j++) {
							var col = {
								value: Math.floor(Math.random() * (MAX_ITEM_VALUE - MIN_ITEM_VALUE + 1)) + MIN_ITEM_VALUE,
								row: i,
								col: j
							};
							itemsRow.push(col);
						}
						itemsArray.push(itemsRow);
					}

					state.itemsArray = itemsArray;
				},

				INCREASE_ITEM: function(state, options) {
					var { row, col } = options;

					state.itemsArray[row][col].value++;
				}
			},
			actions: {
				startNewGame: function (context, options) {
					context.commit('GENERATE_ITEMS_ARRAY');
					context.state.dropsCount = INITIAL_DROPS_COUNTER;
					context.state.gameStarted = true;
				},

				makeUserMove: function(context, options) {
					var { row, col, addBonusDrop } = options;

					context.state.dropsCount--;
					this.commit('INCREASE_ITEM', { row: options.row, col: options.col, addBonusDrop: false });

					if (context.state.itemsArray[row][col].value > MAX_ITEM_VALUE) {
						context.state.itemsArray[row][col].value = MIN_ITEM_VALUE;

						this.dispatch('emitAllDrops', { row:row, col: col, addBonusDrop: true });
					}
				},

				emitAllDrops: function(context, options) {
					setTimeout(function () {
						var { row, col, addBonusDrop } = options;

						if (addBonusDrop === true) {
							context.state.dropsCount++;
						}

						context.state.directions.forEach(function(direction) {
							context.dispatch('emitSingleDrop', { row: row, col: col, offset: direction } );
						});
					}, DROP_POP_DELAY);
				},

				emitSingleDrop: function (context, options) {
					var row = options.row + options.offset.top;
					var col = options.col + options.offset.left;

					if (!context.state.itemsArray[row] || !context.state.itemsArray[row][col]) {
						return;
					}

					if (context.state.itemsArray[row][col].value === 0) {
						var newTop;
						var newLeft;

						if (options.offset.top === 0) {
							newTop = options.offset.top;
						} else if (options.offset.top < 0) {
							newTop = options.offset.top - 1
						} else {
							newTop = options.offset.top + 1
						}

						if (options.offset.left === 0) {
							newLeft = options.offset.left;
						} else if (options.offset.left < 0) {
							newLeft = options.offset.left - 1
						} else {
							newLeft = options.offset.left + 1
						}
						
						setTimeout(function () {
							context.dispatch('emitSingleDrop', {
								row: options.row,
								col: options.col,
								offset: {
									top: newTop,
									left: newLeft
								}
							})
						}, 1000);
						return;
					}

					context.commit('INCREASE_ITEM', { row: row, col: col });

					if (context.state.itemsArray[row][col].value > MAX_ITEM_VALUE) {
						context.state.itemsArray[row][col].value = MIN_ITEM_VALUE;

						this.dispatch('emitAllDrops', { row:row, col: col, addBonusDrop: true });
					}
				}
			}
		});

		var item = {
			template: '<div class="item" v-bind:value="item.value" v-bind:data-row="item.row" v-bind:data-col="item.col" v-on:click.prevent="onClick">{{ theValue }}</div>',
			props: [ 'item' ],
			computed: {
				theValue: function () {
					return this.$store.state.itemsArray[this.$props.item.row][this.$props.item.col].value
				}
			},
			methods: {
				onClick: function(event) {
					var row = +event.target.getAttribute('data-row');
					var col = +event.target.getAttribute('data-col');

					this.$store.dispatch('makeUserMove', { row: row, col: col })
				}
			}
		};

		var dropsCounter = {
			template: '<div class="drops-counter">{{ dropsCount }}</div>',
			computed: {
				dropsCount: function () {
					return this.$store.state.dropsCount
				}
			}
		};

		var helloScreen = {
			template: '<div class="hello-screen">Hello World!<br><br><a href="#" v-on:click.prevent="onClick">Start Game</a></div>',
			methods: {
				onClick: function () {
					this.$store.dispatch('startNewGame');
				}
			},
		};

		var youLost = {
			template: '<div class="you-lost">Game Over<br><br><a href="#" v-on:click.prevent="onClick">Restart</a><div>',
			methods: {
				onClick: function () {
					this.$store.dispatch('startNewGame');
				}
			},
		};

		var youWin = {
			template: '<div class="you-win">You Win<br>Congratulations!<br><br><a href="#" v-on:click.prevent="onClick">Restart</a><div>',
			methods: {
				onClick: function () {
					this.$store.dispatch('startNewGame');
				}
			},
		};

		var playground = {
			template: '<div class="playground-box"><template v-for="itemRow in itemsArray"><item v-for="item in itemRow" v-bind:item="item"></item><br class="clear"></template>{{ itemsArray }}</div>',
			components: {
				item: item,
			},
			computed: {
				itemsArray: function() {
					return this.$store.state.itemsArray
				}
			}
		};

		var app = new Vue({
			el: '#root',

			store: store,

			components: {
				helloScreen: helloScreen,
				dropsCounter: dropsCounter,
				playground: playground,
				youLost: youLost,
				youWin: youWin
			},

			computed: {
				youLost: function() {
					return store.state.gameStarted && (store.state.dropsCount === 0);
				},
				youWin: function() {
					return store.state.gameStarted && this.isArrayEmpty();
				},
				gameStarted: function() {
					return store.state.gameStarted;
				}
			},

			methods: {
				isArrayEmpty: function () {
					for (var i = 0; i < ARRAY_HEIGHT; i++) {
						for (var j = 0; j < ARRAY_WIDTH; j++) {
							if (store.state.itemsArray[i][j].value > 0) {
								return false;
							}
						}
					}

					return true;
				}
			}
		});

	});
	$(window).on('load', function() {

	});
})(jQuery);