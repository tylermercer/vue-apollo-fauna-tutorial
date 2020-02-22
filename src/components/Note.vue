<template>
  <div class="post">
    <template v-if="!editing">
      <div class="menu-buttons">
        <DeleteNoteButton 
          :id="id"
        />
        <button class="menu-button" @click="() => editing = true">Edit</button>
      </div>
      <p class="body">{{body}}</p>
      <p class="author">~ {{author}}</p>
    </template>
    <template v-else>
      <div class="menu-buttons">
        <button class="menu-button" @click="() => editing = false">Cancel</button>
      </div>
      <NoteEditor
        :id="id"
        :body="body"
        :author="author"
        @saved="() => editing = false"
      />
    </template>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator'
import DeleteNoteButton from './DeleteNoteButton.vue'
import NoteEditor from './NoteEditor.vue'

@Component({
  components: {
    DeleteNoteButton,
    NoteEditor
  }
})
export default class Note extends Vue {
  @Prop(String) private body!: string;
  @Prop(String) private author!: string;
  @Prop(String) private id!: string;

  editing: boolean = false
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
.menu-buttons {
  visibility: hidden;
	position: absolute;
	top: 0;
	right: 0;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
}
.post:hover .menu-buttons {
  visibility: visible;
}
.menu-button {
  border: unset;
  background: unset;
}
</style>
