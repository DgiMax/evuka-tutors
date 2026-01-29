"use client";

import React from "react";
import { 
  X, 
  Trash2, 
  AlertCircle 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";

interface ConfirmDeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  isLoading?: boolean;
}

const Loader2 = ({ className, size = 16 }: { className?: string; size?: number }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
  </svg>
);

export const ConfirmDeleteModal: React.FC<ConfirmDeleteModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  isLoading = false,
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent 
        className="w-[95%] sm:max-w-[420px] p-0 gap-0 border-border/80 rounded-md bg-background overflow-hidden [&>button]:hidden transition-all duration-300 top-[5%] md:top-[10%] translate-y-0 shadow-none"
      >
        <DialogHeader className="px-4 md:px-6 py-4 border-b bg-muted/50 flex flex-row items-center justify-between shrink-0 backdrop-blur-sm z-10">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 md:h-9 md:w-9 rounded-full bg-red-100/50 flex items-center justify-center shrink-0 border border-red-200/60">
              <Trash2 className="h-4 w-4 text-red-600" />
            </div>
            <DialogTitle className="text-base md:text-lg font-bold tracking-tight text-foreground">
              {title}
            </DialogTitle>
          </div>
          <DialogClose className="rounded-md p-2 hover:bg-muted transition -mr-2">
            <X className="h-5 w-5 text-muted-foreground hover:text-foreground" />
          </DialogClose>
        </DialogHeader>

        <div className="p-4 md:p-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <p className="text-sm text-foreground/80 leading-relaxed font-medium">
                Are you sure you want to proceed with this action?
              </p>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {description}
              </p>
            </div>

            <div className="bg-red-50/50 border border-red-100 rounded-md p-3 flex gap-3 items-start">
              <AlertCircle className="h-4 w-4 text-red-600 shrink-0 mt-0.5" />
              <p className="text-[10px] md:text-[11px] text-red-700 font-bold uppercase tracking-wider leading-normal">
                This action is permanent and cannot be undone.
              </p>
            </div>
          </div>
        </div>

        <div className="px-4 md:px-6 py-4 border-t bg-muted/20 flex flex-col-reverse sm:flex-row justify-end gap-3 shrink-0 mt-auto">
          <Button 
            variant="outline" 
            onClick={onClose} 
            disabled={isLoading}
            className="h-11 md:h-10 w-full sm:w-auto px-6 rounded-md font-bold text-[11px] md:text-xs uppercase tracking-widest border-border shadow-none bg-background"
          >
            Cancel
          </Button>
          <Button 
            variant="destructive" 
            onClick={onConfirm} 
            disabled={isLoading}
            className="h-11 md:h-10 w-full sm:w-auto px-6 rounded-md font-bold text-[11px] md:text-xs uppercase tracking-widest shadow-none bg-red-600 hover:bg-red-700"
          >
            {isLoading ? (
              <div className="flex items-center gap-2">
                <Loader2 className="animate-spin" />
                <span>Processing...</span>
              </div>
            ) : (
              "Confirm Delete"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};