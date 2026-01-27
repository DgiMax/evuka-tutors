"use client";

import React, { useState, useEffect, useRef } from "react";
import api from "@/lib/api/axios";
import {
  useFieldArray,
  Control,
  UseFormWatch,
  UseFormSetValue,
  UseFormReturn,
} from "react-hook-form";
import {
  Plus,
  Trash2,
  GripVertical,
  FileText,
  Video,
  Book,
  Link as LinkIcon,
  Send,
  File as FileIcon,
  X,
  BookOpen,
  Info,
  Check,
  CheckCheck,
  Search,
  Loader2
} from "lucide-react";
import {
  Card,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
} from "@/components/ui/form";
import { CourseFormValues } from "../CourseFormTypes";

interface Step2Props {
  form: UseFormReturn<CourseFormValues>;
  control: Control<CourseFormValues>;
  watch: UseFormWatch<CourseFormValues>;
  setValue: UseFormSetValue<CourseFormValues>;
}

export default function Step2Curriculum({
  form,
  control,
  watch,
  setValue,
}: Step2Props) {
  const {
    fields: moduleFields,
    append: appendModule,
    remove: removeModule,
  } = useFieldArray({
    control,
    name: "modules",
  });

  return (
    <div className="rounded-md border p-3 sm:p-4 md:p-6">
      <div className="space-y-6 sm:space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="space-y-2">
          <h3 className="text-base sm:text-lg font-semibold">Curriculum Builder</h3>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Structure your course into modules and lessons. Add video content, 
            reading materials, and text content.
          </p>
        </div>

        <div className="space-y-4">
          <Accordion type="single" collapsible className="space-y-4 border-none shadow-none">
            {moduleFields.map((module, moduleIndex) => (
              <ModuleItem
                key={module.id}
                moduleIndex={moduleIndex}
                control={control}
                register={form.register}
                removeModule={removeModule}
                watch={watch}
                setValue={setValue}
              />
            ))}
          </Accordion>
        </div>

        <Button
          type="button"
          variant="outline"
          onClick={() =>
            appendModule({
              title: `Module ${moduleFields.length + 1}`,
              description: "",
              lessons: [{ title: "New Lesson", content: "", video_file: null, resources: [], quizzes: [] }],
              assignments: [],
            })
          }
          className="w-full border-dashed border-2 py-4 sm:py-6 hover:border-primary/50 hover:bg-accent/50 text-sm"
        >
          <Plus className="mr-2 h-4 w-4" /> Add Module
        </Button>
      </div>
    </div>
  );
}

const ModuleItem = ({
  moduleIndex,
  control,
  register,
  removeModule,
  watch,
  setValue,
}: any) => {
  const {
    fields: lessonFields,
    append: appendLesson,
    remove: removeLesson,
  } = useFieldArray({
    control,
    name: `modules.${moduleIndex}.lessons`,
  });

  const moduleTitle = watch(`modules.${moduleIndex}.title`);

  return (
    <AccordionItem 
      value={`module-${moduleIndex}`} 
      className="border rounded-md bg-card shadow-none mb-4 last:mb-0 overflow-hidden"
    >
      <div className="flex items-stretch w-full bg-muted/20 group [&[data-state=open]]:bg-muted/50 transition-colors border-b border-border">
        <div className="flex items-center justify-center w-10 sm:w-12 border-r border-border/50 cursor-grab active:cursor-grabbing shrink-0">
          <GripVertical className="h-4 w-4 text-muted-foreground/40 group-hover:text-muted-foreground" />
        </div>
        
        <div className="flex-1 flex items-center min-w-0">
          <AccordionTrigger className="flex-1 py-3 sm:py-4 px-3 sm:px-6 hover:no-underline [&>svg]:hidden overflow-hidden">
            <div className="flex flex-col items-start text-left gap-1 w-full overflow-hidden">
              <span className="font-semibold text-sm sm:text-base text-primary tracking-tight sm:tracking-widest leading-none truncate w-full">
                {moduleTitle || `Untitled Module ${moduleIndex + 1}`}
              </span>
            </div>
          </AccordionTrigger>
        </div>

        <div className="flex items-center px-2 sm:px-4 border-l border-border/50 bg-background/30 shrink-0">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
            onClick={(e) => {
              e.stopPropagation();
              removeModule(moduleIndex);
            }}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <AccordionContent className="p-0 border-t-0">
        <div className="p-4 sm:p-6 space-y-4 bg-background">
          <div className="space-y-2">
            <Label className="text-[10px] sm:text-xs font-bold uppercase text-muted-foreground">Module Title</Label>
            <Input
              {...register(`modules.${moduleIndex}.title`)}
              placeholder="e.g., Introduction to UI Design"
              className="font-medium shadow-none focus-visible:ring-1 text-sm"
            />
          </div>
          
          <div className="space-y-2">
            <Label className="text-[10px] sm:text-xs font-bold uppercase text-muted-foreground">Description</Label>
            <Textarea
              {...register(`modules.${moduleIndex}.description`)}
              placeholder="What will students cover in this module?"
              className="resize-none min-h-[80px] shadow-none focus-visible:ring-1 text-sm"
            />
          </div>
        </div>

        <div className="border-t border-border">
          <div className="bg-muted/5 px-4 sm:px-6 py-3 border-b border-border">
             <h4 className="text-xs sm:text-sm font-semibold flex items-center gap-2">
               <BookOpen className="h-4 w-4 text-primary" /> Lessons
             </h4>
          </div>
          
          <Accordion type="single" collapsible className="w-full">
            {lessonFields.map((lesson, lessonIndex) => (
              <LessonItem
                key={lesson.id}
                moduleIndex={moduleIndex}
                lessonIndex={lessonIndex}
                control={control}
                register={register}
                removeLesson={removeLesson}
                watch={watch}
                setValue={setValue}
              />
            ))}
          </Accordion>

          <div className="p-3 sm:p-4 bg-muted/10 border-t border-border">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() =>
                appendLesson({
                  title: "",
                  content: "",
                  video_file: null,
                  resources: [],
                  quizzes: [],
                })
              }
              className="text-primary hover:text-primary/80 hover:bg-primary/5 w-full justify-start text-xs sm:text-sm"
            >
              <Plus className="mr-2 h-4 w-4" /> Add Lesson
            </Button>
          </div>
        </div>
        
        <AssignmentBuilder moduleIndex={moduleIndex} control={control} />
      </AccordionContent>
    </AccordionItem>
  );
};

