"use client";

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import Input from '@/components/ui/FormInput';
import { 
  X, 
  ShieldAlert, 
  AlertCircle,
  CheckCircle2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";

interface ChangePasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
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

export default function ChangePasswordModal({ isOpen, onClose }: ChangePasswordModalProps) {
  const { changePassword } = useAuth();

  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) {
        const timer = setTimeout(() => {
            setOldPassword('');
            setNewPassword('');
            setConfirmPassword('');
            setError(null);
            setSuccess(null);
        }, 300);
        return () => clearTimeout(timer);
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setError("New passwords do not match.");
      return;
    }
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      await changePassword(oldPassword, newPassword);
      setSuccess("Password changed successfully!");
      setTimeout(onClose, 2000);
    } catch (err: any) {
      setError(err.message || "Failed to change password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent 
        className="w-[95%] sm:max-w-[420px] p-0 gap-0 border-border/80 rounded-md bg-background overflow-hidden [&>button]:hidden transition-all duration-300 top-[5%] md:top-[10%] translate-y-0 shadow-none"
      >
        <DialogHeader className="px-4 md:px-6 py-4 border-b bg-muted/50 flex flex-row items-center justify-between shrink-0 backdrop-blur-sm z-10">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 md:h-9 md:w-9 rounded-full bg-blue-100/50 flex items-center justify-center shrink-0 border border-blue-200/60">
              <ShieldAlert className="h-4 w-4 text-blue-600" />
            </div>
            <DialogTitle className="text-base md:text-lg font-bold tracking-tight text-foreground">
              Update Security
            </DialogTitle>
          </div>
          <DialogClose className="rounded-md p-2 hover:bg-muted transition -mr-2">
            <X className="h-5 w-5 text-muted-foreground hover:text-foreground" />
          </DialogClose>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col">
          <div className="p-4 md:p-6 space-y-4">
            <div className="space-y-3">
              <Input
                type="password"
                placeholder="Current Password"
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
                required
              />
              <Input
                type="password"
                placeholder="New Password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
              />
              <Input
                type="password"
                placeholder="Confirm New Password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>

            {error && (
              <div className="bg-red-50/50 border border-red-100 rounded-md p-3 flex gap-3 items-start">
                <AlertCircle className="h-4 w-4 text-red-600 shrink-0 mt-0.5" />
                <p className="text-[10px] md:text-[11px] text-red-700 font-bold uppercase tracking-wider leading-normal">
                  {error}
                </p>
              </div>
            )}

            {success && (
              <div className="bg-emerald-50/50 border border-emerald-100 rounded-md p-3 flex gap-3 items-start">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                <p className="text-[10px] md:text-[11px] text-emerald-700 font-bold uppercase tracking-wider leading-normal">
                  {success}
                </p>
              </div>
            )}
          </div>

          <div className="px-4 md:px-6 py-4 border-t bg-muted/20 flex flex-col-reverse sm:flex-row justify-end gap-3 shrink-0 mt-auto">
            <Button 
              type="button"
              variant="outline" 
              onClick={onClose} 
              disabled={loading}
              className="h-11 md:h-10 w-full sm:w-auto px-6 rounded-md font-bold text-[11px] md:text-xs uppercase tracking-widest border-border shadow-none bg-background"
            >
              Cancel
            </Button>
            <Button 
              type="submit"
              disabled={loading}
              className="h-11 md:h-10 w-full sm:w-auto px-6 rounded-md font-bold text-[11px] md:text-xs uppercase tracking-widest shadow-none bg-primary hover:bg-primary/90"
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="animate-spin" />
                  <span>Updating...</span>
                </div>
              ) : (
                "Update Password"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}