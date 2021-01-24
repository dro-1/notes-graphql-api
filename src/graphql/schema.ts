import { buildSchema } from "graphql";

export default buildSchema(`

    input CreateUserInput{
        username: String!
        email: String!
        password: String!
    }

    input LoginInput{
        email: String
        username: String
        password: String!
    }

    type Note {
        title: String!
        content: String!
        _id: String!
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
    }

    type AddNoteResponse {
        note: Note!
        message: String!
    }

    type RootMutation {
        createUser(userInput: CreateUserInput): User!
        addNote(title: String!, content: String!): AddNoteResponse!
        editNote(title: String, content: String, noteId: String!): AddNoteResponse!
    }

    type RootQuery{
        login(loginInput: LoginInput): LoginResponse!
        getNotes: [Note]!
        getNote(noteId: String!): Note!
    }

    schema{
        query: RootQuery
        mutation: RootMutation
    }
`);
