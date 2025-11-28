// app/(tutor)/courses/create/forms/Step1_BasicInfo.tsx

"use client";

import React, { useMemo } from "react";
import { useFieldArray, type UseFormReturn } from "react-hook-form";
import { Plus, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input as ShadcnInput } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import {
  type CourseFormValues,
  type FormOptionsData,
} from "../CourseFormTypes";

interface Step1Props {
  form: UseFormReturn<CourseFormValues>;
  formOptions: FormOptionsData;
  filteredSubCategories: { id: string; name: string }[];
  activeSlug: string | null;
}

export default function Step1BasicInfo({
  form,
  formOptions,
  filteredSubCategories,
  activeSlug,
}: Step1Props) {
  const {
    fields: objectives,
    append: appendObjective,
    remove: removeObjective,
  } = useFieldArray({
    control: form.control,
    name: "learning_objectives",
  });

  const watchedGlobalCategoryFromForm = form.watch("global_category");

  return (
    <div className="space-y-6">
      <FormField
        control={form.control}
        name="title"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Course Title</FormLabel>
            <FormControl>
              <ShadcnInput
                placeholder="e.g., The Ultimate Next.js Bootcamp"
                {...field}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name="short_description"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Short Description (Max 200 chars)</FormLabel>
            <FormControl>
              <Textarea
                maxLength={200}
                placeholder="A brief, catchy summary..."
                {...field}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name="long_description"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Full Course Description</FormLabel>
            <FormControl>
              <Textarea
                rows={5}
                placeholder="Provide details about what students will learn..."
                {...field}
              />
            </FormControl>
            <FormDescription>Markdown is supported.</FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />
      <div>
        <FormLabel>Learning Objectives (Min 2)</FormLabel>
        <FormDescription className="mb-2">
          What will students be able to do after this course?
        </FormDescription>
        <div className="space-y-2">
          {objectives.map((objField, index) => (
            <FormField
              key={objField.id}
              control={form.control}
              name={`learning_objectives.${index}.value`}
              render={({ field }) => (
                <FormItem className="flex items-center gap-2">
                  <FormControl>
                    <ShadcnInput
                      placeholder={`Objective #${index + 1}`}
                      {...field}
                    />
                  </FormControl>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() =>
                      objectives.length > 2 && removeObjective(index)
                    }
                    disabled={objectives.length <= 2}
                    className="text-destructive/70 hover:text-destructive"
                  >
                    <Trash2 size={16} />
                  </Button>
                  <FormMessage />
                </FormItem>
              )}
            />
          ))}
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="mt-2 rounded-md"
          onClick={() => appendObjective({ value: "" })}
        >
          <Plus className="mr-2" size={16} /> Add Objective
        </Button>
        {form.formState.errors.learning_objectives?.message && (
          <FormMessage className="mt-1">
            {String(form.formState.errors.learning_objectives.message)}
          </FormMessage>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full pt-4 border-t border-border">
        {/* Global Category */}
        <FormField
          control={form.control}
          name="global_category"
          render={({ field }) => (
            <FormItem className="w-full">
              <FormLabel>Marketplace Category</FormLabel>
              <Select
                onValueChange={(value) => {
                  field.onChange(value);
                  form.setValue("global_subcategory", "", {
                    shouldValidate: false,
                  });
                }}
                value={field.value?.toString() || ""}
              >
                <FormControl>
                  <SelectTrigger className="rounded-md truncate">
                    <SelectValue placeholder="Select Category..." />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {formOptions.globalCategories
                    .filter((c) => c.id?.toString() !== "")
                    .map((cat) => (
                      <SelectItem key={cat.id} value={cat.id.toString()}>
                        {cat.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        {/* Global Subcategory */}
        <FormField
          control={form.control}
          name="global_subcategory"
          render={({ field }) => (
            <FormItem className="w-full">
              <FormLabel>Marketplace Subcategory</FormLabel>
              <Select
                onValueChange={field.onChange}
                value={field.value?.toString() || ""}
                disabled={
                  !watchedGlobalCategoryFromForm ||
                  filteredSubCategories.length === 0
                }
              >
                <FormControl>
                  <SelectTrigger className="rounded-md truncate">
                    <SelectValue placeholder="Select Subcategory..." />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {filteredSubCategories
                    .filter((s) => s.id?.toString() !== "")
                    .map((subCat) => (
                      <SelectItem key={subCat.id} value={subCat.id.toString()}>
                        {subCat.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        {/* Global Level */}
        <FormField
          control={form.control}
          name="global_level"
          render={({ field }) => (
            <FormItem className="w-full">
              <FormLabel>Difficulty Level</FormLabel>
              <Select
                onValueChange={field.onChange}
                value={field.value?.toString() || ""}
              >
                <FormControl>
                  <SelectTrigger className="rounded-md truncate">
                    <SelectValue placeholder="Select Level..." />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {formOptions.globalLevels
                    .filter((l) => l.id?.toString() !== "")
                    .map((lvl) => (
                      <SelectItem key={lvl.id} value={lvl.id.toString()}>
                        {lvl.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Organization Fields (Conditional) */}
        {activeSlug && (
          <>
            <FormField
              control={form.control}
              name="org_category"
              render={({ field }) => (
                <FormItem className="w-full">
                  <FormLabel>Organization Category</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value?.toString() || ""}
                  >
                    <FormControl>
                      <SelectTrigger className="rounded-md truncate">
                        <SelectValue placeholder="Select for organization..." />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {formOptions.orgCategories
                        .filter((c) => c.id?.toString() !== "")
                        .map((cat) => (
                          <SelectItem key={cat.id} value={cat.id.toString()}>
                            {cat.name}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="org_level"
              render={({ field }) => (
                <FormItem className="w-full">
                  <FormLabel>Organization Level</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value?.toString() || ""}
                  >
                    <FormControl>
                      <SelectTrigger className="rounded-md truncate">
                        <SelectValue placeholder="Select for organization..." />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {formOptions.orgLevels
                        .filter((l) => l.id?.toString() !== "")
                        .map((lvl) => (
                          <SelectItem key={lvl.id} value={lvl.id.toString()}>
                            {lvl.name}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </>
        )}
      </div>
    </div>
  );
}