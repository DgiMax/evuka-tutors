// app/(tutor)/courses/create/forms/Step3_Media.tsx

"use client";

import React from "react";
import { Control, UseFormReturn } from "react-hook-form";
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input as ShadcnInput } from "@/components/ui/input";
import { type CourseFormValues } from "../CourseFormTypes";

interface Step3Props {
  control: Control<CourseFormValues>;
  form: UseFormReturn<CourseFormValues>; // Pass the whole form object
}

export default function Step3Media({ control, form }: Step3Props) {
  return (
    <div className="space-y-6">
      <FormField
        control={control}
        name="thumbnail"
        render={({ field: { onChange, value, ...restField } }) => {
          const watchedThumbnail = form.watch("thumbnail");
          const currentThumbnail =
            typeof watchedThumbnail === "string"
              ? watchedThumbnail
              : watchedThumbnail instanceof File
              ? URL.createObjectURL(watchedThumbnail)
              : null;

          return (
            <FormItem>
              <FormLabel>Course Thumbnail (Image)</FormLabel>
              <FormControl>
                <ShadcnInput
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0] || null;
                    onChange(file);
                  }}
                  {...restField}
                />
              </FormControl>

              {currentThumbnail && (
                <div className="mt-2">
                  <img
                    src={currentThumbnail}
                    alt="Preview"
                    className="h-32 w-auto rounded-md border border-border object-cover"
                  />
                </div>
              )}

              <FormDescription>Recommended: 720x405px.</FormDescription>
              <FormMessage />
            </FormItem>
          );
        }}
      />

      <FormField
        control={control}
        name="promo_video"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Promotional Video URL (Optional)</FormLabel>
            <FormControl>
              <ShadcnInput
                className="rounded-md"
                placeholder="e.g., https://vimeo.com/123456"
                {...field}
                value={field.value || ""}
              />
            </FormControl>
            <FormDescription>Link to Vimeo or YouTube.</FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
}