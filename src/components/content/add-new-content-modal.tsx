import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "../ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Calendar } from "../ui/calendar";

interface AddNewContentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const AddNewContentModal = ({
  open,
  onOpenChange,
}: AddNewContentModalProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <form>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Add New Content</DialogTitle>
          </DialogHeader>
          <div>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="content-title" className="text-right">
                  Title
                </Label>
                <Input id="content-title" className="col-span-3" />
                <Label htmlFor="content-description" className="text-right">
                  Description
                </Label>
                <Textarea id="content-description" className="col-span-3" />
                <Label htmlFor="tags" className="text-right">
                  Tags
                </Label>
                <Input id="tags" className="col-span-3" />

                <Label htmlFor="status" className="text-right">
                  Status
                </Label>
                <Select id="status">
                  <SelectTrigger>
                    <SelectValue placeholder="Select a status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="published">Published</SelectItem>
                  </SelectContent>
                </Select>

                <Label htmlFor="scheduled-date" className="text-right">
                  Scheduled Date
                </Label>
                <Calendar /> 
              </div>
            </div>
          </div>
          <DialogFooter>
            <DialogClose render={<Button variant="outline">Cancel</Button>} />
            <Button type="submit">Save changes</Button>
          </DialogFooter>
        </DialogContent>
      </form>
    </Dialog>
  );
};
