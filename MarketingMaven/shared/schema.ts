import { pgTable, text, serial, integer, boolean, timestamp, decimal, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email").notNull().unique(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  role: text("role").notNull().default("user"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const prospects = pgTable("prospects", {
  id: serial("id").primaryKey(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  email: text("email").notNull(),
  company: text("company").notNull(),
  title: text("title").notNull(),
  phone: text("phone"),
  linkedinUrl: text("linkedin_url"),
  website: text("website"),
  industry: text("industry"),
  companySize: text("company_size"),
  revenue: text("revenue"),
  location: text("location"),
  leadScore: integer("lead_score").default(0),
  status: text("status").notNull().default("new"), // new, contacted, responded, qualified, closed
  source: text("source").notNull(), // apollo, clay, rb2b, manual
  lastActivity: timestamp("last_activity").defaultNow(),
  engagementLevel: text("engagement_level").default("low"), // low, medium, high
  intentSignals: jsonb("intent_signals").default('{}'),
  personalizedNotes: text("personalized_notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const sequences = pgTable("sequences", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  status: text("status").notNull().default("draft"), // draft, active, paused, completed
  templateType: text("template_type").notNull(), // email, linkedin, multi-channel
  steps: jsonb("steps").notNull().default('[]'), // Array of sequence steps
  targetCriteria: jsonb("target_criteria").default('{}'),
  responseRate: decimal("response_rate", { precision: 5, scale: 2 }).default("0"),
  totalSent: integer("total_sent").default(0),
  totalResponses: integer("total_responses").default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const sequenceEnrollments = pgTable("sequence_enrollments", {
  id: serial("id").primaryKey(),
  sequenceId: integer("sequence_id").references(() => sequences.id).notNull(),
  prospectId: integer("prospect_id").references(() => prospects.id).notNull(),
  currentStep: integer("current_step").default(0),
  status: text("status").notNull().default("active"), // active, paused, completed, bounced
  enrolledAt: timestamp("enrolled_at").defaultNow().notNull(),
  lastTouchpoint: timestamp("last_touchpoint"),
  nextTouchpoint: timestamp("next_touchpoint"),
});

export const activities = pgTable("activities", {
  id: serial("id").primaryKey(),
  prospectId: integer("prospect_id").references(() => prospects.id),
  sequenceId: integer("sequence_id").references(() => sequences.id),
  type: text("type").notNull(), // email_sent, email_opened, email_clicked, response_received, linkedin_viewed, etc.
  description: text("description").notNull(),
  metadata: jsonb("metadata").default('{}'),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const integrations = pgTable("integrations", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(), // apollo, clay, rb2b, smartlead, openai
  status: text("status").notNull().default("disconnected"), // connected, disconnected, syncing, error
  apiKey: text("api_key"),
  lastSync: timestamp("last_sync"),
  syncFrequency: integer("sync_frequency").default(60), // minutes
  settings: jsonb("settings").default('{}'),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const leadScoringRules = pgTable("lead_scoring_rules", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  criteria: jsonb("criteria").notNull(), // Scoring criteria and weights
  isActive: boolean("is_active").default(true),
  priority: integer("priority").default(1),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
});

export const insertProspectSchema = createInsertSchema(prospects).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertSequenceSchema = createInsertSchema(sequences).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertSequenceEnrollmentSchema = createInsertSchema(sequenceEnrollments).omit({
  id: true,
  enrolledAt: true,
});

export const insertActivitySchema = createInsertSchema(activities).omit({
  id: true,
  createdAt: true,
});

export const insertIntegrationSchema = createInsertSchema(integrations).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertLeadScoringRuleSchema = createInsertSchema(leadScoringRules).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Prospect = typeof prospects.$inferSelect;
export type InsertProspect = z.infer<typeof insertProspectSchema>;

export type Sequence = typeof sequences.$inferSelect;
export type InsertSequence = z.infer<typeof insertSequenceSchema>;

export type SequenceEnrollment = typeof sequenceEnrollments.$inferSelect;
export type InsertSequenceEnrollment = z.infer<typeof insertSequenceEnrollmentSchema>;

export type Activity = typeof activities.$inferSelect;
export type InsertActivity = z.infer<typeof insertActivitySchema>;

export type Integration = typeof integrations.$inferSelect;
export type InsertIntegration = z.infer<typeof insertIntegrationSchema>;

export type LeadScoringRule = typeof leadScoringRules.$inferSelect;
export type InsertLeadScoringRule = z.infer<typeof insertLeadScoringRuleSchema>;
