import { Router, Request, Response } from 'express';
import { PostService } from '../services/PostService';

const router = Router();
const postService = new PostService();

// Helper to generate slug from title
const generateSlug = (title: string): string => {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
};

// GET /posts - Get all posts
router.get('/', async (req: Request, res: Response) => {
  try {
    const includeDeleted = req.query.includeDeleted === 'true';
    const posts = await postService.findAll(includeDeleted);
    res.json(posts);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch posts' });
  }
});

// GET /posts/published - Get published posts only
router.get('/published', async (req: Request, res: Response) => {
  try {
    const posts = await postService.findPublished();
    res.json(posts);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch published posts' });
  }
});

// GET /posts/stats - Get post statistics
router.get('/stats', async (req: Request, res: Response) => {
  try {
    const stats = await postService.getPostStats();
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch post stats' });
  }
});

// GET /posts/search - Search posts
router.get('/search', async (req: Request, res: Response) => {
  try {
    const query = req.query.q as string;
    if (!query) {
      return res.status(400).json({ error: 'Search query is required' });
    }
    const posts = await postService.searchPosts(query);
    res.json(posts);
  } catch (error) {
    res.status(500).json({ error: 'Failed to search posts' });
  }
});

// GET /posts/author/:authorId - Get posts by author
router.get('/author/:authorId', async (req: Request, res: Response) => {
  try {
    const posts = await postService.findByAuthor(parseInt(req.params.authorId));
    res.json(posts);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch posts by author' });
  }
});

// GET /posts/:id - Get post by ID
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const post = await postService.findById(parseInt(req.params.id));
    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }
    // Increment view count
    await postService.incrementViewCount(post.id);
    res.json(post);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch post' });
  }
});

// GET /posts/slug/:slug - Get post by slug
router.get('/slug/:slug', async (req: Request, res: Response) => {
  try {
    const post = await postService.findBySlug(req.params.slug);
    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }
    await postService.incrementViewCount(post.id);
    res.json(post);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch post' });
  }
});

// POST /posts - Create new post
router.post('/', async (req: Request, res: Response) => {
  try {
    const { title, content, excerpt, authorId } = req.body;

    if (!title || !content || !authorId) {
      return res.status(400).json({ error: 'Title, content, and authorId are required' });
    }

    const slug = generateSlug(title) + '-' + Date.now();

    const post = await postService.create({
      title,
      slug,
      content,
      excerpt,
      authorId,
    });
    res.status(201).json(post);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create post' });
  }
});

// PUT /posts/:id - Update post
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const post = await postService.update(parseInt(req.params.id), req.body);
    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }
    res.json(post);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update post' });
  }
});

// PATCH /posts/:id/publish - Publish post
router.patch('/:id/publish', async (req: Request, res: Response) => {
  try {
    const post = await postService.publish(parseInt(req.params.id));
    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }
    res.json(post);
  } catch (error) {
    res.status(500).json({ error: 'Failed to publish post' });
  }
});

// PATCH /posts/:id/archive - Archive post
router.patch('/:id/archive', async (req: Request, res: Response) => {
  try {
    const post = await postService.archive(parseInt(req.params.id));
    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }
    res.json(post);
  } catch (error) {
    res.status(500).json({ error: 'Failed to archive post' });
  }
});

// DELETE /posts/:id - Soft delete post
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const deleted = await postService.softDelete(parseInt(req.params.id));
    if (!deleted) {
      return res.status(404).json({ error: 'Post not found' });
    }
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete post' });
  }
});

// PATCH /posts/:id/restore - Restore soft-deleted post
router.patch('/:id/restore', async (req: Request, res: Response) => {
  try {
    const restored = await postService.restore(parseInt(req.params.id));
    if (!restored) {
      return res.status(404).json({ error: 'Post not found' });
    }
    res.json({ message: 'Post restored successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to restore post' });
  }
});

// DELETE /posts/:id/permanent - Permanently delete post
router.delete('/:id/permanent', async (req: Request, res: Response) => {
  try {
    const deleted = await postService.hardDelete(parseInt(req.params.id));
    if (!deleted) {
      return res.status(404).json({ error: 'Post not found' });
    }
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Failed to permanently delete post' });
  }
});

export default router;
