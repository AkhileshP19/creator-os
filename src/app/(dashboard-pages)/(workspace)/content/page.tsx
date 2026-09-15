"use client";

import { AddNewContentModal } from "@/components/content/add-new-content-modal";
import { Button } from "@/components/ui/button";
import { useState } from "react";

export default function ContentPage() {
  const [isAddContentModalOpen, setIsAddContentModalOpen] =
    useState<boolean>(false);
  return (
    <div className="space-y-6 p-5 max-h-[80vh] w-full overflow-y-auto">
      <div className="flex justify-between gap-4">
        <h1 className="text-2xl font-bold mb-4">Content</h1>
        <Button onClick={() => setIsAddContentModalOpen(true)}>
          Add New Content
        </Button>
      </div>

      <AddNewContentModal open={isAddContentModalOpen} onOpenChange={setIsAddContentModalOpen} />
    </div>
  );
}
