"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import { useActiveOrg } from "@/lib/hooks/useActiveOrg";
import api from "@/lib/api/axios";
import { toast } from "sonner";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { format } from "date-fns";
import {
  DollarSign,
  Wallet,
  Loader2,
  AlertTriangle,
  ArrowDownCircle,
  ArrowUpCircle,
  Send,
  Landmark,
  CircleOff,
  User,
  Building,
} from "lucide-react";

// Shadcn UI Components
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input as ShadcnInput } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

// --- TYPE DEFINITIONS (from your serializers) ---

interface Transaction {
  id: string;
  tx_type: "DEBIT" | "CREDIT";
  amount: string;
  description: string;
  created_at: string;
}

interface Payout {
  id: string;
  amount: string;
  status: "PENDING" | "PROCESSED" | "FAILED";
  reference: string;
  created_at: string;
  processed_at: string | null;
}

interface Wallet {
  id: string;
  balance: string;
  currency: string;
  transactions: Transaction[];
  payouts: Payout[];
  updated_at: string;
}

interface OverviewData {
  personal_wallet: Wallet | null;
  organization_wallet: Wallet | null;
  view: "personal" | "organization_member" | "organization_admin";
  message: string;
}

// --- ZOD SCHEMA FOR PAYOUT ---
// ❌ REMOVE THE SCHEMA FUNCTION FROM HERE
// const payoutFormSchema = (maxBalance: number) => z.object({
//   amount: z.coerce
//     .number()
//     .min(1, "Amount must be greater than 0.")
//     .max(maxBalance, `Amount cannot exceed your available balance of ${maxBalance}.`),
// });


// --- 1. PAYOUT MODAL COMPONENT ---

interface PayoutModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  context: "personal" | "organization";
  wallet: Wallet;
  onSuccess: (payout: Payout) => void;
}

function PayoutModal({ open, onOpenChange, context, wallet, onSuccess }: PayoutModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const numericBalance = parseFloat(wallet.balance);

  // ✅ FIX: Define the schema *inside* the component
  // This gives it access to numericBalance and makes it a concrete object
  // that z.infer and useForm can understand.
  const payoutFormSchema = z.object({
    amount: z.coerce
      .number()
      .min(1, "Amount must be greater than 0.")
      .max(numericBalance, `Amount cannot exceed your available balance of ${numericBalance}.`),
  });

  // ✅ FIX: Explicitly define the type from the schema *object*
  type PayoutFormValues = z.infer<typeof payoutFormSchema>;

  const form = useForm<PayoutFormValues>({ // ✅ No more 'unknown'
    resolver: zodResolver(payoutFormSchema) as any, // Use the new schema object
    defaultValues: {
      amount: undefined,
    },
  });

  // ✅ FIX: Use the concrete type for 'data'
  const onSubmit = async (data: PayoutFormValues) => {
    setIsLoading(true);
    try {
      const payload = {
        amount: data.amount.toString(), // ✅ 'data' is now strongly typed
        context: context,
      };
      
      const response = await api.post("revenue/payout/", payload);
      
      toast.success("Payout Initiated!", {
        description: `Your withdrawal of ${wallet.currency} ${data.amount} is being processed.`, // ✅ 'data' is now strongly typed
      });
      onSuccess(response.data);
      form.reset();
      
    } catch (error: any) {
      console.error("Payout failed:", error);
      const message = error.response?.data?.detail || "An unknown error occurred.";
      toast.error("Payout Failed", { description: message });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Send size={20} />
            Request a Payout
          </DialogTitle>
          <DialogDescription>
            Withdraw funds from your{" "}
            <span className="font-semibold capitalize">{context}</span> wallet.
          </DialogDescription>
        </DialogHeader>
        {/* ✅ This <Form> component will now work */}
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="p-4 rounded-lg bg-gray-100">
              <p className="text-sm font-medium text-gray-600">Available Balance</p>
              <p className="text-2xl font-bold text-gray-900">
                {wallet.currency} {wallet.balance}
              </p>
            </div>
            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Amount to Withdraw ({wallet.currency})</FormLabel>
                  <FormControl>
                    <ShadcnInput type="number" step="0.01" placeholder="e.g., 50.00" {...field} />
                  </FormControl>
                  <FormDescription>
                    Payouts are processed within 3-5 business days.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button
                type="submit"
                disabled={isLoading}
                className="w-full bg-green-600 hover:bg-green-700"
              >
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Request Payout
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}


// --- 2. TRANSACTION LIST COMPONENT ---

const TransactionList: React.FC<{ transactions: Transaction[] }> = ({ transactions }) => {
  if (transactions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-40 border-2 border-dashed rounded-lg bg-gray-50">
        <CircleOff className="h-8 w-8 text-gray-400" />
        <p className="mt-2 text-sm text-gray-500">No transactions found.</p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-gray-200 border rounded-lg overflow-hidden">
      {transactions.map((tx) => (
        <div key={tx.id} className="p-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {tx.tx_type === "CREDIT" ? (
              <ArrowUpCircle className="h-6 w-6 text-green-500" />
            ) : (
              <ArrowDownCircle className="h-6 w-6 text-red-500" />
            )}
            <div>
              <p className="font-medium text-sm text-gray-900">{tx.description}</p>
              <p className="text-xs text-gray-500">
                {format(new Date(tx.created_at), "dd MMM yyyy, p")}
              </p>
            </div>
          </div>
          <p className={`font-semibold text-sm ${
            tx.tx_type === "CREDIT" ? "text-green-600" : "text-red-600"
          }`}>
            {tx.tx_type === "CREDIT" ? "+" : "-"} KES {tx.amount}
          </p>
        </div>
      ))}
    </div>
  );
};


