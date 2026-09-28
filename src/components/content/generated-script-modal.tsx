import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { GeneratedScript } from "@/types/generate-script-types";
import { Dispatch, SetStateAction } from "react";

interface GeneratedScriptDialogProps {
  open: boolean;
  onOpenChange: Dispatch<SetStateAction<boolean>>;
  scriptData: GeneratedScript;
}

export const GeneratedScriptModal = ({
  open,
  onOpenChange,
  scriptData,
}: GeneratedScriptDialogProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <form>
        {/* max-h-[90vh] with flex-col ensures layout respects height bounds, 
            while overflow-hidden on content and overflow-y-auto on the body 
            keeps the DialogHeader fixed at the top */}
        <DialogContent className="w-[95vw] max-w-2xl max-h-[90vh] flex flex-col rounded p-4 sm:p-6 overflow-hidden">
          
          {/* Fixed Header */}
          <DialogHeader className="border-b pb-3 shrink-0">
            <DialogTitle className="text-base sm:text-lg font-bold truncate">
              {scriptData?.title} - Script
            </DialogTitle>
          </DialogHeader>

          {/* Scrollable Content Body */}
          <div className="flex flex-col gap-4 overflow-y-auto pr-1 mt-4 text-sm sm:text-base">
            <div>
              <span className="font-semibold text-muted-foreground block text-xs uppercase tracking-wider">Hook:</span>
              <p className="mt-1">{scriptData?.hook}</p>
            </div>

            <div>
              <span className="font-semibold text-muted-foreground block text-xs uppercase tracking-wider">Narration:</span>
              <p className="mt-1">{scriptData?.narration}</p>
            </div>

            <div>
              <span className="font-semibold text-muted-foreground block text-xs uppercase tracking-wider">Duration:</span>
              <p className="mt-1">{scriptData?.durationSeconds} seconds</p>
            </div>

            <div>
              <span className="font-semibold text-muted-foreground block text-xs uppercase tracking-wider mb-2">Scenes:</span>
              <div className="flex flex-col gap-3">
                {scriptData?.scenes?.map((scene, index) => {
                  return (
                    <div key={`${index}`} className="border rounded-md p-3 sm:p-4 bg-muted/30 flex flex-col gap-2">
                      <div>
                        <span className="font-bold text-primary">
                          Scene {scene.sceneNumber}
                        </span>
                      </div>
                      <div>
                        <span className="font-semibold text-xs text-muted-foreground">Visual Description:</span>
                        <p>{scene?.visualDescription}</p>
                      </div>
                      <div>
                        <span className="font-semibold text-xs text-muted-foreground">Voiceover:</span>
                        <p>{scene?.voiceover}</p>
                      </div>
                      <div>
                        <span className="font-semibold text-xs text-muted-foreground">On Screen Text:</span>
                        <p>{scene?.onScreenText}</p>
                      </div>
                      <div>
                        <span className="font-semibold text-xs text-muted-foreground">Duration:</span>
                        <p>{scene?.durationSeconds}s</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

        </DialogContent>
      </form>
    </Dialog>
  );
};