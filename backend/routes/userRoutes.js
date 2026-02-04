import express from "express";
import { saveUser, updateLastLogin } from "../controllers/userController.js";
import User from "../models/user.js";


const router = express.Router();

router.post("/", saveUser);
router.post("/last-login", updateLastLogin);

router.get("/", async (_req, res) => {
    const users= await User.find();
    res.json(users);
});

export default router;
