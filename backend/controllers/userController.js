import User from "../models/user.js";

export const saveUser = async (req, res) => {
  try {
    const { firebaseUID, email, username } = req.body;

    let user = await User.findOne({ firebaseUID });

    if (user) {
      return res.json({ message: "User already exists ✅", user });
    }

    user = await User.create({
      firebaseUID,
      email,
      username,
      lastLoginAt: new Date(),
    });

    res.status(201).json({ message: "User saved ✅", user });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const updateLastLogin = async (req, res) => {
  try {
    const { email, firebaseUID } = req.body;
    if (!email && !firebaseUID) {
      return res.status(400).json({ error: "Email or firebaseUID required" });
    }

    const user = await User.findOneAndUpdate(
      email ? { email } : { firebaseUID },
      { lastLoginAt: new Date() },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({ message: "Last login updated ✅", user });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
