// src/components/tutor/dashboard/LiveClassManagerTab.tsx

import React from "react";
import Link from "next/link";
import { Calendar, Loader2, Edit, Plus, Clock, Inbox } from "lucide-react";

import { LiveClassMinimal } from "./SharedTypes";

// --- UI Components ---
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

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

// NEW: Reusable Empty State component (themed)
const EmptyState: React.FC<{
  message: string;
  linkPath: string;
  linkText: string;
}> = ({ message, linkPath, linkText }) => (
  <div className="flex flex-col items-center justify-center h-40 border-2 border-dashed border-border rounded-lg bg-muted/50 p-4">
    <Inbox className="h-8 w-8 text-muted-foreground" />
    <p className="text-muted-foreground mt-2 text-center">{message}</p>
    {linkPath && linkText && (
      <Button asChild variant="link" className="text-primary">
        <Link href={linkPath}>{linkText}</Link>
      </Button>
    )}
  </div>
);

// --- Helper Function ---
// ✅ FIX: Changed type from '"none" | "weekly"' to 'string' to resolve TS error.
function formatRecurrence(type: string): string {
  if (type === "none") {
    return "One-time class";
  }
  if (type === "weekly") {
    return "Weekly";
  }
  // Fallback for any other unexpected string values
  return type.charAt(0).toUpperCase() + type.slice(1);
}

const LiveClassManagerTab: React.FC<LiveClassTabProps> = ({
  courseSlug,
  liveClasses,
}) => {
  // Corrected link to match the create page route
  const createLink = `/courses/${courseSlug}/live-classes/create`;

  // Reusable function to render the "Manage" button
  const renderManageButton = (lc: LiveClassMinimal) => (
    // Corrected link to match the manage page route
    <Button asChild size="sm" variant="secondary">
      <Link href={`/courses/${courseSlug}/live-classes/${lc.slug}/manage`}>
        <Edit size={14} className="mr-1" /> Manage
      </Link>
    </Button>
  );

  return (
    // UPDATED: Card uses theme colors and flush padding
    <Card className="p-0">
      {/* UPDATED: Header is responsive and themed */}
      <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-6">
        <div>
          <CardTitle>Live Class Series</CardTitle>
          <CardDescription>
            Schedule and manage your recurring live sessions.
          </CardDescription>
        </div>
        {/* UPDATED: Button uses theme primary color (purple) */}
        <Link href={createLink} passHref>
          <Button size="sm">
            <Calendar className="h-4 w-4 mr-2" /> Schedule New Series
          </Button>
        </Link>
      </CardHeader>
      <CardContent className="p-6 pt-0">
        {liveClasses.length === 0 ? (
          // UPDATED: Using new EmptyState component
          <EmptyState
            message="No live class series scheduled for this course."
            linkPath={createLink}
            linkText="Schedule your first series"
          />
        ) : (
          <>
            {/* --- NEW: Mobile Card List (Visible on mobile) --- */}
            <div className="space-y-4 md:hidden">
              {liveClasses.map((lc) => (
                <Card key={lc.id} className="p-4">
                  <div className="flex justify-between items-start">
                    <p className="font-semibold text-foreground">{lc.title}</p>
                    <span className="text-xs text-muted-foreground capitalize">
                      {formatRecurrence(lc.recurrence_type)}
                    </span>
                  </div>
                  <div className="flex justify-between items-end mt-4">
                    <div className="text-sm text-muted-foreground flex items-center">
                      <Clock size={14} className="mr-1" /> {lc.lessons_count}{" "}
                      sessions
                    </div>
                    {renderManageButton(lc)}
                  </div>
                </Card>
              ))}
            </div>

            {/* --- UPDATED: Desktop Table (Hidden on mobile) --- */}
            <div className="border rounded-lg overflow-hidden hidden md:block">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Start Date</TableHead>
                    <TableHead>Lessons</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {liveClasses.map((lc) => (
                    <TableRow key={lc.id}>
                      <TableCell className="font-medium text-foreground">
                        {lc.title}
                      </TableCell>
                      <TableCell className="capitalize text-muted-foreground">
                        {formatRecurrence(lc.recurrence_type)}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {new Date(lc.start_date).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="flex items-center text-muted-foreground">
                        <Clock size={14} className="mr-1" /> {lc.lessons_count}{" "}
                        sessions
                      </TableCell>
                      <TableCell className="text-right">
                        {renderManageButton(lc)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};
export default LiveClassManagerTab;