import type { Request, Response, NextFunction } from "express";
import { uploadsService } from "../services/uploads.service";
import { signUploadSchema } from "../schemas/uploads";

export const uploadsController = {
  async signProductImage(req: Request, res: Response, next: NextFunction) {
    try {
      const { contentType } = signUploadSchema.parse(req.body);
      const result = await uploadsService.signProductImageUpload(contentType);
      res.json(result);
    } catch (err) {
      next(err);
    }
  },
};
