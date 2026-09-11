"use client";

import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious
} from "@/components/ui/pagination";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface PaginationControllerProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  maxVisibleButtons?: number;
  perPageOptions?: number[];
  perPage?: number;
  onPerPageChange?: (value: number) => void;
  previousLabel?: string;
  nextLabel?: string;
  label?: string;
}

export const PaginationController = ({
  currentPage,
  totalPages,
  onPageChange,
  maxVisibleButtons = 5,
  perPageOptions = [10, 20, 30, 50],
  perPage,
  onPerPageChange,
  label = "Rows per page"
}: PaginationControllerProps) => {
  const getPages = (): (number | "...")[] => {
    const pages: (number | "...")[] = [];

    if (totalPages <= maxVisibleButtons + 2) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      const siblings = Math.floor(maxVisibleButtons / 2);
      const startPage = Math.max(2, currentPage - siblings);
      const endPage = Math.min(totalPages - 1, currentPage + siblings);

      pages.push(1);

      if (startPage > 2) pages.push("...");

      for (let i = startPage; i <= endPage; i++) {
        pages.push(i);
      }

      if (endPage < totalPages - 1) pages.push("...");

      pages.push(totalPages);
    }

    return pages;
  };

  const pageItems = getPages();

  return (
    <div className="grid grid-cols-3 items-center px-4 py-2 bg-background border-t border-border min-h-[56px]">
      <div className="flex items-center gap-2">
        {onPerPageChange && perPage !== undefined && (
          <div className="flex items-center justify-start gap-2">
            <div>{label}</div>
            <Select value={perPage.toString()} onValueChange={(value) => onPerPageChange(Number(value))}>
              <SelectTrigger className="h-8 w-[70px] text-sm bg-background text-foreground border-border">
                <SelectValue placeholder="Rows" />
              </SelectTrigger>
              <SelectContent>
                {perPageOptions.map((option) => (
                  <SelectItem key={option} value={option.toString()}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      <div className="flex justify-center">
        <Pagination className="mx-0 w-auto">
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                onClick={() => onPageChange(currentPage - 1)}
                className={`cursor-pointer text-muted-foreground ${
                  currentPage === 1 ? "pointer-events-none opacity-50" : ""
                }`}
              />
            </PaginationItem>

            {pageItems.map((page, idx) =>
              page === "..." ? (
                <PaginationItem key={`ellipsis-${idx}`}>
                  <PaginationEllipsis className="text-foreground" />
                </PaginationItem>
              ) : (
                <PaginationItem key={page}>
                  <PaginationLink
                    isActive={page === currentPage}
                    onClick={() => onPageChange(page)}
                    className={`cursor-pointer text-muted-foreground ${
                      page === currentPage ? "bg-primary text-white hover:bg-primary/90 hover:text-white" : ""
                    }`}
                  >
                    {page}
                  </PaginationLink>
                </PaginationItem>
              )
            )}

            <PaginationItem>
              <PaginationNext
                onClick={() => onPageChange(currentPage + 1)}
                className={`cursor-pointer text-muted-foreground ${
                  currentPage === totalPages ? "pointer-events-none opacity-50" : ""
                }`}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      </div>
      <div className="hidden md:block" />
    </div>
  );
};
