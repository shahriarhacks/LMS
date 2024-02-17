import express from "express";
import {
  activateUpdateEmail,
  activateUser,
  forgotPasswordRequest,
  forgotPasswordVerify,
  getUserInfo,
  loginUser,
  logoutUser,
  registerUser,
  saveForgotPassword,
  socialAuth,
  updateAccessToken,
  updateAvatar,
  updatePassword,
  updateUserEmail,
  updateUserInfo,
} from "./user.controller";
import { isAuthenticated } from "../../middleware/auth";

const router = express.Router();

router.post("/registration", registerUser);
router.post("/activation", activateUser);
router.post("/login", loginUser);
router.post("/social", socialAuth);
router.post("/request-email-update", isAuthenticated, updateUserEmail);
router.post("/request-forgot-pass", forgotPasswordRequest);
router.post("/verify-forgot-pass", forgotPasswordVerify);

router.get("/logout", isAuthenticated, logoutUser);
router.get("/refresh", updateAccessToken);
router.get("/me", isAuthenticated, getUserInfo);

router.patch("/activate-update-email", isAuthenticated, activateUpdateEmail);
router.patch("/update-userinfo", isAuthenticated, updateUserInfo);
router.patch("/change-password", isAuthenticated, updatePassword);
router.patch("/update-avatar", isAuthenticated, updateAvatar);
router.patch("/save-password", saveForgotPassword);

export default router;
