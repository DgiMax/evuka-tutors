"use client";

import React, { useEffect, useState } from "react";
import { useActiveOrg } from "@/lib/hooks/useActiveOrg";
import api from "@/lib/api/axios";
import {
  Loader2,
  Wallet,
  ArrowUpRight,
  ArrowDownLeft,
  CreditCard,
  History,
  AlertCircle,
  Inbox,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
// NEW: Imports for responsive tabs
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Types
interface Transaction {
  id: number;
  tx_type: string;
  amount: string;
  description: string;
  created_at: string;
}
interface Payout {
  id: number;
  amount: string;
  status: string;
  created_at: string;
}
interface RevenueData {
  context: string;
  wallet: { balance: string; currency: string };
  recent_transactions: Transaction[];
  payout_history: Payout[];
  payout_methods: any[];
}

// --- NEW: Themed Utility Components ---
const LoaderState: React.FC = () => (
  <div className="flex flex-col h-[50vh] items-center justify-center">
    <Loader2 className="h-8 w-8 animate-spin text-primary" />
    <p className="mt-2 text-muted-foreground">Loading revenue data...</p>
  </div>
);

const EmptyState: React.FC<{ message: string }> = ({ message }) => (
  <div className="flex flex-col items-center justify-center h-40 border-2 border-dashed border-border rounded-lg bg-muted/50 p-4">
    <Inbox className="h-8 w-8 text-muted-foreground" />
    <p className="text-muted-foreground mt-2 text-center">{message}</p>
  </div>
);

export default function TutorRevenueClient() {
  const { activeSlug } = useActiveOrg();
  const [data, setData] = useState<RevenueData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("transactions"); // For responsive tabs

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const headers = activeSlug ? { "X-Organization-Slug": activeSlug } : {};
        const res = await api.get("/users/dashboard/revenue/", { headers });
        setData(res.data);
      } catch (error) {
        console.error("Revenue fetch error:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [activeSlug]);

  const formatCurrency = (amount: string | number, currency = "KES") => {
    return new Intl.NumberFormat("en-KE", { style: "currency", currency }).format(
      Number(amount)
    );
  };

  if (isLoading) return <LoaderState />;
  if (!data) return null;

  const tabItems = [
    { value: "transactions", label: "Transactions", icon: History },
    { value: "payouts", label: "Payout History", icon: CreditCard },
  ];

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {/* UPDATED: Responsive Header */}
      <div className="mb-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          {/* UPDATED: Themed text */}
          <h1 className="text-2xl font-bold text-foreground">
            Revenue & Payouts
          </h1>
          <p className="text-sm text-muted-foreground">{data.context}</p>
        </div>
        <Button className="w-full md:w-auto">Request Payout</Button>
      </div>

      {/* UPDATED: Themed Wallet Banner (Purple) */}
      <div className="mb-8 rounded-lg border border-primary/20 bg-primary/10 p-6 md:p-8">
        <div className="flex items-center gap-4">
          <div className="rounded-full bg-primary/20 p-3 text-primary">
            <Wallet className="h-6 w-6 md:h-8 md:w-8" />
          </div>
          <div>
            <p className="text-sm font-medium text-primary mb-1">
              Available Balance
            </p>
            <p className="text-4xl font-bold text-foreground">
              {formatCurrency(data.wallet.balance, data.wallet.currency)}
            </p>
          </div>
        </div>
      </div>

      {/* UPDATED: Responsive Tabs */}
      <Tabs
        defaultValue="transactions"
        className="w-full"
        value={activeTab}
        onValueChange={setActiveTab}
      >
        {/* --- NEW: Mobile Select (Dropdown) Navigation --- */}
        <div className="md:hidden mb-4">
          <Select value={activeTab} onValueChange={setActiveTab}>
            <SelectTrigger className="w-full h-12 px-4 py-3 text-base">
              <SelectValue placeholder="Select a section..." />
            </SelectTrigger>
            <SelectContent className="w-[--radix-select-trigger-width]">
              {tabItems.map((item) => (
                <SelectItem
                  key={item.value}
                  value={item.value}
                  className="py-3 text-base"
                >
                  <div className="flex items-center gap-2">
                    <item.icon className="h-4 w-4" />
                    <span>{item.label}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* --- UPDATED: Desktop Tabs Navigation (Hidden on mobile) --- */}
        <TabsList className="hidden md:grid w-full max-w-md grid-cols-2 mb-8">
          <TabsTrigger value="transactions">
            <History className="h-4 w-4 mr-2" />
            Transactions
          </TabsTrigger>
          <TabsTrigger value="payouts">
            <CreditCard className="h-4 w-4 mr-2" />
            Payout History
          </TabsTrigger>
        </TabsList>

        {/* UPDATED: Themed Tab Content */}
        <TabsContent
          value="transactions"
          className="rounded-lg border border-border bg-card p-0 mt-0"
        >
          <div className="p-6 border-b border-border">
            <h3 className="font-semibold text-foreground flex items-center gap-2">
              <History className="h-5 w-5 text-muted-foreground" /> Recent
              Activity
            </h3>
          </div>
          {data.recent_transactions.length > 0 ? (
            <div className="divide-y divide-border">
              {data.recent_transactions.map((tx) => (
                <div
                  key={tx.id}
                  className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 sm:px-6 hover:bg-muted/50 gap-2"
                >
                  <div className="flex items-center gap-4">
                    <div
                      className={`rounded-full p-2 ${
                        tx.tx_type === "credit"
                          ? "bg-green-100 text-green-600"
                          : "bg-red-100 text-red-600"
                      }`}
                    >
                      {tx.tx_type === "credit" ? (
                        <ArrowDownLeft className="h-4 w-4" />
                      ) : (
                        <ArrowUpRight className="h-4 w-4" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-foreground capitalize">
                        {tx.tx_type.replace("_", " ")}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {tx.description || "No description"}
                      </p>
                      <p className="text-xs text-muted-foreground/80">
                        {new Date(tx.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <span
                    className={`font-semibold text-base sm:text-right ${
                      tx.tx_type === "credit"
                        ? "text-green-600"
                        : "text-destructive"
                    }`}
                  >
                    {tx.tx_type === "credit" ? "+" : "-"}{" "}
                    {formatCurrency(tx.amount)}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            // UPDATED: Themed Empty State
            <div className="p-6">
              <EmptyState message="No recent transactions." />
            </div>
          )}
        </TabsContent>

        {/* UPDATED: Themed Tab Content */}
        <TabsContent
          value="payouts"
          className="rounded-lg border border-border bg-card p-0 mt-0"
        >
          <div className="p-6 border-b border-border">
            <h3 className="font-semibold text-foreground flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-muted-foreground" />{" "}
              Withdrawal History
            </h3>
          </div>
          {data.payout_history.length > 0 ? (
            <div className="divide-y divide-border">
              {data.payout_history.map((payout) => (
                <div
                  key={payout.id}
                  className="flex items-center justify-between p-4 sm:px-6"
                >
                  <div>
                    <p className="font-medium text-foreground">Withdrawal</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(payout.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-foreground">
                      {formatCurrency(payout.amount)}
                    </p>
                    {/* Badge will now use theme primary/secondary */}
                    <Badge
                      variant={
                        payout.status === "completed" ? "default" : "secondary"
                      }
                      className="capitalize mt-1"
                    >
                      {payout.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            // UPDATED: Themed Empty State
            <div className="p-6">
              <EmptyState message="No payout history yet." />
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}