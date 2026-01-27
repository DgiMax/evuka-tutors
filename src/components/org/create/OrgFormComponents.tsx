import React, { useState } from "react";
import { useFormContext, Control } from "react-hook-form";
import {
  FormField, FormItem, FormLabel, FormControl, FormMessage, FormDescription
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Plus, X, School, Home, Layers, DollarSign, Image as ImageIcon, Globe, Lock, AlertTriangle, CreditCard, Calendar, Percent } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { OrgFormValues, statusOptions } from "./OrgFormSchema";

export function StepBasics() {
  const { control } = useFormContext<OrgFormValues>();

  return (
    <div className="space-y-6">
      <Card className="rounded-md border shadow-none">
        <CardHeader>
            <CardTitle>Organization Identity</CardTitle>
            <CardDescription>Basic details about your institution.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
            <FormField control={control} name="name" render={({ field }) => (
                <FormItem className="w-full">
                    <FormLabel>Organization Name <span className="text-destructive">*</span></FormLabel>
                    <FormControl><Input className="rounded-md shadow-none w-full" placeholder="e.g. Springfield Academy" {...field} /></FormControl>
                    <FormMessage />
                </FormItem>
            )} />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
                <FormField control={control} name="org_type" render={({ field }) => (
                    <FormItem className="w-full">
                        <FormLabel>Type</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger className="rounded-md shadow-none w-full text-left">
                                <div className="truncate w-full text-left">
                                  <SelectValue />
                                </div>
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent className="rounded-md shadow-none">
                                <SelectItem value="school" className="rounded-md">
                                    <div className="flex items-center gap-2"><School className="h-4 w-4"/> School / Institution</div>
                                </SelectItem>
                                <SelectItem value="homeschool" className="rounded-md">
                                    <div className="flex items-center gap-2"><Home className="h-4 w-4"/> Homeschool Network</div>
                                </SelectItem>
                            </SelectContent>
                        </Select>
                        <FormMessage />
                    </FormItem>
                )} />
            </div>

            <FormField control={control} name="description" render={({ field }) => (
                <FormItem className="w-full">
                    <FormLabel>Description</FormLabel>
                    <FormControl><Textarea className="rounded-md shadow-none w-full" rows={5} placeholder="Tell us about your mission..." {...field} /></FormControl>
                    <FormMessage />
                </FormItem>
            )} />
        </CardContent>
      </Card>
    </div>
  );
}

export function StepBranding() {
  const { control, watch } = useFormContext<OrgFormValues>();
  const logoValue = watch("logo");

  return (
    <div className="space-y-6">
        <Card className="rounded-md border shadow-none">
            <CardHeader>
                <CardTitle>Branding & Socials</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
                <FormField control={control} name="logo" render={({ field }) => (
                    <FormItem className="w-full">
                        <FormLabel>Organization Logo</FormLabel>
                        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
                            <div className="h-24 w-24 rounded-md border-2 border-dashed border-border flex items-center justify-center overflow-hidden bg-muted/20 shrink-0 shadow-none">
                                {logoValue ? (
                                    <img 
                                        src={typeof logoValue === 'string' ? logoValue : URL.createObjectURL(logoValue)} 
                                        alt="Preview" 
                                        className="h-full w-full object-cover" 
                                    />
                                ) : (
                                    <ImageIcon className="h-8 w-8 text-muted-foreground" />
                                )}
                            </div>
                            <div className="space-y-2 w-full">
                                <FormControl>
                                    <Input 
                                        type="file" 
                                        accept="image/*" 
                                        onChange={(e) => field.onChange(e.target.files?.[0])}
                                        className="cursor-pointer file:text-primary rounded-md shadow-none w-full"
                                    />
                                </FormControl>
                                <FormDescription>Recommended: 500x500px, PNG or JPG.</FormDescription>
                            </div>
                        </div>
                    </FormItem>
                )} />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t w-full">
                    <FormField control={control} name="branding.website" render={({ field }) => (
                        <FormItem className="w-full"><FormLabel>Website</FormLabel><FormControl><Input className="rounded-md shadow-none w-full" placeholder="https://..." {...field} /></FormControl><FormMessage/></FormItem>
                    )} />
                    <FormField control={control} name="branding.linkedin" render={({ field }) => (
                        <FormItem className="w-full"><FormLabel>LinkedIn</FormLabel><FormControl><Input className="rounded-md shadow-none w-full" placeholder="https://linkedin.com/..." {...field} /></FormControl><FormMessage/></FormItem>
                    )} />
                    <FormField control={control} name="branding.facebook" render={({ field }) => (
                        <FormItem className="w-full"><FormLabel>Facebook</FormLabel><FormControl><Input className="rounded-md shadow-none w-full" placeholder="https://facebook.com/..." {...field} /></FormControl><FormMessage/></FormItem>
                    )} />
                    <FormField control={control} name="branding.twitter" render={({ field }) => (
                        <FormItem className="w-full"><FormLabel>X (Twitter)</FormLabel><FormControl><Input className="rounded-md shadow-none w-full" placeholder="https://x.com/..." {...field} /></FormControl><FormMessage/></FormItem>
                    )} />
                </div>
            </CardContent>
        </Card>
    </div>
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
            <Plus className="mr-2 h-4 w-4" /> Add
          </Button>
        </div>
        <div className="space-y-2 max-h-[300px] overflow-y-auto w-full">
          {items.length === 0 && <div className="text-sm text-muted-foreground italic text-center p-4 border border-dashed rounded-md">No clauses added yet.</div>}
          {items.map((item, idx) => (
            <div key={idx} className="flex items-start justify-between gap-3 bg-muted/20 border p-3 rounded-md text-sm shadow-none w-full">
              <div className="flex gap-3 min-w-0">
                <span className="text-muted-foreground font-mono bg-muted w-6 h-6 flex items-center justify-center rounded-full text-xs shrink-0">{idx + 1}</span>
                <p className="whitespace-pre-wrap break-words min-w-0">{item}</p>
              </div>
              <Button type="button" variant="ghost" size="icon" className="h-6 w-6 shrink-0 rounded-md" onClick={() => handleRemove(idx)}><X className="h-4 w-4" /></Button>
            </div>
          ))}
        </div>
      </div>
    );
};

