import express from "express";
import bodyParser from "body-parser";
import { graphqlHTTP } from "express-graphql";
import resolvers from "./graphql/resolvers";
import schema from "./graphql/schema";
import dbConnector from "./util/db";

const PORT = process.env.PORT || 8080;

const app = express();

app.use(bodyParser.json());

app.use(
  "/graphql",
  graphqlHTTP({
    schema,
    rootValue: resolvers,
    graphiql: true,
  })
);

dbConnector(() => {
  app.listen(PORT, () => {
    console.log("Server Started on Port " + PORT);
  });
});
