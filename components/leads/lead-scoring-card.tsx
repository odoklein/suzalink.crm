"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { 
  Target, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle, 
  Clock,
  Lightbulb,
  RefreshCw
} from "lucide-react";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

interface LeadScore {
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

interface LeadScoringCardProps {
  leadId: string;
  initialScore?: LeadScore;
}

const getGradeColor = (grade: string) => {
  switch (grade) {
    case 'A': return 'bg-success-100 text-success-text border-success-500';
    case 'B': return 'bg-info-light text-info-500 border-info-500';
    case 'C': return 'bg-warning-100 text-warning-500 border-warning-500';
    case 'D': return 'bg-danger-100 text-danger-text border-danger-500';
    case 'F': return 'bg-muted text-muted-foreground border-border';
    default: return 'bg-muted text-muted-foreground border-border';
  }
};

const getPriorityColor = (priority: string) => {
  switch (priority) {
    case 'Hot': return 'bg-danger-100 text-danger-text border-danger-500';
    case 'Warm': return 'bg-warning-100 text-warning-500 border-warning-500';
    case 'Cold': return 'bg-info-light text-info-500 border-info-500';
    default: return 'bg-muted text-muted-foreground border-border';
  }
};

const getRiskColor = (risk: string) => {
  switch (risk) {
    case 'High': return 'bg-danger-100 text-danger-text border-danger-500';
    case 'Medium': return 'bg-warning-100 text-warning-500 border-warning-500';
    case 'Low': return 'bg-success-100 text-success-text border-success-500';
    default: return 'bg-muted text-muted-foreground border-border';
  }
};

export function LeadScoringCard({ leadId, initialScore }: LeadScoringCardProps) {
  const queryClient = useQueryClient();
  
  const { data: score, isLoading } = useQuery<LeadScore>({
    queryKey: ['lead-score', leadId],
    queryFn: async () => {
      const res = await fetch(`/api/leads/scoring?leadId=${leadId}`);
      if (!res.ok) throw new Error('Failed to fetch lead score');
      const data = await res.json();
      return data.score;
    },
    initialData: initialScore,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const recalculateMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/leads/scoring', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leadId }),
      });
      if (!res.ok) throw new Error('Failed to recalculate score');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lead-score', leadId] });
    },
  });

  if (isLoading || !score) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-h2 flex items-center gap-2">
            <Target className="h-5 w-5" />
            Lead Score
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-muted rounded"></div>
            <div className="h-4 bg-muted rounded w-3/4"></div>
            <div className="h-4 bg-muted rounded w-1/2"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-h2 flex items-center gap-2">
          <Target className="h-5 w-5" />
          Lead Score
        </CardTitle>
        <Button
          variant="outline"
          size="sm"
          onClick={() => recalculateMutation.mutate()}
          disabled={recalculateMutation.isPending}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${recalculateMutation.isPending ? 'animate-spin' : ''}`} />
          Recalculate
        </Button>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Overall Score */}
        <div className="text-center">
          <div className="text-4xl font-bold text-text-main mb-2">
            {score.totalScore}
          </div>
          <div className="flex items-center justify-center gap-2 mb-4">
            <Badge className={getGradeColor(score.grade)} variant="outline">
              Grade {score.grade}
            </Badge>
            <Badge className={getPriorityColor(score.priority)} variant="outline">
              {score.priority}
            </Badge>
            <Badge className={getRiskColor(score.riskLevel)} variant="outline">
              {score.riskLevel} Risk
            </Badge>
          </div>
          <Progress value={score.totalScore} className="w-full" />
        </div>

        {/* Score Breakdown */}
        <div className="space-y-3">
          <h4 className="text-body-sm font-medium">Score Breakdown</h4>
          
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Demographic</span>
              <span className="text-sm font-medium">{score.factors.demographic}/100</span>
            </div>
            <Progress value={score.factors.demographic} className="h-2" />
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Engagement</span>
              <span className="text-sm font-medium">{score.factors.engagement}/100</span>
            </div>
            <Progress value={score.factors.engagement} className="h-2" />
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Behavioral</span>
              <span className="text-sm font-medium">{score.factors.behavioral}/100</span>
            </div>
            <Progress value={score.factors.behavioral} className="h-2" />
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Campaign</span>
              <span className="text-sm font-medium">{score.factors.campaign}/100</span>
            </div>
            <Progress value={score.factors.campaign} className="h-2" />
          </div>
        </div>

        {/* Next Best Action */}
        <div className="p-3 bg-primary-100 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle className="h-4 w-4 text-primary-500" />
            <span className="text-sm font-medium text-primary-500">Next Best Action</span>
          </div>
          <p className="text-sm text-text-main">{score.nextBestAction}</p>
        </div>

        {/* Recommendations */}
        {score.recommendations.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Lightbulb className="h-4 w-4 text-warning-500" />
              <span className="text-body-sm font-medium">Recommendations</span>
            </div>
            <ul className="space-y-1">
              {score.recommendations.map((rec, index) => (
                <li key={index} className="text-sm text-muted-foreground flex items-start gap-2">
                  <span className="text-warning-500 mt-1">•</span>
                  {rec}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Risk Alert */}
        {score.riskLevel === 'High' && (
          <div className="p-3 bg-danger-100 rounded-lg border border-danger-500">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="h-4 w-4 text-danger-500" />
              <span className="text-sm font-medium text-danger-text">High Risk Lead</span>
            </div>
            <p className="text-sm text-danger-text">
              This lead requires immediate attention to prevent loss.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}





