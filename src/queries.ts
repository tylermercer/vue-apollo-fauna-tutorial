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