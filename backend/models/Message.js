import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
  {
    chatId: { type: String, required: true },
    sender: { type: String, required: true }, // email or UID
    text: {
      type: String,
      // Only require text if no file is attached
      required: function () {
        return !this.fileUrl;
      },
      set: (value) => (typeof value === "string" ? value.trim() : value),
      default: "",
    },
    fileUrl: { type: String, default: null },
    fileType: { type: String, default: null },
    fileName: { type: String, default: null },
  },
  { timestamps: true }
);

export default mongoose.model("Message", messageSchema);
