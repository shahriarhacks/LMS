import jwt from "jsonwebtoken";
import { IActivationToken, IRegisterUserBody } from "./user.interface";
import config from "../../../config";

export function createActivationToken(
  user: IRegisterUserBody
): IActivationToken {
  const activationCode: string = Math.floor(
    10000 + Math.random() * 90000
  ).toString();

  const token: string = jwt.sign(
    { user, activationCode },
    config.JWT.activation_secret as string,
    { expiresIn: "5m" }
  );

  return { token, activationCode };
}
