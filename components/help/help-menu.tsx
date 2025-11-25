"use client";

import { HelpCircle, BookOpen, MessageCircle, ExternalLink } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

export function HelpMenu() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <HelpCircle className="h-5 w-5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuItem asChild>
          <a
            href="#"
            className="flex items-center gap-2 cursor-pointer"
            onClick={(e) => {
              e.preventDefault();
              // TODO: Open help center modal/page
            }}
          >
            <BookOpen className="h-4 w-4" />
            Help Center
          </a>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <a
            href="#"
            className="flex items-center gap-2 cursor-pointer"
            onClick={(e) => {
              e.preventDefault();
              // TODO: Open keyboard shortcuts modal
            }}
          >
            <ExternalLink className="h-4 w-4" />
            Keyboard Shortcuts
          </a>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <a
            href="#"
            className="flex items-center gap-2 cursor-pointer"
            onClick={(e) => {
              e.preventDefault();
              // TODO: Open contact support
            }}
          >
            <MessageCircle className="h-4 w-4" />
            Contact Support
          </a>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}






