import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { UseFormReturn } from "react-hook-form";
import { newContentFormSchema } from "@/schema/validation-schemas/new-content-schema";
import * as z from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { ProjectData } from "@/types/dashboard-types";
import { Loader2 } from "lucide-react";
import { Dispatch, SetStateAction, useEffect } from "react";
import { ContentIdea } from "@/types/content-types";

interface AddNewContentModalProps {
  open: boolean;
  onOpenChange: Dispatch<SetStateAction<boolean>>;
  form: UseFormReturn<z.infer<typeof newContentFormSchema>>;
  onSubmit: (data: z.infer<typeof newContentFormSchema>) => void;
  allProjects: ProjectData[];
  isSubmitting: boolean;
  mode: "create" | "edit";
  selectedContentData?: ContentIdea;
  isUpdating: boolean;
}

const statusLabels: Record<string, string> = {
  DRAFT: "Draft",
  PENDING: "Pending",
  IN_PROGRESS: "In Progress",
  COMPLETED: "Completed",
  ARCHIVED: "Archived",
};

const priorityLabels: Record<string, string> = {
  P0: "Critical",
  P1: "High",
  P2: "Medium",
  P3: "Low",
};

const emptyContentFormValues = {
  projectId: "",
  title: "",
  description: "",
  category: "",
  tags: [] as string[],
  status: "",
  scheduledDate: undefined,
  priority: "",
};

