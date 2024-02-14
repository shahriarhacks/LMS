import { NextFunction, Request, Response } from "express";
import ErrorHandler from "../../utils/errorHandler";
import sendResponse from "../../shared/sendResponse";
import httpStatus from "http-status";

export const errorMiddleware = (
  error: any,
  _req: Request,
  res: Response,
  next: NextFunction
) => {
  error.statusCode = error.statusCode || httpStatus.INTERNAL_SERVER_ERROR;
  error.message = error.message || "Internal server error";

  //Wrong MongoDB ID

  if (error.name === "CastError") {
    const message = `Resource not found, Invalid request by ${error.path}`;
    error = new ErrorHandler(message, httpStatus.BAD_REQUEST);
  }

  //   Duplicate Key Error

  if (error.code === 11000) {
    const message = `Duplicate ${Object.keys(error.keyValue)} entered.`;
    error = new ErrorHandler(message, httpStatus.BAD_REQUEST);
  }
  // Wrong JWT use

  if (error.name === "JsonWebTokenError") {
    const message = `JSON Web Token is invalid! Please try again.`;
    error = new ErrorHandler(message, httpStatus.FORBIDDEN);
  }
  //   JWT Expired Error
  if (error.name === "TokenExpiredError") {
    const message = `JSON Web Token is expired! Please try again.`;
    error = new ErrorHandler(message, httpStatus.UNAUTHORIZED);
  }

  sendResponse(res, {
    statusCode: error.statusCode,
    success: false,
    message: error.message,
    data: error,
  });
};
