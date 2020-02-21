function html(s: TemplateStringsArray){ return s.join()};

export const CreateNoteQuery: string = `
    mutation AddNote ($author: String!, $body: String!) {
        createNote(data: {
            author: $author,
            body: $body
        }) {
            _id
        }
    }
`

export const GetNotesQuery: string = `
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

export const TestHTMLTemplate: string = html`
    <div></div>
`