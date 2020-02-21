<template>
  <ApolloMutation
    :mutation="gql => gql(query)"
    :variables="{ author, body }"
    @done="onDone">
    <template v-slot="{ mutate, loading, error }">
      <h4>Add Note:</h4>
      <div>
        <label for="body">Contents:</label>
        <input id="body" type="text"  :disabled="loading" v-model="body"/>
      </div>
      <div>
        <label for="author">Name:</label>
        <input id="author" type="text" :disabled="loading" v-model="author"/>
      </div>
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

import { CreateNoteQuery } from '../queries'

@Component
export default class NoteCreator extends Vue {
  author: string = ""
  body: string = ""

  get isSubmittable () {
    return !!this.author && !!this.body
  }

  showSuccess: boolean = false

  query: string = CreateNoteQuery

  onDone() {
    this.showSuccess = true
    this.author = ""
    this.body = ""
    setTimeout(() => {
      this.showSuccess = false
    }, 2000);
  }
}
</script>

<style lang="css">
.error {
  color: red;
}
.success {
  color: #008800;
}
</style>
