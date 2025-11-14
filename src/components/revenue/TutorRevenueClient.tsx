"use client";

import React, { useEffect, useState } from "react";
import { useActiveOrg } from "@/lib/hooks/useActiveOrg";
import api from "@/lib/api/axios";
import { Loader2, Wallet, ArrowUpRight, ArrowDownLeft, CreditCard, History, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";

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

export default function TutorRevenueClient() {
  const { activeSlug } = useActiveOrg();
  const [data, setData] = useState<RevenueData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const headers = activeSlug ? { 'X-Organization-Slug': activeSlug } : {};
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
     return new Intl.NumberFormat('en-KE', { style: 'currency', currency }).format(Number(amount));
  }

  if (isLoading) return <div className="flex h-[50vh] items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-blue-600" /></div>;
  if (!data) return null;

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="mb-8 flex items-center justify-between">
        <div>
            <h1 className="text-2xl font-bold text-gray-900">Revenue & Payouts</h1>
            <p className="text-sm text-gray-500">{data.context}</p>
        </div>
        <Button className="rounded-md">Request Payout</Button>
      </div>

      {/* Wallet Banner */}
      <div className="mb-8 rounded-md border border-blue-100 bg-gradient-to-br from-blue-50 to-white p-8">
        <div className="flex items-center gap-4">
            <div className="rounded-full bg-blue-100 p-3 text-blue-600">
                <Wallet className="h-8 w-8" />
            </div>
            <div>
                <p className="text-sm font-medium text-blue-600 mb-1">Available Balance</p>
                <p className="text-4xl font-bold text-gray-900">
                    {formatCurrency(data.wallet.balance, data.wallet.currency)}
                </p>
            </div>
        </div>
      </div>

      {/* Tabs for History */}
      <Tabs defaultValue="transactions" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2 mb-8">
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
          <TabsTrigger value="payouts">Payout History</TabsTrigger>
        </TabsList>

        <TabsContent value="transactions" className="rounded-md border border-gray-200 bg-white">
            <div className="p-6 border-b border-gray-100">
                 <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                    <History className="h-5 w-5 text-gray-500"/> Recent Activity
                 </h3>
            </div>
            {data.recent_transactions.length > 0 ? (
                <div className="divide-y divide-gray-100">
                    {data.recent_transactions.map((tx) => (
                        <div key={tx.id} className="flex items-center justify-between p-4 sm:px-6 hover:bg-gray-50">
                             <div className="flex items-center gap-4">
                                 <div className={`rounded-full p-2 ${tx.tx_type === 'credit' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                                     {tx.tx_type === 'credit' ? <ArrowDownLeft className="h-4 w-4" /> : <ArrowUpRight className="h-4 w-4"/>}
                                 </div>
                                 <div>
                                     <p className="font-medium text-gray-900 capitalize">{tx.tx_type.replace('_', ' ')}</p>
                                     <p className="text-sm text-gray-500">{tx.description || 'No description'}</p>
                                     <p className="text-xs text-gray-400">{new Date(tx.created_at).toLocaleDateString()}</p>
                                 </div>
                             </div>
                             <span className={`font-semibold ${tx.tx_type === 'credit' ? 'text-green-600' : 'text-gray-900'}`}>
                                 {tx.tx_type === 'credit' ? '+' : '-'} {formatCurrency(tx.amount)}
                             </span>
                        </div>
                    ))}
                </div>
            ) : <div className="p-8 text-center text-gray-500 italic">No recent transactions.</div>}
        </TabsContent>

        <TabsContent value="payouts" className="rounded-md border border-gray-200 bg-white">
             <div className="p-6 border-b border-gray-100">
                 <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                    <CreditCard className="h-5 w-5 text-gray-500"/> Withdrawal History
                 </h3>
            </div>
             {data.payout_history.length > 0 ? (
                 <div className="divide-y divide-gray-100">
                     {data.payout_history.map((payout) => (
                         <div key={payout.id} className="flex items-center justify-between p-4 sm:px-6">
                             <div>
                                 <p className="font-medium text-gray-900">Withdrawal</p>
                                 <p className="text-xs text-gray-500">{new Date(payout.created_at).toLocaleDateString()}</p>
                             </div>
                             <div className="text-right">
                                 <p className="font-semibold text-gray-900">{formatCurrency(payout.amount)}</p>
                                 <Badge variant={payout.status === 'completed' ? 'default' : 'secondary'} className="capitalize mt-1">
                                     {payout.status}
                                 </Badge>
                             </div>
                         </div>
                     ))}
                 </div>
             ) : <div className="p-8 text-center text-gray-500 italic">No payout history yet.</div>}
        </TabsContent>
      </Tabs>
    </div>
  );
}