import { IUser } from "./user.interface";
import User from "./user.model";

export const activateUserServices = async (user: Partial<IUser>) => {
  const result = await User.create(user);
  return result;
};

export const getSingleUserInfo = async (id: string) => {
  const user = await User.findOne({ _id: id }).select("+password");
  return user;
};

export const getUserInfoById = async (id: string) => {
  const result = await User.findOne({ _id: id }).select("-password");
  return result;
};
