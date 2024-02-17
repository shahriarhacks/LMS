import { NextFunction, Request, Response } from "express";
import { catchAsyncError } from "../../middleware/catchAsyncErrors";
import ErrorHandler from "../../../utils/errorHandler";
import httpStatus from "http-status";
import jwt, { JwtPayload } from "jsonwebtoken";
import User from "./user.model";
import {
  IActivationRequest,
  IForgotPassword,
  ILoginRequest,
  IRegisterUserBody,
  ISocialAuthBody,
  IUpdateAvatar,
  IUpdatePassword,
  IUpdateUserEmail,
  IUser,
  IVerifyOTPConfirm,
} from "./user.interface";
import config from "../../../config";
import ejs from "ejs";
import path from "path";
import sendMail from "../../../utils/sendMail";
import sendResponse from "../../../shared/sendResponse";
import {
  createActivationToken,
  createForgotToken,
  createUpdateEmailToken,
  signNewTokenForFP,
} from "./user.utils";
import cloudinary from "cloudinary";
import {
  activateUserServices,
  getSingleUserInfo,
  getUserInfoById,
} from "./user.services";
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
      const dbUser = await getUserInfoById(user._id);
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

// Login User
export const loginUser = catchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { email, password } = req.body as ILoginRequest;
      if (!email && !password) {
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
      const user = JSON.parse(session) as IUser;
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
      const dbUser = await getUserInfoById(user._id);
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
        data: dbUser,
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
      const user = await userId;
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
        const activationToken = createUpdateEmailToken({ email });
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

      const user = await getSingleUserInfo(req.user?._id);
      if (!user) {
        return next(new ErrorHandler("User not found", httpStatus.NOT_FOUND));
      }
      (user as IUser).email = email as string;

      await user.save();
      await redis.set(req.user?._id, JSON.stringify(user));
      req.user = user;
      const dbUser = await getUserInfoById(user._id);
      sendResponse(res, {
        statusCode: httpStatus.CREATED,
        success: true,
        message: "User email updated successfully",
        data: dbUser,
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, httpStatus.BAD_REQUEST));
    }
  }
);

// Update user information
export const updateUserInfo = catchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { name } = req.body as { name: string };
      const uid = req.user?._id;
      const user = await getUserInfoById(uid);
      if (user && name) {
        user.name = name;
      }
      await user?.save();
      await redis.set(uid, JSON.stringify(user));
      req.user = user as IUser;
      sendResponse(res, {
        statusCode: httpStatus.CREATED,
        success: true,
        message: "User info updated successfully",
        data: user,
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, httpStatus.BAD_REQUEST));
    }
  }
);

export const updatePassword = catchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { oldPassword, newPassword } = req.body as IUpdatePassword;
      if (!oldPassword && !newPassword) {
        return next(
          new ErrorHandler(
            "Please enter old and new password",
            httpStatus.BAD_REQUEST
          )
        );
      }

      const user = await getSingleUserInfo(req.user?._id);
      if (!user) {
        return next(new ErrorHandler("Invalid user", httpStatus.NOT_FOUND));
      }
      if (user?.password === undefined) {
        return next(new ErrorHandler("Invalid user", httpStatus.NOT_FOUND));
      }
      const isPasswordMatch = user.comparePassword(oldPassword);
      if (!isPasswordMatch) {
        return next(
          new ErrorHandler("Password not correct", httpStatus.BAD_REQUEST)
        );
      }
      user.password = newPassword;
      await user.save();
      await redis.set(req.user?._id, JSON.stringify(user));
      const dbUser = await getUserInfoById(user._id);
      sendResponse(res, {
        statusCode: httpStatus.CREATED,
        success: true,
        message: "Password updated successfully",
        data: dbUser,
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, httpStatus.BAD_REQUEST));
    }
  }
);

// Update avatar
export const updateAvatar = catchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { avatar } = req.body as IUpdateAvatar;
      const uid = req.user?._id;
      const user = await getUserInfoById(uid);
      if (avatar && user) {
        if (user.avatar.public_id) {
          await cloudinary.v2.uploader.destroy(user.avatar.public_id);
          const myCloud = await cloudinary.v2.uploader.upload(avatar, {
            folder: "avatars",
            width: 150,
          });
          user.avatar = {
            public_id: myCloud.public_id,
            url: myCloud.secure_url,
          };
        } else {
          const myCloud = await cloudinary.v2.uploader.upload(avatar, {
            folder: "avatars",
            width: 150,
          });
          user.avatar = {
            public_id: myCloud.public_id,
            url: myCloud.secure_url,
          };
        }
      }
      await user?.save();
      await redis.set(uid, JSON.stringify(user));
      sendResponse(res, {
        statusCode: httpStatus.CREATED,
        success: true,
        message: "Avatar updated successfully",
        data: user,
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, httpStatus.BAD_REQUEST));
    }
  }
);

// Forgot Password
export const forgotPasswordRequest = catchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { email } = req.body as IForgotPassword;
      if (!email) {
        return next(
          new ErrorHandler(
            "Please enter your user email",
            httpStatus.BAD_REQUEST
          )
        );
      }
      const user = await User.findOne({ email });
      if (!user) {
        return next(
          new ErrorHandler("Invalid email address", httpStatus.NOT_FOUND)
        );
      }
      const activationToken = createForgotToken({ email, id: user._id });
      const activationCode = activationToken.activationCode;
      const data = {
        user: { name: user.name, email: user.email },
        activationCode,
      };
      try {
        await sendMail({
          email: email,
          subject: "Forgot password OTP",
          template: "fpass.ejs",
          data,
        });
        res.status(httpStatus.CREATED).json({
          success: true,
          message: `Please check your email: ${email} to forgot your password`,
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

export const forgotPasswordVerify = catchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { token, otp } = req.body as IActivationRequest;
      const newUser: { user: Partial<IUser>; activationCode: string } =
        jwt.verify(token, config.JWT.forgot_pass_secret as string) as {
          user: Partial<IUser>;
          activationCode: string;
        };

      if (newUser.activationCode !== otp) {
        return next(new ErrorHandler("Invalid OTP", httpStatus.UNAUTHORIZED));
      }
      const { id } = newUser.user;

      const user = await getSingleUserInfo(id);
      if (!user) {
        return next(
          new ErrorHandler(
            "Something went wrong! User not found",
            httpStatus.INTERNAL_SERVER_ERROR
          )
        );
      }
      const fpVerifyToken = signNewTokenForFP({ id, verified: true });
      res.status(httpStatus.OK).json({
        success: true,
        message: "OTP verified",
        fpVerifyToken,
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, httpStatus.BAD_REQUEST));
    }
  }
);

export const saveForgotPassword = catchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { token, password } = req.body as {
        token: string;
        password: string;
      };
      const decoded = jwt.verify(
        token,
        config.JWT.fp_verify_secret as string
      ) as { user: IVerifyOTPConfirm };
      console.log(decoded);
      const { verified, id } = decoded.user;
      if (!verified) {
        return next(
          new ErrorHandler(
            "Server verified not confirmed",
            httpStatus.UNAUTHORIZED
          )
        );
      }
      const user = await getSingleUserInfo(id);
      if (!user) {
        return next(new ErrorHandler("User not found", httpStatus.NOT_FOUND));
      }
      user.password = password;
      await user.save();
      sendResponse(res, {
        statusCode: httpStatus.CREATED,
        success: true,
        message: "Password updated successfully",
        data: user,
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, httpStatus.BAD_REQUEST));
    }
  }
);
