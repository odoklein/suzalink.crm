"use client";

import { format, isToday, isYesterday, isThisWeek, isThisYear } from "date-fns";
import { fr } from "date-fns/locale";

type DateSeparatorProps = {
  date: Date;
};

export function DateSeparator({ date }: DateSeparatorProps) {
  const getDateLabel = () => {
    if (isToday(date)) {
      return "Aujourd'hui";
    }
    if (isYesterday(date)) {
      return "Hier";
    }
    if (isThisWeek(date)) {
      return format(date, "EEEE", { locale: fr });
    }
    if (isThisYear(date)) {
      return format(date, "d MMMM", { locale: fr });
    }
    return format(date, "d MMMM yyyy", { locale: fr });
  };

  return (
    <div className="flex items-center gap-4 my-4">
      <div className="flex-1 border-t border-gray-200"></div>
      <span className="text-xs font-medium text-text-body uppercase tracking-wide">
        {getDateLabel()}
      </span>
      <div className="flex-1 border-t border-gray-200"></div>
    </div>
  );
}

