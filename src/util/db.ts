import mongoose from "mongoose";

const MONGO_URI =
  process.env.MONGO_URI ||
  "mongodb+srv://dro:pword1234@cluster0.ytwpa.mongodb.net/notes?retryWrites=true&w=majority";
export default (cb: () => void) => {
  mongoose
    .connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then((res) => {
      console.log("DB Connected");
      cb();
    });
};
