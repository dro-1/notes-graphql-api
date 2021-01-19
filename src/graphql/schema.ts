import { buildSchema } from "graphql";

export default buildSchema(`

    input CreateUserInput{
        username: String!
        email: String!
        password: String!
    }

    type Note {
        title: String!
        content: String!
    }

    type User { 
        id: String!
        username: String!
        notes: [Note]!
    }

    type RootMutation {
        createUser(userInput: CreateUserInput): User!
    }

    type RootQuery{
        hello: String!
    }

    schema{
        query: RootQuery
        mutation: RootMutation
    }
`);
