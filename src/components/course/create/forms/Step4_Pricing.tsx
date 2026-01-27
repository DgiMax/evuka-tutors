"use client";

import React from "react";
import { Control } from "react-hook-form";
import { DollarSign, Globe, Lock, AlertTriangle } from "lucide-react";
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { type CourseFormValues, type CourseStatus, statusOptions } from "../CourseFormTypes";

interface Step4Props {
  control: Control<CourseFormValues>;
  availableStatusOptions: CourseStatus[];
  activeSlug: string | null;
  isOrgAdminOrOwner: boolean;
  canPublish: boolean;
  missingFields: string[];
}

export default function Step4Pricing({
  control,
  availableStatusOptions,
  activeSlug,
  isOrgAdminOrOwner,
  canPublish,
  missingFields,
}: Step4Props) {
  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="rounded-md border p-4 md:p-6 ">
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-primary" /> Pricing
            </h3>
            <p className="text-sm text-muted-foreground mt-1">
              Set a price for your course or leave it empty/0 to make it free.
            </p>
          </div>

          <FormField
            control={control}
            name="price"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Course Price (KES)</FormLabel>
                <FormControl>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="number"
                      min="0"
                      placeholder="0.00"
                      className="pl-9 text-lg font-medium"
                      {...field}
                      onChange={(e) => {
                        const val = e.target.value;
                        field.onChange(val === "" ? undefined : Number(val));
                      }}
                    />
                  </div>
                </FormControl>
                <FormDescription>
                  Earnings will be calculated after platform fees.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      </div>
      
      <div className="rounded-md border p-4 md:p-6 ">
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Globe className="h-5 w-5 text-primary" /> Publishing Status
            </h3>
            <p className="text-sm text-muted-foreground mt-1">
              Control the visibility of your course.
            </p>
          </div>

          {!canPublish && (
            <Alert
              variant="destructive"
              className="bg-destructive/5 border-destructive/20 text-destructive"
            >
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Not ready to publish</AlertTitle>
              <AlertDescription className="text-xs mt-1">
                You must complete the following fields before publishing:{" "}
                {missingFields.map(f => f.replace(/_/g, " ")).join(", ")}
              </AlertDescription>
            </Alert>
          )}

          <FormField
            control={control}
            name="status"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Current Status</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                  value={field.value}
                >
                  <FormControl>
                    <SelectTrigger className="h-12 w-full">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {availableStatusOptions.map((status) => {
                      const isLocked = (status !== "draft" && !canPublish);
                      return (
                        <SelectItem 
                          key={status} 
                          value={status} 
                          disabled={isLocked}
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

          {activeSlug && !isOrgAdminOrOwner && (
            <Card className="bg-amber-50 border-amber-200">
              <CardContent className="p-4 flex items-start gap-3">
                <Lock className="h-5 w-5 text-amber-600 mt-0.5" />
                <div className="space-y-1">
                  <p className="text-sm font-medium text-amber-800">
                    Organization Publishing Restricted
                  </p>
                  <p className="text-xs text-amber-700 leading-relaxed">
                    As a Tutor in this organization, you can create drafts and
                    submit courses for review. Only an Admin or Owner can fully
                    publish the course.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className={`p-4 rounded-md border ${
              control._formValues.status === 'draft' ? 'border-primary bg-primary/5' : 'border-border bg-card'
            }`}>
              <Badge variant="outline" className="mb-2">Draft</Badge>
              <p className="text-xs text-muted-foreground">
                Only visible to you. Work in progress.
              </p>
            </div>
            
            <div className={`p-4 rounded-md border ${
              control._formValues.status === 'pending_review' ? 'border-primary bg-primary/5' : 'border-border bg-card'
            } ${(!canPublish || !activeSlug) ? 'opacity-50' : ''}`}>
              <Badge variant="secondary" className="mb-2">Pending Review</Badge>
              <p className="text-xs text-muted-foreground">
                Submitted to admins for approval (Organization only).
              </p>
            </div>

            <div className={`p-4 rounded-md border ${
              control._formValues.status === 'published' ? 'border-primary bg-primary/5' : 'border-border bg-card'
            } ${!canPublish ? 'opacity-50' : ''}`}>
              <Badge className="mb-2">Published</Badge>
              <p className="text-xs text-muted-foreground">
                Live and visible to students for enrollment.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}