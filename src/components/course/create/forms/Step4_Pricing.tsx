// app/(tutor)/courses/create/forms/Step4_Pricing.tsx

"use client";

import React from "react";
import { Control } from "react-hook-form";
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
} from "@/components/ui/form";
import { Input as ShadcnInput } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { type CourseStatus, statusOptions } from "../CourseFormTypes";

interface Step4Props {
  control: Control<any>; // Use 'any' or 'CourseFormValues'
  availableStatusOptions: CourseStatus[];
  activeSlug: string | null;
  isOrgAdminOrOwner: boolean;
}

export default function Step4Pricing({
  control,
  availableStatusOptions,
  activeSlug,
  isOrgAdminOrOwner,
}: Step4Props) {
  return (
    <div className="space-y-6">
      <FormField
        control={control}
        name="price"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Price (KES)</FormLabel>
            <FormControl>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                  KSh
                </span>
                <ShadcnInput
                  type="number"
                  step="1"
                  min="0"
                  placeholder="0 (Free) or e.g., 1500"
                  className="pl-12 rounded-md"
                  {...field}
                  value={field.value ?? ""}
                  onChange={(e) => {
                    const val = e.target.value;
                    field.onChange(val === "" ? undefined : Number(val));
                  }}
                />
              </div>
            </FormControl>
            <FormDescription>
              Enter 0 or leave blank for a free course.
            </FormDescription>
          </FormItem>
        )}
      />

      <FormField
        control={control}
        name="status"
        render={({ field }) => (
          <FormItem className="flex flex-col sm:flex-row items-start sm:items-center justify-between rounded-md border border-border p-4 bg-muted/50">
            <div className="space-y-0.5 mb-2 sm:mb-0">
              <FormLabel className="text-base">Course Status</FormLabel>
              <FormDescription>
                {activeSlug && !isOrgAdminOrOwner
                  ? "Save as draft or submit for review."
                  : "Set the course status."}
              </FormDescription>
            </div>
            <Select onValueChange={field.onChange} value={field.value}>
              <FormControl>
                <SelectTrigger className="w-full sm:w-[180px] rounded-md truncate">
                  <SelectValue placeholder="Select status..." />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {availableStatusOptions.map((statusKey) => (
                  <SelectItem key={statusKey} value={statusKey}>
                    {statusOptions[statusKey]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormItem>
        )}
      />
    </div>
  );
}