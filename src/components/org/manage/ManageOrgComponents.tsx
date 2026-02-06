"use client";

import React, { useState } from "react";
import { useFormContext, Control } from "react-hook-form";
import {
  FormField, FormItem, FormLabel, FormControl, FormMessage, FormDescription
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Plus, X, School, Layers, DollarSign, Globe, Lock, AlertTriangle, CreditCard, Percent } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { OrgSettingsValues } from "./OrgSharedTypes";

export function ManageBasics({ canSubmit, missingFields }: { canSubmit: boolean; missingFields: string[] }) {
  const { control } = useFormContext<OrgSettingsValues>();

  return (
    <div className="space-y-6">
      <Card className="rounded-md border shadow-none">
        <CardHeader>
            <CardTitle className="flex items-center gap-2"><School className="h-5 w-5 text-primary"/> Organization Identity</CardTitle>
            <CardDescription>Manage profile and institution-wide visibility.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
            <FormField control={control} name="name" render={({ field }) => (
                <FormItem className="w-full">
                    <FormLabel className="uppercase text-xs font-bold text-muted-foreground">Organization Name</FormLabel>
                    <FormControl><Input className="rounded-md shadow-none w-full font-medium" {...field} value={field.value ?? ""} /></FormControl>
                    <FormMessage />
                </FormItem>
            )} />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
                <FormField control={control} name="org_type" render={({ field }) => (
                    <FormItem className="w-full">
                        <FormLabel className="uppercase text-xs font-bold text-muted-foreground">Type</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger className="rounded-md shadow-none w-full text-left font-medium">
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent className="rounded-md shadow-none">
                                <SelectItem value="school" className="rounded-md">School</SelectItem>
                                <SelectItem value="homeschool" className="rounded-md">Homeschool Network</SelectItem>
                            </SelectContent>
                        </Select>
                        <FormMessage />
                    </FormItem>
                )} />

                <FormField control={control} name="status" render={({ field }) => (
                    <FormItem className="w-full">
                        <FormLabel className="uppercase text-xs font-bold text-muted-foreground">Visibility Status</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger className="rounded-md shadow-none w-full text-left font-medium">
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent className="rounded-md shadow-none">
                                <SelectItem value="draft" className="rounded-md">Draft (Hidden)</SelectItem>
                                <SelectItem value="pending_approval" disabled={!canSubmit} className="rounded-md">
                                  Pending Approval {!canSubmit && "(Locked)"}
                                </SelectItem>
                                <SelectItem value="approved" disabled className="rounded-md font-bold text-primary">Approved (Locked)</SelectItem>
                                <SelectItem value="suspended" disabled className="rounded-md text-destructive">Suspended</SelectItem>
                            </SelectContent>
                        </Select>
                        <FormMessage />
                    </FormItem>
                )} />
            </div>

            <FormField control={control} name="description" render={({ field }) => (
                <FormItem className="w-full">
                    <FormLabel className="uppercase text-xs font-bold text-muted-foreground">Description</FormLabel>
                    <FormControl><Textarea className="rounded-md shadow-none w-full h-40 resize-none leading-relaxed" {...field} value={field.value ?? ""} /></FormControl>
                    <FormMessage />
                </FormItem>
            )} />
        </CardContent>
      </Card>
      
      {!canSubmit && (
        <Alert variant="destructive" className="bg-amber-50 border-amber-200 text-amber-900 rounded-md shadow-none">
            <AlertTriangle className="h-4 w-4 text-amber-600" />
            <AlertTitle className="text-sm font-bold">Incomplete Configuration</AlertTitle>
            <AlertDescription className="text-xs opacity-90">
              Required for approval: {missingFields.join(", ")}
            </AlertDescription>
        </Alert>
      )}
    </div>
  );
}

