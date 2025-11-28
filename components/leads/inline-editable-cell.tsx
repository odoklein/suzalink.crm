"use client";

import { useState, useRef, useEffect, KeyboardEvent } from "react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

type CellType = "text" | "email" | "phone" | "select" | "readonly";

type InlineEditableCellProps = {
  value: string;
  type?: CellType;
  options?: { value: string; label: string }[];
  onSave: (value: string) => void;
  className?: string;
  placeholder?: string;
  isEditing?: boolean;
  onStartEdit?: () => void;
  onEndEdit?: () => void;
  onNavigate?: (direction: "up" | "down" | "left" | "right") => void;
};

export function InlineEditableCell({
  value,
  type = "text",
  options = [],
  onSave,
  className,
  placeholder = "-",
  isEditing = false,
  onStartEdit,
  onEndEdit,
  onNavigate,
}: InlineEditableCellProps) {
  const [localValue, setLocalValue] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSave();
    } else if (e.key === "Escape") {
      e.preventDefault();
      setLocalValue(value);
      onEndEdit?.();
    } else if (e.key === "Tab") {
      e.preventDefault();
      handleSave();
      onNavigate?.(e.shiftKey ? "left" : "right");
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      handleSave();
      onNavigate?.("up");
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      handleSave();
      onNavigate?.("down");
    }
  };

  const handleSave = () => {
    if (localValue !== value) {
      onSave(localValue);
    }
    onEndEdit?.();
  };

  const handleBlur = () => {
    handleSave();
  };

  if (type === "readonly") {
    return (
      <div className={cn("px-2 py-1.5 text-sm", className)}>
        {value || placeholder}
      </div>
    );
  }

  if (type === "select") {
    return (
      <Select
        value={value}
        onValueChange={(newValue) => {
          onSave(newValue);
        }}
      >
        <SelectTrigger 
          className={cn(
            "h-8 border-0 bg-transparent shadow-none focus:ring-1 focus:ring-primary-500",
            className
          )}
        >
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    );
  }

  if (isEditing) {
    return (
      <Input
        ref={inputRef}
        type={type === "email" ? "email" : type === "phone" ? "tel" : "text"}
        value={localValue}
        onChange={(e) => setLocalValue(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={handleBlur}
        className={cn(
          "h-8 px-2 py-1 border-0 bg-white shadow-sm ring-2 ring-primary-500 rounded-none focus-visible:ring-2 focus-visible:ring-primary-500",
          className
        )}
        placeholder={placeholder}
      />
    );
  }

  return (
    <div
      onClick={onStartEdit}
      onDoubleClick={onStartEdit}
      className={cn(
        "px-2 py-1.5 text-sm cursor-cell min-h-[32px] hover:bg-primary-50/50 transition-colors rounded-sm",
        !value && "text-muted-foreground",
        className
      )}
    >
      {value || placeholder}
    </div>
  );
}
