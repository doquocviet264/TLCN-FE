"use client";
import { ColumnDef } from "@tanstack/react-table";
import { useMemo } from "react";
import { GenericTable } from "@/shared/GenericTable";
import { ReviewData } from "@/lib/admin/adminReviewApi";

interface Props {
  data: ReviewData[];
  onEdit?: (reviewId: string, rating: number, comment: string) => void;
  onDelete?: (reviewId: string, userName: string) => void;
  isDeleting?: boolean;
}

export function ReviewTable({ data, onEdit, onDelete, isDeleting }: Props) {
  const columns = useMemo<ColumnDef<ReviewData>[]>(
    () => [
      {
        header: "Tên Tác giả",
        accessorKey: "userId.fullName",
        cell: ({ row }) => {
          const review = row.original;
          if (!review.userId) {
            return <span className="text-slate-500">Người dùng đã bị xóa</span>;
          }
          return (
            <div className="flex gap-2 mr-6">
              <img
                src={review.userId.avatarUrl || "/default-avatar.png"}
                alt=""
                className="h-6 w-6 object-cover rounded-full"
              />
              <div className="flex flex-col">
                <h2 className="clamp-1">{review.userId.fullName}</h2>
                <h4 className="text-xs text-slate-500">
                  @{review.userId.username}
                </h4>
              </div>
            </div>
          );
        },
      },
      {
        header: "Rating",
        accessorKey: "rating",
        cell: ({ getValue }) => {
          const rating = getValue() as number;
          return (
            <div className="flex gap-1">
              {[...Array(5)].map((_, i) => (
                <i
                  key={i}
                  className={`ri-star-${
                    i < rating ? "fill" : "line"
                  } text-yellow-500`}
                ></i>
              ))}
            </div>
          );
        },
      },
      {
        header: "Nội dung",
        accessorKey: "comment",
        cell: ({ getValue }) => {
          const value = getValue() as string;
          return (
            <span className="clamp-2">{value || "Không có bình luận"}</span>
          );
        },
      },
      {
        header: "Ngày đăng",
        accessorKey: "createdAt",
        cell: ({ getValue }) => {
          const date = new Date(getValue() as string);
          return (
            <span className="text-[#667085]">
              {date.toLocaleDateString("vi-VN")}
            </span>
          );
        },
      },
      {
        header: "Action",
        accessorKey: "action",
        cell: ({ row }) => {
          const review = row.original;
          return (
            <div className="flex gap-2 justify-center">
              <button
                onClick={() =>
                  onEdit?.(review._id, review.rating, review.comment)
                }
                className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition"
                title="Chỉnh sửa"
              >
                <i className="ri-pencil-line text-lg"></i>
              </button>
              <button
                onClick={() => onDelete?.(review._id, review.userId.fullName)}
                disabled={isDeleting}
                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition disabled:opacity-50"
                title="Xóa"
              >
                <i className="ri-delete-bin-6-line text-lg"></i>
              </button>
            </div>
          );
        },
      },
    ],
    [onEdit, onDelete, isDeleting]
  );

  return (
    <div className="[&>div]:!border-0 [&>div]:!shadow-none [&>div]:!rounded-none">
      <GenericTable data={data} columns={columns} />
    </div>
  );
}
