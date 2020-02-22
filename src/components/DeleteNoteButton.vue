<template>
  <ApolloMutation
    :mutation="_ => deleteMutation"
    :variables="{id}"
    :update="updateCache"
  >
    <template v-slot="{ mutate, loading }">
      <button class="button" @click="loading? () => {} : mutate()">
        {{loading? "deleting..." : "X"}}
      </button>
    </template>
  </ApolloMutation>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator'
import ApolloMutation from 'vue-apollo'
import { DeleteNoteQuery, GetNotesQuery } from '../queries'
import { DocumentNode } from 'graphql'
import { DataStore } from 'apollo-client/data/store'
import ApolloClient from 'apollo-client'

@Component
export default class DeleteNoteButton extends Vue {
  @Prop(String) private id!: String;
  
  deleteMutation: DocumentNode = DeleteNoteQuery;

  updateCache(store: ApolloClient<any>, result: any) {
    const oldNote = result.data.deleteNote;
    const data = store.readQuery({ query: GetNotesQuery });
    data.allNotes.data = data.allNotes.data.filter((n: any) => n._id !== oldNote._id)
    store.writeQuery({ query: GetNotesQuery, data });
  }
}
</script>

<style scoped>
.button {
	padding: 10px;
	color: rgba(0,0,0,0.4);
	margin: 0;
	background: unset;
	border: unset;
	cursor: pointer;
}
</style>