// --- 3. PAYOUT LIST COMPONENT ---

const PayoutList: React.FC<{ payouts: Payout[], currency: string }> = ({ payouts, currency }) => {
  const statusConfig = {
    PENDING: { label: "Pending", color: "bg-yellow-500" },
    PROCESSED: { label: "Processed", color: "bg-green-600" },
    FAILED: { label: "Failed", color: "bg-red-600" },
  };

  if (payouts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-40 border-2 border-dashed rounded-lg bg-gray-50">
        <CircleOff className="h-8 w-8 text-gray-400" />
        <p className="mt-2 text-sm text-gray-500">No payouts found.</p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-gray-200 border rounded-lg overflow-hidden">
      {payouts.map((payout) => {
        const status = statusConfig[payout.status] || { label: "Unknown", color: "bg-gray-500" };
        return (
          <div key={payout.id} className="p-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Landmark className="h-6 w-6 text-gray-500" />
              <div>
                <p className="font-medium text-sm text-gray-900">
                  Withdrawal of {currency} {payout.amount}
                </p>
                <p className="text-xs text-gray-500">
                  Initiated: {format(new Date(payout.created_at), "dd MMM yyyy")}
                  {payout.processed_at && ` | Processed: ${format(new Date(payout.processed_at), "dd MMM yyyy")}`}
                </p>
              </div>
            </div>
            <Badge className={`text-white ${status.color}`}>{status.label}</Badge>
          </div>
        );
      })}
    </div>
  );
};


// --- 4. MAIN REVENUE PAGE COMPONENT ---

