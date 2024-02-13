import { NextFunction, Request, Response } from "express";
import ErrorHandler from "../../utils/errorHandler";
import sendResponse from "../../shared/sendResponse";

export const errorMiddleware = (
  error: any,
  _req: Request,
  res: Response,
  next: NextFunction
) => {
  error.statusCode = error.statusCode || 500;
  error.message = error.message || "Internal server error";

  //Wrong MongoDB ID

  if (error.name === "CastError") {
    const message = `Resource not found, Invalid request by ${error.path}`;
    error = new ErrorHandler(message, 400);
  }

  //   Duplicate Key Error

  if (error.code === 11000) {
    const message = `Duplicate ${Object.keys(error.keyValue)} entered.`;
    error = new ErrorHandler(message, 400);
  }
  // Wrong JWT use

  if (error.name === "JsonWebTokenError") {
    const message = `JSON Web Token is invalid! Please try again.`;
    error = new ErrorHandler(message, 400);
  }
  //   JWT Expired Error
  if (error.name === "TokenExpiredError") {
    const message = `JSON Web Token is expired! Please try again.`;
  }

  sendResponse(res, {
    statusCode: error.statusCode,
    success: false,
    message: error.message,
    data: error,
  });
};
