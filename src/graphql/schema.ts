import { buildSchema } from "graphql";

export default buildSchema(`

    input CreateUserInput{
        username: String!
        email: String!
        password: String!
    }

    input LoginInput{
       loginId: String!
        password: String!
    }

    type Note {
        title: String!
        content: String!
        id: String!
        type: String!
        updatedAt: String!
    }

    type User { 
        id: ID!
        username: String!
        notes: [String]!
    }

    type LoginResponse{
        token: String!
        message: String!
        user: User!
        status: Int!
    }

    type AddNoteResponse {
        note: Note!
        message: String!
    }

    type CreateUserResponse {
        message: String!
        status: Int! 
    }

    type GetNotesResponse {
        notes: [Note]!
        status: Int!
    }

    type DeleteNoteResponse{
        message: String!
        status: Int!
    }

    type RootMutation {
        createUser(userInput: CreateUserInput): CreateUserResponse!
        addNote(title: String!, content: String!, type: String!): AddNoteResponse!
        editNote(title: String, content: String,, type: String!, noteId: String!): AddNoteResponse!
        deleteNote(noteId: String!): DeleteNoteResponse!
    }

    type RootQuery{
        login(loginInput: LoginInput): LoginResponse!
        getNotes: GetNotesResponse!
        getNote(noteId: String!): Note!
    }

    schema{
        query: RootQuery
        mutation: RootMutation
    }
`);
