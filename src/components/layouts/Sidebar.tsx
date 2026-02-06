"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { type ElementType, useState, useEffect } from "react";
import { useActiveOrg } from "@/lib/hooks/useActiveOrg";
import { useAuth } from "@/context/AuthContext";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";

import {
  LayoutGrid,
  GraduationCap,
  Users,
  Backpack,
  Calendar,
  Wallet,
  Megaphone,
  BarChart,
  Building,
  UserCircle,
  HelpCircle,
  Building2,
  LogOut,
  Loader2,
  Store,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const navGroups = [
  {
    title: "Overview",
    items: [
      { href: "/", label: "Dashboard", icon: LayoutGrid },
      { href: "/analytics", label: "Analytics", icon: BarChart },
    ],
  },
  {
    title: "Academic",
    items: [
      { href: "/courses", label: "Courses", icon: GraduationCap },
      { href: "/tutors", label: "Tutors", icon: Users, orgOnly: true },
      { href: "/students", label: "Students", icon: Backpack },
    ],
  },
  {
    title: "Operations",
    items: [
      { href: "/events", label: "Events", icon: Calendar },
      { href: "/organizations", label: "Organizations", icon: Building2 },
      { href: "/revenue", label: "Revenue & Payouts", icon: Wallet },
      { href: "/announcements", label: "Announcements", icon: Megaphone },
      { href: "/org-info", label: "Org Info", icon: Building, orgOnly: true },
    ],
  },
];

const secondaryLinks = [
  { href: "/profile", label: "My Profile", icon: UserCircle },
  { href: "/discover/organizations", label: "Discover", icon: HelpCircle },
  { href: "https://e-vuka.com/courses", label: "Marketplace", icon: Store },
];

type NavLinkProps = {
  href: string;
  label: string;
  icon: ElementType;
  onClick?: () => void;
};

const NavLink = ({ href, label, icon: Icon, onClick }: NavLinkProps) => {
  const pathname = usePathname();
  const { activeSlug } = useActiveOrg();

  const isGlobalLink = 
    href.startsWith("http") || 
    href === "/profile" || 
    href === "/discover/organizations" ||
    href === "/organizations";

  const computedHref = (!isGlobalLink && activeSlug) 
    ? `/${activeSlug}${href === "/" ? "" : href}` 
    : href;

  const isActive = href === "/" 
    ? pathname === computedHref 
    : pathname === computedHref || pathname.startsWith(`${computedHref}/`);

  return (
    <Link
      href={computedHref}
      onClick={onClick}
      className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors ${
        isActive
          ? "bg-primary text-primary-foreground font-medium shadow-none"
          : "text-muted-foreground hover:bg-muted hover:text-foreground"
      }`}
    >
      <Icon className={`h-4 w-4 ${isActive ? "text-primary-foreground" : ""}`} />
      <span>{label}</span>
    </Link>
  );
};

type SidebarNavProps = {
  isSidebarOpen: boolean;
  setIsSidebarOpen: React.Dispatch<React.SetStateAction<boolean>>;
};

export function SidebarNav({ isSidebarOpen, setIsSidebarOpen }: SidebarNavProps) {
  const router = useRouter();
  const { logout, user } = useAuth(); 
  const { activeSlug } = useActiveOrg();
  const [signOutLoading, setSignOutLoading] = useState(false);
  const [isDataLoading, setIsDataLoading] = useState(true);

  useEffect(() => {
    if (user) {
      setIsDataLoading(false);
    } else {
      const timer = setTimeout(() => setIsDataLoading(false), 1000); 
      return () => clearTimeout(timer);
    }
  }, [user]);

  const handleSignOut = async () => {
    try {
      setSignOutLoading(true);
      await logout();
      router.push("/login");
    } catch (error) {
      console.error("Logout failed:", error);
    } finally {
      setSignOutLoading(false);
      setIsSidebarOpen(false);
    }
  };

  return (
    <AnimatePresence>
      {isSidebarOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-30 bg-black/20 backdrop-blur-sm"
            onClick={() => setIsSidebarOpen(false)}
          />

          <motion.aside
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="fixed top-14 bottom-0 left-0 z-40 flex flex-col bg-background border-r border-border shadow-none w-72 md:w-64"
          >
            <div className="flex-1 overflow-y-auto px-3 py-6 space-y-6 [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-thumb]:bg-muted-foreground/20 hover:[&::-webkit-scrollbar-thumb]:bg-muted-foreground/40 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-none [&::-webkit-scrollbar-thumb]:border-x-[1px] [&::-webkit-scrollbar-thumb]:border-transparent [&::-webkit-scrollbar-thumb]:bg-clip-content">
              {isDataLoading ? (
                <div className="space-y-6 px-1">
                  {[1, 2, 3].map((i) => (
                    <div key={i}>
                       <Skeleton width={80} height={15} className="mb-3 opacity-50" />
                       <div className="space-y-2">
                        <Skeleton height={36} count={3} borderRadius={6} />
                       </div>
                    </div>
                  ))}
                </div>
              ) : (
                navGroups.map((group) => {
                  const visibleLinks = group.items.filter(
                    (link: any) => {
                        if (link.orgOnly && !activeSlug) return false;
                        return true;
                    }
                  );

                  if (visibleLinks.length === 0) return null;

                  return (
                    <div key={group.title}>
                      <h3 className="mb-2 px-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">
                        {group.title}
                      </h3>
                      <div className="space-y-1">
                        {visibleLinks.map((link) => (
                          <NavLink
                            key={link.label}
                            {...link}
                            onClick={() => setIsSidebarOpen(false)}
                          />
                        ))}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <div className="border-t border-border bg-muted/10 p-3">
              <div className="space-y-1 mb-4">
                {isDataLoading ? (
                  <Skeleton height={36} count={2} borderRadius={6} />
                ) : (
                  secondaryLinks.map((link) => (
                    <NavLink
                      key={link.label}
                      {...link}
                      onClick={() => setIsSidebarOpen(false)}
                    />
                  ))
                )}
              </div>

              <div className="flex items-center justify-between gap-3 pt-4 border-t border-border/50">
                {isDataLoading ? (
                   <div className="flex items-center gap-3 w-full">
                     <Skeleton circle width={32} height={32} />
                     <div className="flex-1">
                       <Skeleton width="80%" height={14} />
                       <Skeleton width="50%" height={10} />
                     </div>
                   </div>
                ) : (
                  <>
                    <div className="flex items-center gap-3 overflow-hidden px-1">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary border border-primary/20">
                            <UserCircle className="h-5 w-5" />
                        </div>
                        <div className="flex flex-col truncate">
                            <span className="text-xs font-bold text-foreground truncate">
                                {activeSlug ? "Org View" : "Personal"}
                            </span>
                            <span className="text-[10px] text-muted-foreground truncate uppercase font-medium">
                                {activeSlug ? activeSlug : "Private"}
                            </span>
                        </div>
                    </div>

                    <button
                      onClick={handleSignOut}
                      disabled={signOutLoading}
                      className="group rounded-md p-2 text-muted-foreground hover:bg-red-50 hover:text-red-600 transition-colors"
                      title="Sign out"
                    >
                      {signOutLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <LogOut className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
                      )}
                    </button>
                  </>
                )}
              </div>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}