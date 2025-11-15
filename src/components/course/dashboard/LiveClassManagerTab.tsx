// src/components/tutor/dashboard/LiveClassManagerTab.tsx

import React from "react";
import Link from "next/link";
import { Calendar, Loader2, Edit, Plus, Clock } from "lucide-react";

import { LiveClassMinimal } from "./SharedTypes";

// --- UI Components ---
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";


interface LiveClassTabProps {
  courseSlug: string;
  liveClasses: LiveClassMinimal[];
}

// Utility component for loading state
const LoaderState: React.FC = () => (
    <div className="flex justify-center items-center h-[300px] bg-white rounded-lg border">
      <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
      <p className="ml-2 text-gray-500">Loading live classes...</p>
    </div>
);


const LiveClassManagerTab: React.FC<LiveClassTabProps> = ({ courseSlug, liveClasses }) => {
    
    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Live Class Series</CardTitle>
                <Link href={`/tutor/courses/${courseSlug}/live-classes/create`} passHref>
                    <Button size="sm" className="bg-[#2694C6] hover:bg-[#1f7ba5]"><Calendar className="h-4 w-4 mr-2" /> Schedule New Series</Button>
                </Link>
            </CardHeader>
            <CardContent>
                {liveClasses.length === 0 ? (
                    <div className="text-center py-8 border rounded-lg bg-gray-50 text-gray-600">
                        <p className="font-medium">No live class series scheduled for this course.</p>
                        <p className="text-sm">Click 'Schedule New Series' to begin adding live sessions.</p>
                    </div>
                ) : (
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
                                    <TableCell className="font-medium">{lc.title}</TableCell>
                                    <TableCell className="capitalize">{lc.recurrence_type}</TableCell>
                                    <TableCell>{new Date(lc.start_date).toLocaleDateString()}</TableCell>
                                    <TableCell className="flex items-center">
                                        <Clock size={14} className="mr-1 text-gray-500" /> {lc.lessons_count} sessions
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Link href={`/tutor/live-classes/${lc.slug}/edit`} passHref>
                                            <Button size="sm" variant="outline"><Edit size={14} className="mr-1" /> Manage</Button>
                                        </Link>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                )}
            </CardContent>
        </Card>
    );
};
export default LiveClassManagerTab;