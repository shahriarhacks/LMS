import express from "express";
import { activateUser, registerUser } from "./user.controller";

const router = express.Router();

router.post("/registration", registerUser);
router.post("/activation", activateUser);

export default router;
