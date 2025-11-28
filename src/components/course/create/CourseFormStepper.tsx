// app/(tutor)/courses/create/CourseFormStepper.tsx

import React from "react";
import { cn } from "@/lib/utils";
import { Check, type LucideIcon } from "lucide-react";

interface Step {
  id: number;
  name: string;
  icon: LucideIcon;
}

interface CourseFormStepperProps {
  steps: Step[];
  currentStep: number;
}

export default function CourseFormStepper({
  steps,
  currentStep,
}: CourseFormStepperProps) {
  return (
    <>
      {/* --- Mobile Stepper --- */}
      <div className="md:hidden mb-6">
        <p className="text-sm font-semibold text-primary">
          Step {currentStep} of {steps.length}
        </p>
        <h2 className="text-lg font-semibold text-foreground">
          {steps[currentStep - 1].name}
        </h2>
      </div>

      {/* --- Desktop Stepper (Themed) --- */}
      <div className="hidden md:flex items-center mb-8 border-b border-border pb-4">
        {steps.map((step, index) => (
          <React.Fragment key={step.id}>
            <div
              className={cn(
                "flex items-center text-sm transition-colors duration-300",
                currentStep > index + 1
                  ? "text-primary" // Completed
                  : currentStep === index + 1
                  ? "text-primary font-semibold" // Active
                  : "text-muted-foreground" // Inactive
              )}
            >
              <div
                className={cn(
                  "flex items-center justify-center w-6 h-6 rounded-full border-2 mr-2",
                  currentStep > index + 1
                    ? "bg-primary border-primary text-primary-foreground" // Completed
                    : currentStep === index + 1
                    ? "border-primary" // Active
                    : "border-border" // Inactive
                )}
              >
                {currentStep > index + 1 ? (
                  <Check size={14} />
                ) : (
                  step.id
                )}
              </div>
              {step.name}
            </div>
            {index < steps.length - 1 && (
              <div
                className={cn(
                  "flex-1 border-t-2 mx-4 transition-colors",
                  currentStep > index + 1 ? "border-primary" : "border-border"
                )}
              ></div>
            )}
          </React.Fragment>
        ))}
      </div>
    </>
  );
}