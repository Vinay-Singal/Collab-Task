import mongoose, { Schema, model, models } from "mongoose";

const taskSchema = new Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  user: { type: Schema.Types.ObjectId, ref: "User", required: true },
});

const Task = models.Task || model("Task", taskSchema);
export default Task;
