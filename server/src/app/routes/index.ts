import express, { Router } from "express";

const router = express.Router();

interface IModuleRouter {
  path: string;
  route: Router;
}

const moduleRoutes: IModuleRouter[] = [];

//Call All route dynamically
moduleRoutes.forEach((moduleRoute: IModuleRouter) =>
  router.use(moduleRoute.path, moduleRoute.route)
);

export default router;
