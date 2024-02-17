import jwt from "jsonwebtoken";
import {
  IActivationToken,
  IRegisterUserBody,
  IUser,
  IVerifyOTPConfirm,
} from "./user.interface";
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

export const createUpdateEmailToken = (
  user: Partial<IRegisterUserBody>
): IActivationToken => {
  const activationCode: string = Math.floor(
    100000 + Math.random() * 900000
  ).toString();
  const token: string = jwt.sign(
    { user, activationCode },
    config.JWT.email_change_secret as string,
    {
      expiresIn: "5m",
    }
  );
  return { token, activationCode };
};

export const createForgotToken = (
  user: Partial<IRegisterUserBody>
): IActivationToken => {
  const activationCode: string = Math.floor(
    1000000 + Math.random() * 9000000
  ).toString();
  const token: string = jwt.sign(
    { user, activationCode },
    config.JWT.forgot_pass_secret as string,
    {
      expiresIn: "5m",
    }
  );
  return { token, activationCode };
};

export const signNewTokenForFP = (user: IVerifyOTPConfirm): string => {
  const token = jwt.sign({ user }, config.JWT.fp_verify_secret as string, {
    expiresIn: "7m",
  });
  return token;
};
