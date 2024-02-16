import { NextFunction, Request, Response } from "express";
import { catchAsyncError } from "../../middleware/catchAsyncErrors";
import ErrorHandler from "../../../utils/errorHandler";
import httpStatus from "http-status";
import jwt, { JwtPayload } from "jsonwebtoken";
import User from "./user.model";
import {
  IActivationRequest,
  ILoginRequest,
  IRegisterUserBody,
  ISocialAuthBody,
  IUpdateUserEmail,
  IUser,
} from "./user.interface";
import config from "../../../config";
import ejs from "ejs";
import path from "path";
import sendMail from "../../../utils/sendMail";
import sendResponse from "../../../shared/sendResponse";
import { createActivationToken, createChangeEmailToken } from "./user.utils";
import { activateUserServices, getUserInfoById } from "./user.services";
import { sendToken } from "../../../utils/jwt";
import { redis } from "../../../utils/redis";
import { tokenOptions } from "../../../shared/tokenOptions";

export const registerUser = catchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { name, email, password } = req.body;
      const isEmailExist = await User.findOne({ email });
      if (isEmailExist) {
        return next(
          new ErrorHandler("Email already exist", httpStatus.CONFLICT)
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

// Login User
export const loginUser = catchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { email, password } = req.body as ILoginRequest;
      if (!email || !password) {
        return next(
          new ErrorHandler(
            "Please enter your email and password",
            httpStatus.BAD_REQUEST
          )
        );
      }
      const user = await User.findOne({ email }).select("+password");
      if (!user) {
        return next(
          new ErrorHandler("Invalid email or password", httpStatus.BAD_REQUEST)
        );
      }
      const isPasswordMatch = await user.comparePassword(password);
      if (!isPasswordMatch) {
        return next(
          new ErrorHandler("Invalid email or password", httpStatus.BAD_REQUEST)
        );
      }
      sendToken(user, httpStatus.OK, res);
    } catch (error: any) {
      return next(new ErrorHandler(error.message, httpStatus.UNAUTHORIZED));
    }
  }
);

// Logout user
export const logoutUser = catchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      res.cookie("ac_token", "", { maxAge: 1 });
      res.cookie("rf_token", "", { maxAge: 1 });
      const uid = req.user?._id;
      redis.del(uid);
      sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "User logged out successfully",
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, httpStatus.BAD_REQUEST));
    }
  }
);

// Update access token
export const updateAccessToken = catchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const refresh_token = req.cookies.rf_token;
      const decoded = jwt.verify(
        refresh_token,
        config.JWT.refresh_secret as string
      ) as JwtPayload;
      if (!decoded) {
        return next(
          new ErrorHandler(
            "Could't find the refresh token",
            httpStatus.FORBIDDEN
          )
        );
      }
      const session = await redis.get(decoded.id as string);
      if (!session) {
        return next(
          new ErrorHandler("Session is expired", httpStatus.UNAUTHORIZED)
        );
      }
      const user = JSON.parse(session);
      const accessToken = jwt.sign(
        { id: user._id },
        config.JWT.access_secret as string,
        {
          expiresIn: config.JWT.jac_exp,
        }
      );
      const refreshToken = jwt.sign(
        { id: user._id },
        config.JWT.refresh_secret as string,
        {
          expiresIn: config.JWT.jrf_exp,
        }
      );
      req.user = user;
      res.cookie(
        "ac_token",
        accessToken,
        tokenOptions(Number(config.JWT.access_exp))
      );
      res.cookie(
        "rf_token",
        refreshToken,
        tokenOptions(Number(config.JWT.refresh_exp))
      );
      res.status(httpStatus.CREATED).json({
        success: true,
        message: "Access token generated successfully",
        data: user,
        accessToken,
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, httpStatus.UNAUTHORIZED));
    }
  }
);

// Getting User Information
export const getUserInfo = catchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?._id;
      const user = await getUserInfoById(userId);
      sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "User info retrieve successfully",
        data: user,
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, httpStatus.BAD_REQUEST));
    }
  }
);

// Social Auth
export const socialAuth = catchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { name, email, avatar } = req.body as ISocialAuthBody;
      const user = await User.findOne({ email });
      if (!user) {
        const newUser = await User.create({ name, email, avatar });
        sendToken(newUser, httpStatus.OK, res);
      } else {
        sendToken(user, httpStatus.OK, res);
      }
    } catch (error: any) {
      return next(new ErrorHandler(error.message, httpStatus.BAD_REQUEST));
    }
  }
);

// Update user information
export const updateUserEmail = catchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { email } = req.body as IUpdateUserEmail;
      const uid = req.user?._id;
      const user = await User.findById(uid);
      if (user && email) {
        const isEmailExist = await User.findOne({ email });
        if (isEmailExist) {
          return next(
            new ErrorHandler("Email already exist", httpStatus.CONFLICT)
          );
        }
        const activationToken = createChangeEmailToken({ email });
        const activationCode = activationToken.activationCode;
        const data = {
          user: { name: user.name, email: user.email },
          activationCode,
        };
        try {
          await sendMail({
            email: email,
            subject: "Updating email address request OTP",
            template: "changemail.ejs",
            data,
          });
          res.status(httpStatus.CREATED).json({
            success: true,
            message: `Please check your email: ${email} to update your email address`,
            activationToken: activationToken.token,
          });
        } catch (error: any) {
          return next(new ErrorHandler(error.message, httpStatus.BAD_REQUEST));
        }
      }
    } catch (error: any) {
      return next(new ErrorHandler(error.message, httpStatus.BAD_REQUEST));
    }
  }
);

// Activate updating email address

export const activateUpdateEmail = catchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { token, otp } = req.body as IActivationRequest;
      const newUser: { user: Partial<IUser>; activationCode: string } =
        jwt.verify(token, config.JWT.email_change_secret as string) as {
          user: Partial<IUser>;
          activationCode: string;
        };

      if (newUser.activationCode !== otp) {
        return next(new ErrorHandler("Invalid OTP", httpStatus.UNAUTHORIZED));
      }
      const { email } = newUser.user;

      const dbUser = await User.findById(req.user?._id);
      if (!dbUser) {
        return next(new ErrorHandler("User not found", httpStatus.NOT_FOUND));
      }
      (dbUser as IUser).email = email as string;
      dbUser.save();
      redis.set(req.user?._id, JSON.stringify(dbUser));
      req.user = dbUser;
      sendResponse(res, {
        statusCode: httpStatus.CREATED,
        success: true,
        message: "User created successfully",
        data: dbUser,
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, httpStatus.BAD_REQUEST));
    }
  }
);
