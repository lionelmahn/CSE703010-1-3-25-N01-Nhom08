import React from 'react';

import { cn } from '@/lib/utils';

const STEP_LABELS = [
  'Thông tin cá nhân',
  'Nhu cầu & thời gian',
  'Xác nhận',
  'Hoàn tất',
];

const StepIndicator = ({ currentStep }) => (
  <div className="relative flex justify-between items-start mt-2 mb-8 px-2 sm:px-4">
    <div className="absolute left-6 right-6 sm:left-8 sm:right-8 top-4 -translate-y-1/2 h-[2px] bg-gray-200 -z-10">
      <div
        className="h-full bg-slate-800 transition-all duration-300"
        style={{
          width: `${Math.max(0, Math.min(100, ((currentStep - 1) / (STEP_LABELS.length - 1)) * 100))}%`,
        }}
      />
    </div>

    {STEP_LABELS.map((label, idx) => {
      const step = idx + 1;
      const isActive = step === currentStep;
      const isDone = step < currentStep;

      return (
        <div
          key={label}
          className="flex flex-col items-center gap-2 bg-white px-1 sm:px-2"
        >
          <div
            className={cn(
              'w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border-2 transition',
              isActive && 'bg-slate-800 text-white border-slate-800 ring-4 ring-slate-100',
              isDone && 'bg-white text-slate-800 border-slate-800',
              !isActive && !isDone && 'border-gray-200 text-gray-400 bg-white'
            )}
          >
            {step}
          </div>
          <span
            className={cn(
              'text-[11px] sm:text-xs font-medium text-center max-w-[80px] sm:max-w-none',
              isActive && 'font-bold text-slate-800',
              !isActive && !isDone && 'text-gray-400',
              isDone && 'text-gray-500'
            )}
          >
            {label}
          </span>
        </div>
      );
    })}
  </div>
);

export default StepIndicator;
