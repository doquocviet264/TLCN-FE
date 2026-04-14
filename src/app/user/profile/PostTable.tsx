'use client'
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table'
import { useMemo } from 'react'
import { GenericTable } from "@/shared/GenericTable"
import { BlogSummary } from "@/lib/blog/blogApi"

interface Props {
    data: BlogSummary[]
  }


export function PostTable({ data }: Props) {

    const columns = useMemo<ColumnDef<BlogSummary>[]>(() => [
        {
            header: 'Bài đăng',
            accessorKey: 'title',
            cell: ({row}) => {
                const post = row.original;
                const cover = post.cover || post.thumbnail || post.coverImageUrl || "/default-cover.jpg";
                return (
                    <div className="flex gap-3">
                        <img src={cover} alt="" className='h-10 w-10 object-cover rounded-md'/>
                        <h2 className="font-semibold">{post.title}</h2>
                    </div>
                )
            },
        },
        {
            header: 'Trạng thái',
            accessorKey: 'status',
            cell: ({ getValue }) => {
                const status = (getValue() as string) || 'draft';
                const statusMap: Record<string, { label: string, color: string }> = {
                    draft: { label: 'Bản nháp', color: 'bg-slate-100 text-slate-600' },
                    pending: { label: 'Chờ duyệt', color: 'bg-amber-100 text-amber-700' },
                    published: { label: 'Đã xuất bản', color: 'bg-emerald-100 text-emerald-700' },
                    rejected: { label: 'Từ chối', color: 'bg-red-100 text-red-700' },
                    archived: { label: 'Lưu trữ', color: 'bg-gray-100 text-gray-700' }
                };
                const config = statusMap[status] || statusMap.draft;
                return <span className={`px-2 py-1 rounded-full text-xs font-semibold ${config.color}`}>{config.label}</span>;
            }
          },
          {
            header: 'Ngày đăng',
            accessorKey: 'createdAt',
            cell: ({ getValue }) => {
              const val = getValue() as string;
              if(!val) return <span>-</span>;
              const date = new Date(val);
              return <span>{date.toLocaleDateString('vi-VN')}</span>
            },
          },
        ], [])

    const table = useReactTable({
        data,
        columns,
        getCoreRowModel: getCoreRowModel(),
        })

    return (
        <div className="[&>div]:!border-0 [&>div]:!shadow-none [&>div]:!rounded-none">
            <GenericTable data={data} columns={columns} />
        </div>
        //<GenericTable data={data} columns={columns} />

        )
    
    
}