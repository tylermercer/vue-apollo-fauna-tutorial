<template>
  <div class="post">
    <DeleteNoteButton 
      class="delete-button" 
      :id="id"
    />
    <p class="body">{{body}}</p>
    <p class="author">~ {{author}}</p>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator'
import DeleteNoteButton from './DeleteNoteButton.vue'

@Component({
  components: {
    DeleteNoteButton
  }
})
export default class Note extends Vue {
  @Prop(String) private body!: string;
  @Prop(String) private author!: string;
  @Prop(String) private id!: string;
}
</script>

<style lang="css">
.post {
  background-color: #FFFFAA;
  text-align: left;
  padding: 8px 20px;
  max-width: 200px;
  min-height: 120px;
  margin-left: auto;
  margin-right: auto;
  margin-top: 10px;
  box-shadow: 0 2px 5px 0 rgba(0,0,0,0.3);
  position: relative;
}
.body {
  font-size: 20px;
}
.author {
  text-align: right;
  font-size: 14px;
}
.delete-button {
  visibility: hidden;
	position: absolute;
	top: 0;
	right: 0;
}
.post:hover .delete-button {
  visibility: visible;
}
</style>
