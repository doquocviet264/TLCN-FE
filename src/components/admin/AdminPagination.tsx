import React from "react";

interface AdminPaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  totalItems?: number;
  itemsLabel?: string;
  activeColor?: "orange" | "emerald" | "blue" | "slate";
}

const AdminPagination: React.FC<AdminPaginationProps> = ({
  currentPage,
  totalPages,
  onPageChange,
  totalItems,
  itemsLabel = "mục",
  activeColor = "orange",
}) => {
  const colorMap = {
    orange: {
      text: "text-orange-600",
      bg: "bg-orange-500",
      border: "border-orange-500",
      hoverBorder: "hover:border-orange-300",
      hoverText: "hover:text-orange-600",
      shadow: "shadow-orange-500/20",
    },
    emerald: {
      text: "text-emerald-600",
      bg: "bg-emerald-500",
      border: "border-emerald-500",
      hoverBorder: "hover:border-emerald-300",
      hoverText: "hover:text-emerald-600",
      shadow: "shadow-emerald-500/20",
    },
    blue: {
      text: "text-blue-600",
      bg: "bg-blue-500",
      border: "border-blue-500",
      hoverBorder: "hover:border-blue-300",
      hoverText: "hover:text-blue-600",
      shadow: "shadow-blue-500/20",
    },
    slate: {
      text: "text-slate-900",
      bg: "bg-slate-800",
      border: "border-slate-800",
      hoverBorder: "hover:border-slate-400",
      hoverText: "hover:text-slate-900",
      shadow: "shadow-slate-800/20",
    },
  };

  const colors = colorMap[activeColor];

  if (totalPages <= 1) return (
    <div className="flex flex-col md:flex-row items-center justify-between bg-white rounded-2xl shadow-sm p-4 md:p-5 gap-4 border border-slate-100">
      {totalItems !== undefined && (
        <p className="text-slate-500 text-sm font-medium">
          Tổng cộng <span className="text-slate-900 font-bold">{totalItems}</span> {itemsLabel}
        </p>
      )}
      <div className="text-slate-400 text-sm italic">Chỉ có 1 trang</div>
    </div>
  );

  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    pages.push(1);

    if (totalPages <= 7) {
      for (let i = 2; i <= totalPages; i++) pages.push(i);
    } else {
      if (currentPage <= 4) {
        for (let i = 2; i <= 5; i++) pages.push(i);
        pages.push("...");
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 3) {
        pages.push("...");
        for (let i = totalPages - 4; i <= totalPages; i++) pages.push(i);
      } else {
        pages.push("...");
        for (let i = currentPage - 1; i <= currentPage + 1; i++) pages.push(i);
        pages.push("...");
        pages.push(totalPages);
      }
    }
    return pages;
  };

  return (
    <div className="flex flex-col md:flex-row items-center justify-between bg-white rounded-2xl shadow-sm p-4 md:p-5 gap-4 border border-slate-100">
      {totalItems !== undefined && (
        <p className="text-slate-500 text-sm font-medium">
          Tổng: <span className="text-slate-900 font-bold">{totalItems}</span> {itemsLabel} 
          <span className="mx-3 text-slate-300">|</span> 
          Trang <span className={`${colors.text} font-bold`}>{currentPage}</span> / {totalPages}
        </p>
      )}

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
          disabled={currentPage === 1}
          className={`w-10 h-10 flex items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 ${colors.hoverBorder} ${colors.hoverText} disabled:opacity-30 disabled:cursor-not-allowed transition-all bg-white shadow-sm`}
          title="Trang trước"
        >
          <i className="ri-arrow-left-s-line text-xl"></i>
        </button>

        <div className="flex items-center gap-2">
          {getPageNumbers().map((p, idx) => (
            <React.Fragment key={idx}>
              {p === "..." ? (
                <span className="w-10 h-10 flex items-center justify-center text-slate-400 font-medium select-none">
                  ...
                </span>
              ) : (
                <button
                  type="button"
                  onClick={() => onPageChange(p as number)}
                  className={`w-10 h-10 flex items-center justify-center rounded-lg text-sm font-bold transition-all shadow-sm ${
                    currentPage === p
                      ? `${colors.bg} text-white border ${colors.border} ${colors.shadow} shadow-md`
                      : `bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 ${colors.hoverBorder} ${colors.hoverText}`
                  }`}
                >
                  {p}
                </button>
              )}
            </React.Fragment>
          ))}
        </div>

        <button
          type="button"
          onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
          disabled={currentPage === totalPages}
          className={`w-10 h-10 flex items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 ${colors.hoverBorder} ${colors.hoverText} disabled:opacity-30 disabled:cursor-not-allowed transition-all bg-white shadow-sm`}
          title="Trang sau"
        >
          <i className="ri-arrow-right-s-line text-xl"></i>
        </button>
      </div>
    </div>
  );
};

export default AdminPagination;
