import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import multer from "multer";
import csv from "csv-parser";
import fs from "fs";
import path from "path";
import { 
  insertProspectSchema, 
  insertSequenceSchema, 
  insertActivitySchema,
  insertIntegrationSchema,
  insertLeadScoringRuleSchema 
} from "@shared/schema";
import { scoreLeadWithAI, generatePersonalizedOutreach, analyzeProspectIntent } from "./services/openai";

// Configure multer for file uploads
const upload = multer({ 
  dest: 'uploads/',
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype !== 'text/csv' && !file.originalname.endsWith('.csv')) {
      return cb(new Error('Only CSV files are allowed'));
    }
    cb(null, true);
  }
});

// Intelligent data source detection
function detectDataSource(headers: string[]): string {
  const headerStr = headers.join(',').toLowerCase();
  
  // Clay AI detection - look for specific Clay patterns
  if (headerStr.includes('lead id') && headerStr.includes('job title') && headerStr.includes('ai interaction score')) {
    return 'Clay AI';
  }
  
  // RB2B detection - look for company-focused data without individual contacts
  if (headerStr.includes('company name') && headerStr.includes('social signal score') && 
      headerStr.includes('annual revenue') && !headerStr.includes('first name')) {
    return 'RB2B';
  }
  
  // Apollo detection - look for typical Apollo export patterns
  if (headerStr.includes('linkedin_url') || headerStr.includes('apollo')) {
    return 'Apollo';
  }
  
  // SmartLead detection
  if (headerStr.includes('smartlead') || headerStr.includes('campaign_id')) {
    return 'SmartLead';
  }
  
  // Generic CSV fallback
  return 'CSV';
}

// Map data rows to prospect format based on source
function mapRowToProspect(row: any, dataSource: string, rowNumber: number): any | null {
  try {
    switch (dataSource) {
      case 'Clay AI':
        return mapClayAIData(row, rowNumber);
      case 'RB2B':
        return mapRB2BData(row, rowNumber);
      case 'Apollo':
        return mapApolloData(row, rowNumber);
      case 'SmartLead':
        return mapSmartLeadData(row, rowNumber);
      default:
        return mapGenericCSVData(row, rowNumber);
    }
  } catch (error) {
    console.error(`Error mapping row ${rowNumber} from ${dataSource}:`, error);
    return null;
  }
}

// Clay AI specific mapping
function mapClayAIData(row: any, rowNumber: number): any {
  const email = row['Email'] || row['email'] || '';
  const firstName = row['First Name'] || row['first_name'] || '';
  const lastName = row['Last Name'] || row['last_name'] || '';
  const company = row['Company Name'] || row['company_name'] || '';
  const title = row['Job Title'] || row['job_title'] || '';
  
  // Skip if missing essential data
  if (!email && !company) {
    return null;
  }
  
  // Handle company-only records (generate generic contact)
  const finalFirstName = firstName || 'Contact';
  const finalLastName = lastName || 'Lead';
  const finalEmail = email || `contact@${company.toLowerCase().replace(/[^a-z0-9]/g, '')}.com`;
  
  const companySize = parseCompanySize(row['Company Size']);
  const leadScore = parseInt(row['AI Interaction Score']) || 50;
  const status = mapStatus(row['Lead Status']);
  
  return {
    firstName: finalFirstName,
    lastName: finalLastName,
    email: finalEmail,
    company: company,
    title: title,
    phone: null,
    linkedinUrl: row['Social Media Profile URL'] || null,
    website: null,
    industry: row['Industry'] || null,
    companySize: companySize,
    revenue: null,
    location: null,
    source: 'clay',
    status: status,
    leadScore: leadScore,
    engagementLevel: leadScore >= 70 ? 'high' : leadScore >= 40 ? 'medium' : 'low',
    intentSignals: {
      signals: [`Clay AI Score: ${leadScore}`, `Status: ${row['Lead Status']}`],
      reasoning: `Imported from Clay AI with interaction score of ${leadScore}`
    },
    personalizedNotes: `Clay AI import - ${row['Lead Source']} source on ${new Date().toLocaleDateString()}`,
  };
}

