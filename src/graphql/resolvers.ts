import bcrypt from "bcryptjs";
import User from "./../models/user";
import Note from "./../models/note";
import jwt from "jsonwebtoken";
import validator from "validator";

const trim = validator.trim;
const normalizeEmail = validator.normalizeEmail;
const isEmail = validator.isEmail;
interface UserInput {
  userInput: {
    email: string;
    password: string;
    username: string;
  };
}
interface Note {
  title: string;
  content: string;
  save: Function;
  id: string;
  _id: string;
  owner: any;
}
interface ErrorObject extends Error {
  [key: string]: any;
}

interface SuperRequest extends Request {
  isAuth: boolean;
  userId: string;
}
interface LoginInput {
  loginInput: {
    email: string;
    password: string;
    username: string;
  };
}

const createUser = async ({ userInput }: UserInput, req: SuperRequest) => {
  const { email, password, username } = userInput;
  let errors = [];
  if (!email || !password || !username) {
    const error: ErrorObject = new Error("All fields are required");
    error.status = 422;
    throw error;
  }
  if (
    isEmail(email) && normalizeEmail(email)
  ) {
    errors.push({
      value: "email",
      message: "You must enter a valid email",
    });
  }
  if (
    !validator.isLength(trim(username), {
      min: 3,
    })
  ) {
    errors.push({
      value: "username",
      message: "Username must be 3 or more characters",
    });
  }

  if (
    !validator.isLength(trim(password), {
      min: 6,
    })
  ) {
    errors.push({
      value: "password",
      message: "Password must be 6 or more characters",
    });
  }

  if (errors.length > 0) {
    const error: ErrorObject = new Error("Invalid Input");
    error.status = 422;
    error.data = errors;
    throw error;
  }

  if (!req.isAuth) {
    const error: any = new Error("Inauthenticated User");
    error.status = 401;
    throw error;
  }
  const users = await User.find({ email, username });
  console.log(users);
  if (users.length > 0) {
    const error: ErrorObject = new Error("User already exists");
    error.status = 409;
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
    return {
      ...savedUser._doc,
      id: savedUser._id.toString(),
    };
  } catch (err) {
    console.log(err);
  }
};

const login = async ({ loginInput }: LoginInput) => {
  const { email, username, password } = loginInput;
  if (!((username && !email) || (!username && email))) {
    const error: ErrorObject = new Error(
      "Arguments must have either email or password, not both",
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
        "Incorrect Email/Password Combination",
      );
      error.status = 422;
      throw error;
    }
    const isPasswordCorrect = await bcrypt.compare(password, user.password);
    if (!isPasswordCorrect) {
      const error: ErrorObject = new Error(
        "Incorrect Email/Password Combination",
      );
      error.status = 404;
      throw error;
    }

    console.log(user);

    const token = jwt.sign(
      {
        userId: user._id.toString(),
      },
      "fh23$rfcow0s!f9ewnd63@",
      {
        expiresIn: "1hr",
      },
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

const addNote = async (
  {
    title,
    content,
  }: {
    title: string;
    content: string;
  },
  req: any,
) => {
  if (!req.isAuth) {
    const error: any = new Error("Inauthenticated User");
    error.status = 401;
    throw error;
  }
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

const editNote = async (
  {
    title,
    content,
    noteId,
  }: {
    title: string;
    content: string;
    noteId: string;
  },
  req: any,
) => {
  console.log(title, content, noteId);
  let errors = [];
  if (!title && !content) {
    const error: ErrorObject = new Error("Title or Content is required");
    error.status = 422;
    throw error;
  }
  if (title) {
    if (
      !validator.isLength(trim(title), {
        min: 3,
      })
    ) {
      errors.push({
        value: "title",
        message: "Title must be 3 or more characters",
      });
    }
  }
  if (content) {
    if (
      !validator.isLength(trim(content), {
        min: 3,
      })
    ) {
      errors.push({
        value: "content",
        message: "Content must be 3 or more characters",
      });
    }
  }

  if (errors.length > 0) {
    const error: ErrorObject = new Error("Invalid Input");
    error.status = 422;
    error.data = errors;
    throw error;
  }

  if (!req.isAuth) {
    const error: any = new Error("Inauthenticated User");
    error.status = 401;
    throw error;
  }
  let note: Note;
  try {
    note = await Note.findById(noteId);
    if (note.owner.toString() !== req.userId) {
      const error: any = new Error("User not authorized");
      error.status = 403;
      throw error;
    }
    console.log(note);
    if (title) {
      note.title = title;
    }
    if (content) {
      note.content = content;
    }
    await note.save();
    console.log(note);
    return {
      note,
      message: "Note updated successfully",
    };
  } catch (err) {
    console.log(err);
  }
};

const getNotes = async (args: any, req: any) => {
  if (!req.isAuth) {
    const error: any = new Error("Inauthenticated User");
    error.status = 401;
    throw error;
  }
  const user = await User.findById(req.userId).populate("notes");
  if (!user) {
    const error: ErrorObject = new Error("User not found");
    error.status = 422;
    throw error;
  }
  return user.notes;
};

const getNote = async ({ noteId }: any, req: any) => {
  if (!req.isAuth) {
    const error: any = new Error("Inauthenticated User");
    error.status = 401;
    throw error;
  }
  const note = await Note.findById(noteId);
  if (!note) {
    const error: any = new Error("Note not found");
    error.status = 404;
    throw error;
  }
  if (note.owner.toString() !== req.userId) {
    const error: any = new Error("User not authorized");
    error.status = 403;
    throw error;
  }
  return note;
};

export default {
  createUser,
  login,
  addNote,
  getNotes,
  getNote,
  editNote,
};
