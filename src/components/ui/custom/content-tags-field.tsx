"use client";

import { InputHTMLAttributes, useRef, useState } from "react";
import {
  Control,
  FieldValues,
  FieldPath,
  useFormContext,
  useController,
} from "react-hook-form";
import { X } from "lucide-react";

import {
  FormItem,
  FormLabel,
  FormMessage,
  FormControl,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { calculateTagsLength } from "@/schema/validation-schemas/new-content-schema";

export interface FormTagsFieldProps<
  TFieldValues extends FieldValues,
> extends Omit<InputHTMLAttributes<HTMLInputElement>, "value" | "onChange"> {
  control: Control<TFieldValues>;
  name: FieldPath<TFieldValues>;
  label?: string;
  placeholder?: string;
  required?: boolean;
  isLabel?: boolean; // If true, show label
  className?: string;
}

export function FormTagsField<TFieldValues extends FieldValues>({
  control,
  name,
  label = "",
  placeholder = "Type a tag, then press Enter or comma to add it...",
  required = false,
  isLabel = true,
  className,
  disabled = false,
  readOnly,
  ...rest
}: FormTagsFieldProps<TFieldValues>) {
  const { setError, clearErrors } = useFormContext<TFieldValues>();
  const {
    field,
    fieldState: { error },
  } = useController({ name, control });
  const [draft, setDraft] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const tags: string[] = Array.isArray(field.value)
    ? (field.value as string[])
    : [];
  const hasDuplicate = (tag: string) =>
    tags.some((existingTag) => existingTag.toLowerCase() === tag.toLowerCase());

  const showDuplicateError = () => {
    setError(name, {
      type: "duplicate",
      message: "This tag has already been added.",
    });
  };

  const addTags = (value: string) => {
    const parsedTags = value
      .split(",")
      .map((tag) => tag.trim())
      .filter(Boolean);
    let nextTags = tags;
    let foundDuplicate = false;

    for (const tag of parsedTags) {
      if (
        nextTags.some(
          (existingTag) => existingTag.toLowerCase() === tag.toLowerCase(),
        )
      ) {
        foundDuplicate = true;
        continue;
      }
      nextTags = [...nextTags, tag];
    }

    field.onChange(nextTags);
    setDraft("");
    if (foundDuplicate) {
      showDuplicateError();
    } else {
      clearErrors(name);
    }

    return foundDuplicate;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const parts = value.split(",");
    const completeTags = parts.slice(0, -1).join(",");
    const nextDraft = parts.at(-1) ?? "";
    let foundDuplicate = false;

    if (completeTags.trim()) {
      foundDuplicate = addTags(completeTags);
    }

    setDraft(nextDraft);
    if (nextDraft.trim() && hasDuplicate(nextDraft.trim())) {
      showDuplicateError();
    } else if (
      nextDraft.trim() &&
      calculateTagsLength([...tags, nextDraft.trim()]) > 500
    ) {
      setError(name, {
        type: "custom",
        message: "Tags exceed YouTube's 500 character limit",
      });
    } else if (!foundDuplicate && (!error || error.type === "duplicate")) {
      clearErrors(name);
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter" || event.key === ",") {
      event.preventDefault();
      if (draft.trim()) {
        addTags(draft);
      }
    }

    if (event.key === "Backspace" && !draft && tags.length > 0) {
      field.onChange(tags.slice(0, -1));
    }
  };

  const removeTag = (tagToRemove: string) => {
    field.onChange(tags.filter((tag) => tag !== tagToRemove));
    clearErrors(name);
  };

  const currentTagsLength = calculateTagsLength(
    draft.trim() ? [...tags, draft.trim()] : tags,
  );

  return (
    <FormItem className={className}>
      {isLabel && label && (
        <FormLabel>
          {label} {required && <span className="text-red-500">*</span>}
        </FormLabel>
      )}
      <FormControl>
        <div
          className={cn(
            "flex max-h-28 min-h-8 w-full cursor-text flex-wrap content-start gap-1.5 overflow-y-auto rounded-lg border border-input bg-transparent p-1.5 focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50",
            error && "border-destructive ring-3 ring-destructive/20",
            disabled &&
              "pointer-events-none cursor-not-allowed bg-input/50 opacity-50",
          )}
          onClick={() => inputRef.current?.focus()}
        >
          {tags.map((tag) => (
            <Badge
              key={tag}
              variant="secondary"
              className="h-7 px-2.5 py-1 flex gap-2"
            >
              {tag}
              <button
                type="button"
                aria-label={`Remove ${tag}`}
                className="cursor-pointer rounded-full outline-none hover:text-destructive focus-visible:ring-2 focus-visible:ring-ring mt-0.5"
                onClick={() => removeTag(tag)}
              >
                <X aria-hidden="true" className="size-3.5" strokeWidth={2.5} />
              </button>
            </Badge>
          ))}
          <Input
            {...rest}
            ref={(element) => {
              inputRef.current = element;
              field.ref(element);
            }}
            type="text"
            className="h-6 min-w-24 flex-1 border-0 px-1 py-0 shadow-none focus-visible:ring-0"
            placeholder={
              tags.length
                ? "Add a tag, then press Enter or comma..."
                : placeholder
            }
            value={draft}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            onBlur={field.onBlur}
            disabled={disabled}
            readOnly={readOnly}
          />
        </div>
      </FormControl>
      <div className="flex items-center justify-between text-xs min-h-[1.25rem] mt-1">
        <div>
          {error && (
            <FormMessage className="text-destructive text-xs">
              {error.message}
            </FormMessage>
          )}
        </div>
        <span
          className={cn(
            "text-muted-foreground ml-auto font-mono text-[0.75rem]",
            currentTagsLength > 500 && "text-destructive font-semibold",
          )}
        >
          {currentTagsLength}/500
        </span>
      </div>
    </FormItem>
  );
}
