import express from 'express';
import { db } from '../db.js';
import { notes, highlights, bookmarks, users, userPreferences, profiles } from '../../shared/schema.js';
import { eq, and } from 'drizzle-orm';
import { insertNoteSchema, insertHighlightSchema, insertBookmarkSchema, insertUserPreferencesSchema, insertProfileSchema } from '../../shared/schema.js';
import { sanitizePlainText } from '../sanitize.js';

const router = express.Router();

// Middleware to get user from session/auth
const requireAuth = (req: any, res: any, next: any) => {
  // In a real app, you'd validate the session/token here
  // For now, we'll get the user ID from the request body or headers
  const userId = req.headers['x-user-id'] || req.body.userId;
  if (!userId) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  req.userId = userId;
  next();
};

// Notes endpoints
router.get('/notes', requireAuth, async (req: any, res) => {
  try {
    const notes = await db
      .select()
      .from(notes)
      .where(eq(notes.user_id, req.userId));
    res.json(notes);
  } catch (error) {
    console.error('Error fetching notes:', error);
    res.status(500).json({ error: 'Failed to fetch notes' });
  }
});

router.post('/notes', requireAuth, async (req: any, res) => {
  try {
    const validatedData = insertNoteSchema.parse({
      ...req.body,
      user_id: req.userId
    });
    
    // Sanitize note text to prevent XSS
    if (validatedData.text) {
      validatedData.text = sanitizePlainText(validatedData.text, 50000);
    }
    
    const [note] = await db
      .insert(notes)
      .values(validatedData)
      .returning();
    
    res.json(note);
  } catch (error) {
    console.error('Error creating note:', error);
    res.status(400).json({ error: 'Failed to create note' });
  }
});

router.put('/notes/:id', requireAuth, async (req: any, res) => {
  try {
    const noteId = parseInt(req.params.id);
    const validatedData = insertNoteSchema.parse({
      ...req.body,
      user_id: req.userId
    });
    
    // Sanitize note text to prevent XSS
    if (validatedData.text) {
      validatedData.text = sanitizePlainText(validatedData.text, 50000);
    }
    
    const [note] = await db
      .update(notes)
      .set({ ...validatedData, updatedAt: new Date() })
      .where(and(eq(notes.id, noteId), eq(notes.user_id, req.userId)))
      .returning();
    
    if (!note) {
      return res.status(404).json({ error: 'Note not found' });
    }
    
    res.json(note);
  } catch (error) {
    console.error('Error updating note:', error);
    res.status(400).json({ error: 'Failed to update note' });
  }
});

router.delete('/notes/:id', requireAuth, async (req: any, res) => {
  try {
    const noteId = parseInt(req.params.id);
    
    const [note] = await db
      .delete(notes)
      .where(and(eq(notes.id, noteId), eq(notes.user_id, req.userId)))
      .returning();
    
    if (!note) {
      return res.status(404).json({ error: 'Note not found' });
    }
    
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting note:', error);
    res.status(500).json({ error: 'Failed to delete note' });
  }
});

// Highlights endpoints
router.get('/highlights', requireAuth, async (req: any, res) => {
  try {
    const userHighlights = await db
      .select()
      .from(highlights)
      .where(eq(highlights.user_id, req.userId));
    res.json(userHighlights);
  } catch (error) {
    console.error('Error fetching highlights:', error);
    res.status(500).json({ error: 'Failed to fetch highlights' });
  }
});

router.post('/highlights', requireAuth, async (req: any, res) => {
  try {
    const validatedData = insertHighlightSchema.parse({
      ...req.body,
      user_id: req.userId
    });
    
    const [highlight] = await db
      .insert(highlights)
      .values(validatedData)
      .returning();
    
    res.json(highlight);
  } catch (error) {
    console.error('Error creating highlight:', error);
    res.status(400).json({ error: 'Failed to create highlight' });
  }
});

router.delete('/highlights/:id', requireAuth, async (req: any, res) => {
  try {
    const highlightId = parseInt(req.params.id);
    
    const [highlight] = await db
      .delete(highlights)
      .where(and(eq(highlights.id, highlightId), eq(highlights.user_id, req.userId)))
      .returning();
    
    if (!highlight) {
      return res.status(404).json({ error: 'Highlight not found' });
    }
    
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting highlight:', error);
    res.status(500).json({ error: 'Failed to delete highlight' });
  }
});

