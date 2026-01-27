// src/components/tutor/dashboard/LiveClassManagerTab.tsx

import React from "react";
import Link from "next/link";
import { Calendar, Loader2, Edit, Clock, Inbox, ListVideo } from "lucide-react";

import { LiveClassMinimal } from "./SharedTypes";

// --- UI Components ---
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";

interface LiveClassTabProps {
  courseSlug: string;
  liveClasses: LiveClassMinimal[];
}

// --- Utility Components (Themed) ---
const LoaderState: React.FC = () => (
  <div className="flex justify-center items-center h-[300px] bg-card rounded-lg border border-border">
    <Loader2 className="h-8 w-8 animate-spin text-primary" />
    <p className="ml-2 text-muted-foreground">Loading live classes...</p>
  </div>
);

const EmptyState: React.FC<{
  message: string;
  linkPath: string;
  linkText: string;
}> = ({ message, linkPath, linkText }) => (
  <div className="flex flex-col items-center justify-center h-48 border-2 border-dashed border-border rounded-xl bg-muted/30 p-6">
    <div className="h-12 w-12 bg-muted rounded-full flex items-center justify-center mb-4">
        <Inbox className="h-6 w-6 text-muted-foreground" />
    </div>
    <p className="text-muted-foreground text-center font-medium">{message}</p>
    {linkPath && linkText && (
      <Button asChild variant="link" className="text-primary mt-1">
        <Link href={linkPath}>{linkText}</Link>
      </Button>
    )}
  </div>
);

// --- Helper Function ---
function formatRecurrence(type: string): string {
  if (type === "none") return "One-time class";
  if (type === "weekly") return "Weekly";
  return type.charAt(0).toUpperCase() + type.slice(1);
}

const LiveClassManagerTab: React.FC<LiveClassTabProps> = ({
  courseSlug,
  liveClasses,
}) => {
  const createLink = `/courses/${courseSlug}/live-classes/create`;

  return (
    <Card className="border border-border shadow-none p-3 md:p-6 rounded-t-md rounded-b-lg">
      {/* Header */}
      <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between px-0 gap-4">
        <div className="space-y-1">
          <CardTitle className="text-xl font-bold">Live Class Series</CardTitle>
          <CardDescription className="mt-1">
            Schedule and manage your recurring live sessions.
          </CardDescription>
        </div>
        <Link href={createLink} passHref className="mt-4 sm:mt-0 w-full sm:w-auto">
          <Button size="sm" className="w-full sm:w-auto">
            <Calendar className="h-4 w-4 mr-2" /> Schedule New Series
          </Button>
        </Link>
      </CardHeader>

      <CardContent className="px-0 space-y-8">
        {liveClasses.length === 0 ? (
          <EmptyState
            message="No live class series scheduled for this course."
            linkPath={createLink}
            linkText="Schedule your first series"
          />
        ) : (
          <div className="space-y-4">
            {liveClasses.map((lc) => (
              <div
                key={lc.id}
                className="flex flex-col md:flex-row md:items-center justify-between p-6 border rounded-xl bg-card gap-6 transition-all hover:border-primary/50"
              >
                {/* Info Section */}
                <div className="space-y-2">
                  <div className="flex items-center gap-3 flex-wrap">
                    <h3 className="font-semibold text-lg text-foreground">{lc.title}</h3>
                    <Badge 
                      variant={lc.recurrence_type === 'none' ? "secondary" : "default"} 
                      className="border-0"
                    >
                      {formatRecurrence(lc.recurrence_type)}
                    </Badge>
                  </div>

                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1.5">
                        <Calendar size={14} />
                        <span>Starts {new Date(lc.start_date).toLocaleDateString()}</span>
                    </div>
                    <div className="hidden sm:block text-muted-foreground/30">•</div>
                    <div className="flex items-center gap-1.5">
                        <Clock size={14} />
                        <span>
                            {lc.lessons_count} session{lc.lessons_count !== 1 ? 's' : ''}
                        </span>
                    </div>
                  </div>
                </div>

                {/* Actions Section */}
                <div className="pt-2 md:pt-0">
                  <Button asChild size="sm" variant="secondary" className="w-full md:w-auto shadow-sm">
                    <Link href={`/courses/${courseSlug}/live-classes/${lc.slug}/manage`}>
                      <ListVideo size={14} className="mr-2" /> Manage Lessons
                    </Link>
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default LiveClassManagerTab;