import bcrypt from "bcryptjs";
import User from "./../models/user";

interface UserInput {
  userInput: {
    email: string;
    password: string;
    username: string;
  };
}

export default {
  hello: () => "hello there",
  createUser: async ({ userInput }: UserInput) => {
    const { email, password, username } = userInput;
    console.log(password);
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
  },
};
