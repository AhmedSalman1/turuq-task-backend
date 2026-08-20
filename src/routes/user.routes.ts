import { Router } from "express";
import { protect } from "../middleware/protect";
import { validate } from "../middleware/validate";
import { restrictTo } from "../middleware/restrictTo";
import {
	createUserSchema,
	getUsersSchema,
	updateUserSchema,
	userIdParamsSchema,
} from "../validators/user.validator";
import * as userController from "../controllers/user.controller";

const router = Router();

router.use(protect);
router.use(restrictTo("admin"));

router
	.route("/")
	.get(validate(getUsersSchema), userController.getUsers)
	.post(validate(createUserSchema), userController.createUser);

router
	.route("/:id")
	.get(validate(userIdParamsSchema), userController.getUserById)
	.put(validate(updateUserSchema), userController.updateUser)
	.delete(validate(userIdParamsSchema), userController.deleteUser);

export default router;
