import React from 'react';
import { Check } from 'lucide-react';

interface StepperProps {
  steps: string[];
  currentStep: number;
  completedSteps: number[];
  className?: string;
}

export default function Stepper({ steps, currentStep, completedSteps, className = '' }: StepperProps) {
  return (
    <div className={`w-full ${className}`}>
      <div className="flex items-center justify-between">
        {steps.map((step, index) => {
          const stepNumber = index + 1;
          const isCompleted = completedSteps.includes(stepNumber);
          const isCurrent = currentStep === stepNumber;

          return (
            <React.Fragment key={index}>
              {/* Step Circle */}
              <div className="flex flex-col items-center">
                <div
                  className={`
                    relative flex items-center justify-center w-12 h-12 rounded-full border-2 transition-all duration-300
                    ${isCompleted 
                      ? 'bg-[#3b8169] border-[#3b8169] text-white shadow-lg' 
                      : isCurrent 
                        ? 'bg-white border-[#1a3d2e] text-[#1a3d2e] shadow-md ring-0' 
                        : 'bg-gray-100 border-gray-300 text-gray-500'
                    }
                  `}
                >
                  {isCompleted ? (
                    <Check className="w-6 h-6 animate-scale-in" />
                  ) : (
                    <span className="text-sm font-semibold">{stepNumber}</span>
                  )}
                  
                  {/* Pulse animation for current step */}
                  {isCurrent && (
                    <div className="absolute inset-0 rounded-full bg-blue-600 opacity-20 animate-ping" />
                  )}
                </div>
                
                {/* Step Label */}
                <div className="mt-3 text-center">
                  <p className={`text-sm font-medium transition-colors duration-200 ${
                    isCompleted || isCurrent ? 'text-gray-900' : 'text-gray-500'
                  }`}>
                    {step}
                  </p>
                </div>
              </div>

              {/* Connector Line */}
              {index < steps.length - 1 && (
                <div className="flex-1 mx-4">
                  <div className={`h-0.5 transition-all duration-500 ${
                    isCompleted ? 'bg-gradient-to-r from-blue-600 to-indigo-600' : 'bg-gray-200'
                  }`} />
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}
