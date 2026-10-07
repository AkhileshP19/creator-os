import {
  Bell,
  ChartColumn,
  ClipboardCheck,
  FileText,
  FolderKanban,
  Images,
  LayoutDashboard,
  Send,
  Settings,
  Sparkles,
  Workflow,
} from "lucide-react";

export const sidebarOptions = {
  OVERVIEW: {
    dashboard: {
      icon: LayoutDashboard,
      label: "Dashboard",
      href: "/dashboard",
    },
  },

  WORKSPACE: {
    projects: {
      icon: FolderKanban,
      label: "Projects",
      href: "/projects",
    },
    content: {
      icon: FileText,
      label: "Content",
      href: "/content",
    },  
    assets: {
      icon: Images,
      label: "Assets",
      href: "/assets",
    },
  },

  INTELLIGENCE: {
    aiGeneration: {
      icon: Sparkles,
      label: "AI Generation",
      href: "/ai-generation",
    },
    automation: {
      icon: Workflow,
      label: "Automation",
      href: "/automation",
    },
    analytics: {
      icon: ChartColumn,
      label: "Analytics",
      href: "/analytics",
    },
  },

  DISTRIBUTION: {
    publishing: {
      icon: Send,
      label: "Publishing",
      href: "/publishing",
    },
    approvals: {
      icon: ClipboardCheck,
      label: "Approvals",
      href: "/approvals",
    },
  },

  SYSTEM: {
    notifications: {
      icon: Bell,
      label: "Notifications",
      href: "/notifications",
    },
    settings: {
      icon: Settings,
      label: "Settings",
      href: "/settings",
    },
  },
} as const;