import { model, Schema, SchemaTypes } from "mongoose";

const noteSchema = new Schema({
  title: {
    type: String,
    required: true,
  },
  content: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    required: true,
  },
  owner: {
    type: SchemaTypes.ObjectId,
    ref: "User",
  },
}, { timestamps: true });

export default model("Note", noteSchema);
