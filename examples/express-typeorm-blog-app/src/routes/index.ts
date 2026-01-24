import { Router } from 'express';
import authorRoutes from './authorRoutes';
import postRoutes from './postRoutes';
import commentRoutes from './commentRoutes';

const router = Router();

router.use('/authors', authorRoutes);
router.use('/posts', postRoutes);
router.use('/comments', commentRoutes);

export default router;
