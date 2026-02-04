import Message from "../models/Message.js";

// Save message
export const saveMessage = async (req, res) => {
  try {
    const { sender, text } = req.body;

    const message = await Message.create({
      sender,
      text,
    });

    res.status(201).json(message);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get all messages
export const getMessages = async (_req, res) => {
  try {
    const messages = await Message.find().sort({ createdAt: 1 });
    res.json(messages);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
