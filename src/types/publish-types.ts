export type PublishStatus =
  "QUEUED" | "UPLOADING" | "SCHEDULED" | "PUBLISHED" | "FAILED";
export interface YouTubeConnection {
  connected: boolean;
  provider: "YOUTUBE";
  channelId: string | null;
  channelTitle: string | null;
}
export interface PublishJob {
  id: string;
  contentId: string;
  assetId: string;
  title: string;
  platform: string;
  publishStatus: PublishStatus;
  scheduledAt: string;
  uploadedAt: string | null;
  publishedAt: string | null;
  externalVideoUrl: string | null;
  errorMessage: string | null;
  retryAllowed: boolean;
  attemptCount: number;
}
