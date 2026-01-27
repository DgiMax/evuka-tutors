"use client";

import React, { useState, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useActiveOrg } from "@/lib/hooks/useActiveOrg";
import Skeleton, { SkeletonTheme } from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";
import api from "@/lib/api/axios";
import { toast } from "sonner";
import { 
  ArrowUpRight, 
  Landmark, 
  Loader2, 
  History, 
  AlertCircle,
  Check,
  ChevronsUpDown,
  Trash2,
  Info,
  X,
  Calendar,
  Building2,
  Wallet,
  Clock,
  CheckCircle2,
  Receipt,
  TrendingDown,
  TrendingUp,
  Users
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
  DialogClose,
} from "@/components/ui/dialog";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface Transaction {
    id: number;
    amount: number;
    description: string;
    tx_type: string;
    created_at: string;
}

interface BankingDetails {
    bank_name: string;
    display_number: string;
    is_verified: boolean;
}

interface PersonalDashboardData {
    wallet: {
        balance: number;
        currency: string;
        recent_transactions: Transaction[];
    };
    banking: BankingDetails | null;
    payouts: any[];
}

interface OrgTutorDashboardData {
    pending_balance: number;
    lifetime_earnings: number;
    recent_history: {
        date: string;
        course: string;
        amount: number;
        status: "PENDING" | "PAID";
    }[];
}

interface OrgAdminDashboardData {
    wallet: {
        balance: number;
        currency: string;
    };
    liabilities: {
        total_pending_payouts: number;
        net_available_funds: number;
        recent_pending_earnings: {
            tutor__username: string;
            amount: number;
            created_at: string;
        }[];
    };
}

interface BankOption {
    name: string;
    code: string;
    type: string;
}

const DashboardSkeleton = () => (
    <SkeletonTheme baseColor="#e5e7eb" highlightColor="#f3f4f6">
        <div className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                <div className="lg:col-span-2"><Skeleton height={180} borderRadius={8} /></div>
                <div className="lg:col-span-1"><Skeleton height={180} borderRadius={8} /></div>
            </div>
            <Skeleton height={300} borderRadius={8} />
        </div>
    </SkeletonTheme>
);

