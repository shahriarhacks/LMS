import { Response } from "express";
import { ISendResponse } from "../interfaces/sendResponseType";

const sendResponse = <T>(res: Response, data: ISendResponse<T>): void => {
  const resData: ISendResponse<T> = {
    statusCode: data?.statusCode,
    success: data?.success,
    message: data?.message || null,
    meta: data?.meta || null,
    data: data?.data || null,
  };
  res.status(data.statusCode).json(resData);
};

export default sendResponse;
