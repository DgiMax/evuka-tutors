import React, { useEffect, useMemo, useState } from "react";
import { useForm, useFieldArray, SubmitHandler, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Save, Loader2, Trash2, Plus, Lock, AlertTriangle, Search, X, User as UserIcon } from "lucide-react";

import api from "@/lib/api/axios";
import {
  CourseManagementData,
  FormOptionsData,
  SettingsSchema,
  CourseStatus,
  statusOptions,
  SettingsFormInitialValues,
} from "./SharedTypes";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input as ShadcnInput } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface SettingsTabProps {
  courseSlug: string;
  initialData: CourseManagementData | undefined;
  formOptions: FormOptionsData | null;
}

interface InstructorResult {
  id: number;
  username: string;
  display_name: string;
  profile_image: string | null;
  headline: string;
}

const LoaderState: React.FC = () => (
  <div className="flex justify-center items-center h-[300px] bg-card rounded-lg border border-border">
    <Loader2 className="h-8 w-8 animate-spin text-primary" />
    <p className="ml-2 text-muted-foreground">Loading settings...</p>
  </div>
);

const getExistingFileUrl = (fieldValue: string | null): string | null => {
  if (
    typeof fieldValue === "string" &&
    (fieldValue.startsWith("http") || fieldValue.startsWith("/media"))
  ) {
    return fieldValue;
  }
  return null;
};

