"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { 
  ChevronLeft, 
  ChevronRight, 
  ExternalLink,
  Users,
  Building2,
  Megaphone,
  Loader2
} from "lucide-react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { SearchResult } from "@/lib/search";

interface SearchResultsProps<T> {
  results: SearchResult<T> | null;
  isLoading: boolean;
  entity: 'leads' | 'campaigns' | 'accounts';
  onPageChange: (page: number) => void;
  onItemClick?: (itemId: string) => void;
}

export function SearchResults<T extends Record<string, any>>({ 
  results, 
  isLoading, 
  entity,
  onPageChange,
  onItemClick,
}: SearchResultsProps<T>) {
  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary-500" />
          <p className="text-body text-muted-foreground">
            Searching...
          </p>
        </CardContent>
      </Card>
    );
  }

  if (!results) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <div className="text-6xl mb-4">🔍</div>
          <p className="text-body text-muted-foreground">
            Enter search criteria to find {entity}
          </p>
        </CardContent>
      </Card>
    );
  }

  if (results.items.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <div className="text-6xl mb-4">📭</div>
          <p className="text-body text-muted-foreground mb-2">
            No {entity} found
          </p>
          <p className="text-sm text-muted-foreground">
            Try adjusting your search criteria or filters
          </p>
        </CardContent>
      </Card>
    );
  }

  const getEntityIcon = () => {
    switch (entity) {
      case 'leads': return Users;
      case 'campaigns': return Megaphone;
      case 'accounts': return Building2;
      default: return Users;
    }
  };

  const EntityIcon = getEntityIcon();

  const renderItem = (item: T) => {
    switch (entity) {
      case 'leads':
        return renderLeadItem(item);
      case 'campaigns':
        return renderCampaignItem(item);
      case 'accounts':
        return renderAccountItem(item);
      default:
        return null;
    }
  };

  const renderLeadItem = (lead: any) => {
    const standardData = lead.standardData || {};
    const customData = lead.customData || {};
    const fullName = `${standardData.firstName || ''} ${standardData.lastName || ''}`.trim() || 'Unknown Lead';
    
    const getInitials = (firstName?: string, lastName?: string) => {
      const first = firstName?.[0] || '';
      const last = lastName?.[0] || '';
      return (first + last).toUpperCase() || '?';
    };

    const getStatusColor = (status: string) => {
      switch (status) {
        case 'Qualified': return 'bg-success-100 text-success-text';
        case 'Contacted': return 'bg-info-light text-info-500';
        case 'Nurture': return 'bg-warning-100 text-warning-500';
        case 'Lost': return 'bg-danger-100 text-danger-text';
        default: return 'bg-muted text-muted-foreground';
      }
    };

    return (
      <div 
        key={lead.id} 
        className="flex items-center gap-4 p-4 border rounded-lg hover:shadow-md transition-shadow cursor-pointer"
        onClick={() => onItemClick && onItemClick(lead.id)}
      >
        <Avatar className="h-10 w-10">
          <AvatarFallback className="bg-primary-100 text-primary-500 font-medium">
            {getInitials(standardData.firstName, standardData.lastName)}
          </AvatarFallback>
        </Avatar>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onItemClick && onItemClick(lead.id);
              }}
              className="text-body-sm font-medium text-text-main hover:text-primary-500 transition-colors text-left"
            >
              {fullName}
            </button>
            <Badge variant="outline" className={`text-xs ${getStatusColor(lead.status)}`}>
              {lead.status}
            </Badge>
            {customData.leadGrade && (
              <Badge variant="outline" className="text-xs">
                Grade {customData.leadGrade}
              </Badge>
            )}
          </div>
          
          <div className="space-y-1">
            {standardData.company && (
              <p className="text-sm text-muted-foreground flex items-center gap-1">
                <Building2 className="h-3 w-3" />
                {standardData.company}
              </p>
            )}
            {standardData.email && (
              <p className="text-sm text-muted-foreground truncate">
                {standardData.email}
              </p>
            )}
            {lead.campaign && (
              <p className="text-xs text-muted-foreground">
                Campaign: {lead.campaign.name}
              </p>
            )}
          </div>
        </div>
        
        <div className="text-right">
          <p className="text-xs text-muted-foreground">
            {formatDistanceToNow(new Date(lead.createdAt), { addSuffix: true })}
          </p>
          {customData.leadScore && (
            <p className="text-xs font-medium">
              Score: {customData.leadScore}
            </p>
          )}
        </div>
        
        <Link href={`/leads/${lead.id}`}>
          <Button variant="ghost" size="icon">
            <ExternalLink className="h-4 w-4" />
          </Button>
        </Link>
      </div>
    );
  };

  const renderCampaignItem = (campaign: any) => {
    const getStatusColor = (status: string) => {
      switch (status) {
        case 'Active': return 'bg-success-100 text-success-text';
        case 'Paused': return 'bg-warning-100 text-warning-500';
        case 'Draft': return 'bg-muted text-muted-foreground';
        default: return 'bg-muted text-muted-foreground';
      }
    };

    return (
      <div 
        key={campaign.id} 
        className="flex items-center gap-4 p-4 border rounded-lg hover:shadow-md transition-shadow cursor-pointer"
        onClick={() => onItemClick && onItemClick(campaign.id)}
      >
        <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center">
          <Megaphone className="h-5 w-5 text-primary-500" />
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onItemClick && onItemClick(campaign.id);
              }}
              className="text-body-sm font-medium text-text-main hover:text-primary-500 transition-colors text-left"
            >
              {campaign.name}
            </button>
            <Badge variant="outline" className={`text-xs ${getStatusColor(campaign.status)}`}>
              {campaign.status}
            </Badge>
          </div>
          
          <div className="space-y-1">
            {campaign.account && (
              <p className="text-sm text-muted-foreground flex items-center gap-1">
                <Building2 className="h-3 w-3" />
                {campaign.account.companyName}
              </p>
            )}
            <p className="text-xs text-muted-foreground">
              {campaign._count?.leads || 0} leads
            </p>
          </div>
        </div>
        
        <div className="text-right">
          <p className="text-xs text-muted-foreground">
            {formatDistanceToNow(new Date(campaign.createdAt), { addSuffix: true })}
          </p>
          {campaign.startDate && (
            <p className="text-xs text-muted-foreground">
              Started: {new Date(campaign.startDate).toLocaleDateString()}
            </p>
          )}
        </div>
        
        <Button 
          variant="ghost" 
          size="icon"
          onClick={(e) => {
            e.stopPropagation();
            onItemClick && onItemClick(campaign.id);
          }}
        >
          <ExternalLink className="h-4 w-4" />
        </Button>
      </div>
    );
  };

  const renderAccountItem = (account: any) => {
    return (
      <div key={account.id} className="flex items-center gap-4 p-4 border rounded-lg hover:shadow-md transition-shadow">
        <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center">
          <Building2 className="h-5 w-5 text-primary-500" />
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <Link 
              href={`/accounts/${account.id}`}
              className="text-body-sm font-medium text-text-main hover:text-primary-500 transition-colors"
            >
              {account.companyName}
            </Link>
          </div>
          
          <div className="space-y-1">
            {account.industry && (
              <p className="text-sm text-muted-foreground">
                {account.industry}
              </p>
            )}
            {account.contactEmail && (
              <p className="text-sm text-muted-foreground truncate">
                {account.contactEmail}
              </p>
            )}
            <p className="text-xs text-muted-foreground">
              {account._count?.campaigns || 0} campaigns
            </p>
          </div>
        </div>
        
        <div className="text-right">
          <p className="text-xs text-muted-foreground">
            {formatDistanceToNow(new Date(account.createdAt), { addSuffix: true })}
          </p>
        </div>
        
        <Link href={`/accounts/${account.id}`}>
          <Button variant="ghost" size="icon">
            <ExternalLink className="h-4 w-4" />
          </Button>
        </Link>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <EntityIcon className="h-5 w-5" />
              Search Results
            </CardTitle>
            <div className="text-sm text-muted-foreground">
              {results.total} {entity} found
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-3">
          {results.items.map(renderItem)}
        </CardContent>
      </Card>

      {/* Pagination */}
      {results.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Page {results.page} of {results.totalPages} 
            ({results.total} total {entity})
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(results.page - 1)}
              disabled={results.page <= 1}
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Previous
            </Button>
            
            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(5, results.totalPages) }, (_, i) => {
                const page = i + 1;
                return (
                  <Button
                    key={page}
                    variant={page === results.page ? "default" : "outline"}
                    size="sm"
                    onClick={() => onPageChange(page)}
                    className="w-8 h-8 p-0"
                  >
                    {page}
                  </Button>
                );
              })}
            </div>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(results.page + 1)}
              disabled={results.page >= results.totalPages}
            >
              Next
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}



