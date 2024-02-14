import { IUser } from "./user.interface";
import User from "./user.model";

export const activateUserServices = async (user: Partial<IUser>) => {
  const result = await User.create(user);
  return result;
};