export const AddNewContentModal = ({
  open,
  onOpenChange,
  form,
  onSubmit,
  allProjects,
  isSubmitting,
  mode,
  selectedContentData,
  isUpdating,
}: AddNewContentModalProps) => {
  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      form.reset(emptyContentFormValues);
    }
    onOpenChange(nextOpen);
  };

  useEffect(() => {
    if (!open) {
      return;
    }

    if (mode === "create") {
      form.reset(emptyContentFormValues);
      return;
    }

    if (selectedContentData) {
      form.reset({
        projectId: selectedContentData.projectId,
        title: selectedContentData.title,
        description: selectedContentData.description ?? "",
        category: selectedContentData.category ?? "",
        tags: Array.isArray(selectedContentData.tags)
          ? (selectedContentData.tags as string[])
          : [],
        status: selectedContentData.status,
        priority: selectedContentData.priority,
        scheduledDate: selectedContentData.scheduledDate
          ? new Date(selectedContentData.scheduledDate)
          : undefined,
      });
    }
  }, [open, selectedContentData, form, mode]);

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <Form {...form}>
        <DialogContent className="sm:max-w-lg">
          {/* The form must be inside DialogContent because the dialog is portaled. */}
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <DialogHeader>
              <DialogTitle>
                {mode === "create" ? "Add New Content" : "Update Content"}
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-4 py-4">
              {/* Title Field */}
              <FormField
                control={form.control}
                name="projectId"
                render={({ field, fieldState }) => (
                  <FormItem>
                    <FormLabel>
                      Projects <span className="text-red-500">*</span>
                    </FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select Project">
                            {
                              allProjects.find((p) => p.id === field.value)
                                ?.name
                            }
                          </SelectValue>
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {allProjects.map((project) => (
                          <SelectItem key={project.id} value={project.id}>
                            {project.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {fieldState.error && (
                      <FormMessage>{fieldState.error?.message}</FormMessage>
                    )}
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="title"
                render={({ field, fieldState }) => (
                  <FormItem>
                    <FormLabel>
                      Title <span className="text-red-500">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input placeholder="Enter title..." {...field} />
                    </FormControl>
                    {fieldState.error && (
                      <FormMessage>{fieldState.error?.message}</FormMessage>
                    )}
                  </FormItem>
                )}
              />

              {/* Description Field */}
              <FormField
                control={form.control}
                name="description"
                render={({ field, fieldState }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Enter description..." {...field} />
                    </FormControl>
                    {fieldState.error && (
                      <FormMessage>{fieldState.error?.message}</FormMessage>
                    )}
                  </FormItem>
                )}
              />

              {/* category */}
              <FormField
                control={form.control}
                name="category"
                render={({ field, fieldState }) => (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter category" {...field} />
                    </FormControl>
                    {fieldState.error && (
                      <FormMessage>{fieldState.error?.message}</FormMessage>
                    )}
                  </FormItem>
                )}
              />

              {/* Tags Field */}
              <FormField
                control={form.control}
                name="tags"
                render={({ field, fieldState }) => (
                  <FormItem>
                    <FormLabel>Tags</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Enter tags separated by commas..."
                        value={field?.value?.join(", ")}
                        onChange={(e) =>
                          field.onChange(
                            e.target.value.split(",").map((tag) => tag.trim()),
                          )
                        }
                      />
                    </FormControl>
                    {fieldState.error && (
                      <FormMessage>{fieldState.error?.message}</FormMessage>
                    )}
                  </FormItem>
                )}
              />

              {/* Scheduled Date Field */}
              <FormField
                control={form.control}
                name="scheduledDate"
                render={({ field, fieldState }) => (
                  <FormItem>
                    <FormLabel>Scheduled Date</FormLabel>
                    <FormControl>
                      <Input
                        type="date"
                        value={
                          field.value
                            ? new Date(field.value).toISOString().split("T")[0]
                            : ""
                        }
                        onChange={(e) =>
                          field.onChange(
                            e.target.value ? new Date(e.target.value) : null,
                          )
                        }
                      />
                    </FormControl>
                    {fieldState.error && (
                      <FormMessage>{fieldState.error?.message}</FormMessage>
                    )}
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2">
                {/* Status Field */}
                <FormField
                  control={form.control}
                  name="status"
                  render={({ field, fieldState }) => (
                    <FormItem>
                      <FormLabel>
                        Status <span className="text-red-500">*</span>
                      </FormLabel>
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue>
                              {(value) =>
                                statusLabels[value] ?? "Select a status"
                              }
                            </SelectValue>
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="DRAFT">Draft</SelectItem>
                          <SelectItem value="PENDING">Pending</SelectItem>
                          <SelectItem value="IN_PROGRESS">
                            In Progress
                          </SelectItem>
                          <SelectItem value="COMPLETED">Completed</SelectItem>
                          <SelectItem value="ARCHIVED">Archived</SelectItem>
                        </SelectContent>
                      </Select>
                      {fieldState.error && (
                        <FormMessage>{fieldState.error?.message}</FormMessage>
                      )}
                    </FormItem>
                  )}
                />

                {/* Priority Field */}
                <FormField
                  control={form.control}
                  name="priority"
                  render={({ field, fieldState }) => (
                    <FormItem>
                      <FormLabel>
                        Priority <span className="text-red-500">*</span>
                      </FormLabel>
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue>
                              {(value) =>
                                priorityLabels[value] ?? "Select a priority"
                              }
                            </SelectValue>
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="P0">Critical</SelectItem>
                          <SelectItem value="P1">High</SelectItem>
                          <SelectItem value="P2">Medium</SelectItem>
                          <SelectItem value="P3">Low</SelectItem>
                        </SelectContent>
                      </Select>
                      {fieldState.error && (
                        <FormMessage>{fieldState.error?.message}</FormMessage>
                      )}
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-4 mt-3">
              <Button
                type="button"
                variant="outline"
                className="cursor-pointer p-4"
                onClick={() => {
                  onOpenChange(false);
                  form.reset();
                }}
              >
                Cancel
              </Button>

              <Button
                type="submit"
                className="text-white bg-indigo-600 hover:bg-indigo-700 hover:text-white p-4 cursor-pointer"
                disabled={isSubmitting || isUpdating}
              >
                {isSubmitting || isUpdating ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                    <span>
                      {mode === "create" ? "Submitting..." : "Updating..."}
                    </span>
                  </>
                ) : (
                  <>{mode === "create" ? "Submit" : "Update"}</>
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Form>
    </Dialog>
  );
};
