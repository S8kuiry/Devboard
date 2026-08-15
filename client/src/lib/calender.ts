interface CalendarParams {
  title?: string;
  dueDate?: string | Date | null;
  description?: string;
  priority?: string;
}

export const generateGoogleCalendarUrl = ({
  title,
  dueDate,
  description,
  priority,
}: CalendarParams): string => {
  if (!dueDate) return "#";

  const parsedDueDate = new Date(dueDate);
  if (isNaN(parsedDueDate.getTime())) return "#";

  // 1. Reset time for exact day comparison
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const due = new Date(parsedDueDate);
  due.setHours(0, 0, 0, 0);

  // 2. Compute day difference
  const diffInMs = due.getTime() - today.getTime();
  const diffInDays = Math.round(diffInMs / (1000 * 60 * 60 * 24));

  // 3. Status prefix
  let statusPrefix = "";
  if (diffInDays === 0) {
    statusPrefix = "[URGENT: DUE TODAY] ";
  } else if (diffInDays === 1) {
    statusPrefix = "[DUE TOMORROW] ";
  } else if (diffInDays < 0) {
    statusPrefix = "[OVERDUE] ";
  } else {
    statusPrefix = `[Due in ${diffInDays} days] `;
  }

  // 4. Format dates (YYYYMMDD)
  const year = parsedDueDate.getFullYear();
  const month = String(parsedDueDate.getMonth() + 1).padStart(2, "0");
  const day = String(parsedDueDate.getDate()).padStart(2, "0");
  const startDateFormatted = `${year}${month}${day}`;

  const nextDay = new Date(parsedDueDate);
  nextDay.setDate(nextDay.getDate() + 1);
  const nextYear = nextDay.getFullYear();
  const nextMonth = String(nextDay.getMonth() + 1).padStart(2, "0");
  const nextDayNum = String(nextDay.getDate()).padStart(2, "0");
  const endDateFormatted = `${nextYear}${nextMonth}${nextDayNum}`;

  // 5. Construct details including recommended notifications
  const eventTitle = encodeURIComponent(`${statusPrefix}${title || "New Task"}`);
  
  const formattedDetails = 
    `Task Details:\n${description || "No description provided."}\n\n` +
    `Priority: ${priority || "MEDIUM"}\n\n` +
    `🔔 Recommended Notifications to set above:\n` +
    `• 1 day before at 9:00 AM\n` +
    `• 0 days before at 9:00 AM (Due Date)`;

  const details = encodeURIComponent(formattedDetails);

  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${eventTitle}&dates=${startDateFormatted}/${endDateFormatted}&details=${details}`;
};