export function ManageBranding() {
  const { control } = useFormContext<OrgSettingsValues>();

  return (
    <Card className="rounded-md border shadow-none">
        <CardHeader>
            <CardTitle className="flex items-center gap-2"><Globe className="h-5 w-5 text-primary"/> Branding & Socials</CardTitle>
            <CardDescription>Optional public links for your organization page.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
                <FormField control={control} name="branding.website" render={({ field }) => (
                    <FormItem><FormLabel className="uppercase text-xs font-bold text-muted-foreground">Website</FormLabel><FormControl><Input className="rounded-md shadow-none w-full" placeholder="https://..." {...field} value={field.value ?? ""} /></FormControl><FormMessage/></FormItem>
                )} />
                <FormField control={control} name="branding.linkedin" render={({ field }) => (
                    <FormItem><FormLabel className="uppercase text-xs font-bold text-muted-foreground">LinkedIn</FormLabel><FormControl><Input className="rounded-md shadow-none w-full" placeholder="https://..." {...field} value={field.value ?? ""} /></FormControl><FormMessage/></FormItem>
                )} />
                <FormField control={control} name="branding.facebook" render={({ field }) => (
                    <FormItem><FormLabel className="uppercase text-xs font-bold text-muted-foreground">Facebook</FormLabel><FormControl><Input className="rounded-md shadow-none w-full" placeholder="https://..." {...field} value={field.value ?? ""} /></FormControl><FormMessage/></FormItem>
                )} />
                <FormField control={control} name="branding.twitter" render={({ field }) => (
                    <FormItem><FormLabel className="uppercase text-xs font-bold text-muted-foreground">X (Twitter)</FormLabel><FormControl><Input className="rounded-md shadow-none w-full" placeholder="https://..." {...field} value={field.value ?? ""} /></FormControl><FormMessage/></FormItem>
                )} />
            </div>
        </CardContent>
    </Card>
  );
}

const PolicyBuilder = ({ value, onChange, placeholder }: { value: string | undefined, onChange: (val: string) => void, placeholder: string }) => {
    const [input, setInput] = useState("");
    const items = value ? value.split('\n\n').filter(Boolean) : [];
  
    const handleAdd = () => {
      if (!input.trim()) return;
      const newItems = [...items, input.trim()];
      onChange(newItems.join('\n\n')); 
      setInput("");
    };
  
    const handleRemove = (index: number) => {
      const newItems = items.filter((_, i) => i !== index);
      onChange(newItems.join('\n\n'));
    };
  
    return (
      <div className="space-y-4 w-full">
        <div className="flex gap-2 w-full">
          <Input 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={placeholder}
            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAdd())}
            className="rounded-md shadow-none w-full"
          />
          <Button type="button" onClick={handleAdd} variant="secondary" className="shrink-0 rounded-md shadow-none">
            <Plus className="mr-2 h-4 w-4" /> Add Clause
          </Button>
        </div>
        <div className="space-y-2 max-h-[300px] overflow-y-auto w-full">
          {items.map((item, idx) => (
            <div key={idx} className="flex items-start justify-between gap-3 bg-muted/20 border p-3 rounded-md text-sm w-full">
              <p className="whitespace-pre-wrap break-words min-w-0 flex-1">{item}</p>
              <Button type="button" variant="ghost" size="icon" className="h-6 w-6 shrink-0" onClick={() => handleRemove(idx)}><X className="h-4 w-4" /></Button>
            </div>
          ))}
        </div>
      </div>
    );
};

export function ManagePolicies() {
    const { control } = useFormContext<OrgSettingsValues>();
    return (
        <Card className="rounded-md border shadow-none">
            <CardHeader><CardTitle>Legal & Policies</CardTitle></CardHeader>
            <CardContent>
                <Tabs defaultValue="terms" className="w-full">
                    <TabsList className="grid w-full grid-cols-3 mb-6">
                        <TabsTrigger value="terms">Terms</TabsTrigger>
                        <TabsTrigger value="privacy">Privacy</TabsTrigger>
                        <TabsTrigger value="refund">Refund</TabsTrigger>
                    </TabsList>
                    <TabsContent value="terms"><FormField control={control} name="policies.terms_of_service" render={({ field }) => (<FormItem><FormControl><PolicyBuilder value={field.value} onChange={field.onChange} placeholder="e.g. Terms of use..." /></FormControl></FormItem>)} /></TabsContent>
                    <TabsContent value="privacy"><FormField control={control} name="policies.privacy_policy" render={({ field }) => (<FormItem><FormControl><PolicyBuilder value={field.value} onChange={field.onChange} placeholder="e.g. Data privacy..." /></FormControl></FormItem>)} /></TabsContent>
                    <TabsContent value="refund"><FormField control={control} name="policies.refund_policy" render={({ field }) => (<FormItem><FormControl><PolicyBuilder value={field.value} onChange={field.onChange} placeholder="e.g. Refund rules..." /></FormControl></FormItem>)} /></TabsContent>
                </Tabs>
            </CardContent>
        </Card>
    );
}

