"use client";
import { useEffect, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { apiHandler } from "@/api/api-handler";
import { ApiEndPoint, type ApiResponse } from "@/types/api/api-types";
import {
  useYouTubeConnection,
  usePublishingMutation,
  publishingError,
} from "@/hooks/fetch/usePublishing";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";
export function YouTubeIntegration() {
  const connection = useYouTubeConnection();
  const [confirm, setConfirm] = useState(false);
  const disconnect = usePublishingMutation<Record<string, never>>(
    "DELETE",
    ApiEndPoint.YOUTUBE_DISCONNECT,
  );
  const connect = useMutation({
    mutationFn: () =>
      apiHandler<ApiResponse<{ authorizationUrl: string }>>(
        "GET",
        ApiEndPoint.YOUTUBE_CONNECT,
        undefined,
        { withCredentials: true },
      ),
    onSuccess: (result) =>
      window.location.assign(result.responseData.authorizationUrl),
    onError: (error) => toast.error(publishingError(error)),
  });
  useEffect(() => {
    const url = new URL(window.location.href);
    const result = url.searchParams.get("youtube");
    if (!result) return;
    if (result === "connected") toast.success("YouTube channel connected");
    else
      toast.error(
        "YouTube connection failed. Grant both permissions, use your configured test account, and reconnect the original channel if jobs already exist.",
      );
    url.searchParams.delete("youtube");
    window.history.replaceState({}, "", url.toString());
  }, []);
  const channel = connection.data?.responseData;
  return (
    <Card className="max-w-2xl">
      <CardContent className="space-y-4">
        <h2 className="text-lg font-semibold">YouTube</h2>
        {connection.isPending ? (
          <div className="flex items-center gap-2 py-4 text-muted-foreground text-sm">
            <Loader2 className="size-4 animate-spin text-indigo-600" />
            <span>Checking YouTube connection…</span>
          </div>
        ) : connection.isError ? (
          <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-4 text-sm text-destructive flex items-center justify-between">
            <span>Unable to load YouTube status.</span>
            <Button
              size="sm"
              variant="outline"
              onClick={() => connection.refetch()}
              className="cursor-pointer"
            >
              Try again
            </Button>
          </div>
        ) : (
          <>
            <Badge variant={channel?.connected ? "default" : "secondary"}>
              {channel?.connected ? "Connected" : "Disconnected"}
            </Badge>
            <p className="text-sm text-muted-foreground">
              {channel?.connected
                ? `Channel: ${channel.channelTitle ?? "YouTube"}`
                : "Connect your YouTube channel to publish approved videos."}
            </p>
            {channel?.connected ? (
              <div className="space-y-3">
                <Button
                  variant="outline"
                  disabled={connect.isPending}
                  onClick={() => connect.mutate()}
                >
                  Reconnect authorization
                </Button>{" "}
                <Button
                  variant="outline"
                  disabled={disconnect.isPending}
                  onClick={() => setConfirm(true)}
                >
                  Disconnect
                </Button>
                {confirm && (
                  <div className="rounded border p-3 text-sm">
                    <p>
                      Queued jobs will stop. Videos already uploaded remain on
                      YouTube and may still publish on schedule. Manage those in
                      YouTube Studio.
                    </p>
                    <div className="mt-3 flex gap-2">
                      <Button
                        variant="destructive"
                        disabled={disconnect.isPending}
                        onClick={async () => {
                          try {
                            await disconnect.mutateAsync({});
                            setConfirm(false);
                            toast.success("YouTube disconnected");
                          } catch (error: unknown) {
                            toast.error(publishingError(error));
                          }
                        }}
                      >
                        Confirm disconnect
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => setConfirm(false)}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <Button
                disabled={connect.isPending}
                onClick={() => connect.mutate()}
              >
                {connect.isPending ? "Connecting…" : "Connect YouTube"}
              </Button>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
