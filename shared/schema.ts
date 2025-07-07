import { pgTable, text, serial, integer, boolean, uuid, timestamp, smallint, bigint } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").notNull().unique(),
  name: text("name").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const userNotes = pgTable("user_notes", {
  id: serial("id").primaryKey(),
  userId: uuid("user_id").references(() => users.id).notNull(),
  verseRef: text("verse_ref").notNull(),
  note: text("note").notNull(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const bookmarks = pgTable("bookmarks", {
  id: serial("id").primaryKey(),
  userId: uuid("user_id").references(() => users.id).notNull(),
  name: text("name").notNull(),
  indexValue: integer("index_value").notNull(),
  color: text("color").default("#ef4444"),
  pending: boolean("pending").default(true), // Enables conflict-free sync
  createdAt: timestamp("created_at").defaultNow(),
});

export const highlights = pgTable("highlights", {
  id: serial("id").primaryKey(),
  userId: uuid("user_id").references(() => users.id).notNull(),
  verseRef: text("verse_ref").notNull(),
  startIdx: smallint("start_idx").notNull(),
  endIdx: smallint("end_idx").notNull(),
  color: text("color").notNull(),
  pending: boolean("pending").default(true), // Enables conflict-free sync
  createdAt: timestamp("created_at").defaultNow(),
});

export const forumPosts = pgTable("forum_posts", {
  id: serial("id").primaryKey(),
  userId: uuid("user_id").references(() => users.id).notNull(),
  title: text("title").notNull(),
  body: text("body").notNull(),
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
  userId: uuid("user_id").references(() => users.id).notNull(),
  theme: text("theme").default("light-mode"),
  selectedTranslations: text("selected_translations").array().default(["KJV"]),
  showNotes: boolean("show_notes").default(false),
  showProphecy: boolean("show_prophecy").default(false),
  showContext: boolean("show_context").default(false),
  fontSize: text("font_size").default("medium"),
  lastVersePosition: text("last_verse_position"),
  columnLayout: text("column_layout"), // JSON string
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).omit({ id: true, createdAt: true });
export const insertUserNoteSchema = createInsertSchema(userNotes).omit({ id: true, updatedAt: true });
export const insertBookmarkSchema = createInsertSchema(bookmarks).omit({ id: true, createdAt: true });
export const insertHighlightSchema = createInsertSchema(highlights).omit({ id: true, createdAt: true });
export const insertForumPostSchema = createInsertSchema(forumPosts).omit({ id: true, createdAt: true, updatedAt: true });
export const insertForumVoteSchema = createInsertSchema(forumVotes).omit({ id: true });
export const insertUserPreferencesSchema = createInsertSchema(userPreferences).omit({ id: true, updatedAt: true });

export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type UserNote = typeof userNotes.$inferSelect;
export type InsertUserNote = z.infer<typeof insertUserNoteSchema>;
export type Bookmark = typeof bookmarks.$inferSelect;
export type InsertBookmark = z.infer<typeof insertBookmarkSchema>;
export type Highlight = typeof highlights.$inferSelect;
export type InsertHighlight = z.infer<typeof insertHighlightSchema>;
export type ForumPost = typeof forumPosts.$inferSelect;
export type InsertForumPost = z.infer<typeof insertForumPostSchema>;
export type ForumVote = typeof forumVotes.$inferSelect;
export type InsertForumVote = z.infer<typeof insertForumVoteSchema>;
export type UserPreferences = typeof userPreferences.$inferSelect;
export type InsertUserPreferences = z.infer<typeof insertUserPreferencesSchema>;
