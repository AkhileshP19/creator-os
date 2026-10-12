"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { ApiEndPoint } from "@/types/api/api-types";
import type { ApprovalListItem } from "@/types/approval-types";
import {
  usePublishingMutation,
  useYouTubeConnection,
  publishingError,
} from "@/hooks/fetch/usePublishing";
import {
  publishFormSchema,
  normalizeTags,
  type PublishForm,
} from "@/schema/validation-schemas/publish-schema";
import { useQueryClient } from "@tanstack/react-query";
import { FormTagsField } from "../ui/custom/content-tags-field";

const audienceLabels: Record<string, string> = {
  yes: "Yes, made for kids",
  no: "No, not made for kids",
};

const syntheticMediaLabels: Record<string, string> = {
  yes: "Yes",
  no: "No",
};

export function PublishDialog({ approval }: { approval: ApprovalListItem }) {
  const [open, setOpen] = useState(false);
  const connection = useYouTubeConnection();
  const queryClient = useQueryClient();

  const getInitialValues = (item: ApprovalListItem): PublishForm => ({
    title: item.title,
    description: item.description ?? "",
    tags: Array.isArray(item.tags)
      ? item.tags.filter((tag): tag is string => typeof tag === "string")
      : typeof item.tags === "string"
      ? (item.tags as string).split(",").map((t) => t.trim()).filter(Boolean)
      : [],
    scheduledDate: item.scheduledDate ?? "",
    selfDeclaredMadeForKids: "" as unknown as "yes" | "no",
    containsSyntheticMedia: "" as unknown as "yes" | "no",
  });

  const form = useForm({
    resolver: zodResolver(publishFormSchema),
    defaultValues: getInitialValues(approval),
  });

  useEffect(() => {
    if (open) {
      form.reset(getInitialValues(approval));
    }
  }, [open, approval, form]);

  const mutation = usePublishingMutation<{
    contentId: string;
    assetId: string;
    title: string;
    description: string;
    tags: string[];
    selfDeclaredMadeForKids: boolean;
    containsSyntheticMedia: boolean;
  }>("POST", ApiEndPoint.PUBLISH_JOBS);
  const connected = connection.data?.responseData;

  const handleOpenChange = (nextOpen: boolean) => {
    if (!mutation.isPending) {
      setOpen(nextOpen);
    }
  };

  return (
    <>
      <Button
        disabled={!approval.assetId}
        onClick={() => setOpen(true)}
        className="bg-indigo-600 hover:bg-indigo-700 text-white cursor-pointer"
      >
        Schedule on YouTube
      </Button>
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="sm:max-w-xl max-h-[95vh] flex flex-col overflow-hidden">
          {/* Sticky Header */}
          <DialogHeader className="shrink-0 pb-4 border-b">
            <DialogTitle>Schedule on YouTube</DialogTitle>
          </DialogHeader>

          {connection.isPending ? (
            <div className="py-6 flex items-center justify-center gap-2">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Checking channel…</p>
            </div>
          ) : connection.isError ? (
            <div className="py-6 space-y-4">
              <p role="alert" className="text-sm text-destructive">
                Unable to check your channel.
              </p>
              <Button
                onClick={() => connection.refetch()}
                className="bg-indigo-600 hover:bg-indigo-700 text-white cursor-pointer"
              >
                Try again
              </Button>
            </div>
          ) : !connected?.connected ? (
            <div className="py-6 space-y-4">
              <p className="text-sm">
                Connect your channel in{" "}
                <Link
                  className="underline font-medium text-indigo-600 hover:text-indigo-700"
                  href="/settings"
                >
                  Settings
                </Link>{" "}
                before scheduling.
              </p>
            </div>
          ) : (
            <Form {...form}>
              <form
                className="flex flex-col flex-1 overflow-hidden"
                onSubmit={form.handleSubmit(async (values) => {
                  try {
                    await mutation.mutateAsync({
                      contentId: approval.contentId,
                      assetId: approval.assetId!,
                      title: values.title,
                      description: values.description,
                      tags: normalizeTags(values.tags),
                      selfDeclaredMadeForKids:
                        values.selfDeclaredMadeForKids === "yes",
                      containsSyntheticMedia:
                        values.containsSyntheticMedia === "yes",
                    });
                    await queryClient.invalidateQueries({
                      queryKey: ["approvals"],
                    });
                    toast.success("Video queued for scheduled publication");
                    setOpen(false);
                  } catch (error: unknown) {
                    toast.error(publishingError(error));
                  }
                })}
              >
                {/* Scrollable Middle Container */}
                <div className="flex-1 overflow-y-auto space-y-4 pr-1 px-2">
                  <p className="text-sm">
                    Channel:{" "}
                    <strong>{connected.channelTitle ?? "YouTube"}</strong>
                  </p>

                  {/* Title Field */}
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field, fieldState }) => {
                      const titleLength = field.value ? field.value.length : 0;
                      return (
                        <FormItem>
                          <FormLabel>
                            Title <span className="text-red-500">*</span>
                          </FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Enter title..."
                              maxLength={100}
                              {...field}
                            />
                          </FormControl>
                          <div className="flex items-center justify-between text-xs min-h-[1.25rem] mt-1">
                            <div>
                              {fieldState.error && (
                                <FormMessage>{fieldState.error?.message}</FormMessage>
                              )}
                            </div>
                            <span
                              className={`text-muted-foreground ml-auto font-mono text-[0.75rem] ${
                                titleLength > 100
                                  ? "text-destructive font-semibold"
                                  : ""
                              }`}
                            >
                              {titleLength}/100
                            </span>
                          </div>
                        </FormItem>
                      );
                    }}
                  />

                  {/* Description Field */}
                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field, fieldState }) => {
                      const descBytes = field.value
                        ? new TextEncoder().encode(field.value).length
                        : 0;
                      return (
                        <FormItem>
                          <FormLabel>
                            Description <span className="text-red-500">*</span>
                          </FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Enter description..."
                              rows={4}
                              {...field}
                            />
                          </FormControl>
                          <div className="flex items-center justify-between text-xs min-h-[1.25rem] mt-1">
                            <div>
                              {fieldState.error && (
                                <FormMessage>{fieldState.error?.message}</FormMessage>
                              )}
                            </div>
                            <span
                              className={`text-muted-foreground ml-auto font-mono text-[0.75rem] ${
                                descBytes > 5000
                                  ? "text-destructive font-semibold"
                                  : ""
                              }`}
                            >
                              {descBytes}/5000 B
                            </span>
                          </div>
                        </FormItem>
                      );
                    }}
                  />

                  {/* Tags Field (using FormTagsField matching add-new-content-modal) */}
                  <FormTagsField control={form.control} name="tags" label="Tags" />

                  {/* Publication info box */}
                  <div className="rounded-lg border bg-muted/50 p-3 text-sm space-y-1">
                    <p>
                      Publication:{" "}
                      <strong>
                        {approval.scheduledDate
                          ? new Date(approval.scheduledDate).toLocaleString()
                          : "Not scheduled"}
                      </strong>
                    </p>
                    <Link
                      href="/content"
                      className="underline text-indigo-600 hover:text-indigo-700"
                    >
                      Edit the schedule in Content
                    </Link>
                    <p className="text-xs text-muted-foreground pt-1">
                      Allow time for uploading and YouTube processing.
                    </p>
                  </div>
                  <input type="hidden" {...form.register("scheduledDate")} />

                  {/* Made For Kids Field */}
                  <FormField
                    control={form.control}
                    name="selfDeclaredMadeForKids"
                    render={({ field, fieldState }) => (
                      <FormItem>
                        <FormLabel>
                          Made for kids <span className="text-red-500">*</span>
                        </FormLabel>
                        <Select
                          value={field.value ?? ""}
                          onValueChange={field.onChange}
                        >
                          <FormControl>
                            <SelectTrigger className="w-full cursor-pointer">
                              <SelectValue placeholder="Choose an audience">
                                {audienceLabels[field.value] ||
                                  "Choose an audience"}
                              </SelectValue>
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="yes">
                              Yes, made for kids
                            </SelectItem>
                            <SelectItem value="no">
                              No, not made for kids
                            </SelectItem>
                          </SelectContent>
                        </Select>
                        {fieldState.error && (
                          <FormMessage>{fieldState.error?.message}</FormMessage>
                        )}
                      </FormItem>
                    )}
                  />

                  {/* Synthetic Media Field */}
                  <FormField
                    control={form.control}
                    name="containsSyntheticMedia"
                    render={({ field, fieldState }) => (
                      <FormItem>
                        <FormLabel>
                          Contains realistic altered or synthetic media{" "}
                          <span className="text-red-500">*</span>
                        </FormLabel>
                        <Select
                          value={field.value ?? ""}
                          onValueChange={field.onChange}
                        >
                          <FormControl>
                            <SelectTrigger className="w-full cursor-pointer">
                              <SelectValue placeholder="Choose a declaration">
                                {syntheticMediaLabels[field.value] ||
                                  "Choose a declaration"}
                              </SelectValue>
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="yes">Yes</SelectItem>
                            <SelectItem value="no">No</SelectItem>
                          </SelectContent>
                        </Select>
                        {fieldState.error && (
                          <FormMessage>{fieldState.error?.message}</FormMessage>
                        )}
                      </FormItem>
                    )}
                  />
                </div>

                {/* Sticky Footer */}
                <div className="flex items-center justify-end gap-4 pt-4 mt-2 border-t shrink-0">
                  <Button
                    type="button"
                    variant="outline"
                    className="cursor-pointer p-4"
                    onClick={() => setOpen(false)}
                    disabled={mutation.isPending}
                  >
                    Cancel
                  </Button>

                  <Button
                    type="submit"
                    className="text-white bg-indigo-600 hover:bg-indigo-700 hover:text-white p-4 cursor-pointer"
                    disabled={mutation.isPending}
                  >
                    {mutation.isPending ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                        <span>Scheduling…</span>
                      </>
                    ) : (
                      "Confirm schedule"
                    )}
                  </Button>
                </div>
              </form>
            </Form>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
