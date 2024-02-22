import { Document, Types } from "mongoose";
import { IUser } from "../users/user.interface";

export interface IReplyQuestion {
  user: Types.ObjectId | Partial<IUser>;
  answer: string;
}

export interface IQuestion extends Document {
  user: Types.ObjectId | IUser;
  question: string;
  questionReplies?: IReplyQuestion[];
}
export interface IReview extends Document {
  user: IUser;
  rating: number;
  comment: string;
  commentReplies: IQuestion[];
}
export interface ILink extends Document {
  title: string;
  url: string;
}
export interface ICourseData extends Document {
  title: string;
  description: string;
  videoUrl: string;
  videoSection: string;
  videoLength: number;
  videoPlayer: string;
  links: ILink[];
  suggestion: string;
  questions: IQuestion[];
}
export interface ICourse extends Document {
  name: string;
  description: string;
  price: number;
  estimatePrice?: number;
  thumbnail: {
    public_id: string;
    url: string;
  };
  tags: string;
  level: string;
  demoUrl: string;
  benefits: Array<{ title: string }>;
  prerequisites: { title: string }[];
  reviews?: IReview[];
  courseData: ICourseData[];
  ratings?: number;
  purchased?: number;
}

export interface IAddQuestionData {
  question: string;
  courseId: string;
  contentId: string;
}

export interface IAddAnswerData {
  answer: string;
  courseId: string;
  contentId: string;
  questionId: string;
}
