"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useActiveOrg } from "@/lib/hooks/useActiveOrg";
import api from "@/lib/api/axios";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

export default function ContextGate({ children, slug }: { children: React.ReactNode; slug: string }) {
  const router = useRouter();
  const { setActiveSlug, setActiveRole, setIsVerifying, activeSlug } = useActiveOrg();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const checkRef = useRef<string | null>(null);

  useEffect(() => {
    if (activeSlug === slug && isAuthorized) return;
    if (checkRef.current === slug) return;

    const verify = async () => {
      checkRef.current = slug;
      setIsVerifying(true);
      setIsAuthorized(false);

      try {
        const { data } = await api.get(`/organizations/validate-context/${slug}/`);

        if (data.org_status === "draft") {
          toast.error("This organization must be published first.", { id: "draft-block" });
          setActiveSlug(null);
          setActiveRole(null);
          setTimeout(() => router.replace("/organizations"), 100);
          return;
        }

        setActiveRole(data.role);
        setActiveSlug(slug);
        setIsAuthorized(true);
      } catch (err: any) {
        toast.error("Access denied.", { id: "access-denied" });
        setActiveSlug(null);
        setActiveRole(null);
        setTimeout(() => router.replace("/"), 100);
      } finally {
        setIsVerifying(false);
        checkRef.current = null;
      }
    };

    verify();
  }, [slug, activeSlug, isAuthorized, router, setActiveRole, setActiveSlug, setIsVerifying]);

  return (
    <AnimatePresence mode="wait">
      {!isAuthorized ? (
        <motion.div
          key="gate-loader"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[9999] bg-[#EFFAFC] flex flex-col items-center justify-center p-6"
        >
          <div className="relative h-16 w-16 md:h-24 md:w-24 flex items-center justify-center">
            
            <motion.div
              animate={{ 
                rotate: [0, 90, 180, 270, 360],
                borderRadius: ["15%", "0%", "15%", "0%", "15%"] 
              }}
              transition={{ repeat: Infinity, duration: 5, ease: "linear" }}
              className="absolute h-12 w-12 md:h-16 md:w-16 border-2 border-[#2694C6]/30"
            />
            
            <motion.div
              animate={{ 
                scale: [0.6, 1, 0.6],
                rotate: [0, -90, -180, -270, -360],
              }}
              transition={{ repeat: Infinity, duration: 2.5, ease: "easeInOut" }}
              className="h-6 w-6 md:h-8 md:w-8 bg-[#2694C6] rounded-sm shadow-xl shadow-[#2694C6]/20"
            />
          </div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="mt-6 text-center"
          >
            <p className="text-[9px] md:text-[10px] font-black uppercase tracking-[0.4em] text-[#2694C6]/90">
              Initializing
            </p>
            <p className="mt-1 text-[8px] font-bold text-muted-foreground uppercase tracking-widest opacity-50 truncate max-w-[150px]">
              {slug}
            </p>
          </motion.div>
        </motion.div>
      ) : (
        <motion.div
          key="gate-content"
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="w-full h-full"
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
}