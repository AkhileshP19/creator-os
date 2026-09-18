"use client";

import { CalendarIcon, Clock } from "lucide-react";
import { format } from "date-fns";
import { useMemo } from "react";

import { cn } from "@/lib/utils";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface ScheduledDateTimePickerProps {
  date: Date | undefined;
  time: string;
  onDateChange: (date: Date | undefined) => void;
  onTimeChange: (time: string) => void;
  disabled?: boolean;
}

interface TimeOption {
  value: string;
  label: string;
}

const TIME_INTERVAL_MINUTES = 15;
const TOTAL_MINUTES_IN_DAY = 24 * 60;

const formatTimeLabel = (hours: number, minutes: number): string => {
  const period = hours < 12 ? "AM" : "PM";
  const displayHours = hours % 12 || 12;

  return `${String(displayHours).padStart(2, "0")}:${String(minutes).padStart(
    2,
    "0",
  )} ${period}`;
};

const generateTimeOptions = (): TimeOption[] => {
  const options: TimeOption[] = [];

  for (
    let totalMinutes = 0;
    totalMinutes < TOTAL_MINUTES_IN_DAY;
    totalMinutes += TIME_INTERVAL_MINUTES
  ) {
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;

    options.push({
      value: `${String(hours).padStart(2, "0")}:${String(minutes).padStart(
        2,
        "0",
      )}`,
      label: formatTimeLabel(hours, minutes),
    });
  }

  return options;
};

export const ScheduledDateTimePicker = ({
  date,
  time,
  onDateChange,
  onTimeChange,
  disabled = false,
}: ScheduledDateTimePickerProps) => {
  const timeOptions = useMemo<TimeOption[]>(() => generateTimeOptions(), []);

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      {/* Date Picker */}
      <Popover>
        <PopoverTrigger
          type="button"
          disabled={disabled}
          className={cn(
            "flex min-w-0 w-full items-center justify-start overflow-hidden rounded-lg border border-input bg-transparent px-2.5 py-2 text-left text-sm font-normal transition-colors outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50",
            !date && "text-muted-foreground",
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4 shrink-0" />

          <span className="truncate">
            {date ? format(date, "PPP") : "Select date"}
          </span>
        </PopoverTrigger>

        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={date}
            onSelect={onDateChange}
            disabled={disabled}
          />
        </PopoverContent>
      </Popover>

      {/* Time Picker */}
      <Select
        value={time}
        onValueChange={(value) => {
          if (value !== null) {
            onTimeChange(value);
          }
        }}
        disabled={disabled}
      >
        <SelectTrigger className="min-w-0 w-full">
          <Clock className="mr-2 h-4 w-4" />
          <SelectValue>
            {timeOptions.find((option) => option.value === time)?.label ??
              "Select time"}
          </SelectValue>
        </SelectTrigger>

        <SelectContent className="max-h-60">
          {timeOptions.map((option: TimeOption) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};