const LessonItem = ({
  moduleIndex,
  lessonIndex,
  control,
  register,
  removeLesson,
  watch,
  setValue,
}: any) => {
  const lessonTitle = watch(`modules.${moduleIndex}.lessons.${lessonIndex}.title`);
  const videoFileValue = watch(`modules.${moduleIndex}.lessons.${lessonIndex}.video_file`);
  
  const previewUrl = videoFileValue instanceof File
    ? URL.createObjectURL(videoFileValue)
    : typeof videoFileValue === "string" ? videoFileValue : null;

  const handleFileChange = (
    event: React.ChangeEvent<HTMLInputElement>,
    fieldPath: any
  ) => {
    const file = event.target.files?.[0] || null;
    setValue(fieldPath, file, { shouldValidate: true });
  };

  return (
    <AccordionItem
      value={`item-${lessonIndex}`}
      className="border-b border-border/60 last:border-0 overflow-hidden"
    >
      <div className="flex items-stretch w-full bg-muted/30 group [&[data-state=open]]:bg-muted/50 transition-colors">
        <div className="flex items-center justify-center w-8 sm:w-10 border-r border-border/50 cursor-grab active:cursor-grabbing shrink-0">
          <GripVertical className="h-3.5 w-3.5 text-muted-foreground/40 group-hover:text-muted-foreground" />
        </div>

        <div className="flex-1 flex items-center min-w-0">
          <AccordionTrigger className="flex-1 py-2.5 sm:py-3 px-3 sm:px-4 hover:no-underline [&>svg]:hidden overflow-hidden">
            <div className="flex items-center gap-2 sm:gap-3 w-full overflow-hidden">
              <div className="flex items-center justify-center w-5 h-5 shrink-0 rounded bg-primary/10 text-primary text-[10px] font-bold">
                {lessonIndex + 1}
              </div>
              <span className="font-medium text-xs sm:text-sm text-foreground truncate text-left">
                {lessonTitle || "Untitled Lesson"}
              </span>
            </div>
          </AccordionTrigger>
        </div>

        <div className="flex items-center px-2 sm:px-3 shrink-0">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
            onClick={(e) => {
              e.stopPropagation();
              removeLesson(lessonIndex);
            }}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      <AccordionContent className="px-4 sm:px-6 pb-4 sm:pb-6 pt-4 sm:pt-6 space-y-6 bg-background border-t border-border/40">
        <div className="grid gap-5">
          <div className="space-y-2">
            <Label className="text-[10px] sm:text-[11px] font-bold uppercase text-muted-foreground tracking-wider">Lesson Title</Label>
            <Input
              {...register(`modules.${moduleIndex}.lessons.${lessonIndex}.title`)}
              placeholder="e.g., Understanding Color Theory"
              className="shadow-none focus-visible:ring-1 text-sm"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-[10px] sm:text-[11px] font-bold uppercase text-muted-foreground tracking-wider">Video Content</Label>
            <div className="border-2 border-dashed border-border rounded-lg p-4 sm:p-6 flex flex-col items-center justify-center text-center bg-muted/5 hover:bg-muted/10 transition-colors">
              <Video className="h-5 w-5 sm:h-6 sm:w-6 text-muted-foreground mb-2" />
              <Input
                type="file"
                accept="video/mp4,video/webm"
                className="cursor-pointer w-full max-w-[240px] h-8 sm:h-9 bg-background text-xs"
                onChange={(e) => handleFileChange(e, `modules.${moduleIndex}.lessons.${lessonIndex}.video_file`)}
              />
              <p className="text-[9px] sm:text-[10px] text-muted-foreground mt-2 break-all px-2">
                {previewUrl ? (videoFileValue instanceof File ? videoFileValue.name : "Video Loaded") : "MP4, WebM (Max 500MB)"}
              </p>
            </div>
            {previewUrl && (
              <div className="mt-2 rounded-md overflow-hidden bg-black aspect-video ring-1 ring-border">
                <video controls src={previewUrl} className="w-full h-full" />
              </div>
            )}
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <Label className="text-[10px] sm:text-[11px] font-bold uppercase text-muted-foreground tracking-wider">Lesson Content</Label>
              <span className="text-[9px] sm:text-[10px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded font-medium">Markdown</span>
            </div>
            <Textarea
              {...register(`modules.${moduleIndex}.lessons.${lessonIndex}.content`)}
              placeholder="# Introduction..."
              rows={6}
              className="font-mono text-xs sm:text-sm leading-relaxed shadow-none resize-none"
            />
          </div>
        </div>

        <ResourceBuilder 
          moduleIndex={moduleIndex}
          lessonIndex={lessonIndex}
          control={control}
          watch={watch}
          setValue={setValue}
          register={register}
        />

        <QuizBuilder
          moduleIndex={moduleIndex}
          lessonIndex={lessonIndex}
          control={control}
          watch={watch}
          setValue={setValue}
        />
      </AccordionContent>
    </AccordionItem>
  );
};

