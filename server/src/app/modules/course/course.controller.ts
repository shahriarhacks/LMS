import express, { NextFunction, Request, Response } from "express";
import cloudinary from "cloudinary";
import { catchAsyncError } from "../../middleware/catchAsyncErrors";
import ErrorHandler from "../../../utils/errorHandler";
import httpStatus from "http-status";
import {
  createCourseService,
  editCourseService,
  getAllCourseService,
  getCourseByUserService,
  getSingleCourseService,
} from "./course.service";
import sendResponse from "../../../shared/sendResponse";
import { ICourse } from "./course.interface";
import { redis } from "../../../utils/redis";

// Create Course
export const createCourse = catchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = req.body;
      const thumbnail = data.thumbnail;
      if (thumbnail) {
        const myCloud = await cloudinary.v2.uploader.upload(thumbnail, {
          folder: "courses",
        });
        data.thumbnail = {
          public_id: myCloud.public_id,
          url: myCloud.secure_url,
        };
      }
      const course = await createCourseService(data);

      //Catching all new
      const courses = await getAllCourseService();
      await redis.del("allCourses");
      await redis.set("allCourses", JSON.stringify(courses));

      sendResponse<ICourse>(res, {
        statusCode: httpStatus.CREATED,
        success: true,
        message: "Course created successfully",
        data: course,
      });
    } catch (error: any) {
      return next(
        new ErrorHandler(error.message, httpStatus.INTERNAL_SERVER_ERROR)
      );
    }
  }
);

// Edit course
export const editCourse = catchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = req.body;
      const cid = req.params.id;
      const thumbnail = data.thumbnail;
      if (thumbnail) {
        await cloudinary.v2.uploader.destroy(thumbnail.public_id);
        const myCloud = await cloudinary.v2.uploader.upload(thumbnail, {
          folder: "courses",
        });
        data.thumbnail = {
          public_id: myCloud.public_id,
          url: myCloud.secure_url,
        };
      }

      const course = await editCourseService(cid, data);

      //Catching all new
      const courses = await getAllCourseService();
      await redis.del("allCourses");
      await redis.set("allCourses", JSON.stringify(courses));

      sendResponse(res, {
        statusCode: httpStatus.CREATED,
        success: true,
        message: "Course updated successfully",
        data: course,
      });
    } catch (error: any) {
      return next(
        new ErrorHandler(error.message, httpStatus.INTERNAL_SERVER_ERROR)
      );
    }
  }
);

// Getting single course
export const getSingleCourse = catchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      let course: Partial<ICourse>;
      const cid = req.params.id;
      const isCatchExist = await redis.get(cid);
      if (isCatchExist) {
        course = JSON.parse(isCatchExist);
      } else {
        course = (await getSingleCourseService(cid)) as Partial<ICourse>;
        await redis.set(cid, JSON.stringify(course));
      }
      sendResponse<Partial<ICourse>>(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Course retrieve successfully",
        data: course,
      });
    } catch (error: any) {
      return next(
        new ErrorHandler(error.message, httpStatus.INTERNAL_SERVER_ERROR)
      );
    }
  }
);

//Getting All Course
export const getAllCourse = catchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      let courses: Partial<ICourse[]>;
      const isCatchExist = await redis.get("allCourses");
      if (isCatchExist) {
        courses = JSON.parse(isCatchExist);
      } else {
        courses = await getAllCourseService();
        redis.set("allCourses", JSON.stringify(courses));
      }
      sendResponse<Partial<ICourse[]>>(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Courses retrieve successfully",
        data: courses,
      });
    } catch (error: any) {
      return next(
        new ErrorHandler(error.message, httpStatus.INTERNAL_SERVER_ERROR)
      );
    }
  }
);

// Get CourseContent for purchasing user
export const getCourseByUser = catchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const myCourseList = req.user?.courses;
      const cid = req.params.id;
      const isCourseExist = myCourseList?.find(
        (course: any) => course.courseId.toString() === cid
      );
      if (!isCourseExist) {
        return next(
          new ErrorHandler(
            "You are not eligible to access this course",
            httpStatus.NOT_FOUND
          )
        );
      }
      const course = await getCourseByUserService(cid);
      const content = course?.courseData;
      sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Content retrieve successfully",
        data: content,
      });
    } catch (error: any) {
      return next(
        new ErrorHandler(error.message, httpStatus.INTERNAL_SERVER_ERROR)
      );
    }
  }
);
