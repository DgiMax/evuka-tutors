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
import { Input } from "@/components/ui/input";
import { type CourseFormValues } from "../CourseFormTypes";
import { Image as ImageIcon, Video } from "lucide-react";

interface Step3Props {
  control: Control<CourseFormValues>;
  form: UseFormReturn<CourseFormValues>;
}

export default function Step3Media({ control, form }: Step3Props) {
  return (
    <div className="rounded-md border p-4 md:p-6 ">
      <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        
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
                <FormLabel className="text-base font-semibold">Course Thumbnail</FormLabel>
                <div className="border-2 border-dashed border-border rounded-lg p-6 flex flex-col items-center justify-center bg-muted/10 hover:bg-muted/30 transition-colors gap-4 text-center">
                  {currentThumbnail ? (
                      <div className="relative group w-full max-w-sm aspect-video rounded-md overflow-hidden border shadow-sm">
                          <img
                              src={currentThumbnail}
                              alt="Course Thumbnail Preview"
                              className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                              <p className="text-white text-sm font-medium">Click to Change</p>
                          </div>
                      </div>
                  ) : (
                      <div className="flex flex-col items-center text-muted-foreground">
                          <div className="p-3 rounded-full bg-muted mb-3">
                              <ImageIcon className="h-6 w-6" />
                          </div>
                          <p className="text-sm font-medium text-foreground">Click to upload image</p>
                          <p className="text-xs">SVG, PNG, JPG or GIF (max. 2MB)</p>
                      </div>
                  )}
                  
                  <FormControl>
                      <Input
                          type="file"
                          accept="image/*"
                          className={`absolute inset-0 w-full h-full opacity-0 cursor-pointer ${currentThumbnail ? "" : "relative"}`}
                          onChange={(e) => {
                              const file = e.target.files?.[0] || null;
                              onChange(file);
                          }}
                          {...restField}
                          value={undefined} 
                      />
                  </FormControl>
                </div>
                <FormDescription>Recommended dimension: 1280x720 pixels (16:9 ratio).</FormDescription>
                <FormMessage />
              </FormItem>
            );
          }}
        />

        <div className="border-t border-border my-6"></div>

        <FormField
          control={control}
          name="promo_video"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-base font-semibold flex items-center gap-2">
                  <Video className="h-4 w-4 text-muted-foreground" /> Promotional Video URL
              </FormLabel>
              <FormControl>
                <Input
                  placeholder="https://www.youtube.com/watch?v=..."
                  {...field}
                  value={typeof field.value === "string" ? field.value : ""} 
                  className="h-12 text-sm"
                />
              </FormControl>
              <FormDescription>
                  Paste a link to your promo video on YouTube or Vimeo. This will be shown on the course landing page.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </div>
  );
}