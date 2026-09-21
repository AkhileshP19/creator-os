import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { GeneratedScript } from "@/types/generate-script-types";
import { Dispatch, SetStateAction } from "react";

interface GeneratedScriptDialogProps {
    open: boolean;
    onOpenChange: Dispatch<SetStateAction<boolean>>;
    scriptData: GeneratedScript
}

export const GeneratedScriptModal = ({open, onOpenChange, scriptData}: GeneratedScriptDialogProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <form>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Script</DialogTitle>
            <DialogDescription>
              <div>
                {scriptData?.narration}
              </div>
            </DialogDescription>
          </DialogHeader>
        </DialogContent>
      </form>
    </Dialog>
  );
};
