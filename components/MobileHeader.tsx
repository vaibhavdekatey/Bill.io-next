import React from "react";
import Link from "next/link";

interface MobileHeaderProps {
  onMenuClick: () => void;
}

const MobileHeader: React.FC<MobileHeaderProps> = ({ onMenuClick }) => {
  return (
    <div className="lg:hidden flex items-center justify-between px-4 py-3 bg-neutral-950 border-b border-neutral-800 sticky top-0 z-40">
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          className="text-neutral-400 hover:text-white transition-colors p-1 cursor-pointer"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="3" y1="12" x2="21" y2="12"></line>
            <line x1="3" y1="6" x2="21" y2="6"></line>
            <line x1="3" y1="18" x2="21" y2="18"></line>
          </svg>
        </button>
        <Link href="/dashboard" className="h-6">
          <img src="/bill.io_ico.svg" alt="Bill.io" className="h-full w-auto" />
        </Link>
      </div>
    </div>
  );
};

export default MobileHeader;
