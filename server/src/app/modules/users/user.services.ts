import { IUser } from "./user.interface";
import User from "./user.model";

export const activateUserServices = async (user: Partial<IUser>) => {
  return await User.create(user);
};

export const getSingleUserInfo = async (id: string) => {
  return await User.findOne({ _id: id }).select("+password");
};

export const getUserInfoById = async (id: string) => {
  return await User.findOne({ _id: id }).select("-password");
};
