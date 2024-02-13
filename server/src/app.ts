import express, { Application, NextFunction, Request, Response } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import status from "http-status";
import sendResponse from "./shared/sendResponse";
import { errorMiddleware } from "./app/middleware/error";
import config from "./config";
import allRoutes from "./app/routes";

const app: Application = express();

//Body Parser
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true }));

// Cookie Parser
app.use(cookieParser());
//Cross Origin Resource Sharing
app.use(
  cors({
    origin: config.ORIGIN,
  })
);

// Calling API route
app.use("/api/v1", allRoutes);

// Testing API or Health checking for server
app.get("/health", (_req: Request, res: Response, _next: NextFunction) => {
  sendResponse<null>(res, {
    statusCode: status.OK,
    success: true,
    message: "Server Health is well! It's working very good",
  });
});

// Unknown Route
app.all("*", (req: Request, _res: Response, next: NextFunction) => {
  const error = new Error(`Route ${req.originalUrl} not found`);

  next(error);
});

app.use(errorMiddleware);

export default app;
