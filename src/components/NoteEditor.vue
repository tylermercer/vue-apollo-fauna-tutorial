<template>
  <ApolloMutation
    class="editor"
    :mutation="() => updateMutation"
    :variables="{ id, author: newAuthor, body: newBody }"
    :update="updateCache"
    @done="onDone">
    <template v-slot="{ mutate, loading, error }">
      <input id="body" type="text" placeholder="Contents" :disabled="loading" v-model="newBody"/>
      <input id="author" type="text" placeholder="Author" :disabled="loading" v-model="newAuthor"/>
      <button :disabled="loading || !isSubmittable" @click="mutate">Save</button>
      <p class="error" v-if="error">{{error}}</p>
      <p v-if="loading">Saving...<p>
      <p class="success" v-if="showSuccess">Note saved!</p>
    </template>
  </ApolloMutation>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator'
import ApolloMutation from 'vue-apollo'
import { UpdateNoteQuery, GetNotesQuery } from '../queries'
import { DocumentNode } from 'graphql'
import { DataStore } from 'apollo-client/data/store'
import ApolloClient from 'apollo-client'

@Component
export default class NoteEditor extends Vue {
  @Prop(String) private body!: string
  @Prop(String) private author!: string
  @Prop(String) private id!: string

  newBody: string = this.body
  newAuthor: string = this.author

  get isSubmittable () {
    return !!this.newAuthor && !!this.newBody && !(this.newBody === this.body && this.newAuthor === this.author)
  }

  updateMutation: DocumentNode = UpdateNoteQuery

  onDone() {
    this.$emit('saved')
  }

  updateCache(store: ApolloClient<any>, result: any) {
    const updatedNote = result.data.updateNote
    const data = store.readQuery({ query: GetNotesQuery })
    const indexOfNote = data.allNotes.data.findIndex((n: any) => n._id === updatedNote._id)
    data.allNotes.data[indexOfNote] = updatedNote
    store.writeQuery({ query: GetNotesQuery, data })
  }

}
</script>

<style scoped>
.editor {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
}
</style>