// RB2B specific mapping
function mapRB2BData(row: any, rowNumber: number): any {
  const company = row['Company Name'] || row['company_name'] || '';
  
  if (!company) {
    return null;
  }
  
  // RB2B is company-focused, so create a generic contact
  const revenue = parseRevenue(row['Annual Revenue']);
  const companySize = parseCompanySize(row['Company Size']);
  const socialScore = parseInt(row['Social Signal Score']) || 50;
  const status = mapStatus(row['Lead Status']);
  
  // Generate contact details for company
  const contactEmail = `contact@${company.toLowerCase().replace(/[^a-z0-9]/g, '')}.com`;
  
  return {
    firstName: 'Business',
    lastName: 'Development',
    email: contactEmail,
    company: company,
    title: 'Decision Maker',
    phone: null,
    linkedinUrl: null,
    website: null,
    industry: row['Industry'] || null,
    companySize: companySize,
    revenue: revenue,
    location: null,
    source: 'rb2b',
    status: status,
    leadScore: socialScore,
    engagementLevel: socialScore >= 70 ? 'high' : socialScore >= 40 ? 'medium' : 'low',
    intentSignals: {
      signals: [`RB2B Social Score: ${socialScore}`, `Revenue: ${revenue}`, `Size: ${companySize}`],
      reasoning: `RB2B company data with social signal score of ${socialScore}`
    },
    personalizedNotes: `RB2B import - ${row['Lead Source']} on ${new Date().toLocaleDateString()}`,
  };
}

// Apollo specific mapping
function mapApolloData(row: any, rowNumber: number): any {
  return {
    firstName: row['first_name'] || row['First Name'] || '',
    lastName: row['last_name'] || row['Last Name'] || '',
    email: row['email'] || row['Email'] || '',
    company: row['company'] || row['Company'] || row['organization_name'] || '',
    title: row['title'] || row['Title'] || row['job_title'] || '',
    phone: row['phone'] || row['Phone'] || null,
    linkedinUrl: row['linkedin_url'] || row['LinkedIn URL'] || null,
    website: row['website'] || row['Website'] || null,
    industry: row['industry'] || row['Industry'] || null,
    companySize: parseCompanySize(row['company_size'] || row['Company Size']),
    revenue: parseRevenue(row['revenue'] || row['Revenue']),
    location: row['location'] || row['Location'] || row['city'] || null,
    source: 'apollo',
    status: 'new',
    leadScore: 50,
    engagementLevel: 'medium',
    intentSignals: {
      signals: ['Apollo export'],
      reasoning: 'Imported from Apollo database'
    },
    personalizedNotes: `Apollo import on ${new Date().toLocaleDateString()}`,
  };
}

// SmartLead specific mapping
function mapSmartLeadData(row: any, rowNumber: number): any {
  return {
    firstName: row['first_name'] || row['First Name'] || '',
    lastName: row['last_name'] || row['Last Name'] || '',
    email: row['email'] || row['Email'] || '',
    company: row['company'] || row['Company'] || '',
    title: row['title'] || row['Title'] || '',
    phone: row['phone'] || row['Phone'] || null,
    linkedinUrl: row['linkedin_url'] || null,
    website: null,
    industry: row['industry'] || null,
    companySize: parseCompanySize(row['company_size']),
    revenue: null,
    location: row['location'] || null,
    source: 'smartlead',
    status: row['status'] ? mapStatus(row['status']) : 'new',
    leadScore: 50,
    engagementLevel: 'medium',
    intentSignals: {
      signals: ['SmartLead export'],
      reasoning: 'Imported from SmartLead campaign'
    },
    personalizedNotes: `SmartLead import on ${new Date().toLocaleDateString()}`,
  };
}

// Generic CSV mapping
function mapGenericCSVData(row: any, rowNumber: number): any {
  const firstName = row.firstName || row.first_name || row['First Name'] || row['first name'] || '';
  const lastName = row.lastName || row.last_name || row['Last Name'] || row['last name'] || '';
  const email = row.email || row.Email || row['Email Address'] || '';
  const company = row.company || row.Company || row['Company Name'] || row['company name'] || '';
  const title = row.title || row.Title || row.position || row.Position || row['Job Title'] || '';
  
  // Require at least company and either name or email
  if (!company || (!firstName && !lastName && !email)) {
    return null;
  }
  
  return {
    firstName: firstName || 'Contact',
    lastName: lastName || 'Lead',
    email: email || `contact@${company.toLowerCase().replace(/[^a-z0-9]/g, '')}.com`,
    company: company,
    title: title || 'Contact',
    phone: row.phone || row.Phone || null,
    linkedinUrl: row.linkedinUrl || row.linkedin_url || row['LinkedIn URL'] || null,
    website: row.website || row.Website || null,
    industry: row.industry || row.Industry || null,
    companySize: parseCompanySize(row.companySize || row.company_size || row['Company Size']),
    revenue: parseRevenue(row.revenue || row.Revenue),
    location: row.location || row.Location || null,
    source: 'csv',
    status: 'new',
    leadScore: 50,
    engagementLevel: 'low',
    intentSignals: {
      signals: ['CSV import'],
      reasoning: 'Manually imported from CSV file'
    },
    personalizedNotes: `CSV import on ${new Date().toLocaleDateString()}`,
  };
}

