import { Request, Response, NextFunction } from "express";
import { validate } from "class-validator";
import { plainToInstance } from "class-transformer";

export function validateRequest(dtoClass: any) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const dtoInstance = plainToInstance(dtoClass, req.body);
    const errors = await validate(dtoInstance, {
      whitelist: true,
      forbidNonWhitelisted: true,
    });

    if (errors.length > 0) {
      const messages: Record<string, string[]> = {};

      for (const error of errors) {
        const field = error.property;
        const constraints = Object.values(error.constraints || {});
        messages[field] = constraints;
      }

      return res.status(400).json({
        status: "error",
        message: "Validation failed",
        errors: messages,
      });
    }

    req.body = dtoInstance;
    next();
  };
}
