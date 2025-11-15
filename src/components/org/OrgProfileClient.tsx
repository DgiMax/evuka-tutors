"use client";

import React, { useEffect, useState, useMemo } from "react";
import { useActiveOrg } from "@/lib/hooks/useActiveOrg";
import { useAuth } from "@/context/AuthContext";
import api from "@/lib/api/axios";
import {
  Loader2,
  Edit,
  BarChart,
  BookOpen,
  Layers,
  Plus,
  Trash2,
  MoreVertical,
  Pencil,
  Link as LinkIcon,
  Facebook,
  Linkedin,
  Twitter,
  FileText,
  Scale,
  Paintbrush,
  Building,
  Users,
  Inbox,
  CalendarDays,
  GraduationCap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogDescription,
  DialogClose,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter,
  SheetClose,
} from "@/components/ui/sheet";
import { toast } from "sonner";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import Image from "next/image";

// --- Interfaces (Unchanged) ---
interface OrgStats {
  students: number;
  tutors: number;
  courses: number;
  upcoming_events: number;
}
interface OrganizationDetails {
  id: number;
  name: string;
  slug: string;
  description: string;
  branding: {
    logo_url?: string;
    website?: string;
    linkedin?: string;
    facebook?: string;
    twitter?: string;
  };
  policies: {
    terms_of_service?: string;
    privacy_policy?: string;
    refund_policy?: string;
  };
  stats: OrgStats;
}
interface TaxonomyItem {
  id: number;
  name: string;
  description?: string;
  order?: number;
  created_at: string;
}