const SettingsTab: React.FC<SettingsTabProps> = ({
  courseSlug,
  initialData,
  formOptions,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const queryClient = useQueryClient();

  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<InstructorResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [openCombobox, setOpenCombobox] = useState(false);
  const [selectedInstructorsDisplay, setSelectedInstructorsDisplay] = useState<InstructorResult[]>([]);

  const toSelectValue = (id: number | string | null | undefined) => {
    if (id === null || id === undefined) return "";
    return id.toString();
  };

  const form = useForm<SettingsFormInitialValues>({
    resolver: zodResolver(SettingsSchema) as any,
    defaultValues: {
      title: "",
      short_description: "",
      long_description: "",
      learning_objectives: [{ value: "" }, { value: "" }],
      global_category: "",
      global_subcategory: "",
      global_level: "",
      org_category: "",
      org_level: "",
      price: undefined,
      status: "draft",
      is_public: false,
      thumbnail: null,
      promo_video: null,
      instructors: [],
    },
    mode: "onBlur",
  });

  const formInstructorIds = useWatch({
    control: form.control,
    name: "instructors",
  }) || [];

  const allValues = form.watch();
  
  const validationResult = useMemo(() => {
    return SettingsSchema.safeParse({ ...allValues, status: 'published' });
  }, [allValues]);

  const canPublish = validationResult.success;
  const missingFields = useMemo(() => {
    if (validationResult.success) return [];
    return [...new Set(validationResult.error.issues.map(i => String(i.path[0])))];
  }, [validationResult]);

  useEffect(() => {
    if (!initialData || !formOptions) return;

    const mapObjectives = (
      objectives: string[] | undefined
    ): { value: string }[] => {
      if (!objectives || objectives.length === 0) {
        return [{ value: "" }, { value: "" }];
      }
      return objectives.map((obj: string) => ({ value: obj }));
    };

    form.reset({
      title: initialData.title || "",
      short_description: initialData.short_description || "",
      long_description: initialData.long_description || "",
      learning_objectives: mapObjectives(initialData.learning_objectives),
      global_category: toSelectValue(initialData.global_category),
      global_subcategory: toSelectValue(initialData.global_subcategory),
      global_level: toSelectValue(initialData.global_level),
      org_category: toSelectValue(initialData.org_category),
      org_level: toSelectValue(initialData.org_level),
      price:
        initialData.price !== null && initialData.price !== undefined
          ? parseFloat(String(initialData.price))
          : undefined,
      status: initialData.status || "draft",
      is_public: initialData.is_public ?? false,
      thumbnail: getExistingFileUrl(initialData.thumbnail),
      promo_video: initialData.promo_video || null,
      instructors: initialData.instructors || [],
    });
  }, [initialData, formOptions, form.reset]);

  useEffect(() => {
    const shouldSearch = (formOptions?.context === 'organization') || searchQuery.length >= 3;

    if (!shouldSearch) {
        setSearchResults([]);
        return;
    }

    const delayDebounceFn = setTimeout(async () => {
      setIsSearching(true);
      try {
        let url = `/users/instructors/search/?q=${searchQuery}`;
        const { data } = await api.get(url);
        setSearchResults(data);
      } catch (error) {
        console.error("Search failed", error);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery, formOptions?.context]);

  const addInstructor = (instructor: InstructorResult) => {
    const currentIds = form.getValues("instructors") || [];
    if (!currentIds.includes(instructor.id)) {
      form.setValue("instructors", [...currentIds, instructor.id], { shouldDirty: true });
      setSelectedInstructorsDisplay((prev) => [...prev, instructor]);
    }
    setOpenCombobox(false);
    setSearchQuery("");
  };

  const removeInstructor = (idToRemove: number) => {
    const currentIds = form.getValues("instructors") || [];
    form.setValue("instructors", currentIds.filter((id) => id !== idToRemove), { shouldDirty: true });
    setSelectedInstructorsDisplay((prev) => prev.filter((i) => i.id !== idToRemove));
  };

  const {
    fields: objectives,
    append: appendObjective,
    remove: removeObjective,
  } = useFieldArray({
    control: form.control,
    name: "learning_objectives",
  });

  const watchedGlobalCategoryFromForm = form.watch("global_category");
  const isOrgCourse = formOptions?.context === "organization";

  const filteredSubCategories = useMemo(() => {
    if (!formOptions || !watchedGlobalCategoryFromForm) return [];
    return formOptions.globalSubCategories.filter(
      (sub) => sub.parent_id === watchedGlobalCategoryFromForm
    );
  }, [formOptions, watchedGlobalCategoryFromForm]);

  const handleUpdateSettings: SubmitHandler<SettingsFormInitialValues> = async (
    data
  ) => {
    setIsLoading(true);
    const formData = new FormData();

    Object.keys(data).forEach((key) => {
      const value = data[key as keyof typeof data];

      if (
        key !== "thumbnail" &&
        key !== "promo_video" &&
        key !== "learning_objectives" &&
        key !== "price" &&
        key !== "is_public" &&
        key !== "instructors"
      ) {
        if (value !== undefined && value !== null) {
          formData.append(key, value.toString());
        } else {
          formData.append(key, "");
        }
      }
    });

    if (data.price !== undefined && data.price !== null) {
      formData.append("price", data.price.toString());
    } else {
      formData.append("price", "");
    }

    formData.append("is_public", data.is_public ? "true" : "false");

    if (data.thumbnail instanceof File) {
      formData.append("thumbnail", data.thumbnail);
    }

    if (data.promo_video) {
      formData.append("promo_video", data.promo_video);
    } else {
      formData.append("promo_video", "");
    }

    const objectivesToSubmit = data.learning_objectives
      .filter((obj) => obj.value.trim() !== "")
      .map((obj) => ({ value: obj.value }));

    formData.append("learning_objectives", JSON.stringify(objectivesToSubmit));
    
    if (data.instructors && data.instructors.length > 0) {
        data.instructors.forEach(id => formData.append("instructors", id.toString()));
    }

    formData.delete("modules");

    try {
      const response = await api.put(
        `/tutor-courses/${courseSlug}/`,
        formData
      );
      toast.success(
        `Settings updated successfully! Status: ${
          statusOptions[response.data.status as CourseStatus]
        }`
      );
      queryClient.invalidateQueries({
        queryKey: ["courseManagement", courseSlug],
      });
    } catch (error: any) {
      console.error("Settings update failed:", error);

      let errorMsg = "Unknown error";
      if (error.response?.data) {
        if (typeof error.response.data === "object") {
          errorMsg = Object.entries(error.response.data)
            .map(([k, v]) => `${k}: ${Array.isArray(v) ? v[0] : v}`)
            .join(", ");
        } else {
          errorMsg = error.response.data.title || "Update failed";
        }
      }

      toast.error(`Failed to update settings: ${errorMsg}`);
    } finally {
      setIsLoading(false);
    }
  };

  if (!formOptions || !initialData) return <LoaderState />;

  const labelClasses = "uppercase text-xs font-bold text-muted-foreground tracking-wider";
  const inputClasses = "w-full text-zinc-600 font-medium";

  return (
    <Card className="border border-border shadow-none p-3 md:p-6 rounded-t-md rounded-b-lg">
      <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between px-0 gap-4">
        <div className="space-y-1">
          <CardTitle>Course Settings & General Info</CardTitle>
          <CardDescription>
            Update basic information, taxonomy, pricing, and status. Click &apos;Save&apos;
            to apply changes.
          </CardDescription>
        </div>
      </CardHeader>
      
      <CardContent className="px-0">
        
        {!canPublish && (
            <Alert variant="destructive" className="mb-6 bg-destructive/5 border-destructive/20 text-destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Required for Publishing</AlertTitle>
                <AlertDescription className="text-xs mt-1">
                    To publish this course, you must complete the following fields:
                    <div className="flex flex-wrap gap-1 mt-2">
                        {missingFields.map((field) => (
                            <span key={field} className="px-2 py-0.5 rounded-full bg-destructive/10 border border-destructive/20 text-[10px] font-medium capitalize">
                                {field.replace(/_/g, " ")}
                            </span>
                        ))}
                    </div>
                </AlertDescription>
            </Alert>
        )}

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleUpdateSettings)}
            className="space-y-6"
          >
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className={labelClasses}>COURSE TITLE</FormLabel>
                  <FormControl>
                    <ShadcnInput {...field} value={field.value ?? ""} className={inputClasses} />
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
                  <FormLabel className={labelClasses}>SHORT DESCRIPTION (MAX 200 CHARS)</FormLabel>
                  <FormControl>
                    <Textarea
                      maxLength={200}
                      {...field}
                      value={field.value ?? ""}
                      className={inputClasses}
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
                  <FormLabel className={labelClasses}>FULL COURSE DESCRIPTION</FormLabel>
                  <FormControl>
                    <Textarea rows={5} {...field} value={field.value ?? ""} className={inputClasses} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="space-y-3">
                <FormLabel className={labelClasses}>INSTRUCTORS</FormLabel>
                <div className="flex flex-wrap gap-2 mb-3">
                    {selectedInstructorsDisplay.map((instructor) => (
                        <div key={instructor.id} className="flex items-center gap-2 bg-muted border border-border rounded-full pl-1 pr-3 py-1">
                            <Avatar className="h-6 w-6">
                                <AvatarImage src={instructor.profile_image || ""} />
                                <AvatarFallback><UserIcon size={12} /></AvatarFallback>
                            </Avatar>
                            <span className="text-sm font-medium">{instructor.display_name || instructor.username}</span>
                            <button 
                                type="button" 
                                onClick={() => removeInstructor(instructor.id)}
                                className="text-muted-foreground hover:text-destructive ml-1"
                            >
                                <X size={14} />
                            </button>
                        </div>
                    ))}
                    {formInstructorIds.length > selectedInstructorsDisplay.length && (
                        <div className="flex items-center gap-2 bg-muted border border-border rounded-full px-3 py-1">
                            <span className="text-sm text-muted-foreground">
                                {formInstructorIds.length - selectedInstructorsDisplay.length} existing instructor(s) loaded
                            </span>
                        </div>
                    )}
                </div>

                <Popover open={openCombobox} onOpenChange={setOpenCombobox}>
                    <PopoverTrigger asChild>
                        <Button variant="outline" role="combobox" aria-expanded={openCombobox} className={`w-full justify-between text-muted-foreground ${inputClasses}`}>
                            <span className="flex items-center"><Search className="mr-2 h-4 w-4" /> 
                            {isOrgCourse ? "Search organization tutors..." : "Search by username or name..."}
                            </span>
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[400px] p-0" align="start">
                        <Command shouldFilter={false}> 
                            <div className="flex items-center border-b px-3" cmdk-input-wrapper="">
                                <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
                                <input 
                                    className="flex h-11 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
                                    placeholder={isOrgCourse ? "Type to filter..." : "Type at least 3 characters..."}
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>
                            <CommandList>
                                {isSearching && (
                                    <div className="py-6 text-center text-sm text-muted-foreground flex justify-center">
                                        <Loader2 className="h-4 w-4 animate-spin mr-2" /> Searching...
                                    </div>
                                )}
                                {!isSearching && searchResults.length === 0 && (searchQuery.length >= 3 || isOrgCourse) && (
                                    <div className="py-6 text-center text-sm text-muted-foreground">No instructors found.</div>
                                )}
                                {!isSearching && searchResults.length > 0 && (
                                    <CommandGroup heading="Results">
                                        {searchResults.map((instructor) => {
                                            const isSelected = formInstructorIds.includes(instructor.id);
                                            return (
                                                <CommandItem
                                                    key={instructor.id}
                                                    value={instructor.username}
                                                    onSelect={() => addInstructor(instructor)}
                                                    disabled={isSelected}
                                                    className="flex items-center gap-3 cursor-pointer p-2 hover:bg-accent"
                                                >
                                                    <Avatar className="h-8 w-8">
                                                        <AvatarImage src={instructor.profile_image || ""} />
                                                        <AvatarFallback><UserIcon size={14} /></AvatarFallback>
                                                    </Avatar>
                                                    <div className="flex flex-col">
                                                        <span className="font-medium">{instructor.display_name}</span>
                                                        <span className="text-xs text-muted-foreground">@{instructor.username}</span>
                                                    </div>
                                                    {isSelected && <span className="ml-auto text-xs text-primary">Added</span>}
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

            <div>
              <FormLabel className={labelClasses}>LEARNING OBJECTIVES</FormLabel>
              <div className="space-y-2 mt-2">
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
                            value={field.value ?? ""}
                            className={inputClasses}
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
                          className="text-destructive/70 hover:text-destructive shrink-0"
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
                className="mt-2"
                onClick={() => appendObjective({ value: "" })}
              >
                <Plus className="mr-2" size={16} /> Add Objective
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border border-border p-4 rounded-lg bg-muted/50">
              <FormField
                control={form.control}
                name="global_category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className={labelClasses}>CATEGORY</FormLabel>
                    <Select
                      onValueChange={(value) => {
                        field.onChange(value);
                        form.setValue("global_subcategory", "", {
                          shouldValidate: false,
                        });
                      }}
                      key={field.value || "initial-category"}
                      value={field.value || ""}
                    >
                      <FormControl>
                        <SelectTrigger className={inputClasses}>
                            <SelectValue placeholder="Select Category..." />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {formOptions.globalCategories.map((c) => (
                          <SelectItem key={c.id} value={c.id.toString()}>
                            {c.name}
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
                    <FormLabel className={labelClasses}>SUBCATEGORY</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      key={field.value || "initial-subcategory"}
                      value={field.value || ""}
                      disabled={
                        !watchedGlobalCategoryFromForm ||
                        filteredSubCategories.length === 0
                      }
                    >
                      <FormControl>
                        <SelectTrigger className={inputClasses}>
                            <SelectValue placeholder="Select Subcategory..." />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {filteredSubCategories.map((s) => (
                          <SelectItem key={s.id} value={s.id.toString()}>
                            {s.name}
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
                    <FormLabel className={labelClasses}>DIFFICULTY LEVEL</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      key={field.value || "initial-level"}
                      value={field.value || ""}
                    >
                      <FormControl>
                        <SelectTrigger className={inputClasses}>
                            <SelectValue placeholder="Select Difficulty..." />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {formOptions.globalLevels.map((l) => (
                          <SelectItem key={l.id} value={l.id.toString()}>
                            {l.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {isOrgCourse && (
              <div className="flex flex-col gap-4 border border-secondary/20 p-4 rounded-lg bg-secondary/10">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="org_category"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className={labelClasses}>ORGANIZATION CATEGORY</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          key={field.value || "initial-org-cat"}
                          value={field.value || ""}
                        >
                          <FormControl>
                            <SelectTrigger className={inputClasses}>
                                <SelectValue placeholder="Select Org Category..." />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {formOptions.orgCategories.map((c) => (
                              <SelectItem key={c.id} value={c.id.toString()}>
                                {c.name}
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
                        <FormLabel className={labelClasses}>ORGANIZATION LEVEL</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          key={field.value || "initial-org-level"}
                          value={field.value || ""}
                        >
                          <FormControl>
                            <SelectTrigger className={inputClasses}>
                                <SelectValue placeholder="Select Org Level..." />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {formOptions.orgLevels.map((l) => (
                              <SelectItem key={l.id} value={l.id.toString()}>
                                {l.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="border-t border-secondary/20 pt-4 mt-2">
                  <FormField
                    control={form.control}
                    name="is_public"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border bg-card p-4">
                        <div className="space-y-0.5">
                          <FormLabel className={labelClasses}>
                            MARKETPLACE VISIBILITY
                          </FormLabel>
                          <FormDescription>
                            Publish this course to the global marketplace? If
                            disabled, only organization members can see it.
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className={labelClasses}>PRICE (KES)</FormLabel>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                        KSh
                      </span>
                      <FormControl>
                        <ShadcnInput
                            type="number"
                            step="0.01"
                            min="0"
                            placeholder="0 (Free)"
                            className={`pl-12 ${inputClasses}`}
                            {...field}
                            value={field.value ?? ""}
                            onChange={(e) => {
                            const val = e.target.value;
                            field.onChange(val === "" ? undefined : parseFloat(val));
                            }}
                        />
                      </FormControl>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className={labelClasses}>COURSE STATUS</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      key={field.value || "initial-status"}
                      value={field.value || ""}
                    >
                      <FormControl>
                        <SelectTrigger className={inputClasses}>
                            <SelectValue placeholder="Select Status..." />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {Object.keys(statusOptions).map((k) => {
                          const isRestricted = (k === 'published' || k === 'pending_review') && !canPublish && field.value !== k;
                          return (
                            <SelectItem key={k} value={k} disabled={isRestricted}>
                                <div className="flex items-center gap-2">
                                    {statusOptions[k as CourseStatus]}
                                    {isRestricted && <Lock className="h-3 w-3 text-muted-foreground" />}
                                </div>
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
              <FormField
                control={form.control}
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
                    <FormItem className="flex flex-col h-full">
                      <FormLabel className={labelClasses}>COURSE THUMBNAIL (IMAGE)</FormLabel>
                      <FormControl className="flex-1">
                        <div className="space-y-2 h-full">
                            <ShadcnInput
                            type="file"
                            accept="image/*"
                            onChange={(e) =>
                                onChange(e.target.files?.[0] || null)
                            }
                            className={inputClasses}
                            {...restField}
                            />
                            {currentThumbnail && (
                                <div className="mt-auto pt-2">
                                    <img
                                    src={currentThumbnail}
                                    alt="Thumbnail Preview"
                                    className="h-32 w-auto rounded-md border border-border object-cover"
                                    />
                                </div>
                            )}
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  );
                }}
              />

              <FormField
                control={form.control}
                name="promo_video"
                render={({ field }) => (
                  <FormItem className="flex flex-col h-full">
                    <FormLabel className={labelClasses}>PROMO VIDEO LINK</FormLabel>
                    <FormControl>
                      <ShadcnInput
                        placeholder="e.g., https://vimeo.com/123456"
                        {...field}
                        value={field.value || ""}
                        className={inputClasses}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="flex justify-end sticky bottom-6">
              <Button type="submit" disabled={isLoading} size="lg" className="shadow-lg">
                {isLoading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Save className="mr-2 h-4 w-4" />
                )}{" "}
                Save Settings
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};

export default SettingsTab;