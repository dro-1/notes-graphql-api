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
    }

    type RootQuery{
        login(loginInput: LoginInput): LoginResponse!
    }

    schema{
        query: RootQuery
        mutation: RootMutation
    }
`);
