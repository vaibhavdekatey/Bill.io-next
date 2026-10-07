import React from "react";

interface LoadingScreenProps {
  message?: string;
}

export default function LoadingScreen({ message = "Loading..." }: LoadingScreenProps) {
  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col items-center justify-center gap-4 text-white font-lexend select-none">
      <div className="relative flex items-center justify-center">
        <div className="w-14 h-14 rounded-full border-2 border-neutral-800 border-t-blue-500 animate-spin" />
        <div className="absolute w-7 h-7 flex items-center justify-center">
          <img
            src="/bill.io_ico.svg"
            alt="Bill.io"
            className="w-full h-full object-contain opacity-90 animate-pulse"
          />
        </div>
      </div>
      <p className="text-xs uppercase tracking-widest text-neutral-400 font-light animate-pulse mt-2">
        {message}
      </p>
    </div>
  );
}
