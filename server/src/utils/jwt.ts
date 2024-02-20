import { Response } from "express";
import { IUser } from "../app/modules/users/user.interface";
import config from "../config";
import { redis } from "./redis";
import { tokenOptions } from "../shared/tokenOptions";
import { getUserInfoById } from "../app/modules/users/user.services";

export const sendToken = async (
  user: IUser,
  statusCode: number,
  res: Response
) => {
  const accessToken = user.SignAccessToken();
  const refreshToken = user.SignRefreshToken();

  //   Upload session to Redis

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
  const dbUser = await getUserInfoById(user._id);
  redis.set(user._id, JSON.stringify(dbUser) as any);
  res.status(statusCode).json({
    success: true,
    message: "User Login Successfully",
    data: dbUser,
    accessToken,
  });
};
