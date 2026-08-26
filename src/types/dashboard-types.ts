export type SidebarMenuItem = {
  icon: React.ReactNode;
  label: string;
  href: string;
}

export type DashboardOverviewResponse = {
  user: {
    id: string;
    name: string;
    role: string;
  };
  metrics: {
    activeProjects: {
      value: number;
      change: number;
      changePeriod: string;
      trend: string;
    };
    contentCreated: {
      value: number;
      change: number;
      changePeriod: string;
      trend: string;
    };
    pendingReviews: {
      value: number;
      attentionRequired: boolean;
    };
    published: {
      value: number;
      change: number;
      changePeriod: string;
      trend: string;
    };
  };
}

export interface ProjectData {
  id: string,
  name: string,
  type: string,
  status: string,
  progress: number,
  thumbnailUrl: string,
  updatedAt: string
}

export type AIActivityData = {
  id: string;
  type:
  | "script_generated"
  | "seo_metadata_generated"
  | "thumbnail_generated"
  | "video_generated"
  | "content_published";
  title: string;
  description: string;
  projectId: string;
  contentId: string;
  createdAt: string;
};


export type ApprovalStatus = "pending" | "approved" | "rejected";

export type ApprovalMetadata = {
  source: "ai_generated";
  resolution: "1080x1920" | "1920x1080";
  durationSeconds: number;
};

export type PendingReviewsData = {
  id: string;
  contentId: string;
  projectId: string;
  title: string;
  status: ApprovalStatus;
  thumbnailUrl: string;
  metadata: ApprovalMetadata;
  createdAt: string;
};


