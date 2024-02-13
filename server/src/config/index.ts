import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.join(process.cwd(), ".env") });

const config = {
  NODE_ENV: process.env.NODE_ENV,
  PORT: process.env.PORT,
  ORIGIN: process.env.ORIGIN,
  URI: process.env.DB_URI,
  REDIS_URL: process.env.REDIS_URL,
  CLOUD: {
    name: process.env.CLOUD_NAME,
    api_key: process.env.CLOUD_API_KEY,
    secret: process.env.CLOUD_SECRET,
  },
};

export default config;
