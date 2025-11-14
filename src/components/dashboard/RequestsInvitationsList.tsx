"use client";

import React, { useState, useEffect, useCallback } from "react";
import api from "@/lib/api/axios";
import { toast } from "sonner";
import { Loader2, Mail, Send, UserCheck, UserX, Trash2, Inbox } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

// --- Interfaces ---
interface Invitation {
  id: number;
  organization: string;
  invited_by: {
    full_name: string;
    username: string;
  };
  role: string;
  created_at: string;
}

interface JoinRequest {
  id: number;
  organization: string;
  message: string;
  status: string;
  created_at: string;
}

export default function RequestsInvitationsList() {
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [requests, setRequests] = useState<JoinRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { fetchCurrentUser } = useAuth(); // To refresh user orgs after accepting

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      // Fetch both in parallel
      const [invitesRes, requestsRes] = await Promise.all([
        // ✅ CORRECT URL: Fetches *only* the user's invitations
        api.get("/community/api/my-invitations/"),
        
        // ✅ CORRECT URL: Fetches *only* the user's sent join requests
        api.get("/community/api/my-join-requests/"), 
      ]);
      
      setInvitations(invitesRes.data.results || invitesRes.data || []);
      setRequests(requestsRes.data.results || requestsRes.data || []);

    } catch (error) {
      console.error("Failed to load requests/invitations:", error);
      toast.error("Failed to load requests and invitations.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // --- Invitation Actions ---
  const handleInvitationAction = async (id: number, action: "accept" | "reject") => {
    try {
      // ✅ CORRECT URL: This path is for the user to accept/reject their own invite
      await api.post(`/community/api/my-invitations/${id}/${action}/`);
      toast.success(
        action === "accept" ? "Invitation Accepted!" : "Invitation Rejected."
      );
      if (action === "accept") {
        await fetchCurrentUser(); // Refresh user state in AuthContext
      }
      fetchData(); // Refresh both lists
    } catch (error: any) {
      toast.error(error.response?.data?.error || `Failed to ${action} invitation.`);
    }
  };

  // --- Join Request Actions ---
  const handleCancelRequest = async (id: number) => {
    try {
      // ✅ CORRECT URL: This path is for the user to cancel their own request
      await api.post(`/community/api/my-join-requests/${id}/cancel/`);
      toast.success("Join request cancelled.");
      fetchData(); // Refresh both lists
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Failed to cancel request.");
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-48">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (invitations.length === 0 && requests.length === 0) {
    return (
      <div className="p-8 text-center text-gray-500 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
        <Inbox className="h-10 w-10 mx-auto mb-3 text-gray-400" />
        <h3 className="font-medium text-lg text-gray-900">All Caught Up</h3>
        <p className="text-sm">You have no pending invitations or join requests.</p>
      </div>
    );
  }

  return (
    <Tabs defaultValue="invitations">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="invitations">
          <Mail className="h-4 w-4 mr-2" />
          Invitations ({invitations.length})
        </TabsTrigger>
        <TabsTrigger value="requests">
          <Send className="h-4 w-4 mr-2" />
          Sent Requests ({requests.length})
        </TabsTrigger>
      </TabsList>

      {/* --- INVITATIONS TAB --- */}
      <TabsContent value="invitations" className="mt-4">
        <div className="space-y-4">
          {invitations.length > 0 ? invitations.map((inv) => (
            <div
              key={inv.id}
              className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
            >
              <div>
                <p className="text-sm text-gray-500">
                  From {inv.invited_by?.full_name || inv.invited_by?.username || "an admin"}
                </p>
                <h3 className="text-lg font-semibold text-gray-900">
                  Join {inv.organization}
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                  You've been invited as a{" "}
                  <span className="font-medium capitalize text-blue-600">{inv.role}</span>
                  .
                </p>
              </div>
              <div className="flex gap-2 shrink-0">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleInvitationAction(inv.id, "reject")}
                >
                  <UserX className="h-4 w-4 mr-2" />
                  Reject
                </Button>
                <Button
                  size="sm"
                  className="bg-green-600 hover:bg-green-700"
                  onClick={() => handleInvitationAction(inv.id, "accept")}
                >
                  <UserCheck className="h-4 w-4 mr-2" />
                  Accept
                </Button>
              </div>
            </div>
          )) : (
             <p className="text-sm text-gray-500 text-center py-6 italic">No pending invitations.</p>
          )}
        </div>
      </TabsContent>

      {/* --- JOIN REQUESTS TAB --- */}
      <TabsContent value="requests" className="mt-4">
        <div className="space-y-4">
          {requests.length > 0 ? requests.map((req) => (
            <div
              key={req.id}
              className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
            >
              <div>
                <p className="text-sm text-gray-500">
                  Sent on {new Date(req.created_at).toLocaleDateString()}
                </p>
                <h3 className="text-lg font-semibold text-gray-900">
                  Request to join {req.organization}
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                  Status: <Badge variant="secondary">{req.status}</Badge>
                </p>
              </div>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button size="sm" variant="destructive" className="shrink-0">
                    <Trash2 className="h-4 w-4 mr-2" />
                    Cancel Request
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Cancel Join Request?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to cancel your request to join {req.organization}?
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Back</AlertDialogCancel>
                    <AlertDialogAction onClick={() => handleCancelRequest(req.id)}>
                      Yes, Cancel Request
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          )) : (
             <p className="text-sm text-gray-500 text-center py-6 italic">You have not sent any join requests.</p>
          )}
        </div>
      </TabsContent>
    </Tabs>
  );
}