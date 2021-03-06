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

export const DeleteNoteQuery: DocumentNode = gql`
    mutation DeleteNote ($id: ID!) {
        deleteNote (id: $id) {
            _id
        }
    }
`

export const UpdateNoteQuery: DocumentNode = gql`
    mutation UpdateNote ($id:ID!, $body:String!, $author:String!){
        updateNote(
            id: $id
            data: { 
                author: $author,
                body: $body
            }
        ) {
            _id
            author
            body
        }
    }
`