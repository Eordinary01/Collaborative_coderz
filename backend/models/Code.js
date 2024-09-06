const mongoose = require("mongoose");


const codeSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    title: { type: String, required: true, default: "Untitled Project" },
    content: { type: String, required: true },
    language: { type: String, required: true },
    collaborators: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    pendingRequests: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    videoSessionActive: { type: Boolean, default: false },
    videoSessionParticipants: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  },
    { timestamps: true }
);

module.exports = mongoose.model("Code", codeSchema);