// Helper functions
function parseCompanySize(size: string | number): string | null {
  if (!size) return null;
  const sizeStr = size.toString().toLowerCase();
  
  if (sizeStr.includes('1-10') || sizeStr.includes('1-50') || parseInt(sizeStr) <= 50) return '1-50';
  if (sizeStr.includes('51-200') || sizeStr.includes('50-100') || (parseInt(sizeStr) > 50 && parseInt(sizeStr) <= 200)) return '51-200';
  if (sizeStr.includes('201-500') || sizeStr.includes('250-500') || (parseInt(sizeStr) > 200 && parseInt(sizeStr) <= 500)) return '201-500';
  if (sizeStr.includes('501-1000') || sizeStr.includes('500-1000') || (parseInt(sizeStr) > 500 && parseInt(sizeStr) <= 1000)) return '501-1000';
  if (sizeStr.includes('1000+') || sizeStr.includes('1001-5000') || parseInt(sizeStr) > 1000) return '1000+';
  
  return size.toString();
}

function parseRevenue(revenue: string | number): string | null {
  if (!revenue) return null;
  const revenueStr = revenue.toString().toLowerCase();
  
  if (revenueStr.includes('1000000') || revenueStr.includes('1m')) return '$1M-$10M';
  if (revenueStr.includes('10000000') || revenueStr.includes('10m')) return '$10M-$50M';
  if (revenueStr.includes('50000000') || revenueStr.includes('50m')) return '$50M-$100M';
  if (revenueStr.includes('100000000') || revenueStr.includes('100m')) return '$100M+';
  
  return revenue.toString();
}

function mapStatus(status: string): 'new' | 'contacted' | 'responded' | 'qualified' | 'disqualified' {
  if (!status) return 'new';
  const statusLower = status.toLowerCase();
  
  if (statusLower.includes('contact') || statusLower.includes('reached')) return 'contacted';
  if (statusLower.includes('respond') || statusLower.includes('reply')) return 'responded';
  if (statusLower.includes('convert') || statusLower.includes('qualif') || statusLower.includes('progress')) return 'qualified';
  if (statusLower.includes('disqualif') || statusLower.includes('reject')) return 'disqualified';
  
  return 'new';
}

