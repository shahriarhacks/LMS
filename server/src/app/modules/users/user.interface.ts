import { Document } from "mongoose";

export interface IUser extends Document {
  name: string;
  email: string;
  password: string;
  avatar: {
    public_id: string;
    url: string;
  };
  role: string;
  isVerified: boolean;
  courses: Array<{ courseId: string }>;
  comparePassword: (password: string) => Promise<boolean>;
  SignAccessToken: () => string;
  SignRefreshToken: () => string;
}

export interface IRegisterUserBody {
  name: string;
  email: string;
  password: string;
  avatar?: string;
}

export interface IActivationToken {
  token: string;
  activationCode: string;
}

export interface IActivationRequest {
  token: string;
  otp: string;
}
export interface ILoginRequest {
  email: string;
  password: string;
}

export interface ISocialAuthBody {
  name: string;
  email: string;
  avatar: string;
}

export interface IUpdateUserEmail {
  email: string;
}

export interface IUpdatePassword {
  oldPassword: string;
  newPassword: string;
}
