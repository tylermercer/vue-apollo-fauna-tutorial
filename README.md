# Building a Notes App with Vue, TypeScript, FaunaDB, and Apollo



## Create a FaunaDB Database.
I called mine "notes-test." Once you've created the database, go to the GraphQL section and upload the notes-test.gql schema from this repo.

Notice that the schema we're uploading is really quite simple:
```
type Note @collection(name: "notes") {
  body: String!
  author: String!
}

type Query {
  allNotes: [Note]
}
```
This is because Fauna does a lot to flesh out the schema for us. If you click the Schema tab on the side of the GraphQL Playground on your dashboard, you'll notice that Fauna has generated `createNote`, `updateNote`, and `deleteNote` mutations as well as `findNoteByID` and `allNotes` queries.

You can use the GraphQL playground to explore the functionality of this auto-embellished schema. Try adding a few notes; this will increase your familiarity with GraphQL and provide data for us to view in the app later.

## Create a Database Key for Your Client
We'll  use the Fauna shell to create the key, but before we do that we need to create a custom role. This is because the [existing roles](https://docs.fauna.com/fauna/current/security/) won't work for our purposes. `server` and `admin` roles are much too powerful to embed in a client (a malicious user could wreak havoc on our database), `server-readonly` won't allow us to create notes, and `client` can only access resources "that are specifically marked with the `public` permission." (Thus, it may actually be possible to use a `client` key for our purposes, but I was unable to figure out how to mark my schema as public.)

To create the custom role, go to the Security section of your console and click "Manage Roles" and then "New Role". Name your role something sensible (I named mine `vue-client`) and grant it permissions to create, update, and delete notes as well as to get the list of all notes, as shown in the screenshot below.

![Custom Fauna Key Role](/screenshots/create-custom-role.png)

Click "Save" to save your role.

