import { Request, Response, NextFunction } from "express";
import { userService } from "../services/userService";

export class UserController {
  async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const search = req.query.search as string | undefined;
      const isActive = req.query.isActive === "true" ? true :
        req.query.isActive === "false" ? false : undefined;
      const sortBy = (req.query.sortBy as string) || "createdAt";
      const sortOrder = (req.query.sortOrder as "ASC" | "DESC") || "DESC";

      const result = await userService.findAll({
        page,
        limit,
        search,
        isActive,
        sortBy,
        sortOrder,
      });

      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const id = parseInt(req.params.id);

      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid user ID" });
      }

      const user = await userService.findById(id);

      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      res.json(user);
    } catch (error) {
      next(error);
    }
  }

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const user = await userService.create(req.body);
      res.status(201).json(user);
    } catch (error: any) {
      if (error.message === "Email already registered") {
        return res.status(409).json({ message: error.message });
      }
      next(error);
    }
  }

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const id = parseInt(req.params.id);

      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid user ID" });
      }

      const user = await userService.update(id, req.body);
      res.json(user);
    } catch (error: any) {
      if (error.message === "User not found") {
        return res.status(404).json({ message: error.message });
      }
      if (error.message === "Email already in use") {
        return res.status(409).json({ message: error.message });
      }
      next(error);
    }
  }

  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const id = parseInt(req.params.id);

      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid user ID" });
      }

      await userService.delete(id);
      res.status(204).send();
    } catch (error: any) {
      if (error.message === "User not found") {
        return res.status(404).json({ message: error.message });
      }
      next(error);
    }
  }

  async restore(req: Request, res: Response, next: NextFunction) {
    try {
      const id = parseInt(req.params.id);

      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid user ID" });
      }

      await userService.restore(id);
      res.json({ message: "User restored successfully" });
    } catch (error: any) {
      if (error.message === "User not found" || error.message === "User is not deleted") {
        return res.status(404).json({ message: error.message });
      }
      next(error);
    }
  }
}

export const userController = new UserController();
