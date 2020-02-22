<template>
  <div class="app">
    <div class="header">
      <h1>Notes</h1>
      <NoteCreator/>
    </div>
    <NotesList/>
  </div>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator'
import NotesList from './components/NotesList.vue'
import NoteCreator from './components/NoteCreator.vue'

@Component({
  components: {
    NotesList, NoteCreator
  }
})
export default class App extends Vue {}
</script>

<style lang="css">
.header {
  position: sticky;
  top: 0;
  background: white;
  box-shadow: 0 2px 8px 0 rgba(0,0,0,0.3);
  padding: 6px;
}
.app {
  font-family: sans-serif;
  text-align: center;
}
body {
  margin: 0
}
</style>
