import { SchemaTypes, Schema, model, Document } from "mongoose";

export interface IUser extends Document {
  email: string;
  password: string;
  username: string;
  notes: Array<Object>;
  _doc: Object;
}

const userSchema = new Schema({
  email: {
    type: String,
    required: true,
  },
  password: {
    type: String,
    required: true,
  },
  username: {
    type: String,
    required: true,
  },
  notes: [
    {
      type: SchemaTypes.ObjectId,
      ref: "Note",
    },
  ],
});

export default model<IUser>("User", userSchema);
