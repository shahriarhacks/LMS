import { NextFunction, Request, Response } from "express";
import { catchAsyncError } from "./catchAsyncErrors";
import ErrorHandler from "../../utils/errorHandler";
import httpStatus from "http-status";
import jwt, { JwtPayload } from "jsonwebtoken";
import config from "../../config";
import { redis } from "../../utils/redis";

//Authenticated User Verify
export const isAuthenticated = catchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const accessToken = req.cookies.ac_token;
      if (!accessToken) {
        return next(
          new ErrorHandler(
            "Please login to access these resource",
            httpStatus.UNAUTHORIZED
          )
        );
      }
      const decoded = jwt.verify(
        accessToken,
        config.JWT.access_secret as string
      ) as JwtPayload;
      if (!decoded) {
        return next(
          new ErrorHandler("Invalid access token", httpStatus.UNAUTHORIZED)
        );
      }
      const user = await redis.get(decoded.id);
      if (!user) {
        return next(new ErrorHandler("User not found", httpStatus.NOT_FOUND));
      }
      req.user = JSON.parse(user);
      next();
    } catch (error: any) {
      return next(new ErrorHandler(error.message, httpStatus.BAD_REQUEST));
    }
  }
);

export const authorizedRoles = (...roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!roles.includes(req.user?.role as string)) {
      return next(
        new ErrorHandler(
          `Role: ${req.user?.role} is not allowed to access this resource `,
          httpStatus.FORBIDDEN
        )
      );
    }
    next();
  };
};
