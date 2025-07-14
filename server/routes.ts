import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  insertUserSchema, insertUserNoteSchema, insertBookmarkSchema, 
  insertHighlightSchema, insertForumPostSchema, insertForumVoteSchema,
  insertUserPreferencesSchema 
} from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // User routes
  app.post("/api/users", async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      const user = await storage.createUser(userData);
      res.json(user);
    } catch (error) {
      res.status(400).json({ error: "Invalid user data" });
    }
  });

  app.get("/api/users/:id", async (req, res) => {
    try {
      const user = await storage.getUser(req.params.id);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      res.json(user);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch user" });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const { email } = req.body;
      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.status(401).json({ error: "Invalid credentials" });
      }
      res.json(user);
    } catch (error) {
      res.status(500).json({ error: "Login failed" });
    }
  });

  // User notes routes
  app.get("/api/users/:userId/notes", async (req, res) => {
    try {
      const notes = await storage.getUserNotes(req.params.userId);
      res.json(notes);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch notes" });
    }
  });

  app.post("/api/notes", async (req, res) => {
    try {
      const noteData = insertUserNoteSchema.parse(req.body);
      const note = await storage.createUserNote(noteData);
      res.json(note);
    } catch (error) {
      res.status(400).json({ error: "Invalid note data" });
    }
  });

  app.put("/api/notes/:id", async (req, res) => {
    try {
      const { note } = req.body;
      const updatedNote = await storage.updateUserNote(parseInt(req.params.id), note);
      res.json(updatedNote);
    } catch (error) {
      res.status(400).json({ error: "Failed to update note" });
    }
  });

  app.delete("/api/notes/:id", async (req, res) => {
    try {
      await storage.deleteUserNote(parseInt(req.params.id));
      res.json({ success: true });
    } catch (error) {
      res.status(400).json({ error: "Failed to delete note" });
    }
  });

  // Bookmarks routes
  app.get("/api/users/:userId/bookmarks", async (req, res) => {
    try {
      const bookmarks = await storage.getUserBookmarks(req.params.userId);
      res.json(bookmarks);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch bookmarks" });
    }
  });

  app.post("/api/bookmarks", async (req, res) => {
    try {
      const bookmarkData = insertBookmarkSchema.parse(req.body);
      const bookmark = await storage.createBookmark(bookmarkData);
      res.json(bookmark);
    } catch (error) {
      res.status(400).json({ error: "Invalid bookmark data" });
    }
  });

  app.delete("/api/bookmarks/:id", async (req, res) => {
    try {
      await storage.deleteBookmark(parseInt(req.params.id));
      res.json({ success: true });
    } catch (error) {
      res.status(400).json({ error: "Failed to delete bookmark" });
    }
  });

  // Highlights routes
  app.get("/api/users/:userId/highlights", async (req, res) => {
    try {
      const highlights = await storage.getUserHighlights(req.params.userId);
      res.json(highlights);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch highlights" });
    }
  });

  app.post("/api/highlights", async (req, res) => {
    try {
      const highlightData = insertHighlightSchema.parse(req.body);
      const highlight = await storage.createHighlight(highlightData);
      res.json(highlight);
    } catch (error) {
      res.status(400).json({ error: "Invalid highlight data" });
    }
  });

  app.delete("/api/highlights/:id", async (req, res) => {
    try {
      await storage.deleteHighlight(parseInt(req.params.id));
      res.json({ success: true });
    } catch (error) {
      res.status(400).json({ error: "Failed to delete highlight" });
    }
  });

  // Forum routes
  app.get("/api/forum/posts", async (req, res) => {
    try {
      const posts = await storage.getForumPosts();
      res.json(posts);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch forum posts" });
    }
  });

  app.post("/api/forum/posts", async (req, res) => {
    try {
      const postData = insertForumPostSchema.parse(req.body);
      const post = await storage.createForumPost(postData);
      res.json(post);
    } catch (error) {
      res.status(400).json({ error: "Invalid post data" });
    }
  });

  app.get("/api/forum/posts/:id/votes", async (req, res) => {
    try {
      const votes = await storage.getForumVotes(parseInt(req.params.id));
      res.json(votes);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch votes" });
    }
  });

  app.post("/api/forum/votes", async (req, res) => {
    try {
      const voteData = insertForumVoteSchema.parse(req.body);
      const vote = await storage.createForumVote(voteData);
      res.json(vote);
    } catch (error) {
      res.status(400).json({ error: "Invalid vote data" });
    }
  });

  // User preferences routes
  app.get("/api/users/:userId/preferences", async (req, res) => {
    try {
      const preferences = await storage.getUserPreferences(req.params.userId);
      if (!preferences) {
        return res.status(404).json({ error: "Preferences not found" });
      }
      res.json(preferences);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch preferences" });
    }
  });

  app.post("/api/preferences", async (req, res) => {
    try {
      const preferencesData = insertUserPreferencesSchema.parse(req.body);
      const preferences = await storage.createUserPreferences(preferencesData);
      res.json(preferences);
    } catch (error) {
      res.status(400).json({ error: "Invalid preferences data" });
    }
  });

  app.put("/api/users/:userId/preferences", async (req, res) => {
    try {
      const preferences = await storage.updateUserPreferences(req.params.userId, req.body);
      res.json(preferences);
    } catch (error) {
      res.status(400).json({ error: "Failed to update preferences" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
