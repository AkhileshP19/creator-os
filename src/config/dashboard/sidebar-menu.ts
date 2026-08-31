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
    },
  },

  WORKSPACE: {
    projects: {
      icon: FolderKanban,
      label: "Projects",
    },
    content: {
      icon: FileText,
      label: "Content",
    },  
    assets: {
      icon: Images,
      label: "Assets",
    },
  },

  INTELLIGENCE: {
    aiGeneration: {
      icon: Sparkles,
      label: "AI Generation",
    },
    automation: {
      icon: Workflow,
      label: "Automation",
    },
    analytics: {
      icon: ChartColumn,
      label: "Analytics",
    },
  },

  DISTRIBUTION: {
    publishing: {
      icon: Send,
      label: "Publishing",
    },
    approvals: {
      icon: ClipboardCheck,
      label: "Approvals",
    },
  },

  SYSTEM: {
    notifications: {
      icon: Bell,
      label: "Notifications",
    },
    settings: {
      icon: Settings,
      label: "Settings",
    },
  },
} as const;