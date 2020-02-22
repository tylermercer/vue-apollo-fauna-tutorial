import { DocumentNode } from 'graphql'
import gql from 'graphql-tag'

export const CreateNoteQuery: DocumentNode = gql`
    mutation AddNote ($author: String!, $body: String!) {
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
    query MyQuery {
        allNotes {
            data {
            _id
            author
            body
            }
        }
    }
`