const ResourceBuilder = ({
  moduleIndex,
  lessonIndex,
  control,
  register,
  watch,
  setValue
}: any) => {
  const {
    fields: resources,
    append: appendResource,
    remove: removeResource
  } = useFieldArray({
    control,
    name: `modules.${moduleIndex}.lessons.${lessonIndex}.resources`
  });

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [resourceType, setResourceType] = useState<'file' | 'link' | 'book_ref'>('file');

  const handleAddResource = () => {
    appendResource({
      title: "",
      resource_type: resourceType,
      description: "",
      file: null,
      external_url: "",
      reading_instructions: "",
      book_id: "", 
      course_book: "" 
    });
    setIsDialogOpen(false);
  };

  const handleFileChange = (
    event: React.ChangeEvent<HTMLInputElement>,
    index: number
  ) => {
    const file = event.target.files?.[0] || null;
    setValue(`modules.${moduleIndex}.lessons.${lessonIndex}.resources.${index}.file`, file);
  };

  return (
    <div className="pt-6 border-t border-border space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <Label className="text-sm font-semibold flex items-center gap-2">
          <FileText className="h-4 w-4 text-primary" /> Lesson Resources
        </Label>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm" className="h-8 sm:h-7 text-xs border-dashed hover:border-primary hover:text-primary transition-all w-full sm:w-auto">
              <Plus className="mr-1 h-3 w-3" /> Add Resource
            </Button>
          </DialogTrigger>
          <DialogContent 
            className="w-[95%] sm:max-w-[480px] p-0 gap-0 max-h-[85vh] h-auto min-h-[300px] flex flex-col border-border/80 shadow-2xl rounded-md bg-background overflow-hidden [&>button]:hidden transition-all duration-300 top-[10%] translate-y-0"
          >
            <DialogHeader className="px-4 py-2 border-b bg-muted/50 flex flex-row items-center justify-between shrink-0 backdrop-blur-sm z-10">
              <DialogTitle className="text-lg font-semibold tracking-tight text-foreground">
                Add Resource Type
              </DialogTitle>
              <DialogClose className="rounded-md p-2 hover:bg-muted transition">
                <X className="h-6 w-6 text-muted-foreground hover:text-foreground" />
              </DialogClose>
            </DialogHeader>

            <div className="flex-1 overflow-y-auto px-6 py-8 [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-thumb]:bg-muted-foreground/20 hover:[&::-webkit-scrollbar-thumb]:bg-muted-foreground/40 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-none">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-xs uppercase font-bold text-muted-foreground tracking-wider ml-1">Select Resource Type</Label>
                  <Select value={resourceType} onValueChange={(val: any) => setResourceType(val)}>
                    <SelectTrigger className="w-full h-12 px-4 text-base shadow-none border border-border focus-visible:ring-0">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="file">
                        <div className="flex items-center gap-2 font-medium">
                          <FileIcon className="h-4 w-4 text-orange-500"/> File Download
                        </div>
                      </SelectItem>
                      <SelectItem value="link">
                        <div className="flex items-center gap-2 font-medium">
                          <LinkIcon className="h-4 w-4 text-blue-500"/> External Link
                        </div>
                      </SelectItem>
                      <SelectItem value="book_ref">
                        <div className="flex items-center gap-2 font-medium">
                          <Book className="h-4 w-4 text-purple-500"/> Book Reference
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <p className="text-xs text-muted-foreground px-1 leading-relaxed">
                  Choose the type of material you want to provide for this lesson. You can add specific details like instructions or files after selecting the type.
                </p>
              </div>
            </div>

            <div className="px-4 py-3 border-t bg-background shrink-0 mt-auto">
              <Button 
                onClick={handleAddResource} 
                className="w-full h-12 text-base font-medium shadow-sm transition-all active:scale-[0.98]"
              >
                Add Resource
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-3">
        {resources.map((resource, index) => {
          const type = watch(`modules.${moduleIndex}.lessons.${lessonIndex}.resources.${index}.resource_type`);
          
          return (
            <div key={resource.id} className="p-3 sm:p-4 border border-border bg-muted/5 rounded-md flex flex-col sm:flex-row gap-3 sm:gap-4 items-start relative group hover:bg-muted/10 transition-colors">
              <div className="shrink-0">
                {type === 'book_ref' ? <div className="p-2 bg-purple-100 text-purple-600 rounded-md"><Book className="h-4 w-4"/></div> : 
                 type === 'link' ? <div className="p-2 bg-blue-100 text-blue-600 rounded-md"><LinkIcon className="h-4 w-4"/></div> : 
                 <div className="p-2 bg-orange-100 text-orange-600 rounded-md"><FileIcon className="h-4 w-4"/></div>}
              </div>
              
              <div className="flex-1 w-full space-y-3">
                <div className="grid grid-cols-1 gap-2 sm:gap-3">
                  <Input 
                    placeholder="Resource Title" 
                    className="h-9 sm:h-8 text-sm font-medium bg-background shadow-none border border-border focus-visible:ring-0 hover:border-secondary focus-visible:border-secondary transition-colors"
                    {...register(`modules.${moduleIndex}.lessons.${lessonIndex}.resources.${index}.title`)}
                  />
                  
                  {type === 'link' && (
                    <Input 
                      placeholder="https://example.com/resource" 
                      className="h-9 sm:h-8 text-sm bg-background font-mono text-muted-foreground shadow-none border border-border focus-visible:ring-0 hover:border-secondary focus-visible:border-secondary transition-colors"
                      {...register(`modules.${moduleIndex}.lessons.${lessonIndex}.resources.${index}.external_url`)}
                    />
                  )}
                  
                  {type === 'file' && (
                    <Input 
                      type="file" 
                      className="h-9 sm:h-8 text-xs sm:text-sm pt-1.5 sm:pt-1 file:text-[10px] sm:file:text-xs bg-background shadow-none border border-border focus-visible:ring-0 hover:border-secondary focus-visible:border-secondary transition-colors"
                      onChange={(e) => handleFileChange(e, index)}
                    />
                  )}

                  {type === 'book_ref' && (
                    <BookSearchInput 
                      moduleIndex={moduleIndex}
                      lessonIndex={lessonIndex}
                      resIndex={index}
                      setValue={setValue}
                      watch={watch}
                    />
                  )}
                </div>

                <Textarea
                  placeholder={type === 'book_ref' ? "Instructions: Read Chapter 1-3..." : "Description of the resource..."}
                  className="min-h-[60px] text-xs resize-none bg-background shadow-none border border-border focus-visible:ring-0 hover:border-secondary focus-visible:border-secondary transition-colors"
                  {...register(type === 'book_ref' 
                    ? `modules.${moduleIndex}.lessons.${lessonIndex}.resources.${index}.reading_instructions` 
                    : `modules.${moduleIndex}.lessons.${lessonIndex}.resources.${index}.description`)}
                />
              </div>

              <div className="absolute top-2 right-2 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 sm:h-6 sm:w-6 text-muted-foreground hover:text-destructive bg-background/80 sm:bg-background/50 backdrop-blur-sm rounded-full shadow-sm border border-border sm:border-transparent hover:border-border"
                  onClick={() => removeResource(index)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          );
        })}
        {resources.length === 0 && (
          <div className="text-center py-6 border border-dashed rounded-md bg-muted/5">
            <span className="text-xs text-muted-foreground">No resources added yet.</span>
          </div>
        )}
      </div>
    </div>
  );
};

const BookSearchInput = ({ moduleIndex, lessonIndex, resIndex, setValue, watch }: any) => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const selectedBookId = watch(`modules.${moduleIndex}.lessons.${lessonIndex}.resources.${resIndex}.book_id`);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (query.length >= 2) {
        fetchBooks(query);
      } else {
        setResults([]);
        setIsLoading(false);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    function handleClickOutside(event: any) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [wrapperRef]);

  const fetchBooks = async (searchTerm: string) => {
    setIsLoading(true);
    setIsOpen(true);
    try {
      const url = `/books/lookup/?search=${encodeURIComponent(searchTerm)}`;
      const { data } = await api.get(url);
      setResults(Array.isArray(data) ? data : data.results || []);
    } catch (error) {
      console.error("Failed to fetch books", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelect = (book: any) => {
    setValue(`modules.${moduleIndex}.lessons.${lessonIndex}.resources.${resIndex}.book_id`, book.id);
    setValue(`modules.${moduleIndex}.lessons.${lessonIndex}.resources.${resIndex}.course_book`, book.id);
    setQuery(book.title);
    setIsOpen(false);
  };

  return (
    <div className="space-y-2 bg-background p-2 sm:p-3 rounded-md border border-border/60" ref={wrapperRef}>
      <Label className="text-[10px] font-bold uppercase text-muted-foreground">Library Search</Label>
      
      <div className="relative">
        <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
        
        <Input 
          placeholder={selectedBookId ? "Change selection..." : "Search book title..."}
          className="pl-8 h-9 text-sm bg-background shadow-none border border-border focus-visible:ring-0 hover:border-secondary focus-visible:border-secondary transition-colors"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            if (selectedBookId) {
              setValue(`modules.${moduleIndex}.lessons.${lessonIndex}.resources.${resIndex}.book_id`, "");
            }
          }}
          onFocus={() => {
            if (query.length >= 2) setIsOpen(true);
          }}
        />
        
        {isLoading && (
          <div className="absolute right-3 top-2.5">
            <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
          </div>
        )}

        {isOpen && results.length > 0 && (
          <div className="absolute z-50 w-full mt-1 bg-popover text-popover-foreground rounded-md border shadow-md max-h-[180px] overflow-y-auto">
            <div className="p-1">
              {results.map((book: any) => (
                <div
                  key={book.id}
                  className="relative flex cursor-default select-none items-center rounded-sm px-2 py-2 text-sm outline-none hover:bg-accent hover:text-accent-foreground"
                  onClick={() => handleSelect(book)}
                >
                  <div className="flex flex-col items-start gap-0.5 min-w-0 pr-4">
                    <span className="font-medium truncate w-full">{book.title}</span>
                    <span className="text-[10px] text-muted-foreground truncate w-full">{book.authors || "Unknown Author"}</span>
                  </div>
                  {selectedBookId === book.id && (
                    <Check className="ml-auto h-3.5 w-3.5 text-primary shrink-0" />
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
        
        {isOpen && !isLoading && results.length === 0 && query.length >= 2 && (
          <div className="absolute z-50 w-full mt-1 bg-popover p-3 text-xs text-muted-foreground text-center border rounded-md shadow-md">
            No books found.
          </div>
        )}
      </div>
      
      <div className="flex flex-col xs:flex-row gap-2 items-start xs:items-center mt-1">
        <span className="px-1.5 py-0.5 rounded bg-blue-50 text-blue-600 text-[9px] font-bold uppercase border border-blue-100 shrink-0">
          Student Pays Separately
        </span>
        <span className="text-[9px] text-muted-foreground leading-tight">
          Access requires students to own this book.
        </span>
      </div>
    </div>
  );
};

const AssignmentBuilder = ({
  moduleIndex,
  control,
}: any) => {
  const {
    fields: assignments,
    append: appendAssignment,
    remove: removeAssignment,
  } = useFieldArray({
    control,
    name: `modules.${moduleIndex}.assignments`,
  });

  return (
    <div className="p-4 sm:p-6 border-t border-border bg-muted/5">
      <h4 className="font-medium text-sm text-foreground flex items-center mb-4">
        <Send size={16} className="mr-2" /> Module Assignment (Optional)
      </h4>

      {assignments.map((assignment, index) => (
        <Card key={assignment.id} className="p-4 bg-card border shadow-none mb-4 last:mb-0">
          <div className="flex justify-between items-center mb-4 border-b border-border pb-2">
            <h5 className="font-semibold text-xs sm:text-sm uppercase tracking-wider text-muted-foreground">Assignment {index + 1}</h5>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => removeAssignment(index)}
              className="text-destructive/70 hover:text-destructive h-7 w-7"
            >
              <Trash2 size={14} />
            </Button>
          </div>
          <div className="space-y-4">
            <FormField
              control={control}
              name={`modules.${moduleIndex}.assignments.${index}.title`}
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs font-bold uppercase text-muted-foreground/80">Title</FormLabel>
                  <FormControl>
                    <Input placeholder="Project Name" {...field} className="bg-background shadow-none border border-border focus-visible:ring-1 text-sm h-9" />
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={control}
              name={`modules.${moduleIndex}.assignments.${index}.description`}
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs font-bold uppercase text-muted-foreground/80">Instructions</FormLabel>
                  <FormControl>
                    <Textarea placeholder="What should the student do?" {...field} rows={3} className="bg-background shadow-none border border-border focus-visible:ring-1 text-sm resize-none" />
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={control}
              name={`modules.${moduleIndex}.assignments.${index}.max_score`}
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs font-bold uppercase text-muted-foreground/80">Max Score</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      min={1} 
                      placeholder="100" 
                      {...field} 
                      onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : 100)} 
                      className="bg-background shadow-none border border-border focus-visible:ring-1 text-sm h-9 w-full sm:max-w-[120px]" 
                    />
                  </FormControl>
                </FormItem>
              )}
            />
          </div>
        </Card>
      ))}

      <Button
        type="button"
        variant="outline"
        size="sm"
        className="w-full border-dashed mt-4 h-9 sm:h-8"
        onClick={() => appendAssignment({ title: "", description: "", max_score: 100 })}
      >
        <Plus className="mr-2" size={14} /> Add Assignment
      </Button>
    </div>
  );
};

const QuizBuilder = ({
  moduleIndex,
  lessonIndex,
  control,
  watch,
  setValue,
}: any) => {
  const {
    fields: quizzes,
    append: appendQuiz,
    remove: removeQuiz,
  } = useFieldArray({
    control,
    name: `modules.${moduleIndex}.lessons.${lessonIndex}.quizzes`,
  });

  return (
    <div className="pt-6 border-t border-border mt-6 space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <h4 className="font-semibold text-sm text-foreground flex items-center">
          <BookOpen size={18} className="mr-2 text-primary" /> Lesson Quizzes
        </h4>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-9 sm:h-8 border-dashed hover:border-primary hover:text-primary transition-all w-full sm:w-auto text-xs"
          onClick={() => appendQuiz({ title: "", description: "", max_score: 0, max_attempts: 3, questions: [] })}
        >
          <Plus className="mr-1 h-3.5 w-3.5" /> Add Quiz
        </Button>
      </div>

      <div className="space-y-4">
        {quizzes.map((quizField, quizIndex) => (
          <QuizItem
            key={quizField.id}
            quizField={quizField}
            moduleIndex={moduleIndex}
            lessonIndex={lessonIndex}
            quizIndex={quizIndex}
            control={control}
            watch={watch}
            setValue={setValue}
            removeQuiz={removeQuiz}
          />
        ))}
      </div>
    </div>
  );
};

const QuizItem = ({
  quizField,
  moduleIndex,
  lessonIndex,
  quizIndex,
  control,
  watch,
  setValue,
  removeQuiz,
}: any) => {
  const questions = watch(`modules.${moduleIndex}.lessons.${lessonIndex}.quizzes.${quizIndex}.questions`) || [];
  const totalScore = questions.reduce((acc: number, q: any) => acc + (Number(q.score_weight) || 0), 0);

  React.useEffect(() => {
    setValue(`modules.${moduleIndex}.lessons.${lessonIndex}.quizzes.${quizIndex}.max_score`, totalScore);
  }, [totalScore, setValue, moduleIndex, lessonIndex, quizIndex]);

  return (
    <div className="bg-muted/30 border border-border rounded-md p-3 sm:p-5 space-y-4 relative group transition-colors hover:bg-muted/40">
      <div className="flex justify-between items-start gap-2">
        <div className="flex-1 min-w-0">
          <FormField
            control={control}
            name={`modules.${moduleIndex}.lessons.${lessonIndex}.quizzes.${quizIndex}.title`}
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-[10px] sm:text-[11px] font-bold uppercase text-muted-foreground tracking-wider">Quiz Title</FormLabel>
                <FormControl>
                  <Input placeholder="e.g., Final Knowledge Check" {...field} className="h-9 bg-background shadow-none border border-border focus-visible:ring-1 text-sm" />
                </FormControl>
              </FormItem>
            )}
          />
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => removeQuiz(quizIndex)}
          className="text-muted-foreground hover:text-destructive h-8 w-8 mt-6 shrink-0"
        >
          <Trash2 size={16} />
        </Button>
      </div>

      <FormField
        control={control}
        name={`modules.${moduleIndex}.lessons.${lessonIndex}.quizzes.${quizIndex}.description`}
        render={({ field }) => (
          <FormItem>
            <FormLabel className="text-[10px] sm:text-[11px] font-bold uppercase text-muted-foreground tracking-wider">Quiz Description</FormLabel>
            <FormControl>
              <Textarea 
                placeholder="Briefly describe the purpose of this quiz..." 
                {...field} 
                className="min-h-[60px] bg-background shadow-none border border-border focus-visible:ring-1 resize-none text-sm" 
              />
            </FormControl>
          </FormItem>
        )}
      />

      <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
        <FormField
          control={control}
          name={`modules.${moduleIndex}.lessons.${lessonIndex}.quizzes.${quizIndex}.max_attempts`}
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-[10px] sm:text-[11px] font-bold uppercase text-muted-foreground">Attempts</FormLabel>
              <FormControl>
                <Input 
                  type="number" 
                  min={1} 
                  {...field} 
                  onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : 1)} 
                  className="h-9 bg-background shadow-none border border-border focus-visible:ring-1 text-sm" 
                />
              </FormControl>
            </FormItem>
          )}
        />
        <FormField
          control={control}
          name={`modules.${moduleIndex}.lessons.${lessonIndex}.quizzes.${quizIndex}.time_limit_minutes`}
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-[10px] sm:text-[11px] font-bold uppercase text-muted-foreground">Mins Limit</FormLabel>
              <FormControl>
                <Input 
                  type="number" 
                  placeholder="∞" 
                  {...field} 
                  value={field.value ?? ""} 
                  onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : null)} 
                  className="h-9 bg-background shadow-none border border-border focus-visible:ring-1 text-sm" 
                />
              </FormControl>
            </FormItem>
          )}
        />
        <div className="space-y-2 xs:col-span-2 sm:col-span-1">
          <label className="text-[10px] sm:text-[11px] font-bold uppercase text-muted-foreground">Total Score</label>
          <div className="h-9 bg-primary/5 border border-primary/10 rounded-md flex items-center px-3 font-bold text-primary text-sm">
            {totalScore} pts
          </div>
        </div>
      </div>

      <QuestionBuilder
        moduleIndex={moduleIndex}
        lessonIndex={lessonIndex}
        quizIndex={quizIndex}
        control={control}
        watch={watch}
        setValue={setValue}
      />
    </div>
  );
};

