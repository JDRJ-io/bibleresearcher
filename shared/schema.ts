import { pgTable, text, serial, integer, boolean, uuid, timestamp, smallint, bigint, primaryKey, index, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").notNull().unique(),
  name: text("name").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const profiles = pgTable("profiles", {
  id: uuid("id").primaryKey().references(() => users.id),
  name: text("name"), // Nullable for incomplete profiles
  bio: text("bio"),
  tier: text("tier").default("free"), // 'free' or 'premium'
  recovery_passkey_hash: text("recovery_passkey_hash"),
  marketing_opt_in: boolean("marketing_opt_in").default(false),
  
  // Stripe membership fields
  stripe_customer_id: text("stripe_customer_id").unique(),
  subscription_status: text("subscription_status")
    .default("incomplete")
    .$type<'trialing' | 'active' | 'past_due' | 'paused' | 'canceled' | 'incomplete' | 'incomplete_expired' | 'unpaid'>(),
  current_period_end: timestamp("current_period_end"),
  trial_end: timestamp("trial_end"),
  cancel_at: timestamp("cancel_at"),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const notes = pgTable("notes", {
  id: serial("id").primaryKey(),
  user_id: uuid("user_id").references(() => users.id).notNull(),
  verse_ref: text("verse_ref").notNull(),
  text: text("text").notNull(),
});

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

// Sessions table for Stripe auth (required for membership system)
export const sessions = pgTable(
  "sessions",
  {
    sid: text("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// Subscriptions table for Stripe audit trail
export const subscriptions = pgTable("subscriptions", {
  id: text("id").primaryKey(), // stripe subscription id
  user_id: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  status: text("status").notNull(),
  price_id: text("price_id").notNull(),
  product_id: text("product_id").notNull(),
  current_period_start: timestamp("current_period_start"),
  current_period_end: timestamp("current_period_end"),
  cancel_at: timestamp("cancel_at"),
  canceled_at: timestamp("canceled_at"),
  trial_start: timestamp("trial_start"),
  trial_end: timestamp("trial_end"),
  raw: jsonb("raw").notNull(),
  created_at: timestamp("created_at").defaultNow(),
}, (table) => [
  index("subscriptions_user_id_idx").on(table.user_id),
]);

export const insertUserSchema = createInsertSchema(users).omit({ id: true, createdAt: true });
export const insertProfileSchema = createInsertSchema(profiles).omit({ createdAt: true, updatedAt: true });
export const insertNoteSchema = createInsertSchema(notes).omit({ id: true });
export const insertBookmarkSchema = createInsertSchema(bookmarks).omit({ created_at: true });
export const insertHighlightSchema = createInsertSchema(highlights).omit({ id: true });
export const insertForumPostSchema = createInsertSchema(forumPosts).omit({ id: true, createdAt: true, updatedAt: true });
export const insertForumVoteSchema = createInsertSchema(forumVotes).omit({ id: true });
export const insertUserPreferencesSchema = createInsertSchema(userPreferences).omit({ id: true, updatedAt: true });
export const insertSubscriptionSchema = createInsertSchema(subscriptions).omit({ created_at: true });

export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Profile = typeof profiles.$inferSelect;
export type InsertProfile = z.infer<typeof insertProfileSchema>;
export type Note = typeof notes.$inferSelect;
export type InsertNote = z.infer<typeof insertNoteSchema>;
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
export type Subscription = typeof subscriptions.$inferSelect;
export type InsertSubscription = z.infer<typeof insertSubscriptionSchema>;
