import { Router, Request, Response } from 'express';
import { AuthorService } from '../services/AuthorService';

const router = Router();
const authorService = new AuthorService();

// GET /authors - Get all authors
router.get('/', async (req: Request, res: Response) => {
  try {
    const authors = await authorService.findAll();
    res.json(authors);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch authors' });
  }
});

// GET /authors/stats - Get authors with post count
router.get('/stats', async (req: Request, res: Response) => {
  try {
    const stats = await authorService.getAuthorWithPostCount();
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch author stats' });
  }
});

// GET /authors/:id - Get author by ID
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const author = await authorService.findById(parseInt(req.params.id));
    if (!author) {
      return res.status(404).json({ error: 'Author not found' });
    }
    res.json(author);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch author' });
  }
});

// POST /authors - Create new author
router.post('/', async (req: Request, res: Response) => {
  try {
    const { firstName, lastName, email, bio, avatarUrl } = req.body;

    // Check if email already exists
    const existing = await authorService.findByEmail(email);
    if (existing) {
      return res.status(400).json({ error: 'Email already exists' });
    }

    const author = await authorService.create({
      firstName,
      lastName,
      email,
      bio,
      avatarUrl,
    });
    res.status(201).json(author);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create author' });
  }
});

// PUT /authors/:id - Update author
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const author = await authorService.update(parseInt(req.params.id), req.body);
    if (!author) {
      return res.status(404).json({ error: 'Author not found' });
    }
    res.json(author);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update author' });
  }
});

// DELETE /authors/:id - Delete author
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const deleted = await authorService.delete(parseInt(req.params.id));
    if (!deleted) {
      return res.status(404).json({ error: 'Author not found' });
    }
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete author' });
  }
});

// PATCH /authors/:id/deactivate - Deactivate author
router.patch('/:id/deactivate', async (req: Request, res: Response) => {
  try {
    const author = await authorService.deactivate(parseInt(req.params.id));
    if (!author) {
      return res.status(404).json({ error: 'Author not found' });
    }
    res.json(author);
  } catch (error) {
    res.status(500).json({ error: 'Failed to deactivate author' });
  }
});

export default router;
