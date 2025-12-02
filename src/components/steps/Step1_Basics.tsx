import React, { ChangeEvent } from "react";
import { UseFormReturn } from "react-hook-form";
import { TutorOnboardingFormData } from "../TutorFormTypes";
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import Image from "next/image";
import { Upload, X, Edit2 } from "lucide-react";
import { Button } from "@/components/ui/button";

const ImageUploader = ({ form }: { form: UseFormReturn<TutorOnboardingFormData> }) => {
  const profileImage = form.watch("profileImage");
  const imagePreview = profileImage instanceof File ? URL.createObjectURL(profileImage) : null;

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    form.setValue("profileImage", file, { shouldValidate: true });
  };

  return (
    <FormItem className="flex flex-col items-center gap-4">
      <div className="relative h-32 w-32">
        {imagePreview ? (
          <>
            <Image
              src={imagePreview}
              alt="Profile Preview"
              width={128}
              height={128}
              className="h-full w-full rounded-full object-cover border-4 border-white shadow-sm"
            />
            <Button
              type="button"
              variant="destructive"
              size="icon"
              onClick={() => form.setValue("profileImage", null, { shouldValidate: true })}
              className="absolute top-0 right-0 -mr-2 -mt-2 h-6 w-6 rounded-full z-10 shadow-sm"
            >
              <X className="h-3 w-3" />
            </Button>
          </>
        ) : (
          <label
            htmlFor="profileImage"
            className="flex h-full w-full cursor-pointer flex-col items-center justify-center rounded-full border-2 border-dashed border-border bg-muted/50 text-muted-foreground hover:bg-muted transition-colors"
          >
            <Upload className="h-8 w-8" />
            <span className="mt-1 text-xs font-medium">Upload Photo</span>
          </label>
        )}
      </div>
      <input id="profileImage" type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
      <FormMessage />
    </FormItem>
  );
};

export default function Step1Basics({ form }: { form: UseFormReturn<TutorOnboardingFormData> }) {
  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
      <div className="md:col-span-1 flex justify-center pt-2">
        <ImageUploader form={form} />
      </div>
      <div className="space-y-6 md:col-span-2">
        <FormField
          control={form.control}
          name="displayName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Display Name</FormLabel>
              <FormControl>
                <Input placeholder="e.g., Jane D." {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="headline"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Headline</FormLabel>
              <FormControl>
                <Input placeholder="e.g., Senior Django & React Developer" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </div>
  );
}