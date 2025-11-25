import { prisma } from "@/lib/prisma";

export interface LeadScoringFactors {
  // Demographic factors
  hasEmail: boolean;
  hasPhone: boolean;
  hasJobTitle: boolean;
  hasCompany: boolean;
  
  // Engagement factors
  emailOpens: number;
  emailClicks: number;
  callsAnswered: number;
  callsAttempted: number;
  
  // Behavioral factors
  responseTime: number; // Average response time in hours
  lastActivityDays: number; // Days since last activity
  totalActivities: number;
  
  // Campaign factors
  campaignType: string;
  leadSource: string;
  
  // Custom data completeness
  customDataCompleteness: number; // Percentage of custom fields filled
}

export interface LeadScore {
  totalScore: number;
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
  factors: {
    demographic: number;
    engagement: number;
    behavioral: number;
    campaign: number;
  };
  recommendations: string[];
  riskLevel: 'Low' | 'Medium' | 'High';
  nextBestAction: string;
  priority: 'Hot' | 'Warm' | 'Cold';
}

const SCORING_WEIGHTS = {
  demographic: 0.2,
  engagement: 0.35,
  behavioral: 0.3,
  campaign: 0.15
};

const DEMOGRAPHIC_SCORES = {
  hasEmail: 15,
  hasPhone: 20,
  hasJobTitle: 10,
  hasCompany: 15,
  customDataCompleteness: 40 // Max 40 points for complete custom data
};

const ENGAGEMENT_MULTIPLIERS = {
  emailOpenRate: 2.0,
  emailClickRate: 3.0,
  callAnswerRate: 4.0
};

