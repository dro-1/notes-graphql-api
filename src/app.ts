import express from "express";
import bodyParser from "body-parser";
import { graphqlHTTP } from "express-graphql";
import resolvers from "./graphql/resolvers";
import schema from "./graphql/schema";
import dbConnector from "./util/db";
import { GraphQLError } from "graphql";
import authMiddleware from "./middleware/auth";
import User from "./models/user";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import cookieParser from "cookie-parser";

require("dotenv").config();

const PORT = process.env.PORT || 8080;

const app = express();

app.use(bodyParser.json());
app.use(cookieParser());

interface ErrorObject extends GraphQLError {
  [key: string]: any;
  originalError: any;
}

app.use((req: any, res: any, next: any) => {
  res.setHeader("Access-Control-Allow-Origin", "http://localhost:3000");
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, PATCH, OPTIONS"
  );
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization, csrf_token, csrf_refresh_token"
  );
  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }
  next();
});

app.get("/refresh-token", async (req, res, next) => {
  let csrfRefreshToken = req.get("csrf_refresh_token") || "";
  if (!process.env.ACCESS_TOKEN_SECRET || !process.env.CSRF_TOKEN_SECRET) {
    return res.sendStatus(500);
  }
  const verifiedToken: any = jwt.verify(
    csrfRefreshToken,
    process.env.CSRF_TOKEN_SECRET
  );
  if (verifiedToken && typeof verifiedToken === "object") {
    const user = await User.findOne({ email: verifiedToken.userEmail });
    if (user) {
      const accessToken = jwt.sign(
        {
          userId: user._id.toString(),
        },
        process.env.ACCESS_TOKEN_SECRET,
        {
          expiresIn: "1hr",
        }
      );

      const csrfToken = jwt.sign(
        {
          userEmail: user.email.toString(),
        },
        process.env.CSRF_TOKEN_SECRET,
        {
          expiresIn: "1hr",
        }
      );

      const csrfRefreshToken = jwt.sign(
        {
          userEmail: user.email.toString(),
        },
        process.env.CSRF_TOKEN_SECRET
      );
      res.cookie("access_token", accessToken, {
        maxAge: 3600000,
        httpOnly: !!process.env.NODE_ENV,
      });
      res.status(200).send({
        message: "Signed In",
        csrfToken,
        csrfRefreshToken,
      });
    }
  }
});

app.use(authMiddleware);

app.post("/login", async (req, res, next) => {
  const { loginId, password } = req.body;

  let user;
  loginId.includes("@")
    ? (user = await User.findOne({ email: loginId }))
    : (user = await User.findOne({ username: loginId }));

  if (!user) {
    return res.status(422).send({
      message: "Incorrect Login Details",
    });
  }

  const isPasswordCorrect = await bcrypt.compare(password, user.password);

  if (!isPasswordCorrect) {
    return res.status(422).send({
      message: "Incorrect Login Details",
    });
  }

  if (!process.env.ACCESS_TOKEN_SECRET || !process.env.CSRF_TOKEN_SECRET) {
    return res.sendStatus(500);
  }

  const accessToken = jwt.sign(
    {
      userId: user._id.toString(),
    },
    process.env.ACCESS_TOKEN_SECRET,
    {
      expiresIn: "1hr",
    }
  );

  const csrfToken = jwt.sign(
    {
      userEmail: user.email.toString(),
    },
    process.env.CSRF_TOKEN_SECRET,
    {
      expiresIn: "1hr",
    }
  );

  const csrfRefreshToken = jwt.sign(
    {
      userEmail: user.email.toString(),
    },
    process.env.CSRF_TOKEN_SECRET
  );
  res.cookie("access_token", accessToken, {
    maxAge: 3600000,
    httpOnly: !!process.env.NODE_ENV,
  });
  res.status(200).send({
    message: "Signed In",
    csrfToken,
    csrfRefreshToken,
    user: {
      name: user.username,
    },
  });
});

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
  })
);

dbConnector(() => {
  app.listen(PORT, () => {
    console.log("Server Started on Port " + PORT);
  });
});