export function StepPolicies() {
    const { control } = useFormContext<OrgFormValues>();
    const [activeTab, setActiveTab] = useState("terms");

    return (
        <Card className="rounded-md border shadow-none">
            <CardHeader>
                <CardTitle>Legal & Policies</CardTitle>
                <CardDescription>Define the rules for your organization.</CardDescription>
            </CardHeader>
            <CardContent>
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <TabsList className="grid w-full grid-cols-3 mb-6 rounded-md">
                        <TabsTrigger value="terms" className="rounded-md">Terms</TabsTrigger>
                        <TabsTrigger value="privacy" className="rounded-md">Privacy</TabsTrigger>
                        <TabsTrigger value="refund" className="rounded-md">Refund</TabsTrigger>
                    </TabsList>

                    <TabsContent value="terms" className="w-full">
                        <FormField control={control} name="policies.terms_of_service" render={({ field }) => (
                            <FormItem className="w-full">
                                <FormControl>
                                    <PolicyBuilder value={field.value} onChange={field.onChange} placeholder="e.g. Be respectful to tutors." />
                                </FormControl>
                            </FormItem>
                        )} />
                    </TabsContent>
                    <TabsContent value="privacy" className="w-full">
                        <FormField control={control} name="policies.privacy_policy" render={({ field }) => (
                            <FormItem className="w-full">
                                <FormControl>
                                    <PolicyBuilder value={field.value} onChange={field.onChange} placeholder="e.g. Data is not shared." />
                                </FormControl>
                            </FormItem>
                        )} />
                    </TabsContent>
                    <TabsContent value="refund" className="w-full">
                        <FormField control={control} name="policies.refund_policy" render={({ field }) => (
                            <FormItem className="w-full">
                                <FormControl>
                                    <PolicyBuilder value={field.value} onChange={field.onChange} placeholder="e.g. Refund within 24 hours." />
                                </FormControl>
                            </FormItem>
                        )} />
                    </TabsContent>
                </Tabs>
            </CardContent>
        </Card>
    );
}

interface StepFinalizeProps {
    control: Control<OrgFormValues>;
    canSubmit: boolean;
    missingFields: string[];
}

