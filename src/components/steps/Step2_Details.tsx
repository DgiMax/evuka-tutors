import React from "react";
import { UseFormReturn } from "react-hook-form";
import { TutorOnboardingFormData } from "../TutorFormTypes";
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Video, CloudUpload, FileVideo, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Step2Details({ form }: { form: UseFormReturn<TutorOnboardingFormData> }) {
  const introVideoFile = form.watch("introVideoFile");
  const videoUrl = introVideoFile instanceof File ? URL.createObjectURL(introVideoFile) : null;

  return (
    <div className="space-y-6">
      <FormField
        control={form.control}
        name="bio"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Detailed Bio</FormLabel>
            <FormControl>
              <Textarea
                rows={5}
                placeholder="Tell students about your teaching style, experience, and passion..."
                {...field}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="introVideoFile"
        render={() => (
          <FormItem>
            <FormLabel className="flex items-center gap-2">
              <Video className="h-4 w-4 text-muted-foreground" /> Introductory Video (Optional)
            </FormLabel>
            
            <FormControl>
                {!introVideoFile && (
                    <label 
                        htmlFor="video-upload" 
                        className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-border rounded-lg cursor-pointer bg-muted/30 hover:bg-muted/50 transition-colors group"
                    >
                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                            <CloudUpload className="w-8 h-8 mb-3 text-muted-foreground group-hover:text-primary transition-colors" />
                            <p className="mb-2 text-sm text-muted-foreground">
                                <span className="font-semibold">Click to upload video</span>
                            </p>
                            <p className="text-xs text-muted-foreground/70">MP4, WebM (Max 50MB)</p>
                        </div>
                        <input 
                            id="video-upload" 
                            type="file" 
                            accept="video/*" 
                            className="hidden" 
                            onChange={(e) => {
                                const file = e.target.files?.[0] || null;
                                form.setValue("introVideoFile", file, { shouldValidate: true });
                            }}
                        />
                    </label>
                )}
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      {videoUrl && (
        <div className="mt-4 p-4 border rounded-md bg-muted/30 space-y-3">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
                <FileVideo className="h-4 w-4 text-primary" />
                <p className="text-sm font-medium truncate max-w-[200px]">
                    {introVideoFile instanceof File ? introVideoFile.name : "Video Selected"}
                </p>
            </div>
            <Button
              type="button"
              variant="destructive"
              size="sm"
              onClick={() => form.setValue("introVideoFile", null, { shouldValidate: true })}
            >
              <Trash2 className="h-3 w-3 mr-1" /> Remove
            </Button>
          </div>
          <div className="aspect-video w-full border border-border rounded-md overflow-hidden bg-black">
            <video width="100%" height="100%" controls src={videoUrl} className="object-contain w-full h-full" />
          </div>
        </div>
      )}
    </div>
  );
}