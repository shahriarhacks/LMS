import express from "express";
import {
  activateUser,
  loginUser,
  logoutUser,
  registerUser,
  updateAccessToken,
} from "./user.controller";
import { isAuthenticated } from "../../middleware/auth";

const router = express.Router();

router.post("/registration", registerUser);
router.post("/activation", activateUser);
router.post("/login", loginUser);
router.get("/logout", isAuthenticated, logoutUser);
router.get("/refresh", updateAccessToken);

export default router;
