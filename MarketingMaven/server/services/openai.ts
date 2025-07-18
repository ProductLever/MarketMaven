import OpenAI from "openai";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY || process.env.OPENAI_KEY || "default_key" 
});

export interface LeadScoringResult {
  score: number;
  reasoning: string;
  intentSignals: string[];
  confidence: number;
}

export interface PersonalizationResult {
  subject: string;
  emailBody: string;
  personalizedOpening: string;
  callToAction: string;
}

export async function scoreLeadWithAI(prospectData: any): Promise<LeadScoringResult> {
  try {
    const prompt = `Analyze this prospect and provide a lead score from 0-100 based on their fit for enterprise B2B outbound marketing software. Consider company size, revenue, title, industry, and any intent signals.

Prospect Data:
- Name: ${prospectData.firstName} ${prospectData.lastName}
- Company: ${prospectData.company}
- Title: ${prospectData.title}
- Industry: ${prospectData.industry || 'Unknown'}
- Company Size: ${prospectData.companySize || 'Unknown'}
- Revenue: ${prospectData.revenue || 'Unknown'}
- Location: ${prospectData.location || 'Unknown'}

Provide your analysis in JSON format with the following structure:
{
  "score": number (0-100),
  "reasoning": "detailed explanation of the score",
  "intentSignals": ["signal1", "signal2", ...],
  "confidence": number (0-1)
}`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are an AI lead scoring expert for enterprise B2B marketing software. Analyze prospects and provide accurate scoring based on their fit for outbound marketing tools."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      response_format: { type: "json_object" },
    });

    const result = JSON.parse(response.choices[0].message.content || '{}');
    
    return {
      score: Math.max(0, Math.min(100, result.score || 0)),
      reasoning: result.reasoning || "No reasoning provided",
      intentSignals: result.intentSignals || [],
      confidence: Math.max(0, Math.min(1, result.confidence || 0.5))
    };
  } catch (error) {
    console.error("Error scoring lead with AI:", error);
    return {
      score: 50,
      reasoning: "Error occurred during AI analysis",
      intentSignals: [],
      confidence: 0.1
    };
  }
}

export async function generatePersonalizedOutreach(prospectData: any, sequenceType: string): Promise<PersonalizationResult> {
  try {
    const prompt = `Create a personalized outreach email for this prospect for an AI-powered outbound marketing platform. The email should be professional, relevant, and focused on their specific role and company.

Prospect Details:
- Name: ${prospectData.firstName} ${prospectData.lastName}
- Company: ${prospectData.company}
- Title: ${prospectData.title}
- Industry: ${prospectData.industry || 'Technology'}

Sequence Type: ${sequenceType}

Generate a personalized email with:
1. A compelling subject line
2. Personalized opening that shows research
3. Value proposition relevant to their role
4. Clear call to action

Provide the response in JSON format:
{
  "subject": "email subject line",
  "emailBody": "full email body",
  "personalizedOpening": "personalized first paragraph",
  "callToAction": "specific call to action"
}`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are an expert B2B copywriter specializing in personalized outreach for marketing technology. Create engaging, relevant emails that resonate with enterprise decision makers."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      response_format: { type: "json_object" },
    });

    const result = JSON.parse(response.choices[0].message.content || '{}');
    
    return {
      subject: result.subject || "Partnership Opportunity",
      emailBody: result.emailBody || "Generic email body",
      personalizedOpening: result.personalizedOpening || "Hello",
      callToAction: result.callToAction || "Let's connect"
    };
  } catch (error) {
    console.error("Error generating personalized outreach:", error);
    return {
      subject: "Error generating subject",
      emailBody: "Error generating email body",
      personalizedOpening: "Error generating opening",
      callToAction: "Error generating CTA"
    };
  }
}

export async function analyzeProspectIntent(prospectData: any, recentActivity: any[]): Promise<string[]> {
  try {
    const prompt = `Analyze this prospect's recent activity and profile to identify intent signals for B2B marketing software. Look for signals that indicate they might be interested in outbound marketing automation, lead generation, or sales enablement tools.

Prospect Profile:
- Company: ${prospectData.company}
- Title: ${prospectData.title}
- Industry: ${prospectData.industry || 'Unknown'}

Recent Activity:
${recentActivity.map(activity => `- ${activity.type}: ${activity.description}`).join('\n')}

Identify potential intent signals and return them as a JSON array of strings:
{
  "intentSignals": ["signal1", "signal2", ...]
}`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are an expert at identifying buyer intent signals for B2B marketing software. Analyze prospect behavior and profile to identify indicators of purchase intent."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      response_format: { type: "json_object" },
    });

    const result = JSON.parse(response.choices[0].message.content || '{}');
    return result.intentSignals || [];
  } catch (error) {
    console.error("Error analyzing prospect intent:", error);
    return [];
  }
}
