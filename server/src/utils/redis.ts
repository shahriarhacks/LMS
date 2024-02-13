import { Redis } from "ioredis";
import config from "../config";

const redisClient = () => {
  if (config.REDIS_URL) {
    console.log(`Redis Connected`);
    return config.REDIS_URL;
  }
  throw new Error("Redis Connection was failed");
};

export const redis = new Redis(redisClient());
