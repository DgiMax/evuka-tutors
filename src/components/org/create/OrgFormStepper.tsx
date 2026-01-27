import React from "react";
import { cn } from "@/lib/utils";
import { Check, type LucideIcon } from "lucide-react";

interface Step {
  id: number;
  title: string;
  icon: LucideIcon;
}

interface OrgFormStepperProps {
  steps: Step[];
  currentStep: number;
}

export default function OrgFormStepper({
  steps,
  currentStep,
}: OrgFormStepperProps) {
  const progressPercentage = Math.round(((currentStep - 1) / steps.length) * 100);

  return (
    <div className="flex flex-col w-full h-full p-0 md:p-6">
      {/* --- Mobile Stepper (Progress Bar) --- */}
      <div className="md:hidden mb-6 w-full">
        <div className="flex justify-between items-end mb-2">
            <div>
                <span className="text-xs font-semibold text-primary uppercase tracking-wider">
                    Step {currentStep} of {steps.length}
                </span>
                <h2 className="text-lg font-bold text-foreground leading-none mt-1">
                    {steps[currentStep - 1].title}
                </h2>
            </div>
            <span className="text-xs text-muted-foreground font-medium">
                {progressPercentage}%
            </span>
        </div>
        <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
            <div 
                className="h-full bg-primary transition-all duration-300 ease-out rounded-full"
                style={{ width: `${(currentStep / steps.length) * 100}%` }}
            />
        </div>
      </div>

      {/* --- Desktop Stepper (Vertical Sidebar) --- */}
      <div className="hidden md:flex flex-col gap-8 relative">
        <div className="absolute left-4 top-4 bottom-4 w-px bg-border -z-10" />
        
        {steps.map((step, index) => {
          const isActive = currentStep === index + 1;
          const isCompleted = currentStep > index + 1;
          const Icon = step.icon;

          return (
            <div key={step.id} className="flex items-center gap-4 group">
              <div
                className={cn(
                  "relative flex items-center justify-center w-8 h-8 rounded-full border-2 bg-background transition-all duration-300 z-10",
                  isCompleted
                    ? "border-primary bg-primary text-primary-foreground"
                    : isActive
                    ? "border-primary text-primary"
                    : "border-muted-foreground/30 text-muted-foreground"
                )}
              >
                {isCompleted ? (
                  <Check size={14} strokeWidth={3} />
                ) : (
                  <Icon size={14} />
                )}
              </div>
              <div className="flex flex-col">
                <span
                  className={cn(
                    "text-sm font-medium transition-colors duration-300",
                    isActive || isCompleted
                      ? "text-foreground"
                      : "text-muted-foreground"
                  )}
                >
                  {step.title}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}