// Bookmarks endpoints
router.get('/bookmarks', requireAuth, async (req: any, res) => {
  try {
    const userBookmarks = await db
      .select()
      .from(bookmarks)
      .where(eq(bookmarks.user_id, req.userId));
    res.json(userBookmarks);
  } catch (error) {
    console.error('Error fetching bookmarks:', error);
    res.status(500).json({ error: 'Failed to fetch bookmarks' });
  }
});

router.post('/bookmarks', requireAuth, async (req: any, res) => {
  try {
    const validatedData = insertBookmarkSchema.parse({
      ...req.body,
      user_id: req.userId
    });
    
    console.log('Creating bookmark with validated data:', validatedData);
    
    const [bookmark] = await db
      .insert(bookmarks)
      .values(validatedData)
      .returning();
    
    res.json(bookmark);
  } catch (error) {
    console.error('Error creating bookmark:', error);
    res.status(400).json({ error: 'Failed to create bookmark' });
  }
});

router.put('/bookmarks/:id', requireAuth, async (req: any, res) => {
  try {
    const bookmarkId = parseInt(req.params.id);
    let { name, color } = req.body;
    
    // Sanitize bookmark name to prevent XSS
    if (name) {
      name = sanitizePlainText(name, 200);
    }
    
    const [bookmark] = await db
      .update(bookmarks)
      .set({ name, color })
      .where(and(eq(bookmarks.id, bookmarkId), eq(bookmarks.user_id, req.userId)))
      .returning();
    
    if (!bookmark) {
      return res.status(404).json({ error: 'Bookmark not found' });
    }
    
    res.json(bookmark);
  } catch (error) {
    console.error('Error updating bookmark:', error);
    res.status(400).json({ error: 'Failed to update bookmark' });
  }
});

router.delete('/bookmarks/:id', requireAuth, async (req: any, res) => {
  try {
    const bookmarkId = parseInt(req.params.id);
    
    const [bookmark] = await db
      .delete(bookmarks)
      .where(and(eq(bookmarks.id, bookmarkId), eq(bookmarks.user_id, req.userId)))
      .returning();
    
    if (!bookmark) {
      return res.status(404).json({ error: 'Bookmark not found' });
    }
    
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting bookmark:', error);
    res.status(500).json({ error: 'Failed to delete bookmark' });
  }
});

// User preferences endpoints
router.get('/preferences', requireAuth, async (req: any, res) => {
  try {
    const [preferences] = await db
      .select()
      .from(userPreferences)
      .where(eq(userPreferences.userId, req.userId));
    
    res.json(preferences || {});
  } catch (error) {
    console.error('Error fetching preferences:', error);
    res.status(500).json({ error: 'Failed to fetch preferences' });
  }
});

router.put('/preferences', requireAuth, async (req: any, res) => {
  try {
    const validatedData = insertUserPreferencesSchema.parse({
      ...req.body,
      user_id: req.userId
    });
    
    // Upsert preferences
    const [preferences] = await db
      .insert(userPreferences)
      .values(validatedData)
      .onConflictDoUpdate({
        target: userPreferences.userId,
        set: { ...validatedData, updatedAt: new Date() }
      })
      .returning();
    
    res.json(preferences);
  } catch (error) {
    console.error('Error updating preferences:', error);
    res.status(400).json({ error: 'Failed to update preferences' });
  }
});

// Profile endpoints
router.get('/profile', requireAuth, async (req: any, res) => {
  try {
    const [profile] = await db
      .select()
      .from(profiles)
      .where(eq(profiles.id, req.userId));
    
    res.json(profile || null);
  } catch (error) {
    console.error('Error fetching profile:', error);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

router.put('/profile', requireAuth, async (req: any, res) => {
  try {
    const validatedData = insertProfileSchema.parse({
      id: req.userId,
      ...req.body
    });
    
    // Sanitize bio to prevent XSS
    if (validatedData.bio) {
      validatedData.bio = sanitizePlainText(validatedData.bio, 5000);
    }
    
    // Upsert profile
    const [profile] = await db
      .insert(profiles)
      .values(validatedData)
      .onConflictDoUpdate({
        target: profiles.id,
        set: { 
          name: validatedData.name,
          bio: validatedData.bio,
          updatedAt: new Date() 
        }
      })
      .returning();
    
    res.json(profile);
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(400).json({ error: 'Failed to update profile' });
  }
});

export default router;