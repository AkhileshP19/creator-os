"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { usePatchData } from "@/hooks/fetch/usePatchData";
import { usePostData } from "@/hooks/fetch/usePostData";
import { ApiEndPoint } from "@/types/api/api-types";
import {
  CreateProjectRequest,
  CreateProjectResponse,
} from "@/types/project-types";
import { Dispatch, SetStateAction, useEffect, useState } from "react";
import toast from "react-hot-toast";

interface CreateProjectModalProps {
  open: boolean;
  onOpenChange: Dispatch<SetStateAction<boolean>>;
  mode: "create" | "edit";
  projectId?: string;
  incomingProjectName?: string;
  incomingProjectDesc?: string;
  refetchProjects?: () => void; // Optional function to refetch projects after creation or update
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
  const [projectName, setProjectName] = useState("");
  const [projectDesc, setProjectDesc] = useState("");

  const createProjectMutation = usePostData<
    CreateProjectResponse,
    CreateProjectRequest
  >(ApiEndPoint.CREATE_PROJECT);

  const updateProjectMutation = usePatchData<
    CreateProjectResponse,
    CreateProjectRequest
  >(ApiEndPoint.UPDATE_PROJECT, [projectId ?? ""]);

  const handleCreateProject = async () => {
    try {
      const payload = {
        name: projectName,
        description: projectDesc,
      };
      const response = await createProjectMutation.mutateAsync(payload);
      console.log("Project created:", response);
      toast.success("Project created successfully!");
      onOpenChange(false);
      setProjectName("");
      setProjectDesc("");
      refetchProjects?.();
    } catch (err) {
      toast.error("Failed to create project");
    }
  };

  const handleUpdateProject = async () => {
    try {
      const payload = {
        name: projectName,
        description: projectDesc,
      };
      await updateProjectMutation.mutateAsync(payload);
      toast.success("Project updated successfully!");
      onOpenChange(false);
      setProjectName("");
      setProjectDesc("");
      refetchProjects?.();
    } catch (err) {
      toast.error("Failed to update project");
    }
  };

  useEffect(() => {
    if (open) {
      setProjectName(mode === "edit" ? (incomingProjectName ?? "") : "");
      setProjectDesc(mode === "edit" ? (incomingProjectDesc ?? "") : "");
    }
  }, [open, mode, incomingProjectName, incomingProjectDesc]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {mode === "create" ? "Create Project" : "Edit Project"}
          </DialogTitle>
          <DialogDescription>
            Enter the details for your new project. Click Create when
            you&apos;re ready.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="name" className="text-right">
              Name
            </Label>
            <Input
              id="name"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="description" className="text-right">
              Description
            </Label>
            <Textarea
              id="description"
              value={projectDesc}
              onChange={(e) => setProjectDesc(e.target.value)}
              className="col-span-3 resize-none"
              placeholder="Add a brief description of your project..."
            />
          </div>
        </div>
        <DialogFooter>
          <Button
            onClick={() =>
              mode === "create" ? handleCreateProject() : handleUpdateProject()
            }
          >
            {mode === "create" ? "Create" : "Update"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
