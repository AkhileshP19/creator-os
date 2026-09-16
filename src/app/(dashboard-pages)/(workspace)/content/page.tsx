"use client";

import { AddNewContentModal } from "@/components/content/add-new-content-modal";
import { Button } from "@/components/ui/button";
import { newContentFormSchema } from "@/schema/validation-schemas/new-content-schema";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useFetchData } from "@/hooks/fetch/useFetchData";
import { ApiEndPoint } from "@/types/api/api-types";
import { ProjectData } from "@/types/dashboard-types";
import { usePostData } from "@/hooks/fetch/usePostData";
import toast from "react-hot-toast";

export default function ContentPage() {
  const [isAddContentModalOpen, setIsAddContentModalOpen] =
    useState<boolean>(false);

  const form = useForm<z.infer<typeof newContentFormSchema>>({
    resolver: zodResolver(newContentFormSchema),
    mode: "onChange",
    defaultValues: {
      projectId: "",
      title: "",
      description: "",
      category: "",
      tags: [],
      status: "",
      scheduledDate: new Date(),
      priority: "",
    },
  });

  const { data: allProjectsData } = useFetchData<ProjectData[]>(
    ApiEndPoint.GET_ALL_PROJECTS,
    "all-projects",
  );

  const {
    mutateAsync: createContentIdea,
    isPending,
    error,
  } = usePostData<any, any>(ApiEndPoint.CREATE_CONTENT_IDEA);

  const handleCreateNewContent = async (
    data: z.infer<typeof newContentFormSchema>,
  ) => {
    console.log("Form Data:", data);
    const formData = form.getValues();

    const payload = {
      projectId: formData.projectId,
      title: formData.title,
      description: formData.description,
      category: formData.category,
      tags: formData.tags,
      scheduledDate: formData.scheduledDate,
      status: formData.status,
      priority: formData.priority,
    };

    try {
      await createContentIdea(payload);
      toast.success("Content Idea Created Successfully");
    } catch (error) {
      console.error("failed to create content idea", error);
      toast.error("Failed to create content idea");
    }
  };

  return (
    <div className="space-y-6 p-5 max-h-[80vh] w-full overflow-y-auto">
      <div className="flex justify-between gap-4">
        <h1 className="text-2xl font-bold mb-4">Content</h1>
        <Button
          onClick={() => setIsAddContentModalOpen(true)}
          className="px-4 py-5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md shadow-md hover:cursor-pointer"
        >
          Add New Content
        </Button>
      </div>

      <AddNewContentModal
        open={isAddContentModalOpen}
        onOpenChange={setIsAddContentModalOpen}
        form={form}
        onSubmit={handleCreateNewContent}
        allProjects={allProjectsData ?? []}
      />
    </div>
  );
}