Open up a command line where you have the Fauna shell installed (follow [these instructions](https://docs.fauna.com/fauna/current/start/cloud) if you haven't done that yet). Run the following command to launch your database's shell (substituting in your own DB's name if you used something else).
```
fauna shell notes-test
```
Now run the following command to create your key:
```
CreateKey({
  role: Role('vue-client')
})
```
**Important:** The secret that is displayed in your console after you run this command is **only ever displayed once**, so copy it to your text editor for safekeeping. If you lose the secret, you'll have to create a new key.

## Create a new Vue project and install Apollo
If you haven't already, install the Vue CLI with the following command:
```
npm install -g @vue/cli
```
Create a new Vue project. Mine is named "notes-client" but you can name yours whatever.
```
vue create notes-client
```
Select the TypeScript option using the arrow keys and spacebar, and choose "yes" when asked if you want to use class-style components. (This isn't strictly necessary, but it's what I'll be assuming for the rest of the tutorial.) You can also select other options you want to include.

Once you're finished, you should have a shiny new Vue project in the `notes-client` folder (assuming that's what you named it). Navigate into that folder and install the modules listed below:
```
cd notes-client
npm install --save vue-apollo apollo-client apollo-cache-inmemory apollo-link apollo-link-context apollo-link-http graphql graphql-tag
```

## Configure Apollo
Open up your project folder in your favorite editor and create a file called `.env` in the project root. Add the following to this file (replacing `<your secret here>` with the secret you copied from the Fauna shell earlier):
```
VUE_APP_FAUNADB_MYCUSTOMROLE_KEY=<your secret here>
```
(The name of the variable isn't important, as long as you're consistent in referring to it.)

Add this file to your .gitignore so you don't accidentally commit it to git. (To do this, add `.env` as a new line at the end of the file.)

Now open up the `main.ts` file in your `src` directory and add the following imports:
```
import { ApolloClient } from 'apollo-client'
import { HttpLink } from 'apollo-link-http'
import { InMemoryCache } from 'apollo-cache-inmemory'
import { setContext } from 'apollo-link-context'
import VueApollo from 'vue-apollo'
```

Below the import section, add the following code to configure Apollo:
```
const httpLink = new HttpLink({
  uri: "https://graphql.fauna.com/graphql"
})

const authLink = setContext((_, { headers }) => {
  const token = process.env.VUE_APP_FAUNADB_CLIENT_KEY

  return {
    headers: {
      ...headers,
      Authorization: token ? `Bearer ${token}` : "",
    }
  }
})

const cache = new InMemoryCache()

const apolloClient = new ApolloClient({
  link: authLink.concat(httpLink),
  cache
})
```
Notice how the special `authLink` is used in the `ApolloClient` constructor. This is a special Link object that will add our key's secret as an Authorization header in each request. Without this, Fauna would not allow Apollo to access the database.

Now that we've created our ApolloClient, we need to configure `vue-apollo` to use it. Add the following code after your ApolloClient instantiation.
```
Vue.use(VueApollo)

const apolloProvider = new VueApollo({
  defaultClient: apolloClient,
})
```
Also, add the apolloClient as a config parameter in the `new Vue` call:
```
new Vue({
  apolloProvider,
  render: h => h(App)
}).$mount('#app')
```

## Use the ApolloQuery Component to Query your Data

In `src/components`, create new files called `NotesList.vue` and `Note.vue`.

The NotesList component will be where the magic happens. The Note component will just allow us to keep the note's styles out of the NotesList.

In `NotesList.vue`, paste the following code:
```
<template>
  <ApolloQuery :query="gql => gql(query)">
    <template v-slot="{ result: { error, data }, isLoading }">
      <!-- Loading -->
      <div v-if="isLoading">Loading...</div>

      <!-- Error -->
      <div v-else-if="error">An error occurred</div>

      <!-- Result -->
      <div v-else-if="data">
        {{JSON.stringify(data)}}
      </div>

      <!-- No result -->
      <div v-else class="no-result">No result :(</div>
    </template>
  </ApolloQuery>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator'
import ApolloQuery from 'vue-apollo'

@Component
export default class NotesList extends Vue {
  query: string = `
    query GetNotes {
      allNotes {
        data {
          _id
          author
          body
        }
      }
    }
  `
}
</script>
```

A brief explanation as to how this component works:

In the template, it creates an ApolloQuery component. That component runs the query (which is stored as a string that's a data member of the NotesList class). If the result contains data, it displays it (as a string for now--we'll extract the actual data and render a list of notes later).

Now we need to actually use the NotesList component in our app. Open up `App.vue` and replace it with the following:

```
<template>
  <div class="app">
    <div class="header>
      <h1>Notes</h1>
    </div>
    <NotesList/>
  </div>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator'
import NotesList from './components/NotesList.vue'

@Component({
  components: {
    NotesList
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
```

This App component is pretty straightforward. It contains the NotesList component, as well as a sticky header (where we'll later add a component for creating notes). It also contains some minimal styling. (Note, however, that UX design is not the focus of this tutorial. 😅)

If you run the app now (using `npm run serve`), you should see your data (as JSON) below the two buttons! It doesn't look pretty, but it's from the database! Yay!

## Render the Notes

As you can see from the JSON that's currently displayed in your app, the response from Fauna has the following structure:
```
{
  allNotes: {
    data: [
      {
        //Post 1
      },
      {
        //Post 2
      }
      ...
    ]
  }
}
```

Thus, we'll need to reach inside it to access the post data.

First, however, we need to build our Note component. Put the following code in `Note.vue`:
```
<template>
  <div class="post">
    <p class="body">{{body}}</p>
    <p class="author">~ {{author}}</p>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator'

@Component
export default class Note extends Vue {
  @Prop(String) private body!: string;
  @Prop(String) private author!: string;
}
</script>

<style lang="css" scoped>
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
}
.body {
  font-size: 20px;
}
.author {
  text-align: right;
  font-size: 14px;
}
</style>
```

This is just a simple component that takes the body and author as props and renders them as a nice yellow sticky note.

Now go to `NotesList.vue` and replace the `{{JSON.stringify}}` line with the following:
```
<Note v-for="post in data.allNotes.data" :key="post._id" :body="post.body" :author="post.author"/>
<p>{{data.allNotes.data.length}} notes</p>
```

Make sure to import the Note component and register it:

```
...
import Note from './Note.vue'

@Component({
  components: {
    Note
  }
})
export default class NotesList extends Vue {
...
```

If you run the app now, you should see a list of notes. (Note that we're using each note's id as its `key`. This is so that Vue has a unique key for each node in that v-for list.) It also displays the number of notes.

## Adding Notes

To create notes, we'll use an ApolloMutation component.

Create a new file in the `components` directory called `NoteCreator.vue`. Put the following code into that file:

```
<template>
  <ApolloMutation
    class="creator"
    :mutation="gql => gql(query)"
    :variables="{ author, body }"
    @done="onDone">
    <template v-slot="{ mutate, loading, error }">
      <h4>Add Note:</h4>
      <input 
        id="body" 
        type="text" 
        placeholder="Contents" 
        :disabled="loading" 
        v-model="newBody"
      />
      <input 
        id="author" 
        type="text" 
        placeholder="Author" 
        :disabled="loading" 
        v-model="newAuthor"
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

@Component
export default class NoteCreator extends Vue {
  author: string = ""
  body: string = ""

  showSuccess: boolean = false

  get isSubmittable () {
    return !!this.author && !!this.body;
  }

  query: string = `
    mutation CreateNote ($author: String!, $body: String!) {
      createNote(data: {
        author: $author,
        body: $body
      }) {
        _id
        author
        body
      }
    }
  `

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
```
As can be seen, the ApolloMutation component exposes a slot where we can build our form and run the mutation. When the button is clicked, we run the mutation by calling the `mutate` slot prop. When the query is running, we disable the button and input fields by binding the `loading` slot prop to their `disabled` props. We disable the button when one or both of the fields is empty using the computed member `isSubmittable`. Finally, when the query finishes successfully, our `onDone` function (which is bound to the `ApolloMutation`'s `done` event) clears the fields and briefly show the success message by means of a `setTimeout`.

As a side note, it should be noted here that you can't use an arrow function as a class member if you want to access `this` within the function. As explained in [the `vue-class-component` docs](https://github.com/vuejs/vue-class-component#this-value-in-property), `this` is not bound to the Vue instance in an arrow function. This is why we use `onDone() {...` instead of `onDone = () => {...`.

If you run the app, submit a note, and increase the page size, you should see your newly-created note. But why does it not show up before you increase the page size? Our ApolloClient doesn't know to update its cache when we post the mutation! Hence it only updates when it is required to re-request the list of notes from the server. This is less than ideal.

**Important note:**
As explained [here](https://www.apollographql.com/docs/angular/features/cache-updates/#normalization-with-dataidfromobject), Apollo _does_ in fact update the cache automatically, but only in some cases--specifically, cases where already-known objects with an `_id` or `id` field are mutated. Since we're creating a new object here instead of mutating one, we have to update the cache manually. 

## Updating the Apollo Cache

To update the cache, we can use the `ApolloMutation`'s `updateCache` prop.

Before we dive into the code, we need to understand how Apollo's cache works. As is explained in [the Apollo Angular docs](https://www.apollographql.com/docs/angular/features/cache-updates/), Apollo stores each query with the data associated with it. Thus, to update the list of notes, we'll need to find the query in the store, modify the data, and rewrite that data into the store. But... how do we look up the query?

Apollo stores the query-data pairs as DocumentNode objects mapped to their data. This is the purpose of the `gql` function that is passed to the Apollo components' `query` parameter--it converts the query string to a DocumentNode. 

Since we'll need to access those DocumentNode objects from multiple places, we'll extract our queries out to a single TypeScript file and import the queries (as DocumentNodes) into the places we'll need them.

Create a file in the `src` folder called `queries.ts`, and add the following contents:

```
import { DocumentNode } from 'graphql'
import gql from 'graphql-tag'

export const CreateNoteQuery: DocumentNode = gql`
    mutation CreateNote ($author: String!, $body: String!) {
        createNote (data: {
            author: $author,
            body: $body
        }) {
            _id
            author
            body
        }
    }
`

export const GetNotesQuery: DocumentNode = gql`
    query GetNotes {
        allNotes {
            data {
            _id
            author
            body
            }
        }
    }
`
```

Here you can see the previously-mentioned `gql` function in action. (For more information on template string tag functions, check out [the MDN docs](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Template_literals)).

Because the queries are exported as DocumentNodes, we don't need to process them with the gql functions in the components they're used in. Thus, we can go to the NotesList component and replace `gql => gql(query)` with `() => query`. Then add an import statement to import the `GetNotesQuery`, and store it in the component's `query` data member:

```
import { GetNotesQuery } from '../queries'
```

Change the NoteCreator's `query` data member and ApolloMutation prop the same way. Make sure to import both the `GetNotesQuery` and the `CreateNoteQuery` here--we'll need the `GetNotesQuery` in order to update the cache.

```
import { CreateNoteQuery, GetNotesQuery } from '../queries'
```

Now for the fun part: updating the cache. Create a new member function in the NoteCreator:

```
updateCache(store: ApolloClient<any>, result: any) {
    //Get the new note
    const newNote = result.data.createNote;

    //Get the object containing the cached results for GetNotesQuery
    const data = store.readQuery({ query: GetNotesQuery });

    //Modify the data to include the new note
    data.allNotes.data = [ ...data.allNotes.data, newNote ];

    //Write the data back into the store's cache
    store.writeQuery({ query: GetNotesQuery, data });
  }
```

There are a few important things to note here that aren't immediately obvious: 

Firstly, `result.data` contains the data returned by the CreateNoteQuery.

Secondly, the `createNote` and `allNotes` members get their names from the query strings: `allNotes` is the object returned by the GetNotesQuery, and `createNote` is the mutation executed by the CreateNoteQuery.

Finally, note that `readQuery` reads from the local cache _only_--it does not make a network request.

Run the app now and add a new note, and you should see it immediately appear in the list of notes!

## Deleting Notes

The next step is to add the ability to delete notes. We'll need to use another ApolloMutation component for this. To keep our Note component tidy, we'll wrap the ApolloMutation in its own component. First, however, we need to add a mutation to our `queries.ts`:

```
export const DeleteNoteQuery: DocumentNode = gql`
    mutation DeleteNote ($id: ID!) {
        deleteNote (id: $id) {
            _id
        }
    }
`
```

This query takes the ID as a parameter, and returns it after executing the query. We'll use the returned ID when we update the cache.

Now put the following code in a file called `DeleteNoteButton.vue`:

```
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

<style lang="css" scoped>
.button {
	padding: 10px;
	color: rgba(0,0,0,0.4);
	margin: 0;
	background: unset;
	border: unset;
	cursor: pointer;
}
</style>
```

This component works similarly to our NoteCreator component:
- The ApolloMutation renders the button, which executes the mutation when clicked. 
- While the mutation is being executed, the button is rendered with a no-op click listener (to prevent the user from clicking it again) and the text "deleting..."
- After the mutation is executed, the `updateCache` method removes the deleted note from the list of notes using `Array.filter`.

Now add an instance of that component to the Note component:

```
...
  <div class="post">
    <DeleteNoteButton 
      class="delete-button" 
      :id="id"
    />
    <p class="body">{{body}}</p>
...
import DeleteNoteButton from './DeleteNoteButton.vue'

@Component({
  components: {
    DeleteNoteButton
  }
})
export default class Note extends Vue {
...
.post {
  ...
  position: relative;
}
...
.delete-button {
  visibility: hidden;
	position: absolute;
	top: 0;
	right: 0;
}
.post:hover .delete-button {
  visibility: visible;
}
```

The styling we added puts the button in the top right corner of the note, and makes it only visible when the user hovers over the note.

That's it! If you run the app, you should be able to delete notes!

## Conclusion and Taking it Further

I hope this tutorial has been helpful for explaining how Apollo, Fauna, and Vue can be used together. Many of the principles explained in this tutorial (like how Apollo's cache works) are independent from the framework used, and could just as easily be used in React, Angular, Svelte, or vanilla JavaScript.

If you'd like to continue with your notes project and want an example of how to make the notes editable, check out the Note.vue code in this repository. Note that you'll have to adjust your custom DB role to include "write" permissions for the `notes` collection.

Happy coding!