export default function RevenuePage() {
  const [overviewData, setOverviewData] = useState<OverviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalContext, setModalContext] = useState<"personal" | "organization">("personal");
  
  const { activeSlug } = useActiveOrg();

  // Data fetching function
  const fetchRevenueData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get("/revenue/overview/");
      setOverviewData(response.data);
    } catch (err) {
      console.error("Failed to fetch revenue data:", err);
      setError("Could not load revenue data. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []); // No dependency on activeSlug, as the backend API interceptor handles it

  // Fetch data on load and when context changes
  useEffect(() => {
    fetchRevenueData();
  }, [activeSlug, fetchRevenueData]);

  // Handlers for opening the modal
  const openPayoutModal = (context: "personal" | "organization") => {
    setModalContext(context);
    setIsModalOpen(true);
  };

  const handlePayoutSuccess = () => {
    setIsModalOpen(false);
    fetchRevenueData(); // Refetch all data to update balances
  };

  // Memoize wallet data to pass to modal
  const walletForModal = useMemo(() => {
    if (modalContext === "personal") return overviewData?.personal_wallet;
    return overviewData?.organization_wallet;
  }, [modalContext, overviewData]);

  // Get tab defaults
  const personalTabs = [
    { value: "personal_tx", label: "Personal Transactions", wallet: overviewData?.personal_wallet, type: "transactions" },
    { value: "personal_payouts", label: "Personal Payouts", wallet: overviewData?.personal_wallet, type: "payouts" },
  ];
  const orgTabs = overviewData?.organization_wallet ? [
    { value: "org_tx", label: "Org. Transactions", wallet: overviewData?.organization_wallet, type: "transactions" },
    { value: "org_payouts", label: "Org. Payouts", wallet: overviewData?.organization_wallet, type: "payouts" },
  ] : [];

  const allTabs = [...personalTabs, ...orgTabs];
  const defaultTab = allTabs[0]?.value || "personal_tx";

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
        <p className="ml-2 text-gray-500">Loading revenue data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-screen text-red-600">
        <AlertTriangle className="h-8 w-8" />
        <p className="mt-2 font-medium">{error}</p>
        <Button onClick={fetchRevenueData} variant="outline" className="mt-4">
          Try Again
        </Button>
      </div>
    );
  }

  if (!overviewData) return null;

  // Check if user is Org Admin
  const isOrgAdmin = overviewData.view === "organization_admin";

  return (
    <>
      <Card className="max-w-5xl mx-auto my-8 border border-gray-200 rounded text-black shadow-none">
        <CardHeader>
          <CardTitle className="text-xl flex items-center gap-2">
            <DollarSign size={20} />
            Revenue & Payouts
          </CardTitle>
          <CardDescription>{overviewData.message}</CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          
          {/* --- Wallets Grid --- */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Personal Wallet Card */}
            {overviewData.personal_wallet && (
              <Card className="shadow-none">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <User size={18} /> Personal Wallet
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold">
                    {overviewData.personal_wallet.currency} {overviewData.personal_wallet.balance}
                  </p>
                </CardContent>
                <CardFooter>
                  <Button
                    onClick={() => openPayoutModal("personal")}
                    className="w-full rounded"
                    disabled={parseFloat(overviewData.personal_wallet.balance) <= 0}
                  >
                    <Send className="mr-2" size={16} /> Withdraw
                  </Button>
                </CardFooter>
              </Card>
            )}

            {/* Organization Wallet Card */}
            {overviewData.organization_wallet && (
              <Card className="shadow-none bg-gray-50">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Building size={18} /> Organization Wallet
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold">
                    {overviewData.organization_wallet.currency} {overviewData.organization_wallet.balance}
                  </p>
                </CardContent>
                <CardFooter>
                  <Button
                    onClick={() => openPayoutModal("organization")}
                    className="w-full rounded"
                    // ✅ CONTEXT-AWARE: Only enabled for admins with a balance
                    disabled={!isOrgAdmin || parseFloat(overviewData.organization_wallet.balance) <= 0}
                  >
                    <Send className="mr-2" size={16} /> Withdraw
                  </Button>
                  {!isOrgAdmin && (
                      <p className="text-xs text-gray-500 mt-2 text-center w-full">
                        Only organization admins or owners can withdraw from this wallet.
                      </p>
                  )}
                </CardFooter>
              </Card>
            )}
          </div>

          {/* --- Transactions & Payouts Tabs --- */}
          <Tabs defaultValue={defaultTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2 md:grid-cols-4">
              {allTabs.map(tab => (
                <TabsTrigger key={tab.value} value={tab.value}>{tab.label}</TabsTrigger>
              ))}
            </TabsList>
            
            {allTabs.map(tab => (
              <TabsContent key={tab.value} value={tab.value} className="mt-4">
                {tab.type === "transactions" ? (
                  <TransactionList transactions={tab.wallet?.transactions || []} />
                ) : (
                  <PayoutList 
                    payouts={tab.wallet?.payouts || []} 
                    currency={tab.wallet?.currency || "KES"} 
                  />
                )}
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>

      {/* --- Payout Modal --- */}
      {isModalOpen && walletForModal && (
        <PayoutModal
          open={isModalOpen}
          onOpenChange={setIsModalOpen}
          context={modalContext}
          wallet={walletForModal}
          onSuccess={handlePayoutSuccess}
        />
      )}
    </>
  );
}

