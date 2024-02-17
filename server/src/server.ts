import app from "./app";
import config from "./config";
import connectDB from "./utils/db";
import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: config.CLOUD.name,
  api_key: config.CLOUD.api_key,
  api_secret: config.CLOUD.secret,
});

app.listen(config.PORT, () => {
  console.log(
    `Server is ready by PORT ${config.PORT} and url address http://127.0.0.1:${config.PORT}`
  );
  connectDB();
});
