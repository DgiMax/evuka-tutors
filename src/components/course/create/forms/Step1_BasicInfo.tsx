"use client";

import React, { useState, useEffect } from "react";
import { useFieldArray, useWatch, type UseFormReturn } from "react-hook-form";
import { Plus, Trash2, Search, X, User as UserIcon, Loader2 } from "lucide-react";

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
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";
import {
  Command,
  CommandGroup,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

import {
  type CourseFormValues,
  type FormOptionsData,
} from "../CourseFormTypes";
import api from "@/lib/api/axios";

interface Step1Props {
  form: UseFormReturn<CourseFormValues>;
  formOptions: FormOptionsData;
  filteredSubCategories: { id: string; name: string }[];
  activeSlug: string | null;
}

interface InstructorResult {
  id: number;
  username: string;
  display_name: string;
  profile_image: string | null;
  headline: string;
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

  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<InstructorResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [openCombobox, setOpenCombobox] = useState(false);
  const [selectedInstructorsDisplay, setSelectedInstructorsDisplay] = useState<InstructorResult[]>([]);

  const formInstructorIds = useWatch({
    control: form.control,
    name: "instructors",
  }) || [];

  const watchedGlobalCategoryFromForm = useWatch({
    control: form.control,
    name: "global_category",
  });

  useEffect(() => {
    const shouldSearch = !!activeSlug || searchQuery.length >= 3;

    if (!shouldSearch) {
        setSearchResults([]);
        return;
    }

    const delayDebounceFn = setTimeout(async () => {
      setIsSearching(true);
      try {
        let url = `/users/instructors/search/?q=${searchQuery}`;
        if (activeSlug) {
            url += `&org_slug=${activeSlug}`;
        }

        const { data } = await api.get(url);
        setSearchResults(data);
      } catch (error) {
        console.error("Search failed", error);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery, activeSlug]);

  const addInstructor = (instructor: InstructorResult) => {
    const currentIds = form.getValues("instructors") || [];
    if (!currentIds.includes(instructor.id)) {
      form.setValue("instructors", [...currentIds, instructor.id]);
      setSelectedInstructorsDisplay((prev) => [...prev, instructor]);
    }
    setOpenCombobox(false);
    setSearchQuery("");
  };

  const removeInstructor = (idToRemove: number) => {
    const currentIds = form.getValues("instructors") || [];
    form.setValue("instructors", currentIds.filter((id) => id !== idToRemove));
    setSelectedInstructorsDisplay((prev) => prev.filter((i) => i.id !== idToRemove));
  };

  useEffect(() => {
    if (watchedGlobalCategoryFromForm) {
       const currentSub = form.getValues("global_subcategory");
       if (currentSub) {
          const isValid = filteredSubCategories.some(sub => sub.id === currentSub);
          if (!isValid) {
             form.setValue("global_subcategory", "");
          }
       }
    }
  }, [watchedGlobalCategoryFromForm, filteredSubCategories, form]);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
    <div className="rounded-md border p-4 md:p-6 ">
        <FormField
        control={form.control}
        name="title"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="text-base font-semibold">Course Title <span className="text-destructive">*</span></FormLabel>
            <FormControl>
              <ShadcnInput
                placeholder="e.g., The Ultimate Next.js Bootcamp"
                className="text-lg py-6"
                {...field}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
        <div className="grid gap-6 md:grid-cols-2 items-start">
            <FormField
                control={form.control}
                name="short_description"
                render={({ field }) => (
                <FormItem>
                    <div className="flex h-8 items-center">
                    <FormLabel>Short Description</FormLabel>
                    </div>
                    <FormControl>
                    <Textarea
                        maxLength={200}
                        placeholder="A brief, catchy summary..."
                        className="resize-none h-32"
                        {...field}
                        value={field.value || ""}
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
                    <div className="flex h-8 items-center gap-2">
                    <FormLabel>Full Description</FormLabel>
                    <span className="rounded-md bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700 dark:bg-green-900/30 dark:text-green-400">
                        Markdown supported
                    </span>
                    </div>
                    <FormControl>
                    <Textarea
                        placeholder="Detailed overview..."
                        className="resize-none h-32 font-mono text-sm"
                        {...field}
                        value={field.value || ""}
                    />
                    </FormControl>
                    <FormMessage />
                </FormItem>
                )}
            />
        </div>
    </div>
      

    <div className="rounded-md border p-4 md:p-6 ">
        <div className="space-y-4">
            <div className="space-y-1">
                <FormLabel className="text-base font-semibold">Instructors</FormLabel>
                <FormDescription>
                {activeSlug 
                    ? "Select tutors from your organization." 
                    : "Search and invite other creators to co-teach this course."}
                </FormDescription>
            </div>

            {(selectedInstructorsDisplay.length > 0 || formInstructorIds.length > selectedInstructorsDisplay.length) && (
                <div className="flex flex-wrap gap-2 mb-2">
                {selectedInstructorsDisplay.map((instructor) => (
                    <div 
                    key={instructor.id} 
                    className="group flex items-center gap-2 rounded-full border border-border bg-secondary/40 pl-1 pr-2 py-1 transition-colors hover:bg-secondary/60"
                    >
                    <Avatar className="h-6 w-6 border border-background">
                        <AvatarImage src={instructor.profile_image || ""} />
                        <AvatarFallback className="bg-primary/10 text-[10px] text-primary">
                        <UserIcon size={12} />
                        </AvatarFallback>
                    </Avatar>
                    <span className="text-sm font-medium text-foreground">
                        {instructor.display_name || instructor.username}
                    </span>
                    <button 
                        type="button" 
                        onClick={() => removeInstructor(instructor.id)}
                        className="ml-1 flex h-4 w-4 items-center justify-center rounded-full text-muted-foreground opacity-60 transition-all hover:bg-destructive hover:text-destructive-foreground hover:opacity-100"
                        aria-label="Remove instructor"
                    >
                        <X size={10} />
                    </button>
                    </div>
                ))}
                
                {formInstructorIds.length > selectedInstructorsDisplay.length && (
                    <div className="flex items-center rounded-full border border-dashed border-border bg-muted/50 px-3 py-1 text-xs font-medium text-muted-foreground">
                        +{formInstructorIds.length - selectedInstructorsDisplay.length} others
                    </div>
                )}
                </div>
            )}

            <Popover open={openCombobox} onOpenChange={setOpenCombobox}>
                <PopoverTrigger asChild>
                <Button 
                    variant="outline" 
                    role="combobox" 
                    aria-expanded={openCombobox} 
                    className="w-full justify-start text-left font-normal px-3 text-muted-foreground hover:text-foreground rounded-md"
                >
                    <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
                    <span className={activeSlug ? "text-foreground" : ""}>
                        {activeSlug ? "Search organization tutors..." : "Search by username or name..."}
                    </span>
                </Button>
                </PopoverTrigger>
                
                <PopoverContent className="w-[400px] md:w-[600px] p-0 shadow-md rounded-md bg-background" align="start">
                <Command shouldFilter={false} className="border-none"> 
                    <div className="flex items-center border-b px-3" cmdk-input-wrapper="">
                    <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
                    <input 
                        className="flex h-11 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
                        placeholder={activeSlug ? "Type to filter..." : "Type at least 3 characters..."}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        autoFocus
                    />
                    </div>
                    <CommandList>
                    {isSearching && (
                        <div className="py-6 text-center text-sm text-muted-foreground flex items-center justify-center">
                        <Loader2 className="h-4 w-4 animate-spin mr-2" /> Searching...
                        </div>
                    )}
                    
                    {!isSearching && searchResults.length === 0 && (searchQuery.length >= 3 || activeSlug) && (
                        <div className="py-6 text-center text-sm text-muted-foreground">
                            No instructors found.
                        </div>
                    )}
                    
                    {!isSearching && searchResults.length > 0 && (
                        <CommandGroup heading="Suggestions" className="p-1.5">
                        {searchResults.map((instructor) => {
                            const isSelected = formInstructorIds.includes(instructor.id);
                            return (
                            <CommandItem
                                key={instructor.id}
                                value={instructor.username}
                                onSelect={() => addInstructor(instructor)}
                                disabled={isSelected}
                                className={`flex items-center gap-3 rounded-sm px-2 py-2 cursor-pointer transition-colors ${isSelected ? 'opacity-50' : 'hover:bg-accent hover:text-accent-foreground'}`}
                            >
                                <Avatar className="h-8 w-8 border border-border">
                                <AvatarImage src={instructor.profile_image || ""} />
                                <AvatarFallback className="bg-muted"><UserIcon size={14} /></AvatarFallback>
                                </Avatar>
                                <div className="flex flex-col">
                                <span className="font-medium text-sm">{instructor.display_name}</span>
                                <span className="text-xs text-muted-foreground">@{instructor.username}</span>
                                </div>
                                {isSelected && (
                                    <span className="ml-auto flex items-center gap-1 text-xs font-medium text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                                        Added
                                    </span>
                                )}
                            </CommandItem>
                            );
                        })}
                        </CommandGroup>
                    )}
                    </CommandList>
                </Command>
                </PopoverContent>
            </Popover>
        </div>
    </div>
      

    <div className="rounded-md border p-4 md:p-6 ">
        <div className="space-y-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="space-y-1">
                    <FormLabel className="text-base font-semibold">Learning Objectives</FormLabel>
                    <FormDescription>
                        What will students be able to do after this course?
                    </FormDescription>
                </div>
                <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => appendObjective({ value: "" })}
                    className="w-full sm:w-auto" 
                >
                    <Plus className="mr-2 h-4 w-4" /> Add Objective
                </Button>
            </div>
            
            <div className="grid gap-3">
                {objectives.map((objField, index) => (
                <FormField
                    key={objField.id}
                    control={form.control}
                    name={`learning_objectives.${index}.value`}
                    render={({ field }) => (
                    <FormItem>
                        <FormControl>
                        <div className="flex items-center gap-2">
                            <ShadcnInput
                                placeholder={`Objective #${index + 1}`}
                                className="flex-1" 
                                {...field}
                            />
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                disabled={objectives.length <= 2}
                                onClick={() => removeObjective(index)}
                                className="shrink-0 text-muted-foreground hover:text-destructive"
                            >
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        </div>
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                    )}
                />
                ))}
            </div>

            {form.formState.errors.learning_objectives?.message && (
                <p className="text-sm font-medium text-destructive mt-1">
                {String(form.formState.errors.learning_objectives.message)}
                </p>
            )}
        </div>
    </div>
      

      <div className="my-6"></div>
    
    <div className="rounded-md border p-4 md:p-6 ">
        <div className="space-y-3">
            <h3 className="text-lg font-semibold">Categorization</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <FormField
                    control={form.control}
                    name="global_category"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Category</FormLabel>
                            <Select
                                onValueChange={field.onChange}
                                value={field.value?.toString() || ""}
                            >
                                <FormControl>
                                    <SelectTrigger className="w-full">
                                        <div className="truncate text-left">
                                            <SelectValue placeholder="Select..." />
                                        </div>
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    {formOptions.globalCategories.map((cat) => (
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
                    name="global_subcategory"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Subcategory</FormLabel>
                            <Select
                                onValueChange={field.onChange}
                                value={field.value?.toString() || ""}
                                disabled={!watchedGlobalCategoryFromForm}
                            >
                                <FormControl>
                                    <SelectTrigger className="w-full">
                                        <div className="truncate text-left">
                                            <SelectValue placeholder="Select..." />
                                        </div>
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    {filteredSubCategories.map((subCat) => (
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

                <FormField
                    control={form.control}
                    name="global_level"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Level</FormLabel>
                            <Select
                                onValueChange={field.onChange}
                                value={field.value?.toString() || ""}
                            >
                                <FormControl>
                                    <SelectTrigger className="w-full">
                                        <div className="truncate text-left">
                                            <SelectValue placeholder="Select..." />
                                        </div>
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    {formOptions.globalLevels.map((lvl) => (
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
            </div>

            {activeSlug && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 bg-muted/30 rounded-lg border border-border/50 mt-3">
                    <FormField
                        control={form.control}
                        name="org_category"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Organization Category</FormLabel>
                                <Select
                                    onValueChange={field.onChange}
                                    value={field.value?.toString() || ""}
                                >
                                    <FormControl>
                                        <SelectTrigger className="w-full">
                                            <div className="truncate text-left">
                                                <SelectValue placeholder="Select for organization..." />
                                            </div>
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        {formOptions.orgCategories.map((cat) => (
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
                            <FormItem>
                                <FormLabel>Organization Level</FormLabel>
                                <Select
                                    onValueChange={field.onChange}
                                    value={field.value?.toString() || ""}
                                >
                                    <FormControl>
                                        <SelectTrigger className="w-full">
                                            <div className="truncate text-left">
                                                <SelectValue placeholder="Select for organization..." />
                                            </div>
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        {formOptions.orgLevels.map((lvl) => (
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
                </div>
            )}
        </div>
    </div>
      
    </div>
  );
}