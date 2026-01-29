"use client";

import React from "react";
import { Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
interface CoursePreviewActionsProps {
  slug: string;
}

export const CoursePreviewActions = ({ slug }: CoursePreviewActionsProps) => {
  return (
    <div className="flex flex-col gap-3 w-full">
      <Button disabled className="w-full h-12 bg-[#2694C6] text-white font-black uppercase text-[11px] tracking-widest rounded-md shadow-none opacity-90 cursor-not-allowed transition-none">
        Buy Now
      </Button>
      <div className="flex items-center gap-2">
        <Button disabled variant="outline" className="flex-grow h-12 border-2 border-gray-900 text-gray-900 bg-white font-black uppercase text-[11px] tracking-widest rounded-md shadow-none cursor-not-allowed transition-none">
          Add to Cart
        </Button>

        <Button disabled variant="outline" size="icon" className="h-12 w-12 shrink-0 border-2 border-gray-900 text-gray-900 bg-white rounded-md shadow-none cursor-not-allowed transition-none">
          <Heart size={20} />
        </Button>
      </div>
      
      <p className="text-[10px] text-center text-muted-foreground font-bold uppercase tracking-tight mt-2">
        30-Day Money-Back Guarantee
      </p>
    </div>
  );
};