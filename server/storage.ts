import { 
  users, userNotes, bookmarks, highlights, forumPosts, forumVotes, userPreferences,
  type User, type InsertUser, type UserNote, type InsertUserNote,
  type Bookmark, type InsertBookmark, type Highlight, type InsertHighlight,
  type ForumPost, type InsertForumPost, type ForumVote, type InsertForumVote,
  type UserPreferences, type InsertUserPreferences
} from "@shared/schema";

export interface IStorage {
  // User management
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // User notes
  getUserNotes(userId: string): Promise<UserNote[]>;
  getUserNoteByVerse(userId: string, verseRef: string): Promise<UserNote | undefined>;
  createUserNote(note: InsertUserNote): Promise<UserNote>;
  updateUserNote(id: number, note: string): Promise<UserNote>;
  deleteUserNote(id: number): Promise<void>;
  
  // Bookmarks
  getUserBookmarks(userId: string): Promise<Bookmark[]>;
  createBookmark(bookmark: InsertBookmark): Promise<Bookmark>;
  deleteBookmark(id: number): Promise<void>;
  
  // Highlights
  getUserHighlights(userId: string): Promise<Highlight[]>;
  getHighlightsByVerse(userId: string, verseRef: string): Promise<Highlight[]>;
  createHighlight(highlight: InsertHighlight): Promise<Highlight>;
  deleteHighlight(id: number): Promise<void>;
  
  // Forum
  getForumPosts(): Promise<ForumPost[]>;
  getForumPost(id: number): Promise<ForumPost | undefined>;
  createForumPost(post: InsertForumPost): Promise<ForumPost>;
  updateForumPost(id: number, title: string, body: string): Promise<ForumPost>;
  deleteForumPost(id: number): Promise<void>;
  
  // Forum votes
  getForumVotes(postId: number): Promise<ForumVote[]>;
  getUserVote(userId: string, postId: number): Promise<ForumVote | undefined>;
  createForumVote(vote: InsertForumVote): Promise<ForumVote>;
  updateForumVote(id: number, value: number): Promise<ForumVote>;
  deleteForumVote(id: number): Promise<void>;
  
  // User preferences
  getUserPreferences(userId: string): Promise<UserPreferences | undefined>;
  createUserPreferences(preferences: InsertUserPreferences): Promise<UserPreferences>;
  updateUserPreferences(userId: string, preferences: Partial<UserPreferences>): Promise<UserPreferences>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User> = new Map();
  private userNotes: Map<number, UserNote> = new Map();
  private bookmarks: Map<number, Bookmark> = new Map();
  private highlights: Map<number, Highlight> = new Map();
  private forumPosts: Map<number, ForumPost> = new Map();
  private forumVotes: Map<number, ForumVote> = new Map();
  private userPreferences: Map<string, UserPreferences> = new Map();
  
