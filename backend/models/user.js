import { Schema, model } from "mongoose";

const userSchema = new Schema(
  {
    firebaseUID: { type: String, required: true },
    email: { type: String, required: true, unique: true },

    // ✅ New Field
    username: { type: String, required: true },
    lastLoginAt: { type: Date, default: null },
  },
  { timestamps: true }
);

export default model("User", userSchema);
