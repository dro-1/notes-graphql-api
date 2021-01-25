import express from "express";
import bodyParser from "body-parser";
import { graphqlHTTP } from "express-graphql";
import resolvers from "./graphql/resolvers";
import schema from "./graphql/schema";
import dbConnector from "./util/db";
import { GraphQLError } from "graphql";
import authMiddleware from "./middleware/auth";

const PORT = process.env.PORT || 8080;

const app = express();

app.use(bodyParser.json());

interface ErrorObject extends GraphQLError {
  [key: string]: any;
  originalError: any;
}

app.use((req: any, res: any, next: any) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, PATCH, OPTIONS",
  );
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }
  next();
});

app.use(authMiddleware);

app.use(
  "/graphql",
  graphqlHTTP({
    schema,
    rootValue: resolvers,
    graphiql: true,
    customFormatErrorFn: (err: ErrorObject) => {
      if (err.originalError && err.originalError.data) {
        err.data = err.originalError.data;
      }
      if (err.originalError && err.originalError.status) {
        err.status = err.originalError.status;
      }
      return err;
      ``;
    },
  }),
);

dbConnector(() => {
  app.listen(PORT, () => {
    console.log("Server Started on Port " + PORT);
  });
});
