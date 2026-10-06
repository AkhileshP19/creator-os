import { YouTubeIntegration } from "@/components/publishing/youtube-integration";
export default function SettingsPage() {
  return (
    <div className="w-full max-w-7xl mx-auto space-y-6 p-4 sm:p-6 lg:p-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Manage your publishing connections and account configurations.
        </p>
      </div>
      <YouTubeIntegration />
    </div>
  );
}