const QuestionBuilder = ({
  moduleIndex,
  lessonIndex,
  quizIndex,
  control,
  watch,
  setValue,
}: any) => {
  const {
    fields: questions,
    append: appendQuestion,
    remove: removeQuestion,
  } = useFieldArray({
    control,
    name: `modules.${moduleIndex}.lessons.${lessonIndex}.quizzes.${quizIndex}.questions`,
  });

  return (
    <div className="pt-5 border-t border-border/60 space-y-4">
      <div className="flex items-center justify-between px-1">
        <h5 className="font-bold text-[10px] sm:text-[11px] uppercase text-muted-foreground tracking-widest">Quiz Questions</h5>
        <span className="text-[9px] sm:text-[10px] text-muted-foreground italic">{questions.length} items</span>
      </div>

      <div className="space-y-4">
        {questions.map((questionField, questionIndex) => {
          const qType = watch(`modules.${moduleIndex}.lessons.${lessonIndex}.quizzes.${quizIndex}.questions.${questionIndex}.question_type`);
          
          return (
            <div key={questionField.id} className="p-3 sm:p-4 bg-background border border-border rounded-md relative group/q transition-all hover:border-primary/20">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-4">
                <div className="flex items-center gap-2">
                  <div className="flex items-center justify-center w-5 h-5 rounded bg-primary text-[10px] text-white font-bold shrink-0">
                    {questionIndex + 1}
                  </div>
                  <Select 
                    value={qType || "mcq"} 
                    onValueChange={(val) => setValue(`modules.${moduleIndex}.lessons.${lessonIndex}.quizzes.${quizIndex}.questions.${questionIndex}.question_type`, val)}
                  >
                    <SelectTrigger className="h-8 text-[10px] w-full sm:w-[130px] uppercase font-bold bg-background shadow-none border border-border focus-visible:ring-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="mcq">Multiple Choice</SelectItem>
                      <SelectItem value="text">Text Answer</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center justify-between sm:justify-end gap-2">
                  <div className="flex items-center bg-muted/50 rounded-md px-2 h-8 border border-border transition-colors">
                    <span className="text-[9px] font-bold text-muted-foreground mr-2">WEIGHT</span>
                    <Input 
                      type="number" 
                      className="w-10 h-6 border-none rounded-md bg-transparent p-0 text-center text-xs font-bold shadow-none focus-visible:ring-0"
                      {...control.register(`modules.${moduleIndex}.lessons.${lessonIndex}.quizzes.${quizIndex}.questions.${questionIndex}.score_weight`, { valueAsNumber: true })}
                      onChange={(e) => setValue(`modules.${moduleIndex}.lessons.${lessonIndex}.quizzes.${quizIndex}.questions.${questionIndex}.score_weight`, e.target.value ? Number(e.target.value) : 1)}
                    />
                  </div>
                  <Button 
                    type="button" 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8 text-muted-foreground hover:text-destructive sm:opacity-0 sm:group-hover/q:opacity-100 transition-opacity" 
                    onClick={() => removeQuestion(questionIndex)}
                  >
                    <Trash2 size={14} />
                  </Button>
                </div>
              </div>

              <div className="space-y-3">
                <FormField
                  control={control}
                  name={`modules.${moduleIndex}.lessons.${lessonIndex}.quizzes.${quizIndex}.questions.${questionIndex}.text`}
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Textarea 
                          placeholder="Type your question here..." 
                          {...field} 
                          className="min-h-[70px] text-sm resize-none bg-background shadow-none border border-border focus-visible:ring-1" 
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                {qType === 'mcq' && (
                  <OptionBuilder
                    moduleIndex={moduleIndex}
                    lessonIndex={lessonIndex}
                    quizIndex={quizIndex}
                    questionIndex={questionIndex}
                    control={control}
                  />
                )}
                
                <FormField
                  control={control}
                  name={`modules.${moduleIndex}.lessons.${lessonIndex}.quizzes.${quizIndex}.questions.${questionIndex}.instructor_hint`}
                  render={({ field }) => (
                    <FormItem>
                      <div className="flex items-center gap-1 mb-1 px-1">
                        <Info size={10} className="text-muted-foreground" />
                        <span className="text-[9px] font-bold uppercase text-muted-foreground/70 tracking-tighter">Instructor Notes / Grading Hint</span>
                      </div>
                      <FormControl>
                        <Input 
                          placeholder="Hidden from students..." 
                          {...field} 
                          className="h-8 text-xs bg-background shadow-none border border-border focus-visible:ring-1" 
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
            </div>
          );
        })}
      </div>

      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="w-full text-[10px] font-bold uppercase tracking-widest text-primary/70 hover:text-primary hover:bg-primary/5 transition-all h-10 border border-dashed border-primary/20"
        onClick={() => appendQuestion({ text: "", question_type: "mcq", score_weight: 1, options: [] })}
      >
        <Plus size={14} className="mr-2" /> Add Question
      </Button>
    </div>
  );
};

const OptionBuilder = ({
  moduleIndex,
  lessonIndex,
  quizIndex,
  questionIndex,
  control,
}: any) => {
  const {
    fields: options,
    append: appendOption,
    remove: removeOption,
  } = useFieldArray({
    control,
    name: `modules.${moduleIndex}.lessons.${lessonIndex}.quizzes.${quizIndex}.questions.${questionIndex}.options`,
  });

  return (
    <div className="space-y-3 p-2 sm:p-3 rounded-md bg-muted/20 border border-border/50">
      <div className="flex items-center justify-between px-1">
        <span className="text-[9px] sm:text-[10px] font-bold uppercase text-muted-foreground tracking-wider">
          Answer Options
        </span>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-7 text-[9px] uppercase font-bold text-primary hover:bg-primary/5 px-2"
          onClick={() => appendOption({ text: "", is_correct: false })}
        >
          <Plus size={12} className="mr-1" /> Add Option
        </Button>
      </div>

      <div className="grid gap-2">
        {options.map((optionField, optionIndex) => (
          <div 
            key={optionField.id} 
            className="flex items-center gap-2 bg-background p-2 rounded-md border border-border group/option"
          >
            <FormField
              control={control}
              name={`modules.${moduleIndex}.lessons.${lessonIndex}.quizzes.${quizIndex}.questions.${questionIndex}.options.${optionIndex}.is_correct`}
              render={({ field }) => (
                <FormItem className="flex items-center space-y-0">
                  <FormControl>
                    <div 
                      className={`flex items-center justify-center w-6 h-6 rounded-full border cursor-pointer transition-all shrink-0 ${
                        field.value 
                        ? "bg-green-500 border-green-600 text-white" 
                        : "border-muted-foreground/30 hover:border-green-500"
                      }`}
                      onClick={() => field.onChange(!field.value)}
                    >
                      {field.value && <CheckCheck size={14} strokeWidth={4} />}
                    </div>
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={control}
              name={`modules.${moduleIndex}.lessons.${lessonIndex}.quizzes.${quizIndex}.questions.${questionIndex}.options.${optionIndex}.text`}
              render={({ field }) => (
                <FormItem className="flex-1 space-y-0">
                  <FormControl>
                    <Input 
                      placeholder="Option text..." 
                      {...field} 
                      className="h-7 text-sm border-none bg-transparent shadow-none focus-visible:ring-0 p-0 px-1 w-full"
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-muted-foreground hover:text-destructive sm:opacity-0 sm:group-hover/option:opacity-100 transition-opacity shrink-0"
              onClick={() => removeOption(optionIndex)}
            >
              <X size={14} />
            </Button>
          </div>
        ))}
      </div>
      
      {options.length === 0 && (
        <p className="text-[9px] text-muted-foreground text-center py-2 italic">
          No options added.
        </p>
      )}
    </div>
  );
};