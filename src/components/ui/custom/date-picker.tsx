// components/ui-custom/date-picker.tsx
import { useState } from "react";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { FormControl } from "@/components/ui/form";
import { cn } from "@/lib/utils";

interface DatePickerProps {
  value: Date | undefined;
  onChange: (date: Date | undefined) => void;
  placeholder?: string;
  disabled?: ((date: Date) => boolean) | boolean;
  buttonDisabled?: boolean;
  disabledDates?: (date: Date) => boolean;
  modal?: boolean;
}

export const DatePicker = ({
  value,
  onChange,
  placeholder,
  disabled,
  buttonDisabled = false,
  disabledDates
}: DatePickerProps) => {
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen} modal={true}>
      <PopoverTrigger asChild>
        <FormControl>
          <Button
            variant="outline"
            disabled={buttonDisabled}
            className={cn("w-full pl-3 text-left font-normal border border-border", !value && "text-muted-foreground")}
          >
            {value?.toString() ? (
              format(value, "MM/dd/yyyy").toString()
            ) : (
              <span>{placeholder ? placeholder : "MM/DD/YYYY"}</span>
            )}
            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
          </Button>
        </FormControl>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={value}
          onSelect={(date) => {
            onChange(date);
            setOpen(false);
          }}
          disabled={disabledDates || disabled}
          initialFocus
        />
      </PopoverContent>
    </Popover>
  );
};
