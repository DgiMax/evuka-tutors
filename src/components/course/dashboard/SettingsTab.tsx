import React, { useEffect, useMemo, useState } from "react";
import { useForm, useFieldArray, SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Save, Loader2, Trash2, Plus } from "lucide-react";

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

interface SettingsTabProps {
  courseSlug: string;
  initialData: CourseManagementData | undefined;
  formOptions: FormOptionsData | null;
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
    },
    mode: "onBlur",
  });

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
    });
  }, [initialData, formOptions, form.reset]);

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
        key !== "is_public"
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
    formData.delete("modules");

    try {
      const response = await api.put(
        `/tutor-courses/${courseSlug}/`,
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        }
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

  return (
    <Card className="p-0">
      <CardHeader className="p-6">
        <CardTitle>Course Settings & General Info</CardTitle>
        <CardDescription>
          Update basic information, taxonomy, pricing, and status. Click 'Save'
          to apply changes.
        </CardDescription>
      </CardHeader>
      <CardContent className="p-6 pt-0">
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
                  <FormLabel>Course Title</FormLabel>
                  <FormControl>
                    <ShadcnInput {...field} value={field.value ?? ""} />
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
                      {...field}
                      value={field.value ?? ""}
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
                    <Textarea rows={5} {...field} value={field.value ?? ""} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div>
              <FormLabel>Learning Objectives</FormLabel>
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
                    <FormLabel>Category</FormLabel>
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
                      <SelectTrigger className="truncate">
                        <SelectValue placeholder="Select Category..." />
                      </SelectTrigger>
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
                    <FormLabel>Subcategory</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      key={field.value || "initial-subcategory"}
                      value={field.value || ""}
                      disabled={
                        !watchedGlobalCategoryFromForm ||
                        filteredSubCategories.length === 0
                      }
                    >
                      <SelectTrigger className="truncate">
                        <SelectValue placeholder="Select Subcategory..." />
                      </SelectTrigger>
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
                    <FormLabel>Difficulty Level</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      key={field.value || "initial-level"}
                      value={field.value || ""}
                    >
                      <SelectTrigger className="truncate">
                        <SelectValue placeholder="Select Difficulty..." />
                      </SelectTrigger>
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
                        <FormLabel>Organization Category</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          key={field.value || "initial-org-cat"}
                          value={field.value || ""}
                        >
                          <SelectTrigger className="truncate">
                            <SelectValue placeholder="Select Org Category..." />
                          </SelectTrigger>
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
                        <FormLabel>Organization Level</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          key={field.value || "initial-org-level"}
                          value={field.value || ""}
                        >
                          <SelectTrigger className="truncate">
                            <SelectValue placeholder="Select Org Level..." />
                          </SelectTrigger>
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
                          <FormLabel className="text-base">
                            Marketplace Visibility
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
                    <FormLabel>Price (KES)</FormLabel>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                        KSh
                      </span>
                      <ShadcnInput
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="0 (Free)"
                        className="pl-12"
                        {...field}
                        value={field.value ?? ""}
                        onChange={(e) => {
                          const val = e.target.value;
                          field.onChange(val === "" ? undefined : parseFloat(val));
                        }}
                      />
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
                    <FormLabel>Course Status</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      key={field.value || "initial-status"}
                      value={field.value || ""}
                    >
                      <SelectTrigger className="truncate">
                        <SelectValue placeholder="Select Status..." />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.keys(statusOptions).map((k) => (
                          <SelectItem key={k} value={k}>
                            {statusOptions[k as CourseStatus]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                    <FormItem>
                      <FormLabel>Course Thumbnail (Image)</FormLabel>
                      <FormControl>
                        <ShadcnInput
                          type="file"
                          accept="image/*"
                          onChange={(e) =>
                            onChange(e.target.files?.[0] || null)
                          }
                          {...restField}
                        />
                      </FormControl>
                      {currentThumbnail && (
                        <img
                          src={currentThumbnail}
                          alt="Thumbnail Preview"
                          className="h-16 w-auto rounded-md border border-border object-cover mt-2"
                        />
                      )}
                      <FormMessage />
                    </FormItem>
                  );
                }}
              />

              <FormField
                control={form.control}
                name="promo_video"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Promo Video Link</FormLabel>
                    <FormControl>
                      <ShadcnInput
                        placeholder="e.g., https://vimeo.com/123456"
                        {...field}
                        value={field.value || ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="flex justify-end pt-6 border-t border-border">
              <Button
                type="submit"
                disabled={isLoading}
                className="w-full sm:w-[200px]"
              >
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