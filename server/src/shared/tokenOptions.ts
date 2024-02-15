import config from "../config";
import { ITokenOptions } from "../interfaces/tokenOptionType";

// Parse environment variables to integrate with fallback values
export const tokenOptions = (tokenExp: number): ITokenOptions => {
  const options: ITokenOptions = {
    expires: new Date(Date.now() + tokenExp * 1000),
    maxAge: tokenExp * 1000,
    httpOnly: true,
    sameSite: "lax",
  };
  if (config.NODE_ENV === "production") {
    options.secure = true;
  }
  return options;
};