// --- Main Component (Unchanged from last version) ---
export default function OrgProfileClient() {
  const { activeSlug } = useActiveOrg();
  const { user } = useAuth();
  const [org, setOrg] = useState<OrganizationDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const currentMembership = user?.organizations?.find(
    (o: any) => o.organization_slug === activeSlug
  );
  const isAdmin =
    currentMembership?.role === "admin" || currentMembership?.role === "owner";

  const fetchOrgDetails = async () => {
    if (!activeSlug) return;
    try {
      setIsLoading(true);
      const res = await api.get("/organizations/current/", {
        headers: { "X-Organization-Slug": activeSlug },
      });
      setOrg(res.data);
    } catch (error) {
      console.error(error);
      toast.error("Failed to load organization details.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOrgDetails();
  }, [activeSlug]);

  if (isLoading)
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  if (!org) return null;

  const hasPolicies =
    org.policies?.terms_of_service ||
    org.policies?.privacy_policy ||
    org.policies?.refund_policy;

  return (
    <div className="bg-background min-h-screen pb-20">
      {/* === HERO BANNER (Restored & Themed) === */}
      <div className="relative bg-primary text-primary-foreground px-6 py-12 md:px-12">
        <div className="container mx-auto">
          {/* Org Info (Responsive) */}
          <div className="flex flex-col md:flex-row items-center md:items-start gap-6 relative">
            <div className="h-24 w-24 md:h-32 md:w-32 shrink-0 rounded-md bg-primary/20 border border-primary-foreground/10 shadow-xl overflow-hidden flex items-center justify-center">
              {org.branding?.logo_url ? (
                <Image
                  src={org.branding.logo_url}
                  alt={org.name}
                  width={128}
                  height={128}
                  className="h-full w-full object-cover"
                />
              ) : (
                <span className="text-4xl font-bold text-primary-foreground/80">
                  {org.name.charAt(0)}
                </span>
              )}
            </div>
            <div className="flex-1 pt-0 md:pt-4 text-center md:text-left">
              <h1 className="text-3xl font-bold text-primary-foreground">
                {org.name}
              </h1>
              <p className="text-primary-foreground/80 mt-2 max-w-2xl">
                {org.branding?.website ||
                  "Empowering minds through practical digital skills."}
              </p>
            </div>
            {/* Action Buttons (Responsive) */}
            {isAdmin && (
              <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
                <EditOrgDialog
                  org={org}
                  onSuccess={fetchOrgDetails}
                  activeSlug={activeSlug}
                />
                <Button
                  variant="outline"
                  className="bg-primary-foreground/10 text-primary-foreground border-primary-foreground/50 hover:bg-primary-foreground/20 hover:text-primary-foreground"
                >
                  <BarChart className="mr-2 h-4 w-4" /> View Analytics
                </Button>
              </div>
            )}
          </div>

          {/* Stats (Responsive) */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center md:text-left border-t border-primary-foreground/20 pt-6 mt-8">
            <StatItem label="Students" value={org.stats.students} />
            <StatItem label="Tutors" value={org.stats.tutors} />
            <StatItem label="Courses" value={org.stats.courses} />
            <StatItem label="Events" value={org.stats.upcoming_events} />
          </div>
        </div>
      </div>

      {/* === MAIN CONTENT GRID === */}
      <div className="container mx-auto px-4 md:px-12 mt-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* === LEFT COLUMN (Main Content) === */}
        <div className="lg:col-span-2 space-y-6">
          {/* Bio */}
          <Card className="p-0">
            <CardHeader className="p-6">
              <CardTitle className="text-xl">About Us</CardTitle>
            </CardHeader>
            <CardContent className="p-6 pt-0">
              <div
                className={cn(
                  "prose prose-sm max-w-none",
                  "prose-p:text-foreground prose-headings:text-foreground",
                  "dark:prose-invert"
                )}
              >
                {org.description ? (
                  org.description
                    .split("\n")
                    .map((paragraph, idx) => (
                      <p key={idx} className="mb-4 last:mb-0">
                        {paragraph}
                      </p>
                    ))
                ) : (
                  <p className="italic text-muted-foreground">
                    No description provided.
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Policies Display Section */}
          {hasPolicies && (
            <Card className="p-0">
              <CardHeader className="p-6">
                <CardTitle className="text-xl">
                  Organization Policies
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 pt-0">
                <Tabs
                  defaultValue={
                    org.policies.terms_of_service
                      ? "terms"
                      : org.policies.privacy_policy
                      ? "privacy"
                      : "refund"
                  }
                >
                  <TabsList className="mb-4">
                    {org.policies.terms_of_service && (
                      <TabsTrigger value="terms">Terms of Service</TabsTrigger>
                    )}
                    {org.policies.privacy_policy && (
                      <TabsTrigger value="privacy">Privacy Policy</TabsTrigger>
                    )}
                    {org.policies.refund_policy && (
                      <TabsTrigger value="refund">Refund Policy</TabsTrigger>
                    )}
                  </TabsList>
                  {org.policies.terms_of_service && (
                    <TabsContent
                      value="terms"
                      className="prose max-w-none text-sm text-foreground bg-muted/50 p-4 rounded-md max-h-64 overflow-y-auto"
                    >
                      <div className="whitespace-pre-wrap">
                        {org.policies.terms_of_service}
                      </div>
                    </TabsContent>
                  )}
                  {org.policies.privacy_policy && (
                    <TabsContent
                      value="privacy"
                      className="prose max-w-none text-sm text-foreground bg-muted/50 p-4 rounded-md max-h-64 overflow-y-auto"
                    >
                      <div className="whitespace-pre-wrap">
                        {org.policies.privacy_policy}
                      </div>
                    </TabsContent>
                  )}
                  {org.policies.refund_policy && (
                    <TabsContent
                      value="refund"
                      className="prose max-w-none text-sm text-foreground bg-muted/50 p-4 rounded-md max-h-64 overflow-y-auto"
                    >
                      <div className="whitespace-pre-wrap">
                        {org.policies.refund_policy}
                      </div>
                    </TabsContent>
                  )}
                </Tabs>
              </CardContent>
            </Card>
          )}
        </div>

        {/* === RIGHT COLUMN (Sidebar) === */}
        <div className="space-y-6">
          {/* Social Links */}
          <Card className="p-0">
            <CardHeader className="p-6">
              <CardTitle className="text-lg">Connect</CardTitle>
            </CardHeader>
            <CardContent className="p-6 pt-0">
              <div className="space-y-1">
                {org.branding?.website && (
                  <SocialLink
                    icon={<LinkIcon className="h-4 w-4" />}
                    label="Website"
                    value={org.branding.website}
                  />
                )}
                {org.branding?.linkedin && (
                  <SocialLink
                    icon={<Linkedin className="h-4 w-4" />}
                    label="LinkedIn"
                    value={org.branding.linkedin}
                  />
                )}
                {org.branding?.facebook && (
                  <SocialLink
                    icon={<Facebook className="h-4 w-4" />}
                    label="Facebook"
                    value={org.branding.facebook}
                  />
                )}
                {org.branding?.twitter && (
                  <SocialLink
                    icon={<Twitter className="h-4 w-4" />}
                    label="X (Twitter)"
                    value={org.branding.twitter}
                  />
                )}
              </div>
            </CardContent>
          </Card>

          {/* Settings (Admin Only) */}
          {isAdmin && (
            <Card className="p-0">
              <CardHeader className="p-6 border-b border-border bg-muted/50">
                <CardTitle className="text-lg">Settings</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y divide-border">
                  <TaxonomyManager
                    activeSlug={activeSlug}
                    type="categories"
                    title="Course Categories"
                    description="Manage subjects."
                    icon={<BookOpen className="h-5 w-5 text-primary" />}
                  />
                  <TaxonomyManager
                    activeSlug={activeSlug}
                    type="levels"
                    title="Organization Levels"
                    description="Manage grade levels."
                    icon={<Layers className="h-5 w-5 text-secondary" />}
                  />
                  <CustomizeBrandingDialog
                    org={org}
                    onSuccess={fetchOrgDetails}
                    activeSlug={activeSlug}
                  />
                  <CustomizePoliciesDialog
                    org={org}
                    onSuccess={fetchOrgDetails}
                    activeSlug={activeSlug}
                  />
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

// --- Helper Components (Themed) ---

function StatItem({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <p className="text-2xl font-bold text-primary-foreground">
        {value.toLocaleString()}
      </p>
      <p className="text-sm text-primary-foreground/80">{label}</p>
    </div>
  );
}

function SocialLink({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <a
      href={value.startsWith("http") ? value : `https://${value}`}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-3 p-3 rounded-md hover:bg-muted/50 transition-colors group"
    >
      <span className="text-muted-foreground group-hover:text-primary">
        {icon}
      </span>
      <div className="overflow-hidden">
        <p className="text-xs font-medium text-muted-foreground">{label}</p>
        <p className="text-sm text-foreground truncate">
          {value.replace(/^https?:\/\/(www\.)?/, "")}
        </p>
      </div>
    </a>
  );
}

// --- Confirmation Dialog for Taxonomy ---
function ConfirmDeleteDialog({
  open,
  onOpenChange,
  onConfirm,
  isLoading,
  itemName,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  isLoading: boolean;
  itemName: string;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete Item?</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete{" "}
            <strong className="text-foreground">{itemName}</strong>? This action
            cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Cancel</Button>
          </DialogClose>
          <Button
            variant="destructive"
            onClick={onConfirm}
            disabled={isLoading}
          >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Delete
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// --- Themed Sub-Components ---

// ✅ UPDATED: CustomizePoliciesDialog (Sheet)
function CustomizePoliciesDialog({
  org,
  onSuccess,
  activeSlug,
}: {
  org: OrganizationDetails;
  onSuccess: () => void;
  activeSlug: string | null;
}) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [policies, setPolicies] = useState(org.policies || {});

  useEffect(() => {
    if (open) setPolicies(org.policies || {});
  }, [open, org.policies]);

  const handleSubmit = async () => {
    if (!activeSlug) return;
    setLoading(true);
    try {
      await api.patch(
        "/organizations/current/",
        { policies },
        { headers: { "X-Organization-Slug": activeSlug } }
      );
      toast.success("Policies updated.");
      onSuccess();
      setOpen(false);
    } catch (e) {
      toast.error("Failed to update policies.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <div className="flex items-center justify-between p-6 hover:bg-muted/50 cursor-pointer transition-colors">
          <div className="flex items-center gap-4">
            <div className="p-2 rounded-full bg-muted">
              <Scale className="h-5 w-5 text-muted-foreground" />
            </div>
            <div>
              <span className="font-medium text-foreground block">
                Manage Policies
              </span>
              <span className="text-sm text-muted-foreground">
                Terms, privacy, & refunds.
              </span>
            </div>
          </div>
          <Button variant="ghost" size="sm">
            Manage
          </Button>
        </div>
      </SheetTrigger>
      {/* ✅ UPDATED: Sheet layout */}
      <SheetContent className="flex flex-col gap-0 p-0 sm:max-w-2xl">
        <SheetHeader className="p-6 border-b border-border">
          <SheetTitle>Organization Policies</SheetTitle>
          <SheetDescription>
            Define the legal and operational policies for your organization.
            These will be visible to your students and tutors.
          </SheetDescription>
        </SheetHeader>
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <div className="space-y-2">
            <Label>Terms of Service</Label>
            <Textarea
              rows={6}
              placeholder="Enter your terms of service..."
              value={policies.terms_of_service || ""}
              onChange={(e) =>
                setPolicies({ ...policies, terms_of_service: e.target.value })
              }
              className="font-mono text-sm"
            />
          </div>
          <div className="space-y-2">
            <Label>Privacy Policy</Label>
            <Textarea
              rows={6}
              placeholder="Enter your privacy policy..."
              value={policies.privacy_policy || ""}
              onChange={(e) =>
                setPolicies({ ...policies, privacy_policy: e.target.value })
              }
              className="font-mono text-sm"
            />
          </div>
          <div className="space-y-2">
            <Label>Refund Policy</Label>
            <Textarea
              rows={4}
              placeholder="Enter your refund policy..."
              value={policies.refund_policy || ""}
              onChange={(e) =>
                setPolicies({ ...policies, refund_policy: e.target.value })
              }
              className="font-mono text-sm"
            />
          </div>
        </div>
        <SheetFooter className="p-6 border-t border-border bg-muted/50">
          <SheetClose asChild>
            <Button variant="outline">Cancel</Button>
          </SheetClose>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}{" "}
            Save Policies
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

// ✅ UPDATED: TaxonomyManager (Sheet)
function TaxonomyManager({
  activeSlug,
  type,
  title,
  description,
  icon,
}: {
  activeSlug: string | null;
  type: "categories" | "levels";
  title: string;
  description: string;
  icon: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<TaxonomyItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingItem, setEditingItem] = useState<TaxonomyItem | null>(null);
  const [itemToDelete, setItemToDelete] = useState<TaxonomyItem | null>(null);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchItems = async () => {
    if (!activeSlug) return;
    setLoading(true);
    try {
      const res = await api.get(`/organizations/${type}/`, {
        headers: { "X-Organization-Slug": activeSlug },
      });
      setItems(Array.isArray(res.data) ? res.data : res.data.results);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) fetchItems();
  }, [open, activeSlug, type]);

  const handleDelete = async () => {
    if (!itemToDelete) return;
    setIsDeleting(true);
    try {
      await api.delete(`/organizations/${type}/${itemToDelete.id}/`, {
        headers: { "X-Organization-Slug": activeSlug },
      });
      toast.success("Deleted.");
      fetchItems();
      setIsDeleteOpen(false);
      setItemToDelete(null);
    } catch (e) {
      toast.error("Failed delete.");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <div className="flex items-center justify-between p-6 hover:bg-muted/50 cursor-pointer transition-colors">
            <div className="flex items-center gap-4">
              <div className="p-2 rounded-full bg-muted">{icon}</div>
              <div>
                <span className="font-medium text-foreground block">
                  {title}
                </span>
                <span className="text-sm text-muted-foreground">
                  {description}
                </span>
              </div>
            </div>
            <Button variant="ghost" size="sm">
              Manage
            </Button>
          </div>
        </SheetTrigger>
        {/* ✅ UPDATED: Sheet layout */}
        <SheetContent className="flex flex-col gap-0 p-0 sm:max-w-xl">
          <SheetHeader className="p-6 border-b border-border">
            <SheetTitle>{title}</SheetTitle>
            <SheetDescription>
              Manage your organization's {type}.
            </SheetDescription>
          </SheetHeader>
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            <UpsertTaxonomyItem
              type={type}
              activeSlug={activeSlug}
              onSuccess={fetchItems}
              existingItem={editingItem}
              onCancel={() => setEditingItem(null)}
            />
            {loading ? (
              <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
            ) : items.length > 0 ? (
              <div className="rounded-md border border-border divide-y divide-border">
                {items.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-4 hover:bg-muted/50"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-foreground">
                          {item.name}
                        </span>
                        {type === "levels" && item.order !== undefined && (
                          <Badge variant="secondary">
                            Order: {item.order}
                          </Badge>
                        )}
                      </div>
                      {item.description && (
                        <p className="text-sm text-muted-foreground mt-1 line-clamp-1">
                          {item.description}
                        </p>
                      )}
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-foreground"
                        >
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => setEditingItem(item)}>
                          <Pencil className="mr-2 h-4 w-4" /> Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={() => {
                            setItemToDelete(item);
                            setIsDeleteOpen(true);
                          }}
                        >
                          <Trash2 className="mr-2 h-4 w-4" /> Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground border-2 border-dashed border-border rounded-lg">
                No items yet.
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>
      <ConfirmDeleteDialog
        open={isDeleteOpen}
        onOpenChange={setIsDeleteOpen}
        onConfirm={handleDelete}
        isLoading={isDeleting}
        itemName={itemToDelete?.name || "item"}
      />
    </>
  );
}

// ✅ UPDATED: UpsertTaxonomyItem (Themed)
function UpsertTaxonomyItem({
  type,
  activeSlug,
  onSuccess,
  existingItem,
  onCancel,
}: any) {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    order: "0",
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (existingItem)
      setFormData({
        name: existingItem.name,
        description: existingItem.description || "",
        order: existingItem.order?.toString() || "0",
      });
    else setFormData({ name: "", description: "", order: "0" });
  }, [existingItem]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeSlug) return;
    setLoading(true);
    try {
      const payload = { ...formData, order: parseInt(formData.order) || 0 };
      if (existingItem)
        await api.patch(`/organizations/${type}/${existingItem.id}/`, payload, {
          headers: { "X-Organization-Slug": activeSlug },
        });
      else
        await api.post(`/organizations/${type}/`, payload, {
          headers: { "X-Organization-Slug": activeSlug },
        });
      toast.success("Saved.");
      setFormData({ name: "", description: "", order: "0" });
      onSuccess();
      if (existingItem) onCancel();
    } catch (e) {
      toast.error("Failed to save.");
    } finally {
      setLoading(false);
    }
  };
  return (
    <form
      onSubmit={handleSubmit}
      className="bg-muted/50 p-4 rounded-lg border border-border space-y-4"
    >
      <h4 className="font-medium text-sm text-foreground">
        {existingItem ? "Edit" : "Add New"}
      </h4>
      <div className="grid grid-cols-2 gap-4">
        <div className={type === "levels" ? "col-span-1" : "col-span-2"}>
          <Label className="text-xs">Name</Label>
          <Input
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />
        </div>
        {type === "levels" && (
          <div>
            <Label className="text-xs">Order</Label>
            <Input
              type="number"
              value={formData.order}
              onChange={(e) =>
                setFormData({ ...formData, order: e.target.value })
              }
            />
          </div>
        )}
        <div className="col-span-2">
          <Label className="text-xs">Description</Label>
          <Input
            value={formData.description}
            onChange={(e) =>
              setFormData({ ...formData, description: e.target.value })
            }
          />
        </div>
      </div>
      <div className="flex justify-end gap-2">
        {existingItem && (
          <Button type="button" variant="ghost" size="sm" onClick={onCancel}>
            Cancel
          </Button>
        )}
        <Button type="submit" size="sm" disabled={loading}>
          {loading && <Loader2 className="mr-2 h-3 w-3 animate-spin" />} Save
        </Button>
      </div>
    </form>
  );
}

// ✅ UPDATED: EditOrgDialog (Themed)
function EditOrgDialog({ org, onSuccess, activeSlug }: any) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: org.name,
    description: org.description || "",
  });

  const handleSubmit = async () => {
    if (!activeSlug) return;
    setLoading(true);
    try {
      await api.patch("/organizations/current/", formData, {
        headers: { "X-Organization-Slug": activeSlug },
      });
      toast.success("Updated.");
      onSuccess();
      setOpen(false);
    } catch (e) {
      toast.error("Failed.");
    } finally {
      setLoading(false);
    }
  };
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          className="w-full sm:w-auto bg-primary-foreground/10 text-primary-foreground border-primary-foreground/50 hover:bg-primary-foreground/20 hover:text-primary-foreground"
        >
          <Edit className="mr-2 h-4 w-4" /> Edit Info
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Info</DialogTitle>
        </DialogHeader>
        <div className="space-y-6 pt-6">
          <div className="space-y-2">
            <Label>Name</Label>
            <Input
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
            />
          </div>
          <div className="space-y-2">
            <Label>Bio</Label>
            <Textarea
              rows={5}
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
            />
          </div>
        </div>
        <DialogFooter className="pt-6">
          <DialogClose asChild>
            <Button variant="outline">Cancel</Button>
          </DialogClose>
          <Button onClick={handleSubmit} disabled={loading}>
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ✅ UPDATED: CustomizeBrandingDialog (Sheet)
function CustomizeBrandingDialog({ org, onSuccess, activeSlug }: any) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [brandingData, setBrandingData] = useState(org.branding || {});
  useEffect(() => {
    if (open) setBrandingData(org.branding || {});
  }, [open, org.branding]);
  const handleSubmit = async () => {
    if (!activeSlug) return;
    setLoading(true);
    try {
      await api.patch(
        "/organizations/current/",
        { branding: brandingData },
        { headers: { "X-Organization-Slug": activeSlug } }
      );
      toast.success("Branding updated.");
      onSuccess();
      setOpen(false);
    } catch (e) {
      toast.error("Failed.");
    } finally {
      setLoading(false);
    }
  };
  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <div className="flex items-center justify-between p-6 hover:bg-muted/50 cursor-pointer transition-colors">
          <div className="flex items-center gap-4">
            <div className="p-2 rounded-full bg-muted">
              <Paintbrush className="h-5 w-5 text-muted-foreground" />
            </div>
            <div>
              <span className="font-medium text-foreground block">
                Branding
              </span>
              <span className="text-sm text-muted-foreground">
                Logo & social links.
              </span>
            </div>
          </div>
          <Button variant="ghost" size="sm">
            Manage
          </Button>
        </div>
      </SheetTrigger>
      {/* ✅ UPDATED: Sheet layout */}
      <SheetContent className="flex flex-col gap-0 p-0 sm:max-w-xl">
        <SheetHeader className="p-6 border-b border-border">
          <SheetTitle>Branding</SheetTitle>
          <SheetDescription>
            Update your logo URL and social media links.
          </SheetDescription>
        </SheetHeader>
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2 space-y-2">
              <Label>Logo URL</Label>
              <Input
                value={brandingData.logo_url || ""}
                onChange={(e) =>
                  setBrandingData({ ...brandingData, logo_url: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Website</Label>
              <Input
                value={brandingData.website || ""}
                onChange={(e) =>
                  setBrandingData({ ...brandingData, website: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label>LinkedIn</Label>
              <Input
                value={brandingData.linkedin || ""}
                onChange={(e) =>
                  setBrandingData({ ...brandingData, linkedin: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Facebook</Label>
              <Input
                value={brandingData.facebook || ""}
                onChange={(e) =>
                  setBrandingData({ ...brandingData, facebook: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label>X (Twitter)</Label>
              <Input
                value={brandingData.twitter || ""}
                onChange={(e) =>
                  setBrandingData({ ...brandingData, twitter: e.target.value })
                }
              />
            </div>
          </div>
        </div>
        <SheetFooter className="p-6 border-t border-border bg-muted/50">
          <SheetClose asChild>
            <Button variant="outline">Cancel</Button>
          </SheetClose>
          <Button onClick={handleSubmit} disabled={loading}>
            Save
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}