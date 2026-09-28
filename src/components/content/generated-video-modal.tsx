import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { GeneratedVideo } from "@/types/generate-video-types";
import { Loader2, Download, ExternalLink } from "lucide-react";
import { Dispatch, SetStateAction } from "react";
import { Button } from "@/components/ui/button";

interface GeneratedVideoModalProps {
  open: boolean;
  onOpenChange: Dispatch<SetStateAction<boolean>>;
  videoData?: GeneratedVideo | null;
  title?: string;
  isLoading?: boolean;
}

export const GeneratedVideoModal = ({
  open,
  onOpenChange,
  videoData,
  title,
  isLoading,
}: GeneratedVideoModalProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] max-w-3xl max-h-[90vh] flex flex-col rounded p-4 sm:p-6 overflow-hidden">
        {/* Fixed Header */}
        <DialogHeader className="border-b pb-3 shrink-0 flex flex-row items-center justify-between">
          <DialogTitle className="text-base sm:text-lg font-bold truncate pr-4">
            {title ? `${title} - Video` : "Generated Video"}
          </DialogTitle>
        </DialogHeader>

        {/* Modal Body */}
        <div className="flex flex-col items-center justify-center min-h-[300px] overflow-y-auto mt-4 w-full">
          {isLoading ? (
            <div className="flex flex-col items-center gap-3 text-muted-foreground py-12">
              <Loader2 className="w-10 h-10 animate-spin text-indigo-600" />
              <p className="text-sm font-medium">Fetching generated video...</p>
            </div>
          ) : videoData?.videoUrl ? (
            <div className="flex flex-col items-center w-full gap-4">
              <div className="relative w-full flex justify-center bg-black/90 rounded-lg overflow-hidden border border-border">
                <video
                  src={videoData.videoUrl}
                  controls
                  autoPlay
                  playsInline
                  className="max-h-[60vh] w-auto max-w-full rounded-md object-contain"
                />
              </div>

              <div className="flex items-center justify-end gap-3 w-full">
                <a
                  href={videoData.videoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-2 cursor-pointer"
                  >
                    <ExternalLink className="w-4 h-4" />
                    Open Original
                  </Button>
                </a>
                <a
                  href={videoData.videoUrl}
                  download="generated_video.mp4"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Button
                    variant="default"
                    size="sm"
                    className="bg-indigo-600 hover:bg-indigo-700 gap-2 cursor-pointer"
                  >
                    <Download className="w-4 h-4" />
                    Download Video
                  </Button>
                </a>
              </div>
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <p>No video available or video generation not completed.</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
