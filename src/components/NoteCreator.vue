<template>
  <ApolloMutation
    class="creator"
    :mutation="() => query"
    :variables="{ author, body }"
    :update="updateCache"
    @done="onDone">
    <template v-slot="{ mutate, loading, error }">
      <h4>Add Note:</h4>
      <input 
        id="body" 
        type="text" 
        placeholder="Contents" 
        :disabled="loading" 
        v-model="body"
      />
      <input 
        id="author" 
        type="text" 
        placeholder="Author" 
        :disabled="loading" 
        v-model="author"
      />
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

import { CreateNoteQuery, GetNotesQuery } from '../queries'
import { DataStore } from 'apollo-client/data/store'
import ApolloClient from 'apollo-client'
import { DocumentNode } from 'graphql'

@Component
export default class NoteCreator extends Vue {
  author: string = ""
  body: string = ""

  get isSubmittable () {
    return !!this.author && !!this.body
  }

  showSuccess: boolean = false

  query: DocumentNode = CreateNoteQuery

  onDone() {
    this.showSuccess = true
    this.author = ""
    this.body = ""
    setTimeout(() => {
      this.showSuccess = false
    }, 2000);
  }

  updateCache(store: ApolloClient<any>, result: any) {
    const newNote = result.data.createNote;
    const data = store.readQuery({ query: GetNotesQuery });
    data.allNotes.data = [ ...data.allNotes.data, newNote ];
    store.writeQuery({ query: GetNotesQuery, data });
  }
}
</script>

<style lang="css" scoped>
.error {
  color: red;
}
.success {
  color: #008800;
}
.creator {
  display: flex;
  flex-direction: column;
  align-items: center;
}
</style>
