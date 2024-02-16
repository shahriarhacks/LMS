import { Model, Schema } from "mongoose";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import { IUser } from "./user.interface";
import jwt from "jsonwebtoken";
import config from "../../../config";

const emailRegexPattern: RegExp = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const userSchema: Schema<IUser> = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Please enter your certificate name"],
    },
    email: {
      type: String,
      required: [true, "Please enter your email"],
      validate: {
        validator: function (value: string) {
          return emailRegexPattern.test(value);
        },
        message: "Please enter a valid email",
      },
      unique: true,
    },
    password: {
      type: String,
      minlength: [6, "Password must be at least 6 characters"],
      select: 0,
    },
    avatar: {
      public_id: String,
      url: String,
    },
    role: {
      type: String,
      default: "user",
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    courses: [
      {
        courseId: String,
      },
    ],
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
    },
  }
);

// Hash password before saving

userSchema.pre<IUser>("save", async function (next) {
  if (!this.isModified("password")) {
    next();
  }
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

// Sign Access token
userSchema.methods.SignAccessToken = function () {
  return jwt.sign({ id: this._id }, config.JWT.access_secret as string, {
    expiresIn: config.JWT.jac_exp,
  });
};

// Sign Refresh token
userSchema.methods.SignRefreshToken = function () {
  return jwt.sign({ id: this._id }, config.JWT.refresh_secret as string, {
    expiresIn: config.JWT.jrf_exp,
  });
};

// Compare password
userSchema.methods.comparePassword = async function (
  entirePass: string
): Promise<boolean> {
  return await bcrypt.compare(entirePass, this.password);
};

const User: Model<IUser> = mongoose.model("User", userSchema);

export default User;
