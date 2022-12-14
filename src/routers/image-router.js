import { Router } from 'express';
import { imageUpload } from '../middlewares';

const imageRouter = Router();

// 이미지 등록 api
imageRouter.post(
  '/register',
  imageUpload.array('images'),
  async (req, res, next) => {
    try {
      // req.files에서 key값만 가져옴
      const imagePath = req.files.map((image) => image.key);

      res.status(200).json(imagePath);
    } catch (error) {
      next(error);
    }
  }
);

export { imageRouter };