export function calculateLeadScore(factors: LeadScoringFactors): LeadScore {
  // Calculate demographic score (0-100)
  let demographicScore = 0;
  demographicScore += factors.hasEmail ? DEMOGRAPHIC_SCORES.hasEmail : 0;
  demographicScore += factors.hasPhone ? DEMOGRAPHIC_SCORES.hasPhone : 0;
  demographicScore += factors.hasJobTitle ? DEMOGRAPHIC_SCORES.hasJobTitle : 0;
  demographicScore += factors.hasCompany ? DEMOGRAPHIC_SCORES.hasCompany : 0;
  demographicScore += (factors.customDataCompleteness / 100) * DEMOGRAPHIC_SCORES.customDataCompleteness;

  // Calculate engagement score (0-100)
  let engagementScore = 0;
  const emailOpenRate = factors.emailClicks > 0 ? factors.emailOpens / factors.emailClicks : 0;
  const emailClickRate = factors.emailOpens > 0 ? factors.emailClicks / factors.emailOpens : 0;
  const callAnswerRate = factors.callsAttempted > 0 ? factors.callsAnswered / factors.callsAttempted : 0;
  
  engagementScore += Math.min(emailOpenRate * ENGAGEMENT_MULTIPLIERS.emailOpenRate * 20, 30);
  engagementScore += Math.min(emailClickRate * ENGAGEMENT_MULTIPLIERS.emailClickRate * 20, 35);
  engagementScore += Math.min(callAnswerRate * ENGAGEMENT_MULTIPLIERS.callAnswerRate * 20, 35);

  // Calculate behavioral score (0-100)
  let behavioralScore = 0;
  
  // Response time scoring (faster response = higher score)
  if (factors.responseTime > 0) {
    if (factors.responseTime <= 1) behavioralScore += 30;
    else if (factors.responseTime <= 4) behavioralScore += 25;
    else if (factors.responseTime <= 24) behavioralScore += 15;
    else if (factors.responseTime <= 72) behavioralScore += 10;
    else behavioralScore += 5;
  }
  
  // Activity recency (more recent = higher score)
  if (factors.lastActivityDays <= 1) behavioralScore += 25;
  else if (factors.lastActivityDays <= 3) behavioralScore += 20;
  else if (factors.lastActivityDays <= 7) behavioralScore += 15;
  else if (factors.lastActivityDays <= 14) behavioralScore += 10;
  else if (factors.lastActivityDays <= 30) behavioralScore += 5;
  
  // Total activities (more engagement = higher score)
  if (factors.totalActivities >= 10) behavioralScore += 25;
  else if (factors.totalActivities >= 5) behavioralScore += 20;
  else if (factors.totalActivities >= 3) behavioralScore += 15;
  else if (factors.totalActivities >= 1) behavioralScore += 10;
  
  // Activity consistency bonus
  if (factors.totalActivities > 0 && factors.lastActivityDays <= 7) {
    behavioralScore += 20;
  }

  // Calculate campaign score (0-100)
  let campaignScore = 50; // Base score
  
  // Campaign type scoring
  switch (factors.campaignType?.toLowerCase()) {
    case 'premium':
    case 'enterprise':
      campaignScore += 30;
      break;
    case 'standard':
      campaignScore += 20;
      break;
    case 'basic':
      campaignScore += 10;
      break;
  }
  
  // Lead source scoring
  switch (factors.leadSource?.toLowerCase()) {
    case 'referral':
    case 'inbound':
      campaignScore += 20;
      break;
    case 'linkedin':
    case 'social':
      campaignScore += 15;
      break;
    case 'cold_email':
      campaignScore += 10;
      break;
    case 'cold_call':
      campaignScore += 5;
      break;
  }

  // Ensure scores are within bounds
  demographicScore = Math.min(Math.max(demographicScore, 0), 100);
  engagementScore = Math.min(Math.max(engagementScore, 0), 100);
  behavioralScore = Math.min(Math.max(behavioralScore, 0), 100);
  campaignScore = Math.min(Math.max(campaignScore, 0), 100);

  // Calculate weighted total score
  const totalScore = Math.round(
    demographicScore * SCORING_WEIGHTS.demographic +
    engagementScore * SCORING_WEIGHTS.engagement +
    behavioralScore * SCORING_WEIGHTS.behavioral +
    campaignScore * SCORING_WEIGHTS.campaign
  );

  // Determine grade
  let grade: 'A' | 'B' | 'C' | 'D' | 'F';
  if (totalScore >= 85) grade = 'A';
  else if (totalScore >= 70) grade = 'B';
  else if (totalScore >= 55) grade = 'C';
  else if (totalScore >= 40) grade = 'D';
  else grade = 'F';

  // Determine priority
  let priority: 'Hot' | 'Warm' | 'Cold';
  if (totalScore >= 75) priority = 'Hot';
  else if (totalScore >= 50) priority = 'Warm';
  else priority = 'Cold';

  // Determine risk level
  let riskLevel: 'Low' | 'Medium' | 'High';
  if (factors.lastActivityDays > 14 && totalScore < 60) riskLevel = 'High';
  else if (factors.lastActivityDays > 7 || totalScore < 70) riskLevel = 'Medium';
  else riskLevel = 'Low';

  // Generate recommendations
  const recommendations: string[] = [];
  
  if (!factors.hasEmail) recommendations.push("Obtain email address for better communication");
  if (!factors.hasPhone) recommendations.push("Get phone number for direct contact");
  if (factors.lastActivityDays > 7) recommendations.push("Follow up immediately - lead is getting cold");
  if (factors.callsAttempted > 0 && factors.callsAnswered === 0) recommendations.push("Try different calling times or email first");
  if (factors.emailOpens === 0 && factors.emailClicks > 0) recommendations.push("Improve email subject lines");
  if (factors.customDataCompleteness < 50) recommendations.push("Gather more qualifying information");
  if (engagementScore < 30) recommendations.push("Increase engagement with personalized content");
  if (totalScore >= 80) recommendations.push("High-quality lead - prioritize for immediate contact");

  // Determine next best action
  let nextBestAction: string;
  if (factors.lastActivityDays > 14) {
    nextBestAction = "Re-engagement campaign";
  } else if (factors.callsAnswered > 0) {
    nextBestAction = "Schedule follow-up call";
  } else if (factors.emailOpens > 0) {
    nextBestAction = "Send personalized email";
  } else if (factors.hasPhone) {
    nextBestAction = "Make phone call";
  } else {
    nextBestAction = "Send initial email";
  }

  return {
    totalScore,
    grade,
    factors: {
      demographic: Math.round(demographicScore),
      engagement: Math.round(engagementScore),
      behavioral: Math.round(behavioralScore),
      campaign: Math.round(campaignScore)
    },
    recommendations,
    riskLevel,
    nextBestAction,
    priority
  };
}

