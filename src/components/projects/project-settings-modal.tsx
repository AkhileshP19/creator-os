import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { projectSettingsFormSchema } from "@/schema/validation-schemas/project-settings-schema";
import { ProjectData } from "@/types/dashboard-types";
import { Loader2 } from "lucide-react";
import { Dispatch, SetStateAction } from "react";
import { UseFormReturn } from "react-hook-form";
import * as z from "zod";

interface ProjectSettingsModalProps {
  open: boolean;
  onOpenChange: Dispatch<SetStateAction<boolean>>;
  form: UseFormReturn<z.infer<typeof projectSettingsFormSchema>>;
  onSubmit: (
    data: z.infer<typeof projectSettingsFormSchema>,
  ) => void | Promise<void>;
  mode: "create" | "edit";
  selectedProject: ProjectData | null;
  isSubmitting: boolean;
  isLoadingSettings: boolean;
}

export const ProjectSettingsModal = ({
  open,
  onOpenChange,
  form,
  onSubmit,
  mode,
  selectedProject,
  isSubmitting,
  isLoadingSettings,
}: ProjectSettingsModalProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <Form {...form}>
        <DialogContent className="sm:max-w-lg">
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <DialogHeader className="pb-4 border-b">
              <DialogTitle>
                {mode === "create"
                  ? "Configure Project Settings"
                  : "Update Project Settings"}
              </DialogTitle>
            </DialogHeader>

            {isLoadingSettings ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : (
              <>
                <div className="space-y-5 py-5">
                  {selectedProject && (
                    <div className="rounded-md border bg-muted/40 p-3">
                      <p className="text-xs text-muted-foreground">Project</p>
                      <p className="font-medium">{selectedProject.name}</p>
                    </div>
                  )}

                  <FormField
                    control={form.control}
                    name="brandName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          Brand Name <span className="text-red-500">*</span>
                        </FormLabel>

                        <FormControl>
                          <Input
                            placeholder="e.g. Everything Around You"
                            {...field}
                          />
                        </FormControl>

                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="defaultDuration"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          Default Duration
                          <span className="text-red-500"> *</span>
                        </FormLabel>

                        <FormControl>
                          <Input
                            type="number"
                            min={1}
                            max={300}
                            value={field.value}
                            onChange={(event) =>
                              field.onChange(event.target.valueAsNumber)
                            }
                          />
                        </FormControl>

                        <p className="text-xs text-muted-foreground">
                          Default video duration in seconds.
                        </p>

                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="defaultAspectRatio"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          Default Aspect Ratio
                          <span className="text-red-500"> *</span>
                        </FormLabel>

                        <Select
                          value={field.value}
                          onValueChange={field.onChange}
                        >
                          <FormControl>
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="Select aspect ratio" />
                            </SelectTrigger>
                          </FormControl>

                          <SelectContent>
                            <SelectItem value="9:16">
                              9:16 — Vertical
                            </SelectItem>
                          </SelectContent>
                        </Select>

                        <p className="text-xs text-muted-foreground">
                          Currently, AI generation supports vertical 9:16
                          content.
                        </p>

                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="flex items-center justify-end gap-4 pt-4 border-t">
                  <Button
                    type="button"
                    variant="outline"
                    className="cursor-pointer"
                    disabled={isSubmitting}
                    onClick={() => onOpenChange(false)}
                  >
                    Cancel
                  </Button>

                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white cursor-pointer"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-1 h-4 w-4 animate-spin" />
                        {mode === "create" ? "Saving..." : "Updating..."}
                      </>
                    ) : mode === "create" ? (
                      "Save Settings"
                    ) : (
                      "Update Settings"
                    )}
                  </Button>
                </div>
              </>
            )}
          </form>
        </DialogContent>
      </Form>
    </Dialog>
  );
};