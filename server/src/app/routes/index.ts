import express, { Router } from "express";
import userRoute from "../modules/users/user.route";

const router = express.Router();

interface IModuleRouter {
  path: string;
  route: Router;
}

const moduleRoutes: IModuleRouter[] = [{ path: "/auth", route: userRoute }];

//Call All route dynamically
moduleRoutes.forEach((moduleRoute: IModuleRouter) =>
  router.use(moduleRoute.path, moduleRoute.route)
);

export default router;
