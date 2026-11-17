import { Router } from "express";
import { suggestTweet, suggestHashtags, sphereChat } from "../controllers/ai.controller.js";
import { authenticateToken, optionalAuthenticateToken } from "../middleware/auth.middleware.js";

const router = Router();

router.post("/suggest-post", authenticateToken as any, suggestTweet);
router.post("/suggest-tweet", authenticateToken as any, suggestTweet);
router.post("/suggest-hashtags", authenticateToken as any, suggestHashtags);
router.post("/sphere-chat", optionalAuthenticateToken as any, sphereChat);

export default router;
