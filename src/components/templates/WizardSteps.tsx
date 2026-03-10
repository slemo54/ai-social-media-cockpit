'use client';

import { motion } from 'framer-motion';
import { Camera, Sparkles, Move, Download, Check } from 'lucide-react';

interface WizardStepsProps {
  currentStep: number;
  onStepClick: (step: number) => void;
  completedSteps: Set<number>;
}

const STEPS = [
  { id: 1, label: 'Scegli Foto', icon: Camera },
  { id: 2, label: 'AI Processing', icon: Sparkles },
  { id: 3, label: 'Aggiustamenti', icon: Move },
  { id: 4, label: 'Export', icon: Download },
];

export default function WizardSteps({
  currentStep,
  onStepClick,
  completedSteps,
}: WizardStepsProps) {
  return (
    <nav className="flex items-center gap-1 w-full" aria-label="Wizard steps">
      {STEPS.map((step, idx) => {
        const Icon = step.icon;
        const isActive = currentStep === step.id;
        const isDone = completedSteps.has(step.id);
        const isClickable = isDone || step.id <= currentStep;

        return (
          <div key={step.id} className="flex items-center flex-1 last:flex-initial">
            {/* Step circle + label */}
            <button
              onClick={() => isClickable && onStepClick(step.id)}
              disabled={!isClickable}
              className={`relative flex flex-col items-center gap-1.5 group transition-all duration-300 ${
                isClickable ? 'cursor-pointer' : 'cursor-not-allowed opacity-40'
              }`}
            >
              <motion.div
                layout
                className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 ${
                  isActive
                    ? 'bg-gradient-to-br from-[#003366] to-[#004A8F] shadow-lg shadow-[#003366]/30'
                    : isDone
                    ? 'bg-green-500/20 border border-green-500/40'
                    : 'bg-[#1A1A1A] border border-[#262626] group-hover:border-[#333333]'
                }`}
              >
                {isDone && !isActive ? (
                  <Check className="w-4 h-4 text-green-400" />
                ) : (
                  <Icon className={`w-4 h-4 ${
                    isActive ? 'text-white' : 'text-[#737373]'
                  }`} />
                )}
              </motion.div>

              <span className={`text-[10px] font-medium whitespace-nowrap transition-colors ${
                isActive
                  ? 'text-[#FAFAFA]'
                  : isDone
                  ? 'text-green-400'
                  : 'text-[#525252]'
              }`}>
                {step.label}
              </span>

              {/* Active glow */}
              {isActive && (
                <motion.div
                  layoutId="wizard-glow"
                  className="absolute -inset-1 rounded-2xl bg-[#003366]/10 -z-10"
                  transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                />
              )}
            </button>

            {/* Connector line */}
            {idx < STEPS.length - 1 && (
              <div className="flex-1 h-px mx-2 relative">
                <div className="absolute inset-0 bg-[#262626]" />
                <motion.div
                  className="absolute inset-y-0 left-0 bg-gradient-to-r from-[#003366] to-[#004A8F]"
                  initial={{ width: '0%' }}
                  animate={{
                    width: isDone ? '100%' : isActive ? '50%' : '0%',
                  }}
                  transition={{ duration: 0.4, ease: 'easeOut' }}
                />
              </div>
            )}
          </div>
        );
      })}
    </nav>
  );
}
