import { Router } from "express";
import { userController } from "../controllers/userController";
import { validateRequest } from "../middleware/validateRequest";
import { CreateUserDto, UpdateUserDto } from "../dto/user.dto";

const router = Router();

// GET /api/users - Get all users (paginated)
router.get("/", (req, res, next) => userController.getAll(req, res, next));

// GET /api/users/:id - Get user by ID
router.get("/:id", (req, res, next) => userController.getById(req, res, next));

// POST /api/users - Create new user
router.post(
  "/",
  validateRequest(CreateUserDto),
  (req, res, next) => userController.create(req, res, next)
);

// PUT /api/users/:id - Update user
router.put(
  "/:id",
  validateRequest(UpdateUserDto),
  (req, res, next) => userController.update(req, res, next)
);

// PATCH /api/users/:id - Partial update
router.patch(
  "/:id",
  validateRequest(UpdateUserDto),
  (req, res, next) => userController.update(req, res, next)
);

// DELETE /api/users/:id - Soft delete user
router.delete("/:id", (req, res, next) => userController.delete(req, res, next));

// POST /api/users/:id/restore - Restore soft-deleted user
router.post("/:id/restore", (req, res, next) => userController.restore(req, res, next));

export { router as userRoutes };
