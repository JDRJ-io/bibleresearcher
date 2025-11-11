import { pgTable, text, serial, integer, boolean, uuid, timestamp, smallint, bigint, primaryKey, unique } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").notNull().unique(),
  name: text("name").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const profiles = pgTable("profiles", {
  id: uuid("id").primaryKey(), // References auth.users.id (Supabase managed)
  email: text("email").notNull(),
  username: text("username").unique(),
  display_name: text("display_name"),
  avatar_url: text("avatar_url"),
  bio: text("bio"),
  tier: text("tier").default("free"), // 'free' or 'premium' or 'staff'
  role: text("role").default("user"), // 'user' or 'mod' or 'admin' or 'staff'
  subscription_id: text("subscription_id"),
  subscription_status: text("subscription_status"),
  premium_until: timestamp("premium_until"),
  stripe_customer_id: text("stripe_customer_id"),
  recovery_passkey_hash: text("recovery_passkey_hash"),
  marketing_opt_in: boolean("marketing_opt_in").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// User notes table
export const userNotes = pgTable("user_notes", {
  id: serial("id").primaryKey(),
  user_id: uuid("user_id").references(() => users.id).notNull(),
  translation: text("translation").notNull(),
  verse_key: text("verse_key").notNull(),
  body: text("body").notNull(),
  server_rev: integer("server_rev").notNull().default(1),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
}, (table) => ({
  userTranslationVerse: unique().on(table.user_id, table.translation, table.verse_key),
}));

// Legacy notes table (for migration compatibility)
export const notes = pgTable("notes", {
  id: serial("id").primaryKey(),
  user_id: uuid("user_id").references(() => users.id).notNull(),
  verse_ref: text("verse_ref").notNull(),
  text: text("text").notNull(),
});

// Legacy bookmarks table (for migration compatibility)
export const bookmarks = pgTable("bookmarks", {
  user_id: uuid("user_id").references(() => users.id).notNull(),
  name: text("name").notNull(),
  index_value: integer("index_value").notNull(),
  verse_ref: text("verse_ref"),
  color: text("color").default("#f00"),
  created_at: timestamp("created_at").defaultNow(),
}, (table) => ({
  pk: primaryKey({ columns: [table.user_id, table.name] }),
}));

// New user-specific bookmarks table
export const userBookmarks = pgTable("user_bookmarks", {
  id: serial("id").primaryKey(),
  user_id: uuid("user_id").references(() => users.id).notNull(),
  translation: text("translation").notNull(),
  verse_key: text("verse_key").notNull(),
  label: text("label"), // Optional bookmark label/name
  color_hex: text("color_hex"), // Optional color in hex format (e.g., #FF8C00)
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
}, (table) => ({
  userTranslationVerse: unique().on(table.user_id, table.translation, table.verse_key),
}));

// Legacy highlights table (for migration compatibility)
export const highlights = pgTable("highlights", {
  id: serial("id").primaryKey(),
  user_id: uuid("user_id").references(() => users.id).notNull(),
  verse_ref: text("verse_ref").notNull(),
  translation: text("translation").notNull(),
  start_pos: smallint("start_pos").notNull(),
  end_pos: smallint("end_pos").notNull(),
  color_hsl: text("color_hsl").notNull(),
  pending: boolean("pending").default(false), // Enables conflict-free sync
});

// New user-specific highlights table with segments
export const userHighlights = pgTable("user_highlights", {
  id: serial("id").primaryKey(),
  user_id: uuid("user_id").references(() => users.id).notNull(),
  translation: text("translation").notNull(),
  verse_key: text("verse_key").notNull(),
  segments: text("segments").notNull(), // JSON array of {start, end, color}
  text_len: integer("text_len"),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
}, (table) => ({
  userTranslationVerse: unique().on(table.user_id, table.translation, table.verse_key),
}));

export const forumPosts = pgTable("forum_posts", {
  id: serial("id").primaryKey(),
  userId: uuid("user_id").references(() => users.id).notNull(),
  title: text("title"),
  body: text("body").notNull(),
  postType: text("post_type").notNull().default("comment"), // comment, suggestion, bug, error, prayer
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const forumVotes = pgTable("forum_votes", {
  id: serial("id").primaryKey(),
  userId: uuid("user_id").references(() => users.id).notNull(),
  postId: integer("post_id").references(() => forumPosts.id).notNull(),
  value: smallint("value").notNull(), // 1 for upvote, -1 for downvote
});

export const userPreferences = pgTable("user_preferences", {
  id: serial("id").primaryKey(),
  userId: uuid("user_id").references(() => users.id).notNull().unique(),
  theme: text("theme").default("light-mode"),
  selectedTranslations: text("selected_translations").array().default(["KJV"]),
  showNotes: boolean("show_notes").default(false),
  showProphecy: boolean("show_prophecy").default(false),
  showContext: boolean("show_context").default(false),
  fontSize: text("font_size").default("medium"),
  lastVersePosition: text("last_verse_position"),
  columnLayout: text("column_layout"), // JSON string
  showJoystick: boolean("show_joystick").default(true),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Navigation history table - tracks last 10 verse visits
export const navigationHistory = pgTable("navigation_history", {
  id: serial("id").primaryKey(),
  user_id: uuid("user_id").references(() => users.id).notNull(),
  verse_reference: text("verse_reference").notNull(), // e.g., "John.3:16"
  translation: text("translation").notNull(),
  visited_at: timestamp("visited_at").defaultNow(),
});

// Enhanced user session data for autosave functionality with SQL function support
export const userSessions = pgTable("user_sessions", {
  id: serial("id").primaryKey(),
  user_id: uuid("user_id").references(() => users.id).notNull().unique(),
  last_verse_position: text("last_verse_position"), // Current verse being read
  current_translation: text("current_translation").default("KJV"),
  layout_preferences: text("layout_preferences"), // JSON: column widths, visible columns, etc.
  scroll_position: integer("scroll_position").default(0),
  last_active: timestamp("last_active").defaultNow(),
  session_data: text("session_data"), // Additional JSON session data
  updated_at: timestamp("updated_at").defaultNow()
});

// Enhanced position tracking per translation
export const userPositions = pgTable("user_positions", {
  id: serial("id").primaryKey(),
  user_id: uuid("user_id").references(() => users.id).notNull(),
  translation_code: text("translation_code").notNull(),
  verse_key: text("verse_key").notNull(), // e.g., "John.3:16"
  scroll_px: integer("scroll_px").default(0),
  center_index: integer("center_index").default(0),
  updated_at: timestamp("updated_at").defaultNow()
}, (table) => ({
  userTranslation: primaryKey({ columns: [table.user_id, table.translation_code] })
}));

// Hyperlink click tracking for last 10 clicks
export const hyperlinkClicks = pgTable("hyperlink_clicks", {
  id: serial("id").primaryKey(),
  user_id: uuid("user_id").references(() => users.id).notNull(),
  verse_key: text("verse_key").notNull(), // Source verse e.g., "John.3:16"
  translation_code: text("translation_code").notNull(),
  target_type: text("target_type").notNull(), // 'cross_ref', 'prophecy', 'verse_jump', etc.
  target_payload: text("target_payload").notNull(), // JSON data about the target
  source_context: text("source_context"), // Optional JSON context
  clicked_at: timestamp("clicked_at").defaultNow()
});

export const insertUserSchema = createInsertSchema(users).omit({ id: true, createdAt: true });
export const insertProfileSchema = createInsertSchema(profiles).omit({ createdAt: true, updatedAt: true });
export const insertNoteSchema = createInsertSchema(notes).omit({ id: true });
export const insertUserNoteSchema = createInsertSchema(userNotes).omit({ id: true, user_id: true, created_at: true, updated_at: true });
export const insertBookmarkSchema = createInsertSchema(bookmarks).omit({ created_at: true });
export const insertHighlightSchema = createInsertSchema(highlights).omit({ id: true });
export const insertUserBookmarkSchema = createInsertSchema(userBookmarks).omit({ id: true, user_id: true, created_at: true, updated_at: true });
export const insertUserHighlightSchema = createInsertSchema(userHighlights).omit({ id: true, user_id: true, created_at: true, updated_at: true });
export const insertForumPostSchema = createInsertSchema(forumPosts).omit({ id: true, createdAt: true, updatedAt: true });
export const insertForumVoteSchema = createInsertSchema(forumVotes).omit({ id: true });
export const insertUserPreferencesSchema = createInsertSchema(userPreferences).omit({ id: true, updatedAt: true });
export const insertNavigationHistorySchema = createInsertSchema(navigationHistory).omit({ id: true, visited_at: true });
export const insertUserSessionSchema = createInsertSchema(userSessions).omit({ id: true, last_active: true, updated_at: true });
export const insertUserPositionSchema = createInsertSchema(userPositions).omit({ id: true, updated_at: true });
export const insertHyperlinkClickSchema = createInsertSchema(hyperlinkClicks).omit({ id: true, clicked_at: true });

export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Profile = typeof profiles.$inferSelect;
export type InsertProfile = z.infer<typeof insertProfileSchema>;
export type Note = typeof notes.$inferSelect;
export type UserNote = typeof userNotes.$inferSelect;
export type InsertUserNote = z.infer<typeof insertUserNoteSchema>;
export type InsertNote = z.infer<typeof insertNoteSchema>;
export type Bookmark = typeof bookmarks.$inferSelect;
export type InsertBookmark = z.infer<typeof insertBookmarkSchema>;
export type Highlight = typeof highlights.$inferSelect;
export type InsertHighlight = z.infer<typeof insertHighlightSchema>;
export type UserBookmark = typeof userBookmarks.$inferSelect;
export type InsertUserBookmark = z.infer<typeof insertUserBookmarkSchema>;
export type UserHighlight = typeof userHighlights.$inferSelect;
export type InsertUserHighlight = z.infer<typeof insertUserHighlightSchema>;
export type ForumPost = typeof forumPosts.$inferSelect;
export type InsertForumPost = z.infer<typeof insertForumPostSchema>;
export type ForumVote = typeof forumVotes.$inferSelect;
export type InsertForumVote = z.infer<typeof insertForumVoteSchema>;
export type UserPreferences = typeof userPreferences.$inferSelect;
export type InsertUserPreferences = z.infer<typeof insertUserPreferencesSchema>;
export type NavigationHistory = typeof navigationHistory.$inferSelect;
export type InsertNavigationHistory = z.infer<typeof insertNavigationHistorySchema>;
export type UserSession = typeof userSessions.$inferSelect;
export type InsertUserSession = z.infer<typeof insertUserSessionSchema>;
export type UserPosition = typeof userPositions.$inferSelect;
export type InsertUserPosition = z.infer<typeof insertUserPositionSchema>;
export type HyperlinkClick = typeof hyperlinkClicks.$inferSelect;
export type InsertHyperlinkClick = z.infer<typeof insertHyperlinkClickSchema>;
