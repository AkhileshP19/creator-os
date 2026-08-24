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