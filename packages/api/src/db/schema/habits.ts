import { pgTable, serial, text, timestamp, integer, boolean, date } from "drizzle-orm/pg-core";
import { users } from "./user";

export const habits = pgTable('habits', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id),
  name: text('name').notNull(),
  description: text('description'),
  frequency: text('frequency').notNull(), // daily, weekly, monthly
  target: integer('target').notNull(), // target number of completions
  isArchived: boolean('is_archived').default(false),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const habitLogs = pgTable('habit_logs', {
  id: serial('id').primaryKey(),
  habitId: integer('habit_id').references(() => habits.id),
  userId: integer('user_id').references(() => users.id),
  completedAt: date('completed_at').notNull(),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow(),
}); 