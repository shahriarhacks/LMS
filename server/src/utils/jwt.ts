import { Response } from "express";
import { IUser } from "../app/modules/users/user.interface";
import config from "../config";
import { ITokenOptions } from "../interfaces/tokenOptionType";
import { redis } from "./redis";

export const sendToken = (user: IUser, statusCode: number, res: Response) => {
  const accessToken = user.SignAccessToken();
  const refreshToken = user.SignRefreshToken();

  //   Upload session to Redis
  redis.set(user._id, JSON.stringify(user) as any);

  //   Parse environment variables to integrate with fallback values
  const accessTokenExpire = parseInt(config.JWT.access_exp || "300", 10);
  const refreshTokenExpire = parseInt(config.JWT.refresh_exp || "1200", 10);

  //   Options for Cookies
  const accessTokenOptions: ITokenOptions = {
    expires: new Date(Date.now() + accessTokenExpire * 1000),
    maxAge: accessTokenExpire * 1000,
    httpOnly: true,
    sameSite: "lax",
  };
  const refreshTokenOptions: ITokenOptions = {
    expires: new Date(Date.now() + refreshTokenExpire * 1000),
    maxAge: refreshTokenExpire * 1000,
    httpOnly: true,
    sameSite: "lax",
  };
  if (config.NODE_ENV === "production") {
    accessTokenOptions.secure = true;
  }
  res.cookie("ac-token", accessToken, accessTokenOptions);
  res.cookie("rf-token", refreshToken, refreshTokenOptions);

  res.status(statusCode).json({
    success: true,
    message: "User Login Successfully",
    data: user,
    accessToken,
  });
};
