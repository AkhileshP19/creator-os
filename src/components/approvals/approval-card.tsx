"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import {
  CalendarDays,
  Check,
  Clock3,
  Folder,
  Loader2,
  RefreshCw,
  X,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { usePostData } from "@/hooks/fetch/usePostData";
import { useFetchData } from "@/hooks/fetch/useFetchData";
import { ApiEndPoint } from "@/types/api/api-types";
import type {
  ApprovalDetail,
  ApprovalListItem,
  ApproveRequest,
  ApproveResponse,
  RejectRequest,
  RejectResponse,
  RegenerateResponse,
} from "@/types/approval-types";

function dateTime(value: string | null) {
  return value
    ? new Date(value).toLocaleString(undefined, {
        dateStyle: "medium",
        timeStyle: "short",
      })
    : "Unscheduled";
}
const statusLabels = {
  PENDING: "Pending review",
  APPROVED: "Approved",
  REJECTED: "Rejected",
  REGENERATE: "Regeneration requested",
};

export function ApprovalCard({ approval }: { approval: ApprovalListItem }) {
  const cache = useQueryClient();
  const [action, setAction] = useState<
    "approve" | "reject" | "regenerate" | null
  >(null);
  const [comments, setComments] = useState("");
  // Keep a stable playback source during list polling; renew explicitly on failure.
  const [videoUrl, setVideoUrl] = useState(approval.videoUrl);
  const [videoFailed, setVideoFailed] = useState(false);
  const [videoLoading, setVideoLoading] = useState(true);
  const detail = useFetchData<ApprovalDetail>(
    ApiEndPoint.GET_APPROVAL,
    "approval-detail",
    [approval.approvalId],
    undefined,
    false,
  );
  const approve = usePostData<ApproveResponse, ApproveRequest>(
    ApiEndPoint.APPROVE_VIDEO,
    [approval.approvalId],
  );
  const reject = usePostData<RejectResponse, RejectRequest>(
    ApiEndPoint.REJECT_VIDEO,
    [approval.approvalId],
  );
  const regenerate = usePostData<RegenerateResponse, ApproveRequest>(
    ApiEndPoint.REGENERATE_VIDEO,
    [approval.approvalId],
  );
  const busy = approve.isPending || reject.isPending || regenerate.isPending;
  const generating =
    approval.regenerationStatus === "QUEUED" ||
    approval.regenerationStatus === "RUNNING";
  const source = videoUrl ?? approval.videoUrl;

  async function refreshVideo() {
    const result = await detail.refetch();
    const url = result.data?.responseData.videoUrl;
    if (result.error || !url) {
      toast.error("Unable to load this video. Please try again.");
      return;
    }
    setVideoUrl(url);
    setVideoFailed(false);
    setVideoLoading(true);
  }

  async function submit() {
    try {
      if (action === "approve") await approve.mutateAsync({});
      else if (action === "reject") await reject.mutateAsync({ comments });
      else if (action === "regenerate") await regenerate.mutateAsync({});
      else return;
      toast.success(
        action === "regenerate"
          ? "Video regeneration started"
          : action === "approve"
            ? "Video approved"
            : "Video rejected",
      );
      setAction(null);
      setComments("");
    } catch (error: unknown) {
      const message =
        typeof error === "object" &&
        error !== null &&
        "message" in error &&
        typeof error.message === "string"
          ? error.message
          : "Unable to update this approval. Please try again.";
      toast.error(message);
    } finally {
      await Promise.all([
        cache.invalidateQueries({ queryKey: ["approvals"] }),
        cache.invalidateQueries({ queryKey: ["content-ideas"] }),
        cache.invalidateQueries({ queryKey: ["approval-detail"] }),
        cache.invalidateQueries({ queryKey: ["get-video"] }),
      ]);
    }
  }

  return (
    <Card className="overflow-hidden">
      <div className="flex flex-col sm:flex-row">
        <div className="relative mx-auto flex aspect-[9/16] w-full max-w-[250px] shrink-0 items-center justify-center bg-zinc-950 text-white sm:mx-0 sm:w-[190px]">
          {!source || videoFailed ? (
            <div className="space-y-3 p-5 text-center text-sm">
              <p>
                {approval.playbackError ?? "This video could not be played."}
              </p>
              <Button
                variant="secondary"
                onClick={refreshVideo}
                disabled={detail.isLoading}
              >
                <RefreshCw /> {detail.isLoading ? "Loading…" : "Retry video"}
              </Button>
            </div>
          ) : (
            <>
              {videoLoading && (
                <div
                  className="pointer-events-none absolute inset-0 flex items-center justify-center"
                  role="status"
                  aria-label="Loading video"
                >
                  <Loader2 className="size-7 animate-spin" />
                </div>
              )}
              <video
                key={source}
                src={source}
                controls
                playsInline
                preload="metadata"
                aria-label={`Review ${approval.title}`}
                className="h-full w-full object-contain"
                onLoadedMetadata={() => setVideoLoading(false)}
                onError={() => {
                  setVideoFailed(true);
                  setVideoLoading(false);
                }}
              />
            </>
          )}
        </div>
        <CardContent className="flex min-w-0 flex-1 flex-col gap-4">
          <div className="flex flex-wrap items-center gap-2">
            <Badge
              variant={
                approval.status === "APPROVED"
                  ? "default"
                  : approval.status === "REJECTED"
                    ? "destructive"
                    : "secondary"
              }
              className={
                approval.status === "APPROVED"
                  ? "bg-emerald-600 text-white"
                  : ""
              }
            >
              {generating ? "Regenerating" : statusLabels[approval.status]}
            </Badge>
            {approval.category && (
              <Badge variant="outline">{approval.category}</Badge>
            )}
          </div>
          <div>
            <h2 className="break-words text-lg font-semibold">
              {approval.title}
            </h2>
            <p className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
              <Folder className="size-4 shrink-0" />
              {approval.projectName}
            </p>
          </div>
          <div className="space-y-2 text-sm">
            <p className="flex items-start gap-2">
              <CalendarDays className="mt-0.5 size-4 shrink-0 text-indigo-500" />
              <span>{dateTime(approval.scheduledDate)}</span>
            </p>
            {approval.generatedAt && (
              <p className="flex items-start gap-2 text-muted-foreground">
                <Clock3 className="mt-0.5 size-4 shrink-0" />
                <span>
                  Generated {dateTime(approval.generatedAt)}
                  {approval.durationSeconds
                    ? ` · ${approval.durationSeconds}s`
                    : ""}
                </span>
              </p>
            )}
          </div>
          {approval.description && (
            <p className="line-clamp-3 text-sm text-muted-foreground">
              {approval.description}
            </p>
          )}
          {approval.comments && (
            <div className="rounded-lg bg-muted p-3 text-sm">
              <p className="mb-1 font-medium">Rejection feedback</p>
              <p className="whitespace-pre-wrap break-words text-muted-foreground">
                {approval.comments}
              </p>
            </div>
          )}
          {generating && (
            <p
              className="flex items-center gap-2 text-sm text-indigo-600"
              role="status"
            >
              <Loader2 className="size-4 animate-spin" />
              Generating a replacement video…
            </p>
          )}
          {approval.regenerationStatus === "FAILED" && (
            <p className="text-sm text-destructive" role="alert">
              Generation failed. You can try again.
            </p>
          )}
          {approval.status === "REGENERATE" &&
            approval.regenerationStatus === "COMPLETED" && (
              <p className="text-sm text-muted-foreground">
                A replacement video is ready in Pending. This review is kept in
                your history.
              </p>
            )}
          <div className="mt-auto flex flex-wrap gap-2 pt-2">
            {approval.status === "PENDING" && (
              <>
                <Button
                  className="min-h-10 bg-indigo-600 text-white hover:bg-indigo-700"
                  disabled={busy || !source || videoFailed}
                  onClick={() => setAction("approve")}
                >
                  <Check />
                  Approve
                </Button>
                <Button
                  variant="outline"
                  className="min-h-10"
                  disabled={busy}
                  onClick={() => setAction("reject")}
                >
                  <X />
                  Reject
                </Button>
              </>
            )}
            {approval.status === "APPROVED" && (
              <p className="flex items-center gap-2 text-sm font-medium text-emerald-600">
                <Check className="size-4" />
                Approved for future publishing
              </p>
            )}
            {approval.status === "REJECTED" && (
              <Button
                variant="outline"
                className="min-h-10"
                disabled={busy || generating || !approval.assetId}
                onClick={() => setAction("regenerate")}
              >
                <RefreshCw />
                Regenerate Video
              </Button>
            )}
          </div>
        </CardContent>
      </div>
      <Dialog
        open={action === "reject"}
        onOpenChange={(open) => {
          if (!open && !busy) setAction(null);
        }}
      >
        <DialogContent showCloseButton={!busy} className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Reject video</DialogTitle>
            <DialogDescription>
              Keep feedback with this generation for future reference.
            </DialogDescription>
          </DialogHeader>
          <label
            htmlFor={`feedback-${approval.approvalId}`}
            className="text-sm font-medium"
          >
            Rejection feedback (optional)
          </label>
          <Textarea
            id={`feedback-${approval.approvalId}`}
            value={comments}
            onChange={(event) => setComments(event.target.value)}
            maxLength={2000}
            placeholder="What would you like to improve?"
            rows={4}
            disabled={busy}
          />
          <DialogFooter>
            <Button
              variant="outline"
              disabled={busy}
              onClick={() => setAction(null)}
            >
              Cancel
            </Button>
            <Button variant="destructive" disabled={busy} onClick={submit}>
              {busy && <Loader2 className="animate-spin" />}Reject Video
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <AlertDialog
        open={action === "approve" || action === "regenerate"}
        onOpenChange={(open) => {
          if (!open && !busy) setAction(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogTitle className="text-lg font-semibold">
            {action === "approve"
              ? "Approve this video?"
              : "Regenerate this video?"}
          </AlertDialogTitle>
          <AlertDialogDescription className="text-sm text-muted-foreground">
            {action === "approve"
              ? "This marks the video as ready for future publishing. It will not publish anything."
              : "A new video generation workflow will begin using the latest completed script. The previous video and rejection feedback will be kept, and the replacement will need your review."}
          </AlertDialogDescription>
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              disabled={busy}
              onClick={() => setAction(null)}
            >
              Cancel
            </Button>
            <Button disabled={busy} onClick={submit}>
              {busy && <Loader2 className="animate-spin" />}
              {action === "approve" ? "Approve Video" : "Regenerate Video"}
            </Button>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
