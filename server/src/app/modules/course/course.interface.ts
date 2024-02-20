import { Document } from "mongoose";

export interface IComment extends Document {
  user: object;
  comment: string;
  commentReplies?: IComment[];
}
export interface IReview extends Document {
  user: object;
  rating: number;
  comment: string;
  commentReplies: IComment[];
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
  questions: IComment[];
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
