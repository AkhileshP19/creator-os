"use client";

import { Control, FieldPath, FieldValues, useController } from "react-hook-form";

import { FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { DatePicker } from "./date-picker";

interface FormDatePickerFieldProps<TFieldValues extends FieldValues> {
  control: Control<TFieldValues>;
  name: FieldPath<TFieldValues>;
  label?: string;
  required?: boolean;
  disableCondition?: (date: Date) => boolean; // function, not boolean
  readOnly?: boolean; // Optional prop to control read-only state
  disabled?: boolean;
}

/**
 * A reusable wrapper around your custom DatePicker component
 * used with react-hook-form.
 */
export function FormDatePickerField<TFieldValues extends FieldValues>({
  control,
  name,
  // readOnly prop removed
  label = "",
  required = false,
  disabled = false,
  disableCondition
}: FormDatePickerFieldProps<TFieldValues>) {
  const {
    field,
    fieldState: { error }
  } = useController({ control, name });

  return (
    <FormItem>
      {label && (
        <FormLabel>
          {label}
          {required && <span className="text-red-500">*</span>}
        </FormLabel>
      )}
      <FormControl>
        <DatePicker value={field.value} onChange={field.onChange} disabled={disableCondition} buttonDisabled={disabled} />
      </FormControl>
      <FormMessage className="text-red-500 text-xs">{error?.message}</FormMessage>
    </FormItem>
  );
}
