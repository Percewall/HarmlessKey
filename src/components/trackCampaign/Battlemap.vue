<template>
  <div class="battlemap">
    <div class="side">
    <Initiative 
        :encounter="encounter" 
        :targets="targets"
        :allEntities="allEntities"
        :turn="turn"
        :campPlayers="campPlayers"
      />
    </div>
    <div
      class="grid" 
      :style="{ 
        'grid-template-rows': `repeat(${gridRows}, ${size}px)`,
        'background-image': 'url(https://images-wixmp-ed30a86b8c4ca887773594c2.wixmp.com/f/cb13c300-5dbd-4437-9498-98bd1147fb3c/da9gd0m-01386171-68d2-4ab4-aca2-e3f1bbd6de1d.png?token=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ1cm46YXBwOjdlMGQxODg5ODIyNjQzNzNhNWYwZDQxNWVhMGQyNmUwIiwiaXNzIjoidXJuOmFwcDo3ZTBkMTg4OTgyMjY0MzczYTVmMGQ0MTVlYTBkMjZlMCIsIm9iaiI6W1t7InBhdGgiOiJcL2ZcL2NiMTNjMzAwLTVkYmQtNDQzNy05NDk4LTk4YmQxMTQ3ZmIzY1wvZGE5Z2QwbS0wMTM4NjE3MS02OGQyLTRhYjQtYWNhMi1lM2YxYmJkNmRlMWQucG5nIn1dXSwiYXVkIjpbInVybjpzZXJ2aWNlOmZpbGUuZG93bmxvYWQiXX0.knUBWEsVCGhia_CQW6ftXbqCH51uMDA0dXVjENeqX5w)'
      }">
        <div 
          class="grid-row" 
          v-for="row_i in gridRows" 
          :key="`row-${row_i}`" 
          :style="{ 'grid-template-columns': `repeat(${gridColumns}, ${size}px)` }"
        >
          <div class="grid-column" v-for="col_i in gridColumns" :key="`col-${col_i}`">
            {{ row_i }}-{{ col_i }}
          </div>
        </div>
    </div>
  </div>
</template>

<script>
import Initiative from '@/components/trackCampaign/InitiativeSmall.vue';

export default {
  name: "battlemap",
  components: {
    Initiative
  },
  props: {
    encounter: {
      type: Object
    },
    targets: {
      type: Array
    },
    allEntities: {
      type: Array
    },
    turn: {
      type: Number
    },
    campPlayers: {
      type: Object
    }
  },
  data() {
    return {
      size: 80
    }
  },
  computed: {
    gridColumns() {
      return this.encounter.battlemap.grid.x;
    },
    gridRows() {
      return this.encounter.battlemap.grid.y;
    },
    gridTotal() {
      return this.encounter.battlemap.grid.x * this.encounter.battlemap.grid.y;
    }
  }
}
</script>

<style lang="scss" scoped>
.battlemap {
  height: calc(100vh - 50px);
  overflow: scroll;
  background: #191919;
  position: relative;
  user-select: none;

  .grid {
    background-position: left top;
    background-repeat: no-repeat;
    display: grid;

    .grid-row {
      display: grid;
      border-bottom: solid 1px #b2b2b2;

      .grid-column {
        border-right: solid 1px #b2b2b2;
        
        &:hover {
          box-shadow: inset 0 0 10px #b2b2b2
          ;
        }
      }
    }
  }
  .side {
    width: 300px;
    padding: 10px;
    box-shadow: 0 0 10px #000;
    background: #262626;
    position: fixed;
    left: 20px;
    top: 70px;
  }
}
</style>