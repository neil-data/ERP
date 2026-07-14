import express from "express";
import { register, login, refresh, logout, getMe } from "../controllers/authController.js";
import { verifyToken } from "../middleware/auth.js";
import rateLimit from "express-rate-limit";

const router = express.Router();

const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10, // limit each IP to 10 login attempts per windowMs
    message: "Too many login attempts from this IP, please try again after 15 minutes"
});

router.post("/register", register);
router.post("/login", loginLimiter, login);
router.post("/refresh", refresh);
router.post("/logout", verifyToken, logout);
router.get("/me", verifyToken, getMe);

export default router;