import { Schema, model, models, Document, Types } from "mongoose";

// Define the TypeScript Interface for the Task Document
// This will be used in your components and API routes for strong typing.
export interface ITask extends Document {
  title: string;
  description: string;
  // Use Types.ObjectId for the schema definition, but allow string for retrieval
  user: Types.ObjectId | string;
}

const taskSchema = new Schema<ITask>(
  {
    title: { type: String, required: true },
    description: { type: String, required: true },
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  {
    timestamps: true, // Good practice to include timestamps
  }
);

// We cast the result to Model<ITask> to ensure type safety when accessing the model
const Task = (models.Task || model<ITask>("Task", taskSchema));
export default Task;
