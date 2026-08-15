import React from "react";
import { Calendar } from "lucide-react";
import { generateGoogleCalendarUrl } from "../lib/calender";

interface AddToCalendarButtonProps {
  title?: string;
  dueDate?: string | Date | null;
  description?: string;
  priority?: string;
}

export const AddToCalendarButton: React.FC<AddToCalendarButtonProps> = ({
  title,
  dueDate,
  description,
  priority,
}) => {
  // 1. Guard check FIRST: If no due date selected, render nothing
  if (!dueDate) return null;

  // 2. Generate URL only when due date exists
  const calendarUrl = generateGoogleCalendarUrl({ title, dueDate, description, priority });

  return (
    <a
      href={calendarUrl}
      target="_blank"
      rel="noopener noreferrer"i-50
      className="w-full py-2.5 px-3.5 rounded-lg bg-indigo-500/20 hover:bg-indigo-400/40 border border-indigo-500/20 text-indigo-300 text-xs font-medium transition-all flex items-center justify-center gap-2 shadow-sm"
      title="Add task deadline to Google Calendar"
    >
      <Calendar className="h-4 w-4 text-indigo-300 shrink-0" />
      <span>Add to Google Calendar</span>
    </a>
  );
};