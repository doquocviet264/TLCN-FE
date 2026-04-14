"use client";
import { useState, useRef, useEffect, KeyboardEvent } from "react";
import { FiX } from "react-icons/fi";
import { MapPin, ChevronDown, Search, Loader2 } from "lucide-react";

const API_BASE = "https://34tinhthanh.com/api";

interface Province {
  province_code: string;
  name: string;
}

interface Ward {
  ward_code: string;
  ward_name: string;
  province_code: string;
}

interface CategoryTagsFormProps {
  categories: string[];
  tags: string[];
  address: string;
  provinceCode: string;
  provinceName: string;
  wardCode: string;
  wardName: string;
  onCategoriesChange: (values: string[]) => void;
  onTagsChange: (values: string[]) => void;
  onAddressChange: (value: string) => void;
  onLocationChange: (pCode: string, pName: string, wCode: string, wName: string) => void;
}

const CATEGORY_OPTIONS = [
  "Du lịch", "Ẩm thực", "Khách sạn", "Mua sắm",
  "Tâm linh", "Văn hóa", "Giải trí", "Thiên nhiên", "Review", "Kinh nghiệm", "Nghỉ dưỡng",
];

export default function CategoryTagsForm({
  categories,
  tags,
  address,
  provinceCode,
  provinceName,
  wardCode,
  wardName,
  onCategoriesChange,
  onTagsChange,
  onAddressChange,
  onLocationChange,
}: CategoryTagsFormProps) {
  const [openCategory, setOpenCategory] = useState(false);
  const [openProvince, setOpenProvince] = useState(false);
  const [openWard, setOpenWard] = useState(false);
  const [tagInput, setTagInput] = useState("");

  // Province/Ward data
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [wards, setWards] = useState<Ward[]>([]);
  const [loadingProvinces, setLoadingProvinces] = useState(false);
  const [loadingWards, setLoadingWards] = useState(false);

  // Search filters for dropdowns
  const [provinceSearch, setProvinceSearch] = useState("");
  const [wardSearch, setWardSearch] = useState("");

  const categoryRef = useRef<HTMLDivElement>(null);
  const provinceRef = useRef<HTMLDivElement>(null);
  const wardRef = useRef<HTMLDivElement>(null);

  // -------- Fetch Tỉnh/Thành từ 34tinhthanh.com --------
  useEffect(() => {
    const fetchProvinces = async () => {
      setLoadingProvinces(true);
      try {
        const res = await fetch(`${API_BASE}/provinces`);
        if (!res.ok) throw new Error("Network error");
        const data: Province[] = await res.json();
        setProvinces(data);
      } catch (err) {
        console.error("Lỗi lấy Tỉnh/Thành:", err);
      } finally {
        setLoadingProvinces(false);
      }
    };
    fetchProvinces();
  }, []);

  // -------- Fetch Phường/Xã khi chọn Tỉnh --------
  useEffect(() => {
    if (!provinceCode) {
      setWards([]);
      return;
    }
    const fetchWards = async () => {
      setLoadingWards(true);
      try {
        const res = await fetch(`${API_BASE}/wards?province_code=${provinceCode}`);
        if (!res.ok) throw new Error("Network error");
        const data: Ward[] = await res.json();
        setWards(data);
      } catch (err) {
        console.error("Lỗi lấy Phường/Xã:", err);
        setWards([]);
      } finally {
        setLoadingWards(false);
      }
    };
    fetchWards();
  }, [provinceCode]);

  // -------- Click outside để đóng dropdown --------
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (categoryRef.current && !categoryRef.current.contains(event.target as Node)) {
        setOpenCategory(false);
      }
      if (provinceRef.current && !provinceRef.current.contains(event.target as Node)) {
        setOpenProvince(false);
        setProvinceSearch("");
      }
      if (wardRef.current && !wardRef.current.contains(event.target as Node)) {
        setOpenWard(false);
        setWardSearch("");
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // -------- Filtered lists --------
  const filteredProvinces = provinceSearch.trim()
    ? provinces.filter((p) => p.name.toLowerCase().includes(provinceSearch.toLowerCase()))
    : provinces;

  const filteredWards = wardSearch.trim()
    ? wards.filter((w) => w.ward_name.toLowerCase().includes(wardSearch.toLowerCase()))
    : wards;

  // -------- Handlers --------
  const toggleCategory = (value: string) => {
    if (categories.includes(value)) {
      onCategoriesChange(categories.filter((c) => c !== value));
    } else {
      onCategoriesChange([...categories, value]);
    }
  };

  const handleAddTag = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === " " && tagInput.trim() !== "") {
      e.preventDefault();
      if (!tagInput.startsWith("#")) return;
      const tag = tagInput.trim();
      const uniqueTags = [...new Set([...tags, tag])];
      onTagsChange(uniqueTags);
      setTagInput("");
    }
  };

  const removeTag = (tag: string) => {
    onTagsChange(tags.filter((t) => t !== tag));
  };

  return (
    <div className="space-y-5">
      {/* ---- Danh mục ---- */}
      <div className="relative" ref={categoryRef}>
        <label className="block font-medium text-slate-700 mb-1.5 text-sm">
          Danh mục <span className="text-slate-400 font-normal">(chọn một hoặc nhiều)</span>
        </label>
        <button
          type="button"
          onClick={() => setOpenCategory(!openCategory)}
          className="w-full flex items-center justify-between gap-2 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-700 hover:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-400/30 transition-colors"
        >
          <span className="truncate">
            {categories.length > 0 ? categories.join(", ") : "Chọn danh mục..."}
          </span>
          <ChevronDown size={16} className={`flex-shrink-0 transition-transform ${openCategory ? "rotate-180" : ""}`} />
        </button>

        {openCategory && (
          <div className="absolute left-0 top-full mt-1 w-full bg-white border border-slate-200 rounded-xl shadow-xl z-20 p-2 max-h-52 overflow-y-auto">
            <div className="grid grid-cols-2 gap-1">
              {CATEGORY_OPTIONS.map((option) => {
                const selected = categories.includes(option);
                return (
                  <label
                    key={option}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer text-sm transition-colors ${
                      selected ? "bg-orange-50 text-orange-700 font-medium" : "hover:bg-slate-50 text-slate-700"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={selected}
                      onChange={() => toggleCategory(option)}
                      className="accent-orange-500 w-3.5 h-3.5"
                    />
                    {option}
                  </label>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* ---- Tags ---- */}
      <div>
        <label className="block font-medium text-slate-700 mb-1.5 text-sm">
          Tags <span className="text-slate-400 font-normal">(bắt đầu bằng #, gõ xong nhấn Space)</span>
        </label>
        <div className="flex flex-wrap gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 focus-within:border-orange-400 focus-within:ring-2 focus-within:ring-orange-400/20 transition-colors min-h-[46px]">
          {tags.map((tag) => (
            <span key={tag} className="inline-flex items-center gap-1 bg-orange-100 text-orange-700 border border-orange-200 px-2.5 py-1 rounded-lg text-xs font-medium">
              {tag}
              <button type="button" onClick={() => removeTag(tag)} className="ml-0.5 hover:text-red-600 transition-colors">
                <FiX size={12} />
              </button>
            </span>
          ))}
          <input
            type="text"
            value={tagInput}
            onChange={(e) => {
              const val = e.target.value;
              if (val === "" || val.startsWith("#")) setTagInput(val);
            }}
            onKeyDown={handleAddTag}
            placeholder={tags.length === 0 ? "#dalat #saigon #dulich..." : ""}
            className="flex-1 min-w-[140px] bg-transparent outline-none text-sm py-0.5"
          />
        </div>
      </div>

      {/* ---- Vị trí hành chính ---- */}
      <div>
        <label className="block font-medium text-slate-700 mb-1.5 text-sm flex items-center gap-1.5">
          <MapPin size={14} className="text-orange-500" />
          Vị trí địa lý
        </label>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
          {/* Tỉnh / Thành phố */}
          <div className="relative" ref={provinceRef}>
            <span className="block text-xs text-slate-500 mb-1">Tỉnh / Thành phố</span>
            <button
              type="button"
              onClick={() => { setOpenProvince(!openProvince); setOpenWard(false); }}
              className="w-full flex items-center justify-between gap-2 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm hover:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-400/30 transition-colors"
            >
              <span className="truncate text-slate-700">{provinceName || "Chọn Tỉnh/Thành..."}</span>
              {loadingProvinces
                ? <Loader2 size={15} className="animate-spin text-slate-400 flex-shrink-0" />
                : <ChevronDown size={15} className={`flex-shrink-0 text-slate-400 transition-transform ${openProvince ? "rotate-180" : ""}`} />
              }
            </button>

            {openProvince && (
              <div className="absolute left-0 top-full mt-1 w-full bg-white border border-slate-200 rounded-xl shadow-xl z-20 overflow-hidden">
                {/* Search box */}
                <div className="p-2 border-b border-slate-100">
                  <div className="flex items-center gap-2 bg-slate-50 rounded-lg px-3 py-1.5">
                    <Search size={13} className="text-slate-400" />
                    <input
                      type="text"
                      autoFocus
                      value={provinceSearch}
                      onChange={(e) => setProvinceSearch(e.target.value)}
                      placeholder="Tìm tỉnh/thành..."
                      className="flex-1 bg-transparent text-sm outline-none"
                    />
                  </div>
                </div>
                <div className="max-h-48 overflow-y-auto">
                  {filteredProvinces.length === 0 ? (
                    <div className="p-3 text-sm text-slate-400 text-center">Không tìm thấy</div>
                  ) : filteredProvinces.map((p) => (
                    <button
                      key={p.province_code}
                      type="button"
                      className={`w-full text-left px-4 py-2.5 text-sm hover:bg-orange-50 hover:text-orange-700 transition-colors border-b border-slate-50 last:border-b-0 ${
                        provinceCode === p.province_code ? "bg-orange-50 text-orange-700 font-medium" : "text-slate-700"
                      }`}
                      onClick={() => {
                        onLocationChange(p.province_code, p.name, "", "");
                        setOpenProvince(false);
                        setProvinceSearch("");
                      }}
                    >
                      {p.name}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Phường / Xã */}
          <div className="relative" ref={wardRef}>
            <span className="block text-xs text-slate-500 mb-1">Phường / Xã</span>
            <button
              type="button"
              disabled={!provinceCode}
              onClick={() => { setOpenWard(!openWard); setOpenProvince(false); }}
              className="w-full flex items-center justify-between gap-2 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm hover:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-400/30 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <span className="truncate text-slate-700">{wardName || "Chọn Phường/Xã..."}</span>
              {loadingWards
                ? <Loader2 size={15} className="animate-spin text-slate-400 flex-shrink-0" />
                : <ChevronDown size={15} className={`flex-shrink-0 text-slate-400 transition-transform ${openWard ? "rotate-180" : ""}`} />
              }
            </button>

            {openWard && (
              <div className="absolute left-0 top-full mt-1 w-full bg-white border border-slate-200 rounded-xl shadow-xl z-20 overflow-hidden">
                {/* Search box */}
                <div className="p-2 border-b border-slate-100">
                  <div className="flex items-center gap-2 bg-slate-50 rounded-lg px-3 py-1.5">
                    <Search size={13} className="text-slate-400" />
                    <input
                      type="text"
                      autoFocus
                      value={wardSearch}
                      onChange={(e) => setWardSearch(e.target.value)}
                      placeholder="Tìm phường/xã..."
                      className="flex-1 bg-transparent text-sm outline-none"
                    />
                  </div>
                </div>
                <div className="max-h-48 overflow-y-auto">
                  {filteredWards.length === 0 ? (
                    <div className="p-3 text-sm text-slate-400 text-center">
                      {wards.length === 0 ? "Đang tải..." : "Không tìm thấy"}
                    </div>
                  ) : filteredWards.map((w) => (
                    <button
                      key={w.ward_code}
                      type="button"
                      className={`w-full text-left px-4 py-2.5 text-sm hover:bg-orange-50 hover:text-orange-700 transition-colors border-b border-slate-50 last:border-b-0 ${
                        wardCode === w.ward_code ? "bg-orange-50 text-orange-700 font-medium" : "text-slate-700"
                      }`}
                      onClick={() => {
                        onLocationChange(provinceCode, provinceName, w.ward_code, w.ward_name);
                        setOpenWard(false);
                        setWardSearch("");
                      }}
                    >
                      {w.ward_name}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Chi tiết địa chỉ */}
        <div>
          <span className="block text-xs text-slate-500 mb-1">Số nhà, tên đường (không bắt buộc)</span>
          <input
            type="text"
            value={address}
            onChange={(e) => onAddressChange(e.target.value)}
            placeholder="VD: 123 Nguyễn Huệ..."
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-400/20 transition-colors"
            name="locationDetail"
          />
        </div>

        {/* Preview địa chỉ đã chọn */}
        {(provinceName || wardName || address) && (
          <div className="mt-3 flex items-start gap-2 bg-orange-50 border border-orange-200 rounded-xl px-3 py-2.5 text-sm text-orange-800">
            <MapPin size={14} className="text-orange-500 mt-0.5 flex-shrink-0" />
            <span>{[address, wardName, provinceName].filter(Boolean).join(", ")}</span>
            <button
              type="button"
              onClick={() => { onLocationChange("", "", "", ""); onAddressChange(""); }}
              className="ml-auto text-orange-400 hover:text-red-500 flex-shrink-0 transition-colors"
              title="Xoá vị trí"
            >
              <FiX size={14} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
