import {
  users,
  prospects,
  sequences,
  sequenceEnrollments,
  activities,
  integrations,
  leadScoringRules,
  type User,
  type InsertUser,
  type Prospect,
  type InsertProspect,
  type Sequence,
  type InsertSequence,
  type SequenceEnrollment,
  type InsertSequenceEnrollment,
  type Activity,
  type InsertActivity,
  type Integration,
  type InsertIntegration,
  type LeadScoringRule,
  type InsertLeadScoringRule,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, sql } from "drizzle-orm";

export interface IStorage {
  // Users
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Prospects
  getProspects(): Promise<Prospect[]>;
  getProspect(id: number): Promise<Prospect | undefined>;
  createProspect(prospect: InsertProspect): Promise<Prospect>;
  updateProspect(id: number, updates: Partial<Prospect>): Promise<Prospect | undefined>;
  deleteProspect(id: number): Promise<boolean>;
  getHighIntentProspects(): Promise<Prospect[]>;
  
  // Sequences
  getSequences(): Promise<Sequence[]>;
  getSequence(id: number): Promise<Sequence | undefined>;
  createSequence(sequence: InsertSequence): Promise<Sequence>;
  updateSequence(id: number, updates: Partial<Sequence>): Promise<Sequence | undefined>;
  deleteSequence(id: number): Promise<boolean>;
  getActiveSequences(): Promise<Sequence[]>;
  
  // Sequence Enrollments
  getSequenceEnrollments(): Promise<SequenceEnrollment[]>;
  createSequenceEnrollment(enrollment: InsertSequenceEnrollment): Promise<SequenceEnrollment>;
  updateSequenceEnrollment(id: number, updates: Partial<SequenceEnrollment>): Promise<SequenceEnrollment | undefined>;
  
  // Activities
  getActivities(): Promise<Activity[]>;
  getRecentActivities(limit?: number): Promise<Activity[]>;
  createActivity(activity: InsertActivity): Promise<Activity>;
  
  // Integrations
  getIntegrations(): Promise<Integration[]>;
  getIntegration(id: number): Promise<Integration | undefined>;
  createIntegration(integration: InsertIntegration): Promise<Integration>;
  updateIntegration(id: number, updates: Partial<Integration>): Promise<Integration | undefined>;
  
  // Lead Scoring Rules
  getLeadScoringRules(): Promise<LeadScoringRule[]>;
  createLeadScoringRule(rule: InsertLeadScoringRule): Promise<LeadScoringRule>;
  updateLeadScoringRule(id: number, updates: Partial<LeadScoringRule>): Promise<LeadScoringRule | undefined>;
}

export class DatabaseStorage implements IStorage {
  constructor() {
    this.seedData();
  }

  // Users
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(user: InsertUser): Promise<User> {
    const [newUser] = await db.insert(users).values(user).returning();
    return newUser;
  }

  // Prospects
  async getProspects(): Promise<Prospect[]> {
    return await db.select().from(prospects).orderBy(desc(prospects.createdAt));
  }

  async getProspect(id: number): Promise<Prospect | undefined> {
    const [prospect] = await db.select().from(prospects).where(eq(prospects.id, id));
    return prospect || undefined;
  }

  async createProspect(prospect: InsertProspect): Promise<Prospect> {
    const [newProspect] = await db.insert(prospects).values(prospect).returning();
    return newProspect;
  }

  async updateProspect(id: number, updates: Partial<Prospect>): Promise<Prospect | undefined> {
    const [updated] = await db.update(prospects).set({ ...updates, updatedAt: new Date() }).where(eq(prospects.id, id)).returning();
    return updated || undefined;
  }

  async deleteProspect(id: number): Promise<boolean> {
    const result = await db.delete(prospects).where(eq(prospects.id, id));
    return result.rowCount > 0;
  }

  async getHighIntentProspects(): Promise<Prospect[]> {
    return await db.select().from(prospects).where(sql`lead_score >= 80`).orderBy(desc(prospects.leadScore));
  }

  // Sequences
  async getSequences(): Promise<Sequence[]> {
    return await db.select().from(sequences).orderBy(desc(sequences.createdAt));
  }

  async getSequence(id: number): Promise<Sequence | undefined> {
    const [sequence] = await db.select().from(sequences).where(eq(sequences.id, id));
    return sequence || undefined;
  }

  async createSequence(sequence: InsertSequence): Promise<Sequence> {
    const [newSequence] = await db.insert(sequences).values(sequence).returning();
    return newSequence;
  }

  async updateSequence(id: number, updates: Partial<Sequence>): Promise<Sequence | undefined> {
    const [updated] = await db.update(sequences).set({ ...updates, updatedAt: new Date() }).where(eq(sequences.id, id)).returning();
    return updated || undefined;
  }

  async deleteSequence(id: number): Promise<boolean> {
    const result = await db.delete(sequences).where(eq(sequences.id, id));
    return result.rowCount > 0;
  }

  async getActiveSequences(): Promise<Sequence[]> {
    return await db.select().from(sequences).where(eq(sequences.status, "active"));
  }

