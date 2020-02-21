<template>
  <ApolloQuery :query="gql => gql(query)" :variables="{ pageSize }">
    <template v-slot="{ result: { error, data }, isLoading }">
      <div v-if="isLoading">Loading...</div>
      <div v-else-if="error">An error occurred</div>
      <div v-else-if="data">
        <Note v-for="post in data.allNotes.data" :key="post._id" :body="post.body" :author="post.author"/>
        <p>{{data.allNotes.data.length}} notes</p>
      </div>
      <div v-else class="no-result">No result :(</div>
    </template>
  </ApolloQuery>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator'
import ApolloQuery from 'vue-apollo'
import Note from './Note.vue'
import { GetNotesQuery } from '../queries'

@Component({
  components: {
    Note
  }
})
export default class NotesList extends Vue {
  @Prop(Number) private pageSize!: string;

  query: string = GetNotesQuery
}
</script>
