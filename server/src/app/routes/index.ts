import express, { Router } from "express";
import userRoute from "../modules/users/user.route";
import courseRoute from "../modules/course/course.route";

const router = express.Router();

interface IModuleRouter {
  path: string;
  route: Router;
}

const moduleRoutes: IModuleRouter[] = [
  { path: "/auth/user", route: userRoute },
  { path: "/course", route: courseRoute },
];

//Call All route dynamically
moduleRoutes.forEach((moduleRoute: IModuleRouter) =>
  router.use(moduleRoute.path, moduleRoute.route)
);

export default router;
