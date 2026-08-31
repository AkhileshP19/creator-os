import { Button } from "./ui/button";

import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import { Show, UserButton } from "@clerk/nextjs";
import {
  Bell,
  ChevronLeft,
  ChevronRight,
  CircleQuestionMark,
  Cog,
  Search,
} from "lucide-react";

interface HeaderProps {
  isSidebarOpen: boolean;
  setIsSidebarOpen: (open: boolean) => void;
}

export const Header = ({ isSidebarOpen, setIsSidebarOpen }: HeaderProps) => {
  return (
    <div className="flex h-14 border items-center relative">
      <div
        className={`h-14 border-r flex items-center justify-start gap-4 px-4 transition-all duration-300 ${isSidebarOpen
            ? "w-[226px]"
            : "w-[70px] flex items-center justify-center overflow-hidden`"
          }`}
      >
        <Cog height={26} width={26} strokeWidth={2} />
        {isSidebarOpen && (
          <span className="font-bold text-xl whitespace-nowrap">CreatorOS</span>
        )}
      </div>
      <div className="flex-1 flex justify-between items-center px-4">
        <div>Dashboard</div>
        <div className="flex gap-6">
          <InputGroup className="max-w-xs">
            <InputGroupInput placeholder="Search anything..." />
            <InputGroupAddon>
              <Search />
            </InputGroupAddon>
          </InputGroup>
          <Button variant="outline">
            <Bell />
          </Button>
          <Button variant="outline">
            <CircleQuestionMark />
          </Button>
          <Show when="signed-in">
            <UserButton />
          </Show>
        </div>
      </div>
      {/* Fixed sidebar toggle position */}
      <Button
        type="button"
        className={`absolute top-1/2 -translate-y-1/2 h-6 w-6 rounded-full z-20 transition-all duration-300 cursor-pointer ${isSidebarOpen ? "left-[214px]" : "left-[56px]"
          }`}
        variant="outline"
        onPointerDown={(e) => {
          e.preventDefault();
          setIsSidebarOpen(!isSidebarOpen);
        }}
      >
        {isSidebarOpen ? (
          <ChevronLeft className="h-4 w-4 pointer-events-none" />
        ) : (
          <ChevronRight className="h-4 w-4 pointer-events-none" />
        )}
      </Button>
    </div>
  );
};
