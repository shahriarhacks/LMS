import { Model, Schema, model } from "mongoose";
import {
  ICourse,
  ICourseData,
  ILink,
  IQuestion,
  IReplyQuestion,
  IReview,
} from "./course.interface";

const replySchema = new Schema<IReplyQuestion>({
  user: {
    type: Schema.Types.ObjectId,
    ref: "User",
  },
  answer: {
    type: String,
    required: true,
  },
});

const questionSchema = new Schema<IQuestion>({
  user: {
    type: Schema.Types.ObjectId,
    ref: "User",
  },
  question: String,
  questionReplies: [replySchema],
});

const reviewSchema = new Schema<IReview>({
  user: Object,
  rating: {
    type: Number,
    default: 0,
  },
  comment: String,
  commentReplies: [Object],
});

const linkSchema = new Schema<ILink>({
  title: String,
  url: String,
});

const courseDataSchema = new Schema<ICourseData>({
  title: String,
  description: String,
  videoUrl: String,
  videoSection: String,
  videoLength: Number,
  videoPlayer: String,
  links: [linkSchema],
  suggestion: String,
  questions: [questionSchema],
});

const courseSchema = new Schema<ICourse>(
  {
    name: {
      type: String,
      required: [true, "Must need to provide a name"],
    },
    description: {
      type: String,
      required: true,
    },
    price: {
      type: Number,
      required: true,
    },
    estimatePrice: Number,
    thumbnail: {
      public_id: {
        type: String,
      },
      url: {
        type: String,
      },
    },
    tags: {
      type: String,
      required: true,
    },
    level: {
      type: String,
      required: true,
    },
    demoUrl: {
      type: String,
      required: true,
    },
    benefits: [{ title: { type: String, required: true } }],
    prerequisites: [{ title: { type: String, required: true } }],
    reviews: [reviewSchema],
    courseData: [courseDataSchema],
    ratings: {
      type: Number,
      default: 0,
    },
    purchased: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
    },
  }
);

const Course: Model<ICourse> = model("Course", courseSchema);

export default Course;
