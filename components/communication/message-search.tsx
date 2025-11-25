"use client";

import { useState } from "react";
import { Search, X, ChevronUp, ChevronDown } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type MessageSearchProps = {
  conversationId: string;
  onSearch: (query: string) => void;
  onClose: () => void;
};

export function MessageSearch({
  conversationId,
  onSearch,
  onClose,
}: MessageSearchProps) {
  const [query, setQuery] = useState("");
  const [currentIndex, setCurrentIndex] = useState(-1);
  const [totalResults, setTotalResults] = useState(0);

  const handleSearch = async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setTotalResults(0);
      setCurrentIndex(-1);
      return;
    }

    try {
      const res = await fetch(
        `/api/conversations/${conversationId}/search?q=${encodeURIComponent(searchQuery)}`
      );
      if (res.ok) {
        const data = await res.json();
        setTotalResults(data.results?.length || 0);
        setCurrentIndex(0);
        onSearch(searchQuery);
      }
    } catch (error) {
      console.error("Search error:", error);
    }
  };

  const handleNext = () => {
    if (currentIndex < totalResults - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  return (
    <div className="flex items-center gap-2 p-2 border-b border-gray-200 bg-white">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-body" />
        <Input
          placeholder="Rechercher dans la conversation..."
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            handleSearch(e.target.value);
          }}
          className="pl-10 pr-20"
        />
        {query && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
            {totalResults > 0 && (
              <span className="text-xs text-text-body">
                {currentIndex + 1} / {totalResults}
              </span>
            )}
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={() => {
                setQuery("");
                setTotalResults(0);
                setCurrentIndex(-1);
                onSearch("");
              }}
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        )}
      </div>
      {totalResults > 0 && (
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={handlePrevious}
            disabled={currentIndex === 0}
          >
            <ChevronUp className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={handleNext}
            disabled={currentIndex === totalResults - 1}
          >
            <ChevronDown className="h-4 w-4" />
          </Button>
        </div>
      )}
      <Button variant="ghost" size="icon" onClick={onClose}>
        <X className="h-4 w-4" />
      </Button>
    </div>
  );
}