  // Sequence Enrollments
  async getSequenceEnrollments(): Promise<SequenceEnrollment[]> {
    return await db.select().from(sequenceEnrollments);
  }

  async createSequenceEnrollment(enrollment: InsertSequenceEnrollment): Promise<SequenceEnrollment> {
    const [newEnrollment] = await db.insert(sequenceEnrollments).values(enrollment).returning();
    return newEnrollment;
  }

  async updateSequenceEnrollment(id: number, updates: Partial<SequenceEnrollment>): Promise<SequenceEnrollment | undefined> {
    const [updated] = await db.update(sequenceEnrollments).set(updates).where(eq(sequenceEnrollments.id, id)).returning();
    return updated || undefined;
  }

  // Activities
  async getActivities(): Promise<Activity[]> {
    return await db.select().from(activities).orderBy(desc(activities.createdAt));
  }

  async getRecentActivities(limit: number = 10): Promise<Activity[]> {
    return await db.select().from(activities).orderBy(desc(activities.createdAt)).limit(limit);
  }

  async createActivity(activity: InsertActivity): Promise<Activity> {
    const [newActivity] = await db.insert(activities).values(activity).returning();
    return newActivity;
  }

  // Integrations
  async getIntegrations(): Promise<Integration[]> {
    return await db.select().from(integrations).orderBy(desc(integrations.createdAt));
  }

  async getIntegration(id: number): Promise<Integration | undefined> {
    const [integration] = await db.select().from(integrations).where(eq(integrations.id, id));
    return integration || undefined;
  }

  async createIntegration(integration: InsertIntegration): Promise<Integration> {
    const [newIntegration] = await db.insert(integrations).values(integration).returning();
    return newIntegration;
  }

  async updateIntegration(id: number, updates: Partial<Integration>): Promise<Integration | undefined> {
    const [updated] = await db.update(integrations).set({ ...updates, updatedAt: new Date() }).where(eq(integrations.id, id)).returning();
    return updated || undefined;
  }

  // Lead Scoring Rules
  async getLeadScoringRules(): Promise<LeadScoringRule[]> {
    return await db.select().from(leadScoringRules);
  }

  async createLeadScoringRule(rule: InsertLeadScoringRule): Promise<LeadScoringRule> {
    const [newRule] = await db.insert(leadScoringRules).values(rule).returning();
    return newRule;
  }

  async updateLeadScoringRule(id: number, updates: Partial<LeadScoringRule>): Promise<LeadScoringRule | undefined> {
    const [updated] = await db.update(leadScoringRules).set(updates).where(eq(leadScoringRules.id, id)).returning();
    return updated || undefined;
  }