export function StepFinalize({ control, canSubmit, missingFields }: StepFinalizeProps) {
    const { watch, setValue, getValues } = useFormContext<OrgFormValues>();
    const [newLevel, setNewLevel] = useState("");
    const [newCategory, setNewCategory] = useState("");
  
    const watchedPeriod = watch("membership_period");
    const watchedPayoutFreq = watch("payout_frequency");
    const levels = watch("levels") || [];
    const categories = watch("categories") || [];
  
    const addLevel = () => {
      if (!newLevel.trim()) return;
      const current = getValues("levels") || [];
      setValue("levels", [...current, { name: newLevel, order: current.length + 1 }]);
      setNewLevel("");
    };
  
    const removeLevel = (index: number) => {
      const current = getValues("levels") || [];
      setValue("levels", current.filter((_, i) => i !== index));
    };
  
    const addCategory = () => {
      if (!newCategory.trim()) return;
      const current = getValues("categories") || [];
      setValue("categories", [...current, { name: newCategory }]);
      setNewCategory("");
    };
  
    const removeCategory = (index: number) => {
      const current = getValues("categories") || [];
      setValue("categories", current.filter((_, i) => i !== index));
    };

    const statusList = ["draft", "pending_approval"]; 

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="grid md:grid-cols-2 gap-6 w-full">
                <Card className="rounded-md border shadow-none">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-base"><Layers className="h-4 w-4"/> Structure & Hierarchy</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="space-y-3 w-full">
                            <FormLabel>Levels (e.g. Grade 1)</FormLabel>
                            <div className="flex gap-2 w-full">
                                <Input 
                                    className="rounded-md shadow-none w-full"
                                    value={newLevel} 
                                    onChange={(e) => setNewLevel(e.target.value)} 
                                    placeholder="Add level..."
                                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addLevel())}
                                />
                                <Button type="button" size="icon" variant="outline" className="rounded-md shadow-none shrink-0" onClick={addLevel}><Plus size={16}/></Button>
                            </div>
                            <div className="flex flex-wrap gap-2 w-full">
                                {levels.map((lvl, idx) => (
                                    <Badge key={idx} variant="secondary" className="px-3 py-1 rounded-md shadow-none">
                                        {lvl.name} <X className="ml-2 h-3 w-3 cursor-pointer" onClick={() => removeLevel(idx)} />
                                    </Badge>
                                ))}
                            </div>
                        </div>

                        <div className="space-y-3 pt-4 border-t w-full">
                            <FormLabel>Subjects / Categories</FormLabel>
                            <div className="flex gap-2 w-full">
                                <Input 
                                    className="rounded-md shadow-none w-full"
                                    value={newCategory} 
                                    onChange={(e) => setNewCategory(e.target.value)} 
                                    placeholder="e.g. Science..."
                                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addCategory())}
                                />
                                <Button type="button" size="icon" variant="outline" className="rounded-md shadow-none shrink-0" onClick={addCategory}><Plus size={16}/></Button>
                            </div>
                            <div className="flex flex-wrap gap-2 w-full">
                                {categories.map((cat, idx) => (
                                    <Badge key={idx} variant="outline" className="px-3 py-1 rounded-md shadow-none">
                                        {cat.name} <X className="ml-2 h-3 w-3 cursor-pointer" onClick={() => removeCategory(idx)} />
                                    </Badge>
                                ))}
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="rounded-md border shadow-none">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-base"><DollarSign className="h-4 w-4"/> Membership & Pricing</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <FormField control={control} name="membership_period" render={({ field }) => (
                            <FormItem className="w-full">
                                <FormLabel>Billing Period</FormLabel>
                                <Select onValueChange={field.onChange} value={field.value}>
                                    <FormControl>
                                      <SelectTrigger className="rounded-md shadow-none w-full text-left">
                                        <div className="truncate w-full text-left">
                                          <SelectValue />
                                        </div>
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent className="rounded-md shadow-none">
                                        <SelectItem value="free" className="rounded-md">Free Access</SelectItem>
                                        <SelectItem value="monthly" className="rounded-md">Monthly Subscription</SelectItem>
                                        <SelectItem value="yearly" className="rounded-md">Yearly Subscription</SelectItem>
                                        <SelectItem value="lifetime" className="rounded-md">One-time (Lifetime)</SelectItem>
                                    </SelectContent>
                                </Select>
                            </FormItem>
                        )} />

                        {watchedPeriod !== "free" && (
                            <div className="grid grid-cols-2 gap-4 animate-in fade-in w-full">
                                <FormField control={control} name="membership_price" render={({ field }) => (
                                    <FormItem className="w-full">
                                        <FormLabel>Price</FormLabel>
                                        <FormControl>
                                            <div className="relative w-full">
                                                <DollarSign className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                                <Input type="number" className="pl-8 rounded-md shadow-none w-full" {...field} />
                                            </div>
                                        </FormControl>
                                    </FormItem>
                                )} />
                                <FormField control={control} name="membership_duration_value" render={({ field }) => (
                                    <FormItem className="w-full">
                                        <FormLabel>Duration ({watchedPeriod === 'monthly' ? 'Months' : 'Years'})</FormLabel>
                                        <FormControl><Input type="number" className="rounded-md shadow-none w-full" {...field} /></FormControl>
                                    </FormItem>
                                )} />
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            <Card className="rounded-md border border-primary/20 bg-primary/5 shadow-none">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base text-primary">
                        <CreditCard className="h-4 w-4"/> Financial & Payout Settings
                    </CardTitle>
                    <CardDescription>Configure how you and your team get paid.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                     <FormField control={control} name="founder_commission_percent" render={({ field }) => (
                        <FormItem className="w-full">
                            <FormLabel className="flex items-center gap-2">Founder Commission (Your Cut) <Percent className="h-3 w-3"/></FormLabel>
                            <FormControl>
                                <div className="relative w-full">
                                    <Input type="number" min={40} max={100} {...field} className="pr-12 rounded-md shadow-none w-full" />
                                    <span className="absolute right-3 top-2.5 text-sm text-muted-foreground">%</span>
                                </div>
                            </FormControl>
                            <FormDescription>Minimum 40%. The percentage you keep from your courses.</FormDescription>
                            <FormMessage />
                        </FormItem>
                    )} />

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full">
                        <FormField control={control} name="payout_frequency" render={({ field }) => (
                            <FormItem className="w-full">
                                <FormLabel>Payout Schedule</FormLabel>
                                <Select onValueChange={field.onChange} value={field.value}>
                                    <FormControl>
                                      <SelectTrigger className="rounded-md shadow-none w-full text-left">
                                        <div className="truncate w-full text-left">
                                          <SelectValue />
                                        </div>
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent className="rounded-md shadow-none">
                                        <SelectItem value="monthly" className="rounded-md">Monthly</SelectItem>
                                        <SelectItem value="weekly" className="rounded-md">Weekly (Mondays)</SelectItem>
                                        <SelectItem value="manual" className="rounded-md">Manual Approval</SelectItem>
                                    </SelectContent>
                                </Select>
                            </FormItem>
                        )} />

                        {watchedPayoutFreq === "monthly" && (
                            <FormField control={control} name="payout_anchor_day" render={({ field }) => (
                                <FormItem className="w-full">
                                    <FormLabel className="flex items-center gap-2">Payout Day <Calendar className="h-3 w-3"/></FormLabel>
                                    <FormControl>
                                        <Input type="number" min={1} max={28} className="rounded-md shadow-none w-full" {...field} placeholder="Day of month (1-28)" />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />
                        )}

                        <FormField control={control} name="auto_distribute" render={({ field }) => (
                            <FormItem className="w-full">
                                <FormLabel>Automation</FormLabel>
                                <Select 
                                    onValueChange={(val) => field.onChange(val === "true")} 
                                    value={field.value ? "true" : "false"}
                                >
                                    <FormControl>
                                      <SelectTrigger className="rounded-md shadow-none w-full text-left">
                                        <div className="truncate w-full text-left">
                                          <SelectValue />
                                        </div>
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent className="rounded-md shadow-none">
                                        <SelectItem value="true" className="rounded-md">Auto-Distribute Funds</SelectItem>
                                        <SelectItem value="false" className="rounded-md">Manual Review Required</SelectItem>
                                    </SelectContent>
                                </Select>
                                <FormDescription>Should the system pay tutors automatically?</FormDescription>
                            </FormItem>
                        )} />
                    </div>
                </CardContent>
            </Card>

            <div className="space-y-6 w-full">
                <div>
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                        <Globe className="h-5 w-5 text-primary" /> Publishing Status
                    </h3>
                    <p className="text-sm text-muted-foreground mt-1">
                        Control the visibility of your organization.
                    </p>
                </div>

                {!canSubmit && (
                    <Alert variant="destructive" className="bg-destructive/5 border-destructive/20 text-destructive rounded-md shadow-none">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertTitle className="mb-2">Not ready to submit</AlertTitle>
                        <AlertDescription className="flex flex-col gap-3">
                            <span className="text-xs opacity-90">You must complete the following fields before submitting for approval:</span>
                            <div className="flex flex-wrap gap-2 w-full">
                                {missingFields.map((field) => (
                                    <Badge key={field} variant="outline" className="border-destructive/30 bg-white text-destructive hover:bg-white rounded-md shadow-none">
                                        {field}
                                    </Badge>
                                ))}
                            </div>
                        </AlertDescription>
                    </Alert>
                )}

                <FormField
                    control={control}
                    name="status"
                    render={({ field }) => (
                        <FormItem className="w-full">
                            <FormLabel>Current Status</FormLabel>
                            <Select
                                onValueChange={field.onChange}
                                defaultValue={field.value}
                                value={field.value}
                            >
                                <FormControl>
                                    <SelectTrigger className="h-12 rounded-md shadow-none w-full text-left">
                                        <div className="truncate w-full text-left">
                                          <SelectValue placeholder="Select status" />
                                        </div>
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent className="rounded-md shadow-none">
                                    {statusList.map((status) => {
                                        const isLocked = (status !== "draft" && !canSubmit);
                                        return (
                                            <SelectItem 
                                                key={status} 
                                                value={status} 
                                                disabled={isLocked}
                                                className="rounded-md"
                                            >
                                                <span className={`font-medium flex items-center gap-2 ${isLocked ? "text-muted-foreground" : ""}`}>
                                                    {statusOptions[status]}
                                                    {isLocked && <Lock className="h-3 w-3" />}
                                                </span>
                                            </SelectItem>
                                        );
                                    })}
                                </SelectContent>
                            </Select>
                            <FormMessage />
                        </FormItem>
                    )}
                />
            </div>
        </div>
    );
}