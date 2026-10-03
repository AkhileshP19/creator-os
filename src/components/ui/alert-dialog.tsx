"use client";
import { AlertDialog as Primitive } from "@base-ui/react/alert-dialog";
import { cn } from "@/lib/utils";

export const AlertDialog = Primitive.Root;
export const AlertDialogTitle = Primitive.Title;
export const AlertDialogDescription = Primitive.Description;
export function AlertDialogContent({ className, children, ...props }: Primitive.Popup.Props) {
  return <Primitive.Portal>
    <Primitive.Backdrop className="fixed inset-0 z-50 bg-black/30 backdrop-blur-xs" />
    <Primitive.Popup className={cn("fixed top-1/2 left-1/2 z-50 grid w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 gap-4 rounded-xl bg-popover p-6 text-popover-foreground shadow-lg ring-1 ring-foreground/10 outline-none", className)} {...props}>{children}</Primitive.Popup>
  </Primitive.Portal>;
}
