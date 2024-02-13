import mongoose from "mongoose";
import config from "../config";

const DBuri: string = config.URI || "";

const connectDB = async () => {
  try {
    mongoose.connect(DBuri).then((data: any) => {
      console.log(`Database connected with ${data.connection.host}`);
    });
  } catch (error: any) {
    console.log(error.message);
    setTimeout(connectDB, 5000);
  }
};

export default connectDB;