export function ManageStructure({ control, canSubmit, missingFields }: { control: Control<any>, canSubmit: boolean, missingFields: string[] }) {
    const { watch, setValue } = useFormContext<OrgSettingsValues>();
    const [newLevel, setNewLevel] = useState("");
    const [newCategory, setNewCategory] = useState("");
  
    const watchedPeriod = watch("membership_period");
    const watchedPayoutFreq = watch("payout_frequency");
    const levels = watch("levels") || [];
    const categories = watch("categories") || [];

    return (
        <div className="space-y-8">
            <div className="grid md:grid-cols-2 gap-6 w-full">
                <Card className="rounded-md border shadow-none">
                    <CardHeader><CardTitle className="text-base flex items-center gap-2"><Layers className="h-4 w-4"/> Structure & Hierarchy</CardTitle></CardHeader>
                    <CardContent className="space-y-6">
                        <div className="space-y-3 w-full">
                            <FormLabel className="uppercase text-xs font-bold text-muted-foreground">Levels</FormLabel>
                            <div className="flex gap-2 w-full">
                                <Input className="rounded-md shadow-none w-full" value={newLevel} onChange={(e) => setNewLevel(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), (() => { if (!newLevel.trim()) return; setValue("levels", [...levels, { name: newLevel, order: levels.length + 1 }]); setNewLevel(""); })())} placeholder="Add level..." />
                                <Button type="button" size="icon" variant="outline" className="shrink-0" onClick={() => { if (!newLevel.trim()) return; setValue("levels", [...levels, { name: newLevel, order: levels.length + 1 }]); setNewLevel(""); }}><Plus size={16}/></Button>
                            </div>
                            <div className="flex flex-wrap gap-2 w-full">{levels.map((lvl, idx) => (<Badge key={idx} variant="secondary" className="px-3 py-1">{lvl.name}<X className="ml-2 h-3 w-3 cursor-pointer" onClick={() => setValue("levels", levels.filter((_, i) => i !== idx))} /></Badge>))}</div>
                        </div>
                        <div className="space-y-3 pt-4 border-t w-full">
                            <FormLabel className="uppercase text-xs font-bold text-muted-foreground">Categories</FormLabel>
                            <div className="flex gap-2 w-full">
                                <Input className="rounded-md shadow-none w-full" value={newCategory} onChange={(e) => setNewCategory(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), (() => { if (!newCategory.trim()) return; setValue("categories", [...categories, { name: newCategory }]); setNewCategory(""); })())} placeholder="Science, Math..." />
                                <Button type="button" size="icon" variant="outline" className="shrink-0" onClick={() => { if (!newCategory.trim()) return; setValue("categories", [...categories, { name: newCategory }]); setNewCategory(""); }}><Plus size={16}/></Button>
                            </div>
                            <div className="flex flex-wrap gap-2 w-full">{categories.map((cat, idx) => (<Badge key={idx} variant="outline" className="px-3 py-1">{cat.name}<X className="ml-2 h-3 w-3 cursor-pointer" onClick={() => setValue("categories", categories.filter((_, i) => i !== idx))} /></Badge>))}</div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="rounded-md border shadow-none">
                    <CardHeader><CardTitle className="text-base flex items-center gap-2"><DollarSign className="h-4 w-4"/> Membership & Pricing</CardTitle></CardHeader>
                    <CardContent className="space-y-4">
                        <FormField control={control} name="membership_period" render={({ field }) => (
                            <FormItem><FormLabel className="uppercase text-xs font-bold text-muted-foreground">Billing Period</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger className="font-medium"><SelectValue /></SelectTrigger></FormControl><SelectContent><SelectItem value="free">Free Access</SelectItem><SelectItem value="monthly">Monthly</SelectItem><SelectItem value="yearly">Yearly</SelectItem><SelectItem value="lifetime">Lifetime</SelectItem></SelectContent></Select></FormItem>
                        )} />
                        {watchedPeriod !== "free" && (
                            <div className="grid grid-cols-2 gap-4 animate-in fade-in">
                                <FormField control={control} name="membership_price" render={({ field }) => (
                                    <FormItem><FormLabel className="uppercase text-xs font-bold text-muted-foreground">Price</FormLabel><FormControl><Input type="number" {...field} value={field.value ?? ""} className="font-medium" /></FormControl></FormItem>
                                )} />
                                <FormField control={control} name="membership_duration_value" render={({ field }) => (
                                    <FormItem><FormLabel className="uppercase text-xs font-bold text-muted-foreground">Value</FormLabel><FormControl><Input type="number" {...field} value={field.value ?? ""} className="font-medium" /></FormControl></FormItem>
                                )} />
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            <Card className="rounded-md border border-primary/20 bg-primary/5 shadow-none">
                <CardHeader><CardTitle className="text-base text-primary flex items-center gap-2"><CreditCard className="h-4 w-4"/> Financials & Payouts</CardTitle></CardHeader>
                <CardContent className="space-y-6">
                    <FormField control={control} name="founder_commission_percent" render={({ field }) => (
                        <FormItem className="w-full">
                            <FormLabel className="uppercase text-xs font-bold text-muted-foreground flex items-center gap-2">Founder Commission (Your Cut) <Percent className="h-3 w-3"/></FormLabel>
                            <FormControl>
                                <div className="relative w-full">
                                    <Input type="number" min={40} max={100} {...field} value={field.value ?? ""} className="pr-12 rounded-md shadow-none w-full font-medium" />
                                    <span className="absolute right-3 top-2.5 text-sm text-muted-foreground">%</span>
                                </div>
                            </FormControl>
                            <FormDescription className="text-[10px]">Min 40%. This is the percentage you retain from sales.</FormDescription>
                            <FormMessage />
                        </FormItem>
                    )} />

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full border-t pt-4">
                        <FormField control={control} name="payout_frequency" render={({ field }) => (
                            <FormItem><FormLabel className="uppercase text-xs font-bold text-muted-foreground">Schedule</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger className="font-medium text-xs h-9"><SelectValue /></SelectTrigger></FormControl><SelectContent><SelectItem value="monthly">Monthly</SelectItem><SelectItem value="weekly">Weekly</SelectItem><SelectItem value="manual">Manual</SelectItem></SelectContent></Select></FormItem>
                        )} />
                        {watchedPayoutFreq === "monthly" && (
                            <FormField control={control} name="payout_anchor_day" render={({ field }) => (
                                <FormItem><FormLabel className="uppercase text-xs font-bold text-muted-foreground">Day</FormLabel><FormControl><Input type="number" {...field} value={field.value ?? ""} className="font-medium h-9 text-xs" /></FormControl></FormItem>
                            )} />
                        )}
                        <FormField control={control} name="auto_distribute" render={({ field }) => (
                            <FormItem><FormLabel className="uppercase text-xs font-bold text-muted-foreground">Automation</FormLabel><Select onValueChange={(val) => field.onChange(val === "true")} value={field.value ? "true" : "false"}><FormControl><SelectTrigger className="font-medium text-xs h-9"><SelectValue /></SelectTrigger></FormControl><SelectContent><SelectItem value="true">Auto</SelectItem><SelectItem value="false">Manual</SelectItem></SelectContent></Select></FormItem>
                        )} />
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}