export async function registerRoutes(app: Express): Promise<Server> {
  
  // Dashboard metrics
  app.get("/api/dashboard/metrics", async (req, res) => {
    try {
      const prospects = await storage.getProspects();
      const sequences = await storage.getActiveSequences();
      
      const activeLeads = prospects.length;
      const qualifiedLeads = prospects.filter(p => (p.leadScore || 0) >= 70).length;
      const totalSequencesSent = sequences.reduce((sum, seq) => sum + (seq.totalSent || 0), 0);
      const totalResponses = sequences.reduce((sum, seq) => sum + (seq.totalResponses || 0), 0);
      const responseRate = totalSequencesSent > 0 ? (totalResponses / totalSequencesSent) * 100 : 0;
      const pipelineValue = qualifiedLeads * 50000; // Estimated pipeline value
      
      res.json({
        activeLeads,
        activeLeadsChange: "+12.5%",
        responseRate: responseRate.toFixed(1),
        responseRateChange: "+8.3%",
        qualifiedLeads,
        qualifiedLeadsChange: "+24.1%",
        pipelineValue: `$${(pipelineValue / 1000000).toFixed(1)}M`,
        pipelineValueChange: "+18.7%"
      });
    } catch (error) {
      res.status(500).json({ message: "Error fetching dashboard metrics" });
    }
  });

  // Prospects
  app.get("/api/prospects", async (req, res) => {
    try {
      const prospects = await storage.getProspects();
      res.json(prospects);
    } catch (error) {
      res.status(500).json({ message: "Error fetching prospects" });
    }
  });

  app.get("/api/prospects/high-intent", async (req, res) => {
    try {
      const highIntentProspects = await storage.getHighIntentProspects();
      res.json(highIntentProspects);
    } catch (error) {
      res.status(500).json({ message: "Error fetching high-intent prospects" });
    }
  });

  app.post("/api/prospects", async (req, res) => {
    try {
      const validatedData = insertProspectSchema.parse(req.body);
      
      // Score the lead with AI
      const scoringResult = await scoreLeadWithAI(validatedData);
      validatedData.leadScore = scoringResult.score;
      validatedData.intentSignals = { signals: scoringResult.intentSignals, reasoning: scoringResult.reasoning };
      
      const prospect = await storage.createProspect(validatedData);
      
      // Create activity for new prospect
      await storage.createActivity({
        prospectId: prospect.id,
        type: "prospect_created",
        description: `New prospect ${prospect.firstName} ${prospect.lastName} added with score ${prospect.leadScore}`,
        metadata: { source: prospect.source, score: prospect.leadScore }
      });
      
      res.json(prospect);
    } catch (error) {
      res.status(400).json({ message: "Error creating prospect" });
    }
  });

  app.post("/api/prospects/csv-upload", upload.single('csv'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No CSV file uploaded" });
      }

      const results: any[] = [];
      const filePath = req.file.path;

      // Parse CSV file
      await new Promise((resolve, reject) => {
        fs.createReadStream(filePath)
          .pipe(csv())
          .on('data', (data) => results.push(data))
          .on('end', resolve)
          .on('error', reject);
      });

      if (results.length === 0) {
        return res.status(400).json({ message: "CSV file is empty or could not be parsed" });
      }

      // Detect data source format by analyzing headers
      const headers = Object.keys(results[0]);
      const dataSource = detectDataSource(headers);

      
      let imported = 0;
      let skipped = 0;
      const errors: string[] = [];

      // Process each row with intelligent mapping
      for (const [index, row] of results.entries()) {
        try {
          const prospectData = mapRowToProspect(row, dataSource, index + 1);

          
          // Skip rows that couldn't be mapped to valid prospects
          if (!prospectData) {
            errors.push(`Row ${index + 1}: Could not map data to prospect format`);
            skipped++;
            continue;
          }
          
          // Additional validation for required fields
          if (!prospectData.firstName || !prospectData.lastName || !prospectData.email || !prospectData.company) {
            errors.push(`Row ${index + 1}: Missing required fields after mapping (${JSON.stringify({
              firstName: prospectData.firstName,
              lastName: prospectData.lastName, 
              email: prospectData.email,
              company: prospectData.company
            })})`);
            skipped++;
            continue;
          }

          // Check for duplicates by email or company name
          const existingProspects = await storage.getProspects();
          const isDuplicateEmail = prospectData.email && existingProspects.some(p => 
            p.email.toLowerCase() === prospectData.email.toLowerCase()
          );
          const isDuplicateCompany = existingProspects.some(p => 
            p.company.toLowerCase() === prospectData.company.toLowerCase() &&
            p.firstName.toLowerCase() === prospectData.firstName.toLowerCase() &&
            p.lastName.toLowerCase() === prospectData.lastName.toLowerCase()
          );
          
          if (isDuplicateEmail || isDuplicateCompany) {
            errors.push(`Row ${index + 1}: Duplicate prospect (${prospectData.email || prospectData.company})`);
            skipped++;
            continue;
          }

          // Score the lead with AI for better quality (disabled temporarily to avoid quota issues)
          // const scoringResult = await scoreLeadWithAI(prospectData);
          // prospectData.leadScore = scoringResult.score;
          // prospectData.intentSignals = { signals: scoringResult.intentSignals, reasoning: scoringResult.reasoning };
          
          // Use existing score from mapping for now
          prospectData.leadScore = prospectData.leadScore || 50;

          // Create prospect
          await storage.createProspect(prospectData);
          imported++;

          // Log import activity
          await storage.createActivity({
            type: 'prospect_created',
            description: `${dataSource} import: ${prospectData.firstName} ${prospectData.lastName} from ${prospectData.company}`,
            metadata: { 
              source: dataSource.toLowerCase(), 
              email: prospectData.email, 
              score: prospectData.leadScore,
              dataSource
            }
          });

        } catch (error) {
          errors.push(`Row ${index + 1}: ${error instanceof Error ? error.message : 'Unknown error'}`);
          skipped++;
        }
      }

      // Clean up uploaded file
      fs.unlink(filePath, (err) => {
        if (err) console.error('Error deleting uploaded file:', err);
      });

      // Log overall import activity
      await storage.createActivity({
        type: 'csv_import',
        description: `${dataSource} CSV import completed: ${imported} prospects imported, ${skipped} skipped`,
        metadata: { 
          imported, 
          skipped, 
          total: results.length,
          dataSource,
          errors: errors.slice(0, 10) // Keep only first 10 errors
        }
      });

      res.json({
        message: `${dataSource} CSV upload completed`,
        imported,
        skipped,
        total: results.length,
        dataSource,
        errors: errors.slice(0, 20) // Return first 20 errors to client
      });

    } catch (error) {
      // Clean up file on error
      if (req.file) {
        fs.unlink(req.file.path, (err) => {
          if (err) console.error('Error deleting uploaded file:', err);
        });
      }
      
      res.status(500).json({ 
        message: "Error processing CSV file",
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  app.patch("/api/prospects/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updates = req.body;
      const prospect = await storage.updateProspect(id, updates);
      
      if (!prospect) {
        return res.status(404).json({ message: "Prospect not found" });
      }
      
      res.json(prospect);
    } catch (error) {
      res.status(400).json({ message: "Error updating prospect" });
    }
  });

  // Sequences
  app.get("/api/sequences", async (req, res) => {
    try {
      const sequences = await storage.getSequences();
      res.json(sequences);
    } catch (error) {
      res.status(500).json({ message: "Error fetching sequences" });
    }
  });

  app.get("/api/sequences/active", async (req, res) => {
    try {
      const activeSequences = await storage.getActiveSequences();
      res.json(activeSequences);
    } catch (error) {
      res.status(500).json({ message: "Error fetching active sequences" });
    }
  });

  app.post("/api/sequences", async (req, res) => {
    try {
      const validatedData = insertSequenceSchema.parse(req.body);
      const sequence = await storage.createSequence(validatedData);
      res.json(sequence);
    } catch (error) {
      res.status(400).json({ message: "Error creating sequence" });
    }
  });

  app.patch("/api/sequences/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updates = req.body;
      const sequence = await storage.updateSequence(id, updates);
      
      if (!sequence) {
        return res.status(404).json({ message: "Sequence not found" });
      }
      
      res.json(sequence);
    } catch (error) {
      res.status(400).json({ message: "Error updating sequence" });
    }
  });

  // Activities
  app.get("/api/activities/recent", async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 10;
      const activities = await storage.getRecentActivities(limit);
      res.json(activities);
    } catch (error) {
      res.status(500).json({ message: "Error fetching recent activities" });
    }
  });

  app.post("/api/activities", async (req, res) => {
    try {
      const validatedData = insertActivitySchema.parse(req.body);
      const activity = await storage.createActivity(validatedData);
      res.json(activity);
    } catch (error) {
      res.status(400).json({ message: "Error creating activity" });
    }
  });

  // Integrations
  app.get("/api/integrations", async (req, res) => {
    try {
      const integrations = await storage.getIntegrations();
      res.json(integrations);
    } catch (error) {
      res.status(500).json({ message: "Error fetching integrations" });
    }
  });

  app.post("/api/integrations", async (req, res) => {
    try {
      const validatedData = insertIntegrationSchema.parse(req.body);
      const integration = await storage.createIntegration(validatedData);
      res.json(integration);
    } catch (error) {
      res.status(400).json({ message: "Error creating integration" });
    }
  });

  app.post("/api/integrations/test", async (req, res) => {
    try {
      const { name, apiKey } = req.body;
      
      if (!name || !apiKey) {
        return res.status(400).json({ message: "Name and API key are required" });
      }

      // Import and use the integration manager
      const { integrationManager } = await import("./services/integrations");
      const result = await integrationManager.testIntegration(name, apiKey);
      
      res.json({
        success: result.success,
        message: result.success ? "Integration test successful" : result.error,
        data: result.success ? result.data : null
      });
    } catch (error) {
      res.status(500).json({ message: "Error testing integration" });
    }
  });

  app.get("/api/integrations/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const integration = await storage.getIntegration(id);
      if (!integration) {
        return res.status(404).json({ message: "Integration not found" });
      }
      res.json(integration);
    } catch (error) {
      res.status(500).json({ message: "Error fetching integration" });
    }
  });

  app.patch("/api/integrations/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updates = req.body;
      const integration = await storage.updateIntegration(id, updates);
      
      if (!integration) {
        return res.status(404).json({ message: "Integration not found" });
      }
      
      res.json(integration);
    } catch (error) {
      res.status(400).json({ message: "Error updating integration" });
    }
  });

  app.post("/api/integrations/:id/sync", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const integration = await storage.getIntegration(id);
      if (!integration) {
        return res.status(404).json({ message: "Integration not found" });
      }

      // Update integration status to syncing
      await storage.updateIntegration(id, { 
        status: "syncing",
        lastSync: new Date(),
        updatedAt: new Date()
      });

      // Log sync activity
      await storage.createActivity({
        type: "integration_sync",
        description: `${integration.name} sync started`,
        metadata: { integrationId: id, syncType: "manual" }
      });

      // Import and use the integration manager
      const { integrationManager } = await import("./services/integrations");
      
      // Perform actual sync in the background
      setTimeout(async () => {
        try {
          const result = await integrationManager.syncIntegration(id);
          
          await storage.updateIntegration(id, { 
            status: result.success ? "connected" : "error",
            lastSync: new Date(),
            updatedAt: new Date()
          });
          
          await storage.createActivity({
            type: "integration_sync",
            description: `${integration.name} sync ${result.success ? 'completed' : 'failed'} - ${result.recordsProcessed || 0} records processed`,
            metadata: { 
              integrationId: id, 
              syncType: "manual", 
              status: result.success ? "completed" : "failed",
              recordsProcessed: result.recordsProcessed || 0,
              error: result.error
            }
          });
        } catch (error) {
          await storage.updateIntegration(id, { 
            status: "error",
            lastSync: new Date(),
            updatedAt: new Date()
          });
          
          await storage.createActivity({
            type: "integration_sync",
            description: `${integration.name} sync failed with error`,
            metadata: { integrationId: id, syncType: "manual", status: "error", error: error instanceof Error ? error.message : 'Unknown error' }
          });
        }
      }, 2000);

      res.json({ message: "Sync started successfully" });
    } catch (error) {
      res.status(500).json({ message: "Error starting sync" });
    }
  });

  app.delete("/api/integrations/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const integration = await storage.getIntegration(id);
      if (!integration) {
        return res.status(404).json({ message: "Integration not found" });
      }

      // Log disconnection activity
      await storage.createActivity({
        type: "integration_disconnected",
        description: `${integration.name} integration disconnected`,
        metadata: { integrationId: id }
      });

      // Update status to disconnected instead of deleting
      await storage.updateIntegration(id, {
        status: "disconnected",
        apiKey: null,
        lastSync: null,
        updatedAt: new Date()
      });

      res.json({ message: "Integration disconnected successfully" });
    } catch (error) {
      res.status(500).json({ message: "Error disconnecting integration" });
    }
  });

  // Lead Scoring
  app.get("/api/lead-scoring/rules", async (req, res) => {
    try {
      const rules = await storage.getLeadScoringRules();
      res.json(rules);
    } catch (error) {
      res.status(500).json({ message: "Error fetching lead scoring rules" });
    }
  });

  app.post("/api/lead-scoring/rules", async (req, res) => {
    try {
      const validatedData = insertLeadScoringRuleSchema.parse(req.body);
      const rule = await storage.createLeadScoringRule(validatedData);
      res.json(rule);
    } catch (error) {
      res.status(400).json({ message: "Error creating lead scoring rule" });
    }
  });

  // AI-powered endpoints
  app.post("/api/ai/score-prospect", async (req, res) => {
    try {
      const prospectData = req.body;
      const result = await scoreLeadWithAI(prospectData);
      res.json(result);
    } catch (error) {
      res.status(500).json({ message: "Error scoring prospect with AI" });
    }
  });

  app.post("/api/ai/generate-outreach", async (req, res) => {
    try {
      const { prospectData, sequenceType } = req.body;
      const result = await generatePersonalizedOutreach(prospectData, sequenceType);
      res.json(result);
    } catch (error) {
      res.status(500).json({ message: "Error generating personalized outreach" });
    }
  });

  app.post("/api/ai/analyze-intent", async (req, res) => {
    try {
      const { prospectData, recentActivity } = req.body;
      const intentSignals = await analyzeProspectIntent(prospectData, recentActivity);
      res.json({ intentSignals });
    } catch (error) {
      res.status(500).json({ message: "Error analyzing prospect intent" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
