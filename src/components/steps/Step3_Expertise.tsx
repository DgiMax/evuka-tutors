"use client";

import React, { useState, KeyboardEvent } from "react";
import { UseFormReturn, useFieldArray } from "react-hook-form";
// Make sure this path to TutorFormTypes is correct based on your folder structure!
import { TutorOnboardingFormData } from "../TutorFormTypes";
import { FormField, FormItem, FormLabel, FormControl, FormMessage, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { BookOpen, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// Helper Component (Internal)
const SubjectInput = ({ form }: { form: UseFormReturn<TutorOnboardingFormData> }) => {
  const [inputValue, setInputValue] = useState("");
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "subjects",
  });

  const handleAddSubject = () => {
    if (inputValue.trim()) {
      const subjectName = inputValue.trim();
      // Case-insensitive duplicate check
      if (!fields.some((field) => field.name.toLowerCase() === subjectName.toLowerCase())) {
        append({ name: subjectName });
      }
      setInputValue("");
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddSubject();
    }
  };

  const subjectError = (form.formState.errors.subjects as any)?.root?.message ||
    (fields.length === 0 && (form.formState.errors.subjects as any)?.message);

  return (
    <FormItem>
      <div className="space-y-3">
        <FormLabel>Subjects Taught</FormLabel>
        
        {/* Input Row */}
        <div className="flex gap-2">
          <Input
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="e.g. Mathematics, React, Piano"
            className="flex-1"
          />
          <Button type="button" onClick={handleAddSubject} variant="secondary" className="shrink-0">
            <Plus className="h-4 w-4 mr-2" /> Add
          </Button>
        </div>

        {/* Chips List */}
        <div className={cn(
            "min-h-[40px] p-1",
            fields.length > 0 ? "flex flex-wrap gap-2" : "text-sm text-muted-foreground italic"
        )}>
            {fields.length === 0 && <span className="text-xs text-muted-foreground">No subjects added yet.</span>}
            
            {fields.map((field, index) => (
                <span key={field.id} className="flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary border border-primary/20">
                {field.name}
                <button type="button" onClick={() => remove(index)} className="ml-1 rounded-full p-0.5 hover:bg-primary/20 text-primary/70 hover:text-primary transition-colors">
                    <X className="h-3 w-3" />
                </button>
                </span>
            ))}
        </div>
        
        {subjectError && <p className="text-sm font-medium text-destructive">{subjectError}</p>}
        <FormDescription>
            Add the subjects you are qualified to teach.
        </FormDescription>
      </div>
    </FormItem>
  );
};

// Main Component for Step 3
// ✅ CRITICAL: Must be 'export default'
export default function Step3Expertise({ form }: { form: UseFormReturn<TutorOnboardingFormData> }) {
  return (
    <div className="space-y-6">
      <SubjectInput form={form} />
      
      <FormField
        control={form.control}
        name="education"
        render={({ field, fieldState, formState }) => (
          <FormItem>
            <FormLabel className="flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-muted-foreground" /> Top Education
            </FormLabel>
            <FormControl>
              <Input placeholder="e.g., B.Sc. Computer Science at University of Nairobi" {...field} />
            </FormControl>
            
            {/* Logic to hide error until dirty or submitted */}
            {((fieldState.isDirty || formState.isSubmitted) && fieldState.error) && (
                <FormMessage>{fieldState.error.message}</FormMessage>
            )}
          </FormItem>
        )}
      />
    </div>
  );
}