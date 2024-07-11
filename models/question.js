import mongoose from "mongoose";
import User from "./user.js";

const { Schema } = mongoose;

const questionSchema = new Schema({
  title: {
    type: String,
    required: true
  },
  body: {
    type: String,
    required: true
  },
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, { timestamps: true });

const Question = mongoose.model('Question', questionSchema);
export default Question;



