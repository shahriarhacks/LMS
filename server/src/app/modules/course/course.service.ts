import { ICourse } from "./course.interface";
import Course from "./course.model";

export const createCourseService = async (data: ICourse): Promise<ICourse> => {
  return await Course.create(data);
};

export const editCourseService = async (id: string, data: Partial<ICourse>) => {
  return await Course.findByIdAndUpdate(
    id,
    {
      $set: data,
    },
    { new: true }
  );
};

export const getSingleCourseService = async (id: String) => {
  return await Course.findById(id).select(
    "-courseData.videoUrl -courseData.suggestion -courseData.links -courseData.questions"
  );
};

export const getAllCourseService = async () => {
  return await Course.find({}).select(
    "-courseData.videoUrl -courseData.suggestion -courseData.links -courseData.questions"
  );
};
export const getCourseByUserService = async (id: string) => {
  return await Course.findById(id);
};