  private currentUserId = 1;
  private currentNoteId = 1;
  private currentBookmarkId = 1;
  private currentHighlightId = 1;
  private currentForumPostId = 1;
  private currentForumVoteId = 1;
  private currentPreferencesId = 1;

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.email === email);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = `user_${this.currentUserId++}`;
    const user: User = {
      ...insertUser,
      id,
      createdAt: new Date(),
    };
    this.users.set(id, user);
    return user;
  }

  async getUserNotes(userId: string): Promise<UserNote[]> {
    return Array.from(this.userNotes.values()).filter(note => note.userId === userId);
  }

  async getUserNoteByVerse(userId: string, verseRef: string): Promise<UserNote | undefined> {
    return Array.from(this.userNotes.values()).find(note => 
      note.userId === userId && note.verseRef === verseRef
    );
  }

  async createUserNote(insertNote: InsertUserNote): Promise<UserNote> {
    const id = this.currentNoteId++;
    const note: UserNote = {
      ...insertNote,
      id,
      updatedAt: new Date(),
    };
    this.userNotes.set(id, note);
    return note;
  }

  async updateUserNote(id: number, noteText: string): Promise<UserNote> {
    const note = this.userNotes.get(id);
    if (!note) throw new Error("Note not found");
    
    const updatedNote = { ...note, note: noteText, updatedAt: new Date() };
    this.userNotes.set(id, updatedNote);
    return updatedNote;
  }

  async deleteUserNote(id: number): Promise<void> {
    this.userNotes.delete(id);
  }

  async getUserBookmarks(userId: string): Promise<Bookmark[]> {
    return Array.from(this.bookmarks.values()).filter(bookmark => bookmark.userId === userId);
  }

  async createBookmark(insertBookmark: InsertBookmark): Promise<Bookmark> {
    const id = this.currentBookmarkId++;
    const bookmark: Bookmark = {
      ...insertBookmark,
      id,
      color: insertBookmark.color || "#ef4444",
      createdAt: new Date(),
    };
    this.bookmarks.set(id, bookmark);
    return bookmark;
  }

  async deleteBookmark(id: number): Promise<void> {
    this.bookmarks.delete(id);
  }

  async getUserHighlights(userId: string): Promise<Highlight[]> {
    return Array.from(this.highlights.values()).filter(highlight => highlight.userId === userId);
  }

  async getHighlightsByVerse(userId: string, verseRef: string): Promise<Highlight[]> {
    return Array.from(this.highlights.values()).filter(highlight => 
      highlight.userId === userId && highlight.verseRef === verseRef
    );
  }

  async createHighlight(insertHighlight: InsertHighlight): Promise<Highlight> {
    const id = this.currentHighlightId++;
    const highlight: Highlight = {
      ...insertHighlight,
      id,
      createdAt: new Date(),
    };
    this.highlights.set(id, highlight);
    return highlight;
  }

  async deleteHighlight(id: number): Promise<void> {
    this.highlights.delete(id);
  }

  async getForumPosts(): Promise<ForumPost[]> {
    return Array.from(this.forumPosts.values()).sort((a, b) => 
      new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime()
    );
  }

  async getForumPost(id: number): Promise<ForumPost | undefined> {
    return this.forumPosts.get(id);
  }

  async createForumPost(insertPost: InsertForumPost): Promise<ForumPost> {
    const id = this.currentForumPostId++;
    const post: ForumPost = {
      ...insertPost,
      id,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.forumPosts.set(id, post);
    return post;
  }

  async updateForumPost(id: number, title: string, body: string): Promise<ForumPost> {
    const post = this.forumPosts.get(id);
    if (!post) throw new Error("Post not found");
    
    const updatedPost = { ...post, title, body, updatedAt: new Date() };
    this.forumPosts.set(id, updatedPost);
    return updatedPost;
  }

  async deleteForumPost(id: number): Promise<void> {
    this.forumPosts.delete(id);
  }

  async getForumVotes(postId: number): Promise<ForumVote[]> {
    return Array.from(this.forumVotes.values()).filter(vote => vote.postId === postId);
  }

  async getUserVote(userId: string, postId: number): Promise<ForumVote | undefined> {
    return Array.from(this.forumVotes.values()).find(vote => 
      vote.userId === userId && vote.postId === postId
    );
  }

  async createForumVote(insertVote: InsertForumVote): Promise<ForumVote> {
    const id = this.currentForumVoteId++;
    const vote: ForumVote = {
      ...insertVote,
      id,
    };
    this.forumVotes.set(id, vote);
    return vote;
  }

  async updateForumVote(id: number, value: number): Promise<ForumVote> {
    const vote = this.forumVotes.get(id);
    if (!vote) throw new Error("Vote not found");
    
    const updatedVote = { ...vote, value };
    this.forumVotes.set(id, updatedVote);
    return updatedVote;
  }

  async deleteForumVote(id: number): Promise<void> {
    this.forumVotes.delete(id);
  }

  async getUserPreferences(userId: string): Promise<UserPreferences | undefined> {
    return this.userPreferences.get(userId);
  }

  async createUserPreferences(insertPreferences: InsertUserPreferences): Promise<UserPreferences> {
    const id = this.currentPreferencesId++;
    const preferences: UserPreferences = {
      ...insertPreferences,
      id,
      theme: insertPreferences.theme || "light-mode",
      selectedTranslations: insertPreferences.selectedTranslations || ["KJV"],
      showNotes: insertPreferences.showNotes || false,
      showProphecy: insertPreferences.showProphecy || false,
      showContext: insertPreferences.showContext || false,
      fontSize: insertPreferences.fontSize || "medium",
      lastVersePosition: insertPreferences.lastVersePosition || null,
      columnLayout: insertPreferences.columnLayout || null,
      updatedAt: new Date(),
    };
    this.userPreferences.set(insertPreferences.userId, preferences);
    return preferences;
  }

  async updateUserPreferences(userId: string, updates: Partial<UserPreferences>): Promise<UserPreferences> {
    const existing = this.userPreferences.get(userId);
    if (!existing) throw new Error("Preferences not found");
    
    const updated = { ...existing, ...updates, updatedAt: new Date() };
    this.userPreferences.set(userId, updated);
    return updated;
  }
}

export const storage = new MemStorage();
