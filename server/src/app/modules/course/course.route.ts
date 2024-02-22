import express from "express";
import { authorizedRoles, isAuthenticated } from "../../middleware/auth";
import {
  addAnswer,
  addQuestion,
  createCourse,
  editCourse,
  getAllCourse,
  getCourseByUser,
  getSingleCourse,
} from "./course.controller";

const router = express.Router();

router.post(
  "/create",
  isAuthenticated,
  authorizedRoles("admin", "super_admin"),
  createCourse
);

router.get("/all", getAllCourse);

router.patch("/add-question", isAuthenticated, addQuestion);
router.patch("/reply-question", isAuthenticated, addAnswer);
router.patch(
  "/edit/:id",
  isAuthenticated,
  authorizedRoles("admin", "super_admin"),
  editCourse
);

router.get("/retrieve/:id", getSingleCourse);
router.get("/content/:id", isAuthenticated, getCourseByUser);

export default router;
