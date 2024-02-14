import express from "express";
import {
  activateUser,
  loginUser,
  logoutUser,
  registerUser,
} from "./user.controller";

const router = express.Router();

router.post("/registration", registerUser);
router.post("/activation", activateUser);
router.post("/login", loginUser);
router.get("/logout", logoutUser);

export default router;
