"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Calendar, Loader2, Clock, Inbox, ListVideo, Plus, ChevronRight } from "lucide-react";
import { LiveClassMinimal } from "./SharedTypes";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { LiveClassFormModal } from "@/components/live/LiveClassFormModal";

interface LiveClassTabProps {
  courseSlug: string;
  courseId: number;
  liveClasses: LiveClassMinimal[];
  isLoading?: boolean;
  onRefresh?: () => void; 
}

const EmptyState: React.FC<{
  message: string;
  onAction: () => void;
  linkText: string;
}> = ({ message, onAction, linkText }) => (
  <div className="flex flex-col items-center justify-center py-12 md:py-16 border-2 border-dashed border-border rounded-md bg-muted/5 p-6">
    <div className="h-12 w-12 bg-background border border-border rounded-full flex items-center justify-center mb-4">
      <Inbox className="h-6 w-6 text-muted-foreground opacity-40" />
    </div>
    <p className="text-muted-foreground text-center text-sm font-medium max-w-[280px] mb-4">
      {message}
    </p>
    <Button onClick={onAction} size="sm" variant="outline" className="rounded-md font-bold shadow-none border-border">
      {linkText}
    </Button>
  </div>
);

function formatRecurrence(type: string): string {
  if (type === "none") return "One-time session";
  if (type === "weekly") return "Weekly Series";
  return type.charAt(0).toUpperCase() + type.slice(1);
}

const LiveClassManagerTab: React.FC<LiveClassTabProps> = ({
  courseSlug,
  courseId,
  liveClasses,
  isLoading = false,
  onRefresh,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Success handler to ensure modal closes and data refreshes
  const handleSuccess = () => {
    setIsModalOpen(false);
    if (onRefresh) {
      onRefresh();
    } else {
      // Fallback: reload the page if no refresh handler is provided
      window.location.reload();
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 bg-card rounded-md border border-border">
        <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
        <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Syncing Schedules...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="border border-border shadow-none rounded-md overflow-hidden bg-card">
        <CardHeader className="flex flex-row items-center justify-between p-4 md:p-6 bg-muted/20 border-b border-border gap-4">
          <div className="space-y-1">
            <CardTitle className="text-lg md:text-xl font-bold tracking-tight">Live Class Series</CardTitle>
            <CardDescription className="hidden sm:block text-xs font-medium uppercase text-muted-foreground">
              Curriculum schedules and recurring live events.
            </CardDescription>
          </div>
          
          <Button 
            onClick={() => setIsModalOpen(true)} 
            size="sm" 
            className="hidden sm:flex rounded-md font-bold shadow-none h-9 px-4 uppercase tracking-wider text-[11px]"
          >
            <Plus size={16} className="mr-2" /> New Series
          </Button>

          <Button 
            onClick={() => setIsModalOpen(true)} 
            size="icon" 
            className="flex sm:hidden h-9 w-9 rounded-md bg-primary text-primary-foreground shadow-none shrink-0"
          >
            <Plus size={20} />
          </Button>
        </CardHeader>

        <CardContent className="p-0">
          {liveClasses.length === 0 ? (
            <div className="p-6">
                <EmptyState
                  message="No live class series scheduled for this course curriculum."
                  onAction={() => setIsModalOpen(true)}
                  linkText="Schedule First Session"
                />
            </div>
          ) : (
            <div className="divide-y divide-border">
              {liveClasses.map((lc) => (
                <div
                  key={lc.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-4 md:p-5 hover:bg-muted/5 transition-colors group"
                >
                  <div className="space-y-1.5 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-bold text-sm md:text-base text-foreground truncate">
                        {lc.title}
                      </h3>
                      <Badge 
                        variant="outline" 
                        className="text-[9px] font-bold uppercase rounded-sm h-4 bg-background border-border"
                      >
                        {formatRecurrence(lc.recurrence_type)}
                      </Badge>
                    </div>

                    <div className="flex items-center gap-3 text-[10px] font-bold text-muted-foreground uppercase tracking-tight">
                      <div className="flex items-center gap-1">
                        <Calendar size={12} className="opacity-50" />
                        <span>Starts {new Date(lc.start_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
                      </div>
                      <div className="opacity-30">•</div>
                      <div className="flex items-center gap-1">
                        <Clock size={12} className="opacity-50" />
                        <span>
                          {lc.lessons_count} Session{lc.lessons_count !== 1 ? 's' : ''}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 mt-4 sm:mt-0">
                    <Button asChild variant="ghost" className="flex-1 sm:flex-none h-9 md:h-8 rounded-md text-[10px] md:text-[11px] font-black uppercase tracking-widest border border-border/40 hover:bg-muted/50 hover:text-primary transition-all">
                      <Link href={`/courses/${courseSlug}/live-classes/${lc.slug}/manage`} className="flex items-center">
                        Manage <ChevronRight size={14} className="ml-1 opacity-50" />
                      </Link>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <LiveClassFormModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        courseId={courseId} 
        onSuccess={handleSuccess} 
      />
    </div>
  );
};

export default LiveClassManagerTab;