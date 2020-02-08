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
  <ApolloQuery :query="gql => gql(query)" :variables="{ pageSize }">
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
export default class HelloWorld extends Vue {
  @Prop(Number) private pageSize!: string;

  query: string = `
    query MyQuery ($pageSize: Int) {
      allNotes(_size: $pageSize) {
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

It receives the page size (the number of items to request) as a prop. In the template, it creates an ApolloQuery component. That component runs the query (which is stored as a string that's a data member of the NotesList class). If the result contains data, it displays it (as a string for now--we'll extract the actual data and render a list of notes later).

Now we need to actually use the NotesList component in our app. Open up `App.vue` and replace it with the following:

```
<template>
  <div class="app">
    <h1>Notes</h1>
    <div>
      <button @click="incrementPageSize">Show More</button>
      <span class="num-shown">Max number of notes shown: {{pageSize}}</span>
      <button :disabled="pageSize <= 1" @click="decrementPageSize">Show Less</button>
    </div>
    <NotesList :pageSize="pageSize"/>
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
export default class App extends Vue {
  pageSize = 1

  incrementPageSize() {
    this.pageSize += 1
  }

  decrementPageSize() {
    if (this.pageSize > 1) this.pageSize -= 1
  }
}
</script>

<style lang="css">
.num-shown {
  padding: 0 10px;
}
.app {
  font-family: sans-serif;
  text-align: center;
}
</style>
```

This App component is pretty straightforward. It contains a data member to track the current page size, buttons that increment and decrement that value, and a NotesList to which that value is passed as a prop. It also contains some minimal styling. (Note, however, that UX design is not the focus of this tutorial. 😅)

If you run the app now (using `npm run serve`), you should see your data (as JSON) below the two buttons! It doesn't look pretty, but it's from the database! Yay!

## Render the Notes

As you can see from the JSON that's currently displayed in your app, the response from Fauna has the following structure:
```
data: {
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
export default class HelloWorld extends Vue {
  @Prop(String) private body!: string;
  @Prop(String) private author!: string;
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

This is just a simple component that takes the body and author as a prop and renders them as a nice yellow sticky note.

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
export default class HelloWorld extends Vue {
...
```

If you run the app now, you should see a list of notes. (Note that we're using each note's id as its `key`. This is so that Vue has a unique id for each node in that v-for list.) It also displays the number of notes.

## Add Functionality for Creating Notes

To create notes, we'll use an ApolloMutation component.

TODO
