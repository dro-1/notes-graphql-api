import bcrypt from "bcryptjs";
import User from "./../models/user";
import Note from "./../models/note";
import jwt from "jsonwebtoken";
import { SchemaTypes } from "mongoose";

interface UserInput {
  userInput: {
    email: string;
    password: string;
    username: string;
  };
}

interface ErrorObject extends Error {
  [key: string]: any;
}

interface LoginInput {
  loginInput: {
    email: string;
    password: string;
    username: string;
  };
}

const createUser = async ({ userInput }: UserInput) => {
  const { email, password, username } = userInput;
  const users = await User.find({ email, username });
  console.log(users);
  if (users.length > 0) {
    const error: ErrorObject = new Error("User alreasy exists");
    error.status = 422;
    throw error;
  }
  try {
    const hashedPassword = await bcrypt.hash(password, 12);
    const user = new User({
      username,
      email,
      password: hashedPassword,
      notes: [],
    });
    const savedUser = await user.save();
    console.log(savedUser);
    console.log({ ...user });
    return {
      ...user._doc,
      id: user._id.toString(),
    };
  } catch (err) {
    console.log(err);
  }
};

const login = async ({ loginInput }: LoginInput) => {
  const { email, username, password } = loginInput;
  if (!((username && !email) || (!username && email))) {
    const error: ErrorObject = new Error(
      "Arguments must have either email or password, not both"
    );
    error.status = 422;
    throw error;
  }
  let user;
  try {
    if (username) {
      user = await User.findOne({ username });
    }
    if (email) {
      user = await User.findOne({ email });
    }
    if (!user) {
      const error: ErrorObject = new Error(
        "Incorrect Email/Password Combination"
      );
      error.status = 422;
      throw error;
    }
    const isPasswordCorrect = await bcrypt.compare(password, user.password);
    if (!isPasswordCorrect) {
      const error: ErrorObject = new Error(
        "Incorrect Email/Password Combination"
      );
      error.status = 404;
      throw error;
    }

    console.log(user);

    const token = jwt.sign(
      {
        userId: user._id,
      },
      "fh23$rfcow0s!f9ewnd63@",
      {
        expiresIn: "1hr",
      }
    );
    return {
      message: "Signed In",
      token,
      user: {
        ...user._doc,
        id: user._id,
      },
    };
  } catch (err) {
    console.log(err);
  }
};

const addNote = async ({
  title,
  content,
}: {
  title: string;
  content: string;
}) => {
  let note;
  try {
    const user = await User.findById("600629bf89244b0a90d96b22");
    note = new Note({
      title,
      content,
      owner: user,
    });
    note = await note.save();
    user.notes.push(note);
    await user.save();
  } catch (err) {
    console.log(err);
  }
  return {
    note,
    message: "Note created successfully",
  };
};

export default {
  createUser,
  login,
  addNote,
};
