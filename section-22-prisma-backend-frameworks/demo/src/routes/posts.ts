import { Router, Request, Response } from 'express';
import prisma from '../lib/prisma';

const router = Router();

// GET /posts - List all published posts
router.get('/', async (req: Request, res: Response) => {
  try {
    const { published, authorId } = req.query;

    const posts = await prisma.post.findMany({
      where: {
        published: published === 'true' ? true : published === 'false' ? false : undefined,
        authorId: authorId as string | undefined,
      },
      include: {
        author: {
          select: { id: true, name: true, email: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json(posts);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch posts' });
  }
});

// GET /posts/:id - Get post by ID
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const post = await prisma.post.findUnique({
      where: { id },
      include: {
        author: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    res.json(post);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch post' });
  }
});

// POST /posts - Create post
router.post('/', async (req: Request, res: Response) => {
  try {
    const { title, content, authorId, published } = req.body;

    if (!title || !authorId) {
      return res.status(400).json({ error: 'Title and authorId are required' });
    }

    const post = await prisma.post.create({
      data: {
        title,
        content,
        authorId,
        published: published || false,
      },
      include: {
        author: {
          select: { id: true, name: true },
        },
      },
    });

    res.status(201).json(post);
  } catch (error: any) {
    if (error.code === 'P2003') {
      return res.status(400).json({ error: 'Author not found' });
    }
    res.status(500).json({ error: 'Failed to create post' });
  }
});

// PUT /posts/:id - Update post
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { title, content, published } = req.body;

    const post = await prisma.post.update({
      where: { id },
      data: { title, content, published },
    });

    res.json(post);
  } catch (error: any) {
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Post not found' });
    }
    res.status(500).json({ error: 'Failed to update post' });
  }
});

// PATCH /posts/:id/publish - Publish post
router.patch('/:id/publish', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const post = await prisma.post.update({
      where: { id },
      data: { published: true },
    });

    res.json(post);
  } catch (error: any) {
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Post not found' });
    }
    res.status(500).json({ error: 'Failed to publish post' });
  }
});

// DELETE /posts/:id - Delete post
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    await prisma.post.delete({
      where: { id },
    });

    res.status(204).send();
  } catch (error: any) {
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Post not found' });
    }
    res.status(500).json({ error: 'Failed to delete post' });
  }
});

export default router;
