import { redis } from "../../../utils/redis";
import { IUser } from "./user.interface";
import User from "./user.model";

export const activateUserServices = async (user: Partial<IUser>) => {
  const result = await User.create(user);
  return result;
};

export const getUserInfoById = async (id: string) => {
  const userJSON = await redis.get(id);
  const result = JSON.parse(userJSON as string);

  return result;
};
