import { Router, Request, Response } from 'express';
import { CommentService } from '../services/CommentService';

const router = Router();
const commentService = new CommentService();

// GET /comments/pending - Get pending comments (admin)
router.get('/pending', async (req: Request, res: Response) => {
  try {
    const comments = await commentService.getPendingComments();
    res.json(comments);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch pending comments' });
  }
});

// GET /comments/post/:postId - Get comments for a post
router.get('/post/:postId', async (req: Request, res: Response) => {
  try {
    const approvedOnly = req.query.all !== 'true';
    const comments = await commentService.findByPost(
      parseInt(req.params.postId),
      approvedOnly
    );
    res.json(comments);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch comments' });
  }
});

// GET /comments/post/:postId/count - Get comment count for a post
router.get('/post/:postId/count', async (req: Request, res: Response) => {
  try {
    const count = await commentService.getCommentCountByPost(
      parseInt(req.params.postId)
    );
    res.json({ count });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch comment count' });
  }
});

// GET /comments/:id - Get comment by ID
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const comment = await commentService.findById(parseInt(req.params.id));
    if (!comment) {
      return res.status(404).json({ error: 'Comment not found' });
    }
    res.json(comment);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch comment' });
  }
});

// POST /comments - Create new comment
router.post('/', async (req: Request, res: Response) => {
  try {
    const { postId, authorName, authorEmail, content } = req.body;

    if (!postId || !authorName || !authorEmail || !content) {
      return res.status(400).json({
        error: 'postId, authorName, authorEmail, and content are required',
      });
    }

    const comment = await commentService.create({
      postId,
      authorName,
      authorEmail,
      content,
    });
    res.status(201).json(comment);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create comment' });
  }
});

// POST /comments/:id/reply - Reply to a comment
router.post('/:id/reply', async (req: Request, res: Response) => {
  try {
    const { authorName, authorEmail, content } = req.body;

    if (!authorName || !authorEmail || !content) {
      return res.status(400).json({
        error: 'authorName, authorEmail, and content are required',
      });
    }

    const reply = await commentService.createReply(parseInt(req.params.id), {
      authorName,
      authorEmail,
      content,
    });

    if (!reply) {
      return res.status(404).json({ error: 'Parent comment not found' });
    }

    res.status(201).json(reply);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create reply' });
  }
});

// PATCH /comments/:id/approve - Approve comment
router.patch('/:id/approve', async (req: Request, res: Response) => {
  try {
    const comment = await commentService.approve(parseInt(req.params.id));
    if (!comment) {
      return res.status(404).json({ error: 'Comment not found' });
    }
    res.json(comment);
  } catch (error) {
    res.status(500).json({ error: 'Failed to approve comment' });
  }
});

// DELETE /comments/:id - Delete comment
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const deleted = await commentService.delete(parseInt(req.params.id));
    if (!deleted) {
      return res.status(404).json({ error: 'Comment not found' });
    }
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete comment' });
  }
});

export default router;
