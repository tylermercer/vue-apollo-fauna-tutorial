<template>
  <div class="post">
    <ApolloMutation
      :mutation="_ => deleteMutation"
      :variables="{id}"
      :update="updateCache"
    >
      <template v-slot="{ mutate, loading }">
        <button 
          class="delete-button"
          @click="loading? () => {} : mutate()"
        >
          {{loading? "deleting..." : "X"}}
        </button>
      </template>
    </ApolloMutation>
    <p class="body">{{body}}</p>
    <p class="author">~ {{author}}</p>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator'
import ApolloMutation from 'vue-apollo'
import { DeleteNoteQuery, GetNotesQuery } from '../queries'
import { DocumentNode } from 'graphql'
import { DataStore } from 'apollo-client/data/store'
import ApolloClient from 'apollo-client'

@Component
export default class Note extends Vue {
  @Prop(String) private body!: string;
  @Prop(String) private author!: string;
  @Prop(String) private id!: string;

  deleteMutation: DocumentNode = DeleteNoteQuery;

  updateCache(store: ApolloClient<any>, result: any) {
    const oldNote = result.data.deleteNote;
    const data = store.readQuery({ query: GetNotesQuery });
    data.allNotes.data = data.allNotes.data.filter((n: any) => n._id !== oldNote._id)
    store.writeQuery({ query: GetNotesQuery, data });
  }
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
	position: absolute;
	top: 0;
	right: 0;
	padding: 10px;
	color: rgba(0,0,0,0.4);
	margin: 0;
	background: unset;
	border: unset;
	visibility: hidden;
	cursor: pointer;
}
.post:hover .delete-button {
  visibility: visible;
}
</style>
