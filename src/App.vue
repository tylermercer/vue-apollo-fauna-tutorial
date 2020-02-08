<template>
  <div class="app">
    <h1>Notes</h1>
    <div>
      <button @click="incrementPageSize">Show More</button>
      <span class="num-shown">Max number of notes shown: {{pageSize}}</span>
      <button :disabled="pageSize <= 1" @click="decrementPageSize">Show Less</button>
    </div>
    <NotesList :pageSize="pageSize"/>
  </div>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator'
import NotesList from './components/NotesList.vue'

@Component({
  components: {
    NotesList
  }
})
export default class App extends Vue {
  pageSize = 1

  incrementPageSize() {
    this.pageSize += 1
  }

  decrementPageSize() {
    if (this.pageSize > 1) this.pageSize -= 1
  }
}
</script>

<style lang="css">
.num-shown {
  padding: 0 10px;
}
.app {
  font-family: sans-serif;
  text-align: center;
}
</style>
