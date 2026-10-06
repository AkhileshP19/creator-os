"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { usePatchData } from "@/hooks/fetch/usePatchData";
import { usePostData } from "@/hooks/fetch/usePostData";
import { ApiEndPoint } from "@/types/api/api-types";
import {
  CreateProjectRequest,
  CreateProjectResponse,
} from "@/types/project-types";
import {
  createProjectSchema,
  CreateProjectFormValues,
} from "@/schema/validation-schemas/create-project-schema";
import { Dispatch, SetStateAction } from "react";
import toast from "react-hot-toast";
import { Loader2 } from "lucide-react";

interface CreateProjectModalProps {
  open: boolean;
  onOpenChange: Dispatch<SetStateAction<boolean>>;
  mode: "create" | "edit";
  projectId?: string;
  incomingProjectName?: string;
  incomingProjectDesc?: string;
  refetchProjects?: () => void;
}

export const CreateProjectModal = ({
  open,
  onOpenChange,
  mode,
  projectId,
  incomingProjectName,
  incomingProjectDesc,
  refetchProjects,
}: CreateProjectModalProps) => {
  const form = useForm<CreateProjectFormValues>({
    resolver: zodResolver(createProjectSchema),
    mode: "onChange",
    defaultValues: {
      name: mode === "edit" ? incomingProjectName ?? "" : "",
      description: mode === "edit" ? incomingProjectDesc ?? "" : "",
    },
  });

  useEffect(() => {
    if (open) {
      form.reset({
        name: mode === "edit" ? incomingProjectName ?? "" : "",
        description: mode === "edit" ? incomingProjectDesc ?? "" : "",
      });
    }
  }, [open, mode, incomingProjectName, incomingProjectDesc, form]);

  const createProjectMutation = usePostData<
    CreateProjectResponse,
    CreateProjectRequest
  >(ApiEndPoint.CREATE_PROJECT);

  const updateProjectMutation = usePatchData<
    CreateProjectResponse,
    CreateProjectRequest
  >(ApiEndPoint.UPDATE_PROJECT, [projectId ?? ""]);

  const isSubmitting =
    createProjectMutation.isPending || updateProjectMutation.isPending;

  const onSubmit = async (values: CreateProjectFormValues) => {
    try {
      if (mode === "create") {
        await createProjectMutation.mutateAsync(values);
        toast.success("Project created successfully!");
      } else {
        await updateProjectMutation.mutateAsync(values);
        toast.success("Project updated successfully!");
      }
      onOpenChange(false);
      form.reset({ name: "", description: "" });
      refetchProjects?.();
    } catch (err) {
      console.error(err);
      toast.error(
        mode === "create"
          ? "Failed to create project"
          : "Failed to update project",
      );
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      form.reset({ name: "", description: "" });
    }
    onOpenChange(newOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[450px]">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <DialogHeader>
              <DialogTitle>
                {mode === "create" ? "Create Project" : "Edit Project"}
              </DialogTitle>
              <DialogDescription>
                Enter the details for your project below. Both fields are required.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-2">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium">
                      Project Name <span className="text-red-500">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g. YouTube Masterclass"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium">
                      Description <span className="text-red-500">*</span>
                    </FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Add a brief description of your project..."
                        className="resize-none min-h-[100px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => handleOpenChange(false)}
                disabled={isSubmitting}
                className="cursor-pointer"
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
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {mode === "create" ? "Creating..." : "Updating..."}
                  </>
                ) : mode === "create" ? (
                  "Create Project"
                ) : (
                  "Update Project"
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
