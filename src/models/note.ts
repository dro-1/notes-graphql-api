import { Schema, model, SchemaTypes } from "mongoose";

const noteSchema = new Schema({
  title: {
    type: String,
    required: true,
  },
  content: {
    type: String,
    required: true,
  },
  owner: {
    type: SchemaTypes.ObjectId,
    ref: "User",
  },
});

export default model("Note", noteSchema);
