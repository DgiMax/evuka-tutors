"use client";

import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { 
  Search, Plus, School, Home, MoreHorizontal, 
  Settings, ExternalLink, Users, LayoutDashboard, ChevronRight 
} from "lucide-react";
import Link from "next/link";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";

import api from "@/lib/api/axios";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface OrganizationListItem {
  slug: string;
  name: string;
  org_type: "school" | "homeschool";
  logo: string | null;
  description: string;
  status: "draft" | "pending_approval" | "approved" | "suspended" | "archived";
  membership_period: string;
  membership_price: number;
  is_member: boolean;
}

export default function OrganizationListPage() {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");

  const { data: organizations, isLoading, isError } = useQuery<OrganizationListItem[]>({
    queryKey: ["myOrganizations"],
    queryFn: async () => {
      const res = await api.get("/organizations/");
      return res.data;
    },
  });

  const filteredOrgs = organizations?.filter(org => 
    org.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (org.description && org.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const getStatusBadge = (status: string) => {
    switch(status) {
        case 'approved': return <Badge className="bg-emerald-600/10 text-emerald-600 hover:bg-emerald-600/20 border-0 shadow-none">Active</Badge>;
        case 'pending_approval': return <Badge variant="secondary" className="text-orange-700 bg-orange-50 hover:bg-orange-100 border-0">Pending</Badge>;
        case 'draft': return <Badge variant="outline" className="text-muted-foreground border-dashed">Draft</Badge>;
        case 'suspended': return <Badge variant="destructive" className="opacity-90">Suspended</Badge>;
        default: return <Badge variant="secondary">{status.replace("_", " ")}</Badge>;
    }
  };

  const getTypeIcon = (type: string) => {
      return type === 'school' ? <School className="h-3.5 w-3.5" /> : <Home className="h-3.5 w-3.5" />;
  };

  return (
    <div className="container mx-auto py-8 px-4 max-w-7xl space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-2">
        <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">My Organizations</h1>
            <p className="text-muted-foreground mt-1">Manage the schools and networks you own or teach at.</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
            <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                    placeholder="Search organizations..." 
                    className="pl-9 bg-background/50 focus:bg-background transition-colors"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>
            <Button onClick={() => router.push("/organizations/create")} className="shrink-0 shadow-none">
                <Plus className="mr-2 h-4 w-4" /> Create New
            </Button>
        </div>
      </div>

      {isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => (
                <Card key={i} className="overflow-hidden border-border/40 shadow-none">
                    <CardHeader className="pb-4">
                        <div className="flex items-center gap-3">
                            <Skeleton className="h-12 w-12 rounded-lg" />
                            <div className="space-y-2 flex-1">
                                <Skeleton className="h-5 w-3/4" />
                                <Skeleton className="h-3 w-1/2" />
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent><Skeleton className="h-16 w-full" /></CardContent>
                    <CardFooter className="pt-0"><Skeleton className="h-9 w-24" /></CardFooter>
                </Card>
            ))}
        </div>
      )}

      {isError && (
          <div className="flex flex-col items-center justify-center py-12 text-center border rounded-lg bg-destructive/5">
              <p className="text-destructive font-medium">Failed to load organizations.</p>
              <Button variant="link" onClick={() => window.location.reload()} className="text-destructive">Try Again</Button>
          </div>
      )}

      {!isLoading && !isError && filteredOrgs?.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-center border-2 border-dashed border-muted-foreground/20 rounded-xl bg-muted/5">
            <div className="h-16 w-16 bg-muted rounded-full flex items-center justify-center mb-4">
                <School className="h-8 w-8 text-muted-foreground opacity-50" />
            </div>
            <h3 className="text-xl font-semibold text-foreground">No organizations found</h3>
            <p className="text-sm text-muted-foreground max-w-sm mt-2 mb-6">
                {searchTerm ? "No results found for your search term." : "You haven't created or joined any organizations yet."}
            </p>
            {!searchTerm && (
                <Button onClick={() => router.push("/organizations/create")} className="shadow-none">
                    Get Started
                </Button>
            )}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredOrgs?.map((org) => (
            <Card 
                key={org.slug} 
                className="group relative flex flex-col border border-border bg-card p-0 rounded-md transition-colors duration-200 hover:border-primary shadow-none"
            >
                <CardHeader className="pb-3 px-4 pt-4">
                    <div className="flex justify-between items-start">
                        <div className="flex items-center gap-3.5">
                            <Avatar className="h-12 w-12 rounded-xl border border-border bg-white shadow-none">
                                <AvatarImage src={org.logo || ""} className="object-cover" alt={org.name} />
                                <AvatarFallback className="rounded-xl bg-primary/5 text-primary font-bold text-lg">
                                    {org.name.charAt(0)}
                                </AvatarFallback>
                            </Avatar>
                            <div>
                                <CardTitle className="text-base font-bold line-clamp-1 leading-tight text-foreground/90">
                                    {org.name}
                                </CardTitle>
                                <div className="flex items-center gap-2 mt-2">
                                    <span className="text-[10px] uppercase tracking-wider font-medium text-muted-foreground flex items-center gap-1.5 bg-secondary/50 px-2 py-0.5 rounded-md">
                                        {getTypeIcon(org.org_type)}
                                        {org.org_type}
                                    </span>
                                    {getStatusBadge(org.status)}
                                </div>
                            </div>
                        </div>
                        
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button 
                                  variant="ghost" 
                                  size="icon"
                                  className="h-8 w-8 p-0 border-none bg-transparent hover:bg-transparent text-muted-foreground hover:text-foreground focus-visible:ring-0"
                                >
                                    <span className="sr-only">Open menu</span>
                                    <MoreHorizontal className="h-4 w-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48">
                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                <DropdownMenuItem onClick={() => router.push(`/${org.slug}`)} className="cursor-pointer">
                                    <LayoutDashboard className="mr-2 h-4 w-4" /> Dashboard
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => window.open(`/${org.slug}`, '_blank')} className="cursor-pointer">
                                    <ExternalLink className="mr-2 h-4 w-4" /> Public Page
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </CardHeader>
                
                <CardContent className="pb-2 px-4 flex-1">
                    <p className="text-sm text-muted-foreground/80 line-clamp-2 leading-relaxed min-h-[2.5rem]">
                        {org.description || <span className="italic opacity-50">No description provided for this organization.</span>}
                    </p>
                </CardContent>

                <CardFooter className="pt-2 pb-4 px-4 flex justify-between items-center border-t-0">
                    <div className="flex items-center text-xs text-muted-foreground/70">
                        <Users className="h-3.5 w-3.5 mr-1.5" />
                        <span>Manage Access</span>
                    </div>
                    
                    <Link href={`/${org.slug}`} passHref>
                        <Button 
                            variant="ghost" 
                            size="sm" 
                            className="gap-1.5 text-primary bg-transparent hover:bg-transparent border-none px-0 h-8 font-medium transition-colors focus-visible:ring-0"
                        >
                            <Settings className="h-3.5 w-3.5" /> 
                            Manage
                            <ChevronRight className="h-3 w-3 opacity-50" />
                        </Button>
                    </Link>
                </CardFooter>
            </Card>
        ))}
      </div>
    </div>
  );
}