  private async seedData() {
    try {
      // Check if data already exists
      const existingIntegrations = await db.select().from(integrations).limit(1);
      if (existingIntegrations.length > 0) return;

      // Create default integrations
      const defaultIntegrations = [
        { name: "Apollo", status: "connected" as const, lastSync: new Date() },
        { name: "Clay", status: "connected" as const, lastSync: new Date() },
        { name: "SmartLead", status: "connected" as const, lastSync: new Date() },
        { name: "Rb2b", status: "syncing" as const, lastSync: new Date(Date.now() - 45 * 60 * 1000) },
        { name: "OpenAI GPT-4", status: "connected" as const, lastSync: new Date() },
      ];

      for (const integration of defaultIntegrations) {
        await db.insert(integrations).values({
          ...integration,
          apiKey: null,
          syncFrequency: 60,
          settings: {},
        });
      }

      // Create sample prospects
      const sampleProspects = [
        {
          firstName: "Sarah",
          lastName: "Johnson",
          email: "sarah.johnson@techcorp.com",
          company: "TechCorp Solutions",
          title: "VP of Marketing",
          phone: "+1-555-123-4567",
          linkedinUrl: "https://linkedin.com/in/sarahjohnson",
          website: "https://techcorpsolutions.com",
          industry: "Technology",
          companySize: "500-1000",
          revenue: "$50M-$100M",
          location: "San Francisco, CA",
          leadScore: 92,
          status: "new" as const,
          source: "apollo" as const,
          lastActivity: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
          engagementLevel: "high" as const,
          intentSignals: {
            signals: ["Visited pricing page", "Downloaded whitepaper", "LinkedIn engagement"],
            reasoning: "Strong buying signals with recent engagement"
          },
          personalizedNotes: "Recently promoted to VP, expanding team",
        },
        {
          firstName: "Michael",
          lastName: "Chen",
          email: "m.chen@growthco.io",
          company: "GrowthCo",
          title: "Head of Growth",
          phone: "+1-555-234-5678",
          linkedinUrl: "https://linkedin.com/in/michaelchen",
          website: "https://growthco.io",
          industry: "SaaS",
          companySize: "100-250",
          revenue: "$10M-$25M",
          location: "Austin, TX",
          leadScore: 85,
          status: "contacted" as const,
          source: "clay" as const,
          lastActivity: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
          engagementLevel: "high" as const,
          intentSignals: {
            signals: ["Email opened", "Link clicked", "Company research"],
            reasoning: "Active engagement with outreach"
          },
          personalizedNotes: "Interested in automation tools",
        },
        {
          firstName: "Emily",
          lastName: "Rodriguez",
          email: "emily.r@scalestartup.com",
          company: "ScaleStartup Inc",
          title: "Marketing Director",
          phone: "+1-555-345-6789",
          linkedinUrl: "https://linkedin.com/in/emilyrodriguez",
          website: "https://scalestartup.com",
          industry: "Fintech",
          companySize: "250-500",
          revenue: "$25M-$50M",
          location: "New York, NY",
          leadScore: 78,
          status: "responded" as const,
          source: "rb2b" as const,
          lastActivity: new Date(Date.now() - 3 * 60 * 60 * 1000),
          engagementLevel: "medium" as const,
          intentSignals: {
            signals: ["Demo request", "Competitor comparison"],
            reasoning: "Evaluating solutions actively"
          },
          personalizedNotes: "Looking for enterprise solution",
        },
        {
          firstName: "David",
          lastName: "Kim",
          email: "david.kim@innovatetech.com",
          company: "InnovateTech",
          title: "Chief Marketing Officer",
          phone: "+1-555-456-7890",
          linkedinUrl: "https://linkedin.com/in/davidkim",
          website: "https://innovatetech.com",
          industry: "Technology",
          companySize: "1000+",
          revenue: "$100M+",
          location: "Seattle, WA",
          leadScore: 95,
          status: "qualified" as const,
          source: "apollo" as const,
          lastActivity: new Date(Date.now() - 30 * 60 * 1000),
          engagementLevel: "high" as const,
          intentSignals: {
            signals: ["Budget confirmed", "Timeline discussed", "Stakeholder meeting"],
            reasoning: "High intent with budget and timeline"
          },
          personalizedNotes: "Ready to implement Q1 2025",
        }
      ];

      for (const prospect of sampleProspects) {
        await db.insert(prospects).values(prospect);
      }

      // Create sample sequences
      const sampleSequences = [
        {
          name: "Enterprise Outreach Sequence",
          description: "AI-powered sequence targeting enterprise prospects",
          status: "active" as const,
          templateType: "email" as const,
          steps: [
            { step: 1, type: "email", delay: 0, template: "Initial outreach" },
            { step: 2, type: "email", delay: 3, template: "Follow-up with value" },
            { step: 3, type: "linkedin", delay: 7, template: "LinkedIn connection" }
          ],
          targetCriteria: { companySize: "500+", industry: "Technology" },
          responseRate: "12.5",
          totalSent: 234,
          totalResponses: 29,
        },
        {
          name: "SaaS Growth Campaign",
          description: "Targeting growing SaaS companies",
          status: "active" as const,
          templateType: "multi-channel" as const,
          steps: [
            { step: 1, type: "email", delay: 0, template: "Pain point email" },
            { step: 2, type: "email", delay: 5, template: "Case study follow-up" }
          ],
          targetCriteria: { industry: "SaaS", revenue: "$10M+" },
          responseRate: "8.3",
          totalSent: 156,
          totalResponses: 13,
        }
      ];

      for (const sequence of sampleSequences) {
        await db.insert(sequences).values(sequence);
      }

      // Create sample activities
      const sampleActivities = [
        {
          prospectId: 1,
          type: "prospect_created",
          description: "New prospect Sarah Johnson added with score 92",
          metadata: { source: "apollo", score: 92 }
        },
        {
          prospectId: 2,
          type: "email_sent",
          description: "Personalized email sent to Michael Chen",
          metadata: { sequenceId: 1, template: "Initial outreach" }
        },
        {
          prospectId: 3,
          type: "response_received",
          description: "Emily Rodriguez responded with interest in demo",
          metadata: { responseType: "positive", sentiment: "interested" }
        },
        {
          prospectId: 4,
          type: "score_updated",
          description: "David Kim lead score increased to 95",
          metadata: { previousScore: 88, newScore: 95 }
        },
        {
          type: "data_enrichment",
          description: "Clay integration updated 15 prospect profiles",
          metadata: { recordsUpdated: 15, source: "clay" }
        }
      ];

      for (const activity of sampleActivities) {
        await db.insert(activities).values(activity);
      }

      // Create sample lead scoring rules
      const sampleRules = [
        {
          name: "Enterprise Company Size",
          description: "Higher score for larger companies",
          criteria: {
            field: "companySize",
            conditions: [
              { value: "1000+", score: 25 },
              { value: "500-1000", score: 20 },
              { value: "250-500", score: 15 }
            ]
          },
          isActive: true,
          priority: 1
        },
        {
          name: "Revenue Qualification",
          description: "Score based on company revenue",
          criteria: {
            field: "revenue", 
            conditions: [
              { value: "$100M+", score: 30 },
              { value: "$50M-$100M", score: 25 },
              { value: "$25M-$50M", score: 20 }
            ]
          },
          isActive: true,
          priority: 2
        }
      ];

      for (const rule of sampleRules) {
        await db.insert(leadScoringRules).values(rule);
      }

    } catch (error) {
      console.log("Seed data already exists or error:", error);
    }
  }
}

export const storage = new DatabaseStorage();