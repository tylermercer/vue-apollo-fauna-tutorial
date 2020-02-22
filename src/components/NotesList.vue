<template>
  <ApolloQuery :query="() => query">
    <template v-slot="{ result: { error, data }, isLoading }">
      <p v-if="isLoading">Loading...</p>
      <p v-else-if="error">An error occurred</p>
      <div v-else-if="data">
        <Note 
          v-for="post in data.allNotes.data" 
          :key="post._id" 
          :id="post._id"
          :body="post.body" 
          :author="post.author"
        />
        <p>{{data.allNotes.data.length}} notes</p>
      </div>
      <p v-else class="no-result">No result :(</p>
    </template>
  </ApolloQuery>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator'
import ApolloQuery from 'vue-apollo'
import Note from './Note.vue'
import { GetNotesQuery } from '../queries'
import { DocumentNode } from 'graphql'

@Component({
  components: {
    Note
  }
})
export default class NotesList extends Vue {
  query: DocumentNode = GetNotesQuery
}
</script>
