import {
  pgTable,
  serial,
  text,
  timestamp,
  integer,
  boolean,
  date,
} from "drizzle-orm/pg-core";
import { users } from "./user";

export const habits = pgTable("habits", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id),
  name: text("name").notNull(),
  description: text("description"),
  interval: text("interval").notNull(), // "daily", "weekly"
  type: text("type").notNull().default("boolean"), // Ensures existing rows get a value, its:  "boolean" | "distance" | "count"
  target: integer("target"), // 1 for boolean, e.g. 6000 for 6km
  unit: text("unit"), // "ml", "km", "workouts", etc.
  isArchived: boolean("is_archived").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const habitLogs = pgTable("habit_logs", {
  id: serial("id").primaryKey(),
  habitId: integer("habit_id")
    .notNull()
    .references(() => habits.id, { onDelete: "cascade" }),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  value: integer("value"), // 1 for boolean, or the distance/count
  completedAt: date("completed_at").notNull(), // one log per day ideally
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});
