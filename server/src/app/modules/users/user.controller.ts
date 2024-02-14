import { NextFunction, Request, Response } from "express";
import { catchAsyncError } from "../../middleware/catchAsyncErrors";
import ErrorHandler from "../../../utils/errorHandler";
import httpStatus from "http-status";
import jwt from "jsonwebtoken";
import User from "./user.model";
import { IActivationRequest, IRegisterUserBody, IUser } from "./user.interface";
import config from "../../../config";
import ejs from "ejs";
import path from "path";
import sendMail from "../../../utils/sendMail";
import sendResponse from "../../../shared/sendResponse";
import { createActivationToken } from "./user.utils";
import { activateUserServices } from "./user.services";

export const registerUser = catchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { name, email, password } = req.body;
      const isEmailExist = await User.findOne({ email });
      if (isEmailExist) {
        return next(
          new ErrorHandler("Email Already Exist", httpStatus.CONFLICT)
        );
      }
      const user: IRegisterUserBody = {
        name,
        email,
        password,
      };
      const activationToken = createActivationToken(user);
      const activationCode = activationToken.activationCode;
      const data = { user: { name: user.name }, activationCode };

      const html = ejs.renderFile(
        path.join(__dirname, "../../../mails/mail.ejs"),
        data
      );

      try {
        await sendMail({
          email: user.email,
          subject: "Account activation OTP",
          template: "mail.ejs",
          data,
        });
        res.status(httpStatus.CREATED).json({
          success: true,
          message: `Please check your email: ${user.email} to activate your account`,
          activationToken: activationToken.token,
        });
      } catch (error: any) {
        return next(new ErrorHandler(error.message, httpStatus.BAD_REQUEST));
      }
    } catch (error: any) {
      return next(new ErrorHandler(error.message, httpStatus.BAD_REQUEST));
    }
  }
);

// Activate User
export const activateUser = catchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { token, otp } = req.body as IActivationRequest;
      const newUser: { user: IUser; activationCode: string } = jwt.verify(
        token,
        config.JWT.activation_secret as string
      ) as { user: IUser; activationCode: string };

      if (newUser.activationCode !== otp) {
        return next(new ErrorHandler("Invalid OTP", httpStatus.UNAUTHORIZED));
      }
      const { name, email, password } = newUser.user;
      const existUser = await User.findOne({ email });
      if (existUser) {
        return next(
          new ErrorHandler(
            "User already exist. Go to login or forgot password",
            httpStatus.CONFLICT
          )
        );
      }
      const user = await activateUserServices({ name, email, password });

      sendResponse(res, {
        statusCode: httpStatus.CREATED,
        success: true,
        message: "User created successfully",
        data: user,
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, httpStatus.BAD_REQUEST));
    }
  }
);