function PersonalWalletView() {
    const queryClient = useQueryClient();
    const [isPayoutOpen, setIsPayoutOpen] = useState(false);
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);
    const [deleting, setDeleting] = useState(false);

    const { data, isLoading, isError } = useQuery<PersonalDashboardData>({
        queryKey: ["revenue-dashboard"],
        queryFn: async () => {
            const { data } = await api.get("/revenue/dashboard/");
            return data;
        },
    });

    const handleDeleteBanking = async () => {
        setDeleting(true);
        try {
            await api.delete("/revenue/banking/add/"); 
            toast.success("Payment method removed.");
            queryClient.invalidateQueries({ queryKey: ["revenue-dashboard"] });
            setIsDeleteOpen(false);
        } catch (error) {
            toast.error("Failed to remove payment method.");
        } finally {
            setDeleting(false);
        }
    };

    if (isLoading) return <DashboardSkeleton />;

    if (isError || !data) {
        return (
            <div className="flex h-[40vh] items-center justify-center flex-col gap-2 text-destructive">
                <AlertCircle className="h-10 w-10" />
                <p>Failed to load personal wallet.</p>
            </div>
        )
    }

    const { wallet, banking } = data;
    const hasBalance = Number(wallet.balance) > 0;

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                <Card className="bg-primary text-primary-foreground border-none shadow-none rounded-md lg:col-span-2 relative overflow-hidden flex flex-col justify-center min-h-[180px]">
                    <div className="absolute -top-6 -right-6 opacity-10 pointer-events-none">
                        <Wallet className="h-48 w-48" />
                    </div>
                    <CardHeader className="pb-1 relative z-10 pt-6">
                        <CardTitle className="text-xs font-bold opacity-80 uppercase tracking-widest">Personal Wallet Balance</CardTitle>
                    </CardHeader>
                    <CardContent className="relative z-10 pb-6">
                        <div className="text-4xl font-extrabold tracking-tight mb-6">
                            {wallet.currency} {Number(wallet.balance).toLocaleString()}
                        </div>
                        <div className="flex gap-3">
                            <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <span tabIndex={0}>
                                            <Dialog open={isPayoutOpen} onOpenChange={setIsPayoutOpen}>
                                                <DialogTrigger asChild>
                                                    <Button variant="secondary" className="font-semibold h-12 text-base shadow-none" disabled={!hasBalance}>
                                                        <ArrowUpRight className="mr-2 h-4 w-4" /> Withdraw Funds
                                                    </Button>
                                                </DialogTrigger>
                                                <PayoutModal
                                                    balance={wallet.balance}
                                                    hasBanking={!!banking}
                                                    onSuccess={() => {
                                                        setIsPayoutOpen(false);
                                                        queryClient.invalidateQueries({ queryKey: ["revenue-dashboard"] });
                                                    }}
                                                />
                                            </Dialog>
                                        </span>
                                    </TooltipTrigger>
                                    {!hasBalance && (
                                        <TooltipContent className="bg-destructive text-destructive-foreground border-destructive">
                                            <p>You need a positive balance to withdraw funds.</p>
                                        </TooltipContent>
                                    )}
                                </Tooltip>
                            </TooltipProvider>
                        </div>
                    </CardContent>
                </Card>

                <Card className="flex flex-col border shadow-none rounded-md">
                    <CardHeader className="pb-3 border-b bg-muted/20">
                        <CardTitle className="flex items-center justify-between w-full text-sm font-semibold">
                            <span className="flex items-center gap-2">
                                <Landmark className="h-4 w-4 text-muted-foreground"/> Payout Method
                            </span>
                            {banking && (
                                <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
                                    <DialogTrigger asChild>
                                        <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-destructive">
                                            <Trash2 className="h-3.5 w-3.5" />
                                        </Button>
                                    </DialogTrigger>
                                    <DialogContent className="sm:max-w-[425px]">
                                        <DialogHeader>
                                            <DialogTitle>Remove Payout Method?</DialogTitle>
                                            <DialogDescription>
                                                Are you sure? You won't be able to withdraw until you add a new one.
                                            </DialogDescription>
                                        </DialogHeader>
                                        <div className="flex justify-end gap-2 mt-4">
                                            <Button variant="outline" onClick={() => setIsDeleteOpen(false)}>Cancel</Button>
                                            <Button variant="destructive" onClick={handleDeleteBanking} disabled={deleting}>
                                                {deleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Remove"}
                                            </Button>
                                        </div>
                                    </DialogContent>
                                </Dialog>
                            )}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="flex-1 flex flex-col justify-center pt-6">
                        {banking ? (
                            <div className="space-y-4">
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                        <span className="font-bold text-lg">{banking.bank_name}</span>
                                        <Badge variant="secondary" className="bg-green-100 text-green-700 border-none px-1.5 py-0 text-[10px]">Verified</Badge>
                                    </div>
                                    <p className="text-sm font-mono text-muted-foreground tracking-wide">{banking.display_number}</p>
                                </div>
                                <UpdateBankingModal label="Edit Details" onSuccess={() => queryClient.invalidateQueries({ queryKey: ["revenue-dashboard"] })} />
                            </div>
                        ) : (
                            <div className="text-center">
                                <div className="bg-muted/40 h-12 w-12 rounded-full flex items-center justify-center mx-auto mb-3">
                                    <Landmark className="h-6 w-6 text-muted-foreground/60" />
                                </div>
                                <p className="text-xs text-muted-foreground mb-4">No payout method linked.</p>
                                <UpdateBankingModal label="Add Method" onSuccess={() => queryClient.invalidateQueries({ queryKey: ["revenue-dashboard"] })} />
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            <Card className="shadow-none rounded-md border">
                <CardHeader className="border-b bg-muted/20 py-4">
                    <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                        <History className="h-4 w-4 text-muted-foreground"/> Transaction History
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    {wallet.recent_transactions.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                            <History className="h-8 w-8 mb-2 opacity-20" />
                            <p className="text-sm">No transactions yet.</p>
                        </div>
                    ) : (
                        <div className="divide-y">
                            {wallet.recent_transactions.map((tx) => (
                                <div key={tx.id} className="flex justify-between items-center py-4 px-6 hover:bg-muted/5">
                                    <div>
                                        <p className="font-medium text-sm text-foreground">{tx.description}</p>
                                        <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                                            <Calendar className="h-3 w-3" />
                                            {new Date(tx.created_at).toLocaleDateString()}
                                        </div>
                                    </div>
                                    <div className={`font-mono text-sm font-bold ${tx.tx_type === 'credit' ? 'text-green-600' : 'text-foreground'}`}>
                                        {tx.tx_type === 'credit' ? '+' : '-'} {Number(tx.amount).toLocaleString()}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}

function OrgAdminView({ slug }: { slug: string }) {
    const { data, isLoading, error } = useQuery<OrgAdminDashboardData>({
        queryKey: ["org-admin-revenue", slug],
        queryFn: async () => {
            const { data } = await api.get("/revenue/dashboard/", {
                headers: { "X-Organization-Slug": slug }
            });
            return data;
        },
    });

    if (isLoading) return <DashboardSkeleton />;
    if (error) return <div className="text-destructive p-4">Error loading financial data.</div>;
    if (!data) return null;

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2">
            <div className="grid gap-6 md:grid-cols-3">
                <Card className="border-l-4 border-l-blue-500 shadow-sm">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                           Total Assets (Wallet)
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-foreground">
                            KES {Number(data.wallet.balance).toLocaleString()}
                        </div>
                        <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                            <Wallet className="h-3 w-3" /> Cash currently held in organization wallet.
                        </p>
                    </CardContent>
                </Card>

                <Card className="border-l-4 border-l-red-500 shadow-sm">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                           Total Liabilities (Owed)
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-destructive">
                            - KES {Number(data.liabilities.total_pending_payouts).toLocaleString()}
                        </div>
                        <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                            <Users className="h-3 w-3" /> Money promised to tutors (Pending).
                        </p>
                    </CardContent>
                </Card>

                <Card className="border-l-4 border-l-green-500 shadow-sm bg-green-50/10">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                           Net Equity (Available)
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-green-700">
                            KES {Number(data.liabilities.net_available_funds).toLocaleString()}
                        </div>
                        <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                            <TrendingUp className="h-3 w-3" /> Real funds available after all payouts.
                        </p>
                    </CardContent>
                </Card>
            </div>

            <Card className="shadow-none rounded-md border">
                <CardHeader className="border-b bg-muted/20 py-4">
                    <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                        <TrendingDown className="h-4 w-4 text-red-500"/> Pending Liabilities (Next Payout)
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    {data.liabilities.recent_pending_earnings.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                            <CheckCircle2 className="h-8 w-8 mb-2 opacity-20 text-green-500" />
                            <p className="text-sm">All caught up! No pending payouts.</p>
                        </div>
                    ) : (
                        <div className="divide-y">
                            {data.liabilities.recent_pending_earnings.map((item, idx) => (
                                <div key={idx} className="flex justify-between items-center py-4 px-6 hover:bg-muted/5">
                                    <div className="space-y-1">
                                        <p className="font-medium text-sm text-foreground">Owed to {item.tutor__username}</p>
                                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                            <Calendar className="h-3 w-3" />
                                            {new Date(item.created_at).toLocaleDateString()}
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="font-mono text-sm font-bold text-destructive">
                                            KES {Number(item.amount).toLocaleString()}
                                        </div>
                                        <Badge variant="outline" className="text-[10px] mt-1 bg-amber-50 text-amber-700 border-amber-200">
                                            Pending
                                        </Badge>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}

function OrgTutorView({ slug }: { slug: string }) {
    const { data, isLoading } = useQuery<OrgTutorDashboardData>({
        queryKey: ["org-tutor-dashboard", slug],
        queryFn: async () => {
            const { data } = await api.get(`/organizations/${slug}/finance/dashboard/`);
            return data;
        },
    });

    if (isLoading) return <DashboardSkeleton />;
    if (!data) return null;

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2">
            <div className="grid gap-6 md:grid-cols-2">
                <Card className="border-l-4 border-l-amber-500 shadow-sm">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                           <Clock className="h-4 w-4 text-amber-500" /> Pending (Owed by Org)
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-foreground">
                            KES {Number(data.pending_balance).toLocaleString()}
                        </div>
                        <p className="text-xs text-muted-foreground mt-2">
                            Revenue currently held by the organization. It will be moved to your Personal Wallet on the next payout date.
                        </p>
                    </CardContent>
                </Card>

                <Card className="border-l-4 border-l-green-500 shadow-sm">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                           <CheckCircle2 className="h-4 w-4 text-green-500" /> Lifetime Earned
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-foreground">
                            KES {Number(data.lifetime_earnings).toLocaleString()}
                        </div>
                        <p className="text-xs text-muted-foreground mt-2">
                            Total amount successfully paid out to your Personal Wallet from this organization.
                        </p>
                    </CardContent>
                </Card>
            </div>

             <Card className="shadow-none rounded-md border">
                <CardHeader className="border-b bg-muted/20 py-4">
                    <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                        <Receipt className="h-4 w-4 text-muted-foreground"/> Organization Payout History
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    {data.recent_history.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                            <Building2 className="h-8 w-8 mb-2 opacity-20" />
                            <p className="text-sm">No earning records found for this organization.</p>
                        </div>
                    ) : (
                        <div className="divide-y">
                            {data.recent_history.map((item, idx) => (
                                <div key={idx} className="flex justify-between items-center py-4 px-6 hover:bg-muted/5">
                                    <div className="space-y-1">
                                        <p className="font-medium text-sm text-foreground">{item.course}</p>
                                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                            <Calendar className="h-3 w-3" />
                                            {new Date(item.date).toLocaleDateString()}
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="font-mono text-sm font-bold">
                                            KES {Number(item.amount).toLocaleString()}
                                        </div>
                                        <Badge variant="outline" className={`text-[10px] mt-1 ${
                                            item.status === 'PAID' 
                                            ? 'bg-green-50 text-green-700 border-green-200' 
                                            : 'bg-amber-50 text-amber-700 border-amber-200'
                                        }`}>
                                            {item.status}
                                        </Badge>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}

export default function RevenueDashboard() {
  const { activeSlug, activeRole } = useActiveOrg();
  const isAdmin = activeRole === 'owner' || activeRole === 'admin';
  
  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
            <h1 className="text-3xl font-bold text-foreground">Revenue & Finance</h1>
            <p className="text-muted-foreground text-sm mt-1">
                {activeSlug 
                    ? "Manage your earnings across personal and organization contexts." 
                    : "Manage your personal earnings, bank accounts, and withdrawals."}
            </p>
        </div>
        <div className="text-xs font-medium bg-secondary/20 border border-border px-3 py-1.5 rounded-full">
            Platform Fee: 10% on sales
        </div>
      </div>

      {!activeSlug ? (
          <PersonalWalletView />
      ) : (
          <Tabs defaultValue="personal" className="w-full">
              <TabsList className="grid w-full max-w-md grid-cols-2 h-auto p-1 bg-muted/50 rounded-lg mb-6">
                  <TabsTrigger value="personal" className="py-2.5 gap-2">
                      <Wallet className="h-4 w-4" /> Personal Wallet
                  </TabsTrigger>
                  <TabsTrigger value="org_revenue" className="py-2.5 gap-2">
                      <Building2 className="h-4 w-4" /> Org Finance
                  </TabsTrigger>
              </TabsList>

              <TabsContent value="personal" className="space-y-4">
                  <div className="bg-blue-50 border border-blue-100 text-blue-800 rounded-md p-4 text-sm flex gap-3 items-start">
                        <Info className="h-5 w-5 shrink-0" />
                        <p>This is your actual cash wallet. Funds from the organization will appear here once payout is processed.</p>
                  </div>
                  <PersonalWalletView />
              </TabsContent>

              <TabsContent value="org_revenue">
                  {isAdmin ? <OrgAdminView slug={activeSlug} /> : <OrgTutorView slug={activeSlug} />}
              </TabsContent>
          </Tabs>
      )}
    </div>
  );
}

function PayoutModal({ balance, hasBanking, onSuccess }: { balance: number, hasBanking: boolean, onSuccess: () => void }) {
    const [amount, setAmount] = useState("");
    const [loading, setLoading] = useState(false);

    const handleWithdraw = async () => {
        if (!hasBanking) {
            toast.error("Please add banking details first.");
            return;
        }
        
        const val = parseFloat(amount);
        if (isNaN(val) || val < 100) {
            toast.error("Minimum withdrawal is KES 100");
            return;
        }

        setLoading(true);
        try {
            await api.post("/revenue/payout/request/", { amount: val });
            toast.success("Payout request submitted successfully!");
            onSuccess();
        } catch (error: any) {
            toast.error(error.response?.data?.error || "Request failed");
        } finally {
            setLoading(false);
        }
    };

    return (
        <DialogContent className="w-[95%] sm:max-w-[480px] p-0 gap-0 border-border/80 shadow-2xl rounded-md bg-background">
        <DialogHeader className="px-6 py-4 border-b bg-muted flex flex-col items-start gap-1">
            <DialogTitle>Withdraw Funds</DialogTitle>
            <DialogDescription>Funds will be sent to your linked verified account.</DialogDescription>
        </DialogHeader>

        <div className="p-6 space-y-6">
            {!hasBanking ? (
            <div className="bg-amber-50 text-amber-900 p-4 rounded-md text-sm border border-amber-200 flex items-start gap-2">
                <AlertCircle className="h-5 w-5 shrink-0 text-amber-600" />
                <p>You must link a bank account or mobile money number before you can request a withdrawal.</p>
            </div>
            ) : (
            <>
                <div className="space-y-2">
                <Label className="text-xs font-bold uppercase text-muted-foreground tracking-wider ml-1">Amount (KES)</Label>
                <div className="relative group">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-bold text-sm">KES</span>
                    <Input
                    type="number"
                    className="pl-12 h-12 text-lg font-medium shadow-none border-input transition-all bg-background"
                    placeholder="0.00"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    />
                </div>
                <div className="flex justify-between text-[11px] text-muted-foreground font-medium px-1">
                    <span>Min: KES 100</span>
                    <span>Max: KES {Number(balance).toLocaleString()}</span>
                </div>
                </div>

                <Button className="w-full h-12 text-base font-medium shadow-sm" onClick={handleWithdraw} disabled={loading || !amount || parseFloat(amount) > balance || parseFloat(amount) < 100}>
                    {loading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : "Confirm Withdrawal"}
                </Button>
            </>
            )}
        </div>
        </DialogContent>
    );
}

function UpdateBankingModal({ label = "Update Details", onSuccess }: { label?: string, onSuccess: () => void }) {
    const [isOpen, setIsOpen] = useState(false);
    const [openCombobox, setOpenCombobox] = useState(false);
    const [loading, setLoading] = useState(false);
    
    const [bankCode, setBankCode] = useState("");
    const [accountNumber, setAccountNumber] = useState("");

    const { data: rawBanks = [] } = useQuery<BankOption[]>({
        queryKey: ["banks-list"],
        queryFn: async () => {
            const { data } = await api.get("/revenue/banks/");
            return data;
        },
        staleTime: Infinity,
    });

    const uniqueBanks = useMemo(() => {
        const seen = new Set();
        return rawBanks.filter((bank) => {
            const duplicate = seen.has(bank.code);
            seen.add(bank.code);
            return !duplicate;
        });
    }, [rawBanks]);

    const handleSubmit = async () => {
        if (!bankCode || !accountNumber) {
            toast.error("Please fill in all fields");
            return;
        }

        setLoading(true);
        try {
            await api.post("/revenue/banking/add/", {
                account_number: accountNumber,
                bank_code: bankCode 
            });
            toast.success("Banking details saved!");
            setIsOpen(false);
            onSuccess();
        } catch (error: any) {
            console.error(error);
            toast.error(error.response?.data?.error || "Verification failed. Check your details.");
        } finally {
            setLoading(false);
        }
    };

    const selectedBankName = uniqueBanks.find((b) => b.code === bankCode)?.name;

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button
                variant="outline"
                className="w-full font-medium text-muted-foreground hover:text-foreground shadow-none border-dashed hover:border-solid hover:bg-muted/50"
                >
                {label}
                </Button>
            </DialogTrigger>

            <DialogContent
                className="w-[95%] sm:max-w-[480px] p-0 gap-0 max-h-[85vh] overflow-y-auto border-border/80 shadow-2xl rounded-md bg-background [&>button]:hidden"
            >
                <DialogHeader className="px-6 py-4 border-b bg-muted flex flex-row items-center justify-between sticky top-0 z-10 backdrop-blur-sm">
                <DialogTitle className="text-lg font-semibold tracking-tight text-foreground">
                    Link Payout Method
                </DialogTitle>

                <DialogClose className="rounded-md p-2 hover:bg-muted transition">
                    <X className="h-6 w-6 text-muted-foreground hover:text-foreground" />
                </DialogClose>
                </DialogHeader>

                <div className="p-6 space-y-6">
                <div className="space-y-2">
                    <Label className="text-xs uppercase font-bold text-muted-foreground tracking-wider ml-1">
                    Bank / Mobile Money Provider
                    </Label>

                    <Popover
                    open={openCombobox}
                    onOpenChange={setOpenCombobox}
                    >
                    <PopoverTrigger asChild>
                        <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={openCombobox}
                        className="w-full h-12 justify-between text-base px-3 font-normal border-input hover:bg-accent/50 shadow-none"
                        >
                        {bankCode ? selectedBankName : "Select provider..."}
                        <ChevronsUpDown className="ml-2 h-4 w-4 opacity-50" />
                        </Button>
                    </PopoverTrigger>

                    <PopoverContent
                        className="w-[300px] sm:w-[430px] p-0 pointer-events-auto"
                        align="start"
                        onWheelCapture={(e) => e.stopPropagation()}
                    >
                        <Command className="max-h-[300px]">
                        <CommandInput
                            placeholder="Search bank name..."
                            className="h-11 border-none focus:ring-0"
                        />

                        <CommandList className="max-h-[250px] overflow-y-auto">
                            <CommandEmpty className="py-6 text-center text-sm">
                            No bank found.
                            </CommandEmpty>

                            <CommandGroup>
                            {uniqueBanks.map((bank) => (
                                <CommandItem
                                key={bank.code}
                                value={bank.name}
                                onSelect={() => {
                                    setBankCode(bank.code)
                                    setOpenCombobox(false)
                                }}
                                className="cursor-pointer py-2.5 px-3"
                                >
                                <Check
                                    className={cn(
                                    "mr-2 h-4 w-4 text-primary",
                                    bankCode === bank.code ? "opacity-100" : "opacity-0"
                                    )}
                                />
                                {bank.name}
                                </CommandItem>
                            ))}
                            </CommandGroup>
                        </CommandList>
                        </Command>
                    </PopoverContent>
                    </Popover>
                </div>

                <div className="space-y-2">
                    <Label className="text-xs uppercase font-bold text-muted-foreground tracking-wider ml-1">
                    {bankCode === "MPESA"
                        ? "M-Pesa Phone Number"
                        : "Account Number"}
                    </Label>

                    <Input
                    className="h-12 px-4 text-base shadow-none"
                    placeholder={
                        bankCode === "MPESA"
                        ? "0712345678"
                        : "e.g. 1234567890"
                    }
                    value={accountNumber}
                    onChange={(e) => setAccountNumber(e.target.value)}
                    />

                    {bankCode === "MPESA" && (
                    <p className="text-[11px] text-muted-foreground ml-1 flex items-center gap-1">
                        <Info className="h-3 w-3" />
                        Format: 07XX… or 01XX… (Do not add +254)
                    </p>
                    )}
                </div>

                <Button
                    className="w-full h-12 text-base font-medium shadow-sm transition-all active:scale-[0.98]"
                    onClick={handleSubmit}
                    disabled={loading || !bankCode || !accountNumber}
                >
                    {loading ? (
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    ) : (
                    "Verify & Save Details"
                    )}
                </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}