export async function calculateLeadScoreFromDatabase(leadId: string): Promise<LeadScore> {
  const lead = await prisma.lead.findUnique({
    where: { id: leadId },
    include: {
      activities: {
        orderBy: { createdAt: 'desc' }
      },
      campaign: true
    }
  });

  if (!lead) {
    throw new Error("Lead not found");
  }

  // Extract factors from database
  const standardData = lead.standardData as any || {};
  const customData = lead.customData as any || {};
  
  // Count custom data completeness
  const customFields = Object.keys(customData);
  const filledCustomFields = customFields.filter(key => 
    customData[key] !== null && 
    customData[key] !== undefined && 
    customData[key] !== ''
  );
  const customDataCompleteness = customFields.length > 0 ? 
    (filledCustomFields.length / customFields.length) * 100 : 0;

  // Calculate activity metrics
  const emailActivities = lead.activities.filter(a => a.type === 'EMAIL');
  const callActivities = lead.activities.filter(a => a.type === 'CALL');
  
  const emailOpens = emailActivities.filter(a => 
    a.metadata && (a.metadata as any).opened
  ).length;
  
  const emailClicks = emailActivities.filter(a => 
    a.metadata && (a.metadata as any).clicked
  ).length;
  
  const callsAttempted = callActivities.length;
  const callsAnswered = callActivities.filter(a => 
    a.metadata && (a.metadata as any).answered
  ).length;

  // Calculate response time (simplified - average time between activities)
  let responseTime = 0;
  if (lead.activities.length > 1) {
    const timeDiffs = [];
    for (let i = 0; i < lead.activities.length - 1; i++) {
      const diff = new Date(lead.activities[i].createdAt).getTime() - 
                   new Date(lead.activities[i + 1].createdAt).getTime();
      timeDiffs.push(diff / (1000 * 60 * 60)); // Convert to hours
    }
    responseTime = timeDiffs.reduce((a, b) => a + b, 0) / timeDiffs.length;
  }

  // Days since last activity
  const lastActivityDays = lead.activities.length > 0 ? 
    Math.floor((Date.now() - new Date(lead.activities[0].createdAt).getTime()) / (1000 * 60 * 60 * 24)) : 
    Math.floor((Date.now() - new Date(lead.createdAt).getTime()) / (1000 * 60 * 60 * 24));

  const factors: LeadScoringFactors = {
    hasEmail: !!standardData.email,
    hasPhone: !!standardData.phone,
    hasJobTitle: !!standardData.jobTitle,
    hasCompany: !!standardData.company,
    emailOpens,
    emailClicks,
    callsAnswered,
    callsAttempted,
    responseTime,
    lastActivityDays,
    totalActivities: lead.activities.length,
    campaignType: lead.campaign?.name || 'standard',
    leadSource: (lead.customData as any)?.source || 'unknown',
    customDataCompleteness
  };

  return calculateLeadScore(factors);
}

export async function updateLeadScores(campaignId?: string): Promise<void> {
  const whereClause = campaignId ? { campaignId } : {};
  
  const leads = await prisma.lead.findMany({
    where: whereClause,
    select: { id: true }
  });

  for (const lead of leads) {
    try {
      const score = await calculateLeadScoreFromDatabase(lead.id);
      
      // Update lead with score
      await prisma.lead.update({
        where: { id: lead.id },
        data: {
          customData: {
            ...(await prisma.lead.findUnique({ where: { id: lead.id } }))?.customData as any || {},
            leadScore: score.totalScore,
            leadGrade: score.grade,
            leadPriority: score.priority,
            riskLevel: score.riskLevel,
            nextBestAction: score.nextBestAction,
            scoringFactors: score.factors,
            recommendations: score.recommendations,
            lastScored: new Date().toISOString()
          }
        }
      });
    } catch (error) {
      console.error(`Failed to score lead ${lead.id}:`, error);
    }
  }
}
