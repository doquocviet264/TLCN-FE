import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FaTimes, FaImage, FaLock, FaGlobe } from "react-icons/fa";
import { travelMemoryApi } from "@/lib/checkin/travelMemoryApi";
import { toast } from "react-hot-toast";

interface MemoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  provinceName: string;
  onSuccess: (provinceUnlocked: boolean) => void;
  bookingId?: string;
}

export default function MemoryModal({
  isOpen,
  onClose,
  provinceName,
  onSuccess,
  bookingId,
}: MemoryModalProps) {
  const [visitedAt, setVisitedAt] = useState("");
  const [caption, setCaption] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [privacy, setPrivacy] = useState<"private" | "public">("private");
  const [isLoading, setIsLoading] = useState(false);
  const [imageUrlInput, setImageUrlInput] = useState("");
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  const remainingImageSlots = 3 - images.length;
  const isBusy = isLoading || isUploadingImage;
  const allowedImageTypes = [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/webp",
  ];

  const handleUploadImages = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    e.target.value = "";

    if (!selectedFiles.length) return;

    if (remainingImageSlots <= 0) {
      toast.error("Tối đa 3 ảnh");
      return;
    }

    if (selectedFiles.length > remainingImageSlots) {
      toast.error(`Chỉ còn ${remainingImageSlots} vị trí ảnh`);
      return;
    }

    const invalidFile = selectedFiles.find(
      (file) => !allowedImageTypes.includes(file.type)
    );
    if (invalidFile) {
      toast.error("Chỉ hỗ trợ ảnh JPG, PNG hoặc WEBP");
      return;
    }

    setIsUploadingImage(true);
    try {
      const res = await travelMemoryApi.uploadImages(selectedFiles);
      const uploadedImages = res.images || [];

      if (!uploadedImages.length) {
        toast.error("Không nhận được link ảnh sau khi upload");
        return;
      }

      setImages((current) => [...current, ...uploadedImages].slice(0, 3));
      toast.success("Upload ảnh thành công");
    } catch (error: any) {
      console.error(error);
      toast.error(error.response?.data?.message || "Không thể upload ảnh");
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleAddImage = () => {
    if (isUploadingImage) {
      toast.error("Vui lòng chờ ảnh upload xong");
      return;
    }

    const imageUrl = imageUrlInput.trim();
    if (!imageUrl) return;

    if (remainingImageSlots <= 0) {
      toast.error("Tối đa 3 ảnh");
      return;
    }

    try {
      const parsedUrl = new URL(imageUrl);
      if (!["http:", "https:"].includes(parsedUrl.protocol)) {
        toast.error("Link ảnh phải bắt đầu bằng http hoặc https");
        return;
      }
    } catch {
      toast.error("Link ảnh không hợp lệ");
      return;
    }

    if (images.includes(imageUrl)) {
      toast.error("Ảnh này đã được thêm");
      return;
    }

    setImages([...images, imageUrl]);
    setImageUrlInput("");
  };

  const handleRemoveImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isUploadingImage) {
      toast.error("Vui lòng chờ ảnh upload xong");
      return;
    }
    if (!visitedAt) {
      toast.error("Vui lòng chọn ngày đi");
      return;
    }
    if (images.length === 0) {
      toast.error("Vui lòng thêm ít nhất 1 ảnh");
      return;
    }

    setIsLoading(true);
    try {
      let res;
      if (bookingId) {
        res = await travelMemoryApi.createMemoryFromBooking(bookingId, {
          visitedAt,
          caption,
          images,
          privacy,
        });
      } else {
        res = await travelMemoryApi.createMemory({
          provinceName,
          visitedAt,
          caption,
          images,
          privacy,
          source: "manual",
        });
      }

      toast.success("Tạo kỷ niệm thành công!");
      onSuccess(res.provinceUnlocked);
      onClose();
    } catch (error: any) {
      console.error(error);
      toast.error(error.response?.data?.message || "Lỗi khi tạo kỷ niệm");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]"
          >
            <div className="flex justify-between items-center p-4 border-b">
              <h3 className="text-lg font-bold text-slate-800">
                Lưu kỷ niệm tại {provinceName}
              </h3>
              <button
                onClick={onClose}
                className="text-slate-400 hover:text-slate-600"
              >
                <FaTimes size={20} />
              </button>
            </div>

            <form
              onSubmit={handleSubmit}
              className="p-4 flex-1 overflow-y-auto space-y-4"
            >
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">
                  Ngày đi *
                </label>
                <input
                  type="date"
                  required
                  value={visitedAt}
                  onChange={(e) => setVisitedAt(e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">
                  Ảnh kỷ niệm * (1-3 ảnh)
                </label>
                <p className="text-xs text-slate-500 mb-2">
                  Có thể tải ảnh từ máy hoặc dán link ảnh. Tối đa 3 ảnh.
                </p>
                <div className="space-y-2 mb-2">
                  <label
                    className={`flex items-center justify-center gap-2 px-4 py-2 border border-dashed rounded-lg text-sm font-semibold transition ${
                      remainingImageSlots <= 0 || isUploadingImage
                        ? "cursor-not-allowed border-slate-200 text-slate-400 bg-slate-50"
                        : "cursor-pointer border-indigo-300 text-indigo-700 bg-indigo-50 hover:bg-indigo-100"
                    }`}
                  >
                    <FaImage />
                    {isUploadingImage
                      ? "Đang tải ảnh..."
                      : "Tải ảnh lên"}
                    <input
                      type="file"
                      multiple
                      accept="image/png,image/jpeg,image/jpg,image/webp"
                      onChange={handleUploadImages}
                      disabled={remainingImageSlots <= 0 || isUploadingImage}
                      className="hidden"
                    />
                  </label>

                  <div className="flex gap-2">
                    <input
                      type="url"
                      placeholder="Nhập URL ảnh..."
                      value={imageUrlInput}
                      onChange={(e) => setImageUrlInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleAddImage();
                        }
                      }}
                      disabled={remainingImageSlots <= 0 || isUploadingImage}
                      className="min-w-0 flex-1 px-4 py-2 border rounded-lg outline-none focus:border-indigo-500 disabled:bg-slate-50 disabled:text-slate-400"
                    />
                    <button
                      type="button"
                      onClick={handleAddImage}
                      disabled={remainingImageSlots <= 0 || isUploadingImage}
                      className="px-4 py-2 bg-slate-100 text-slate-700 font-semibold rounded-lg hover:bg-slate-200 disabled:opacity-50"
                    >
                      Thêm
                    </button>
                  </div>
                </div>
                {images.length > 0 && (
                  <div className="grid grid-cols-3 gap-2 mt-2">
                    {images.map((img, i) => (
                      <div key={i} className="relative aspect-square">
                        <img
                          src={img}
                          alt=""
                          className="w-full h-full object-cover rounded-lg border"
                        />
                        <button
                          type="button"
                          onClick={() => handleRemoveImage(i)}
                          className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1"
                        >
                          <FaTimes size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">
                  Cảm nhận (Tùy chọn)
                </label>
                <textarea
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  placeholder="Vài dòng đáng nhớ về chuyến đi..."
                  maxLength={500}
                  rows={3}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Chế độ hiển thị
                </label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="privacy"
                      value="private"
                      checked={privacy === "private"}
                      onChange={() => setPrivacy("private")}
                    />
                    <span className="flex items-center gap-1 text-slate-600">
                      <FaLock /> Chỉ mình tôi
                    </span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="privacy"
                      value="public"
                      checked={privacy === "public"}
                      onChange={() => setPrivacy("public")}
                    />
                    <span className="flex items-center gap-1 text-slate-600">
                      <FaGlobe /> Chia sẻ cộng đồng
                    </span>
                  </label>
                </div>
              </div>

              <div className="pt-4">
                <button
                  type="submit"
                  disabled={isBusy}
                  className="w-full py-3 rounded-xl bg-indigo-600 text-white font-bold hover:bg-indigo-700 disabled:opacity-50"
                >
                  {isLoading
                    ? "Đang lưu..."
                    : isUploadingImage
                      ? "Đang tải ảnh..."
                      : "Lưu kỷ niệm"}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
