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
  type: string;
  id: string;
  _id: string;
  owner: any;
}
export interface ErrorObject extends Error {
  [key: string]: any;
}
interface SuperRequest extends Request {
  isAuth: boolean;
  userId: string;
}
interface LoginInput {
  loginInput: {
    loginId: string;
    password: string;
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
  if (!isEmail(email) && normalizeEmail(email)) {
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

  const users = await User.find({ email, username });
  if (users.length > 0) {
    const error: ErrorObject = new Error("User already exists");
    error.status = 409;
    throw error;
  }
  const hashedPassword = await bcrypt.hash(password, 12);
  const user = new User({
    username,
    email,
    password: hashedPassword,
    notes: [],
  });
  await user.save();
  return {
    message: "User created successfully",
    status: 201,
  };
};

const login = async ({ loginInput }: LoginInput) => {
  const { loginId, password } = loginInput;

  let user;
  loginId.includes("@")
    ? (user = await User.findOne({ email: loginId }))
    : (user = await User.findOne({ username: loginId }));

  if (!user) {
    const error: ErrorObject = new Error("Incorrect Login Details");
    error.status = 422;
    throw error;
  }

  const isPasswordCorrect = await bcrypt.compare(password, user.password);

  if (!isPasswordCorrect) {
    const error: ErrorObject = new Error("Incorrect Login Details");
    error.status = 422;
    throw error;
  }

  const token = jwt.sign(
    {
      userId: user._id.toString(),
    },
    "fh23$rfcow0s!f9ewnd63@",
    {
      expiresIn: "1hr",
    }
  );
  return {
    message: "Signed In",
    status: 200,
    token,
    user: {
      ...user._doc,
      id: user._id,
    },
  };
};

const addNote = async (
  {
    title,
    content,
    type,
  }: {
    title: string;
    content: string;
    type: string;
  },
  req: any
) => {
  if (!req.isAuth) {
    const error: any = new Error("Inauthenticated User");
    error.status = 401;
    throw error;
  }
  let errors = [];
  if (!validator.isLength(trim(title), { min: 3 })) {
    errors.push({
      value: "title",
      message: "Title must be 3 or more characters",
    });
  }
  if (!validator.isLength(trim(content), { min: 3 })) {
    errors.push({
      value: "content",
      message: "Content must be 3 or more characters",
    });
  }
  if (
    type !== "none" &&
    type !== "personal" &&
    type !== "todo" &&
    type !== "work"
  ) {
    errors.push({
      value: "type",
      message: "Type must be either be none, personal, todo, work",
    });
  }
  if (errors.length > 0) {
    const error: ErrorObject = new Error("Invalid Input");
    error.status = 422;
    error.data = errors;
  }
  let note;

  const user = await User.findById(req.userId);
  note = new Note({
    title,
    content,
    type,
    owner: user,
  });
  note = await note.save();
  user.notes.push(note);
  await user.save();

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
    type,
  }: {
    title: string;
    content: string;
    noteId: string;
    type: string;
  },
  req: any
) => {
  let errors = [];
  if (!title && !content && !type) {
    const error: ErrorObject = new Error("Field(s) to edit is(are) required");
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

  if (type) {
    if (
      type !== "none" &&
      type !== "personal" &&
      type !== "todo" &&
      type !== "work"
    ) {
      errors.push({
        value: "type",
        message: "Type must be either be none, personal, todo, work",
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
  note = await Note.findById(noteId);
  if (note.owner.toString() !== req.userId) {
    const error: any = new Error("User not authorized");
    error.status = 403;
    throw error;
  }
  if (title) {
    note.title = title;
  }
  if (content) {
    note.content = content;
  }
  if (type) {
    note.type = type;
  }
  await note.save();
  return {
    note,
    message: "Note updated successfully",
  };
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
  return {
    notes: user.notes.map((note: any) => {
      return {
        ...note._doc,
        id: note._id.toString(),
        updatedAt: new Date(note.updatedAt).getTime(),
      };
    }),
    status: 200,
  };
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
  return {
    ...note._doc,
    id: note._id.toString(),
    updatedAt: new Date(note.updatedAt).getTime(),
  };
};

const deleteNote = async ({ noteId }: any, req: any) => {
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
  await Note.findByIdAndDelete(noteId);
  return {
    message: "Note Successfully Deleted",
    status: 204,
  };
};

export default {
  createUser,
  login,
  addNote,
  getNotes,
  getNote,
  editNote,
  deleteNote,
};
