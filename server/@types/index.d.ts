import { Request } from "express";
import { IUser } from "../src/app/modules/users/user.interface";

declare global {
  namespace Express {
    export interface Request {
      user?: IUser;
    }
  }
}
