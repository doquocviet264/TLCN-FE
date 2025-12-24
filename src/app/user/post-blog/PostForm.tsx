"use client";

import { useEffect, useRef } from "react";
import { FiBold, FiItalic, FiUnderline, FiImage, FiVideo, FiGlobe, FiUser } from "react-icons/fi";
import { toast } from "react-hot-toast";

// File size limits
const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB
const MAX_VIDEO_SIZE = 50 * 1024 * 1024; // 50MB

interface PostFormProps {
  title: string;
  content: string;
  privacy: string;
  onTitleChange: (value: string) => void;
  onContentChange: (value: string) => void;
  onPrivacyClick: () => void;
}

export default function PostForm({
  title,
  content,
  privacy,
  onTitleChange,
  onContentChange,
  onPrivacyClick,
}: PostFormProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  const execCommand = (command: string, value?: string) => {
    document.execCommand(command, false, value);
    editorRef.current?.focus();
  };

  const placeCaretInside = (el: HTMLElement, atEnd = false) => {
    const sel = window.getSelection();
    if (!sel) return;
    const range = document.createRange();
    range.selectNodeContents(el);
    range.collapse(atEnd);
    sel.removeAllRanges();
    sel.addRange(range);
    el.focus();
  };

  const moveCaretAfterFigure = (figure: Element | HTMLElement) => {
    const htmlElement = figure as HTMLElement;
    
    if (!htmlElement.nextSibling && htmlElement.parentNode) {
      const p = document.createElement("p");
      p.innerHTML = "<br>";
      htmlElement.parentNode.insertBefore(p, htmlElement.nextSibling);
    }

    const sel = window.getSelection();
    if (!sel) return;
    
    const range = document.createRange();
    range.setStartAfter(htmlElement);
    range.collapse(true);
    
    sel.removeAllRanges();
    sel.addRange(range);
    editorRef.current?.focus();
  };

  const insertImage = (url: string) => {
    const capId = `cap-${Date.now()}`;
    execCommand(
      "insertHTML",
      `
      <figure class="editor-figure" contenteditable="false" style="margin:8px 0; text-align:center;">
        <img src="${url}" style="max-width:100%; border-radius:6px; display:inline-block;" />
        <figcaption 
          id="${capId}" 
          data-caption 
          data-placeholder="Nhập nội dung ghi chú (Không bắt buộc)" 
          contenteditable="true" 
          style="display:block; margin-top:6px; outline:none; min-height:1.2em;"
        ></figcaption>
      </figure>
      `
    );

    setTimeout(() => {
      const cap = editorRef.current?.querySelector<HTMLElement>(`#${capId}`);
      if (cap) placeCaretInside(cap, false);
    }, 50);
  };

  const insertVideo = (url: string) => {
    const capId = `cap-${Date.now()}`;
    execCommand(
      "insertHTML",
      `
      <figure class="editor-figure" contenteditable="false" style="margin:8px 0; text-align:center;">
        <video controls src="${url}" style="max-width:100%; border-radius:6px; display:inline-block;"></video>
        <figcaption 
          id="${capId}" 
          data-caption 
          data-placeholder="Nhập nội dung ghi chú (Không bắt buộc)" 
          contenteditable="true" 
          style="display:block; margin-top:6px; outline:none; min-height:1.2em;"
        ></figcaption>
      </figure>
      `
    );

    setTimeout(() => {
      const cap = editorRef.current?.querySelector<HTMLElement>(`#${capId}`);
      if (cap) placeCaretInside(cap, false);
    }, 50);
  };

  const readFileAsDataURL = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (reader.result) {
          resolve(reader.result.toString());
        } else {
          reject("Failed to read file");
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size
    if (file.size > MAX_IMAGE_SIZE) {
      toast.error("Ảnh không được vượt quá 5MB");
      e.target.value = "";
      return;
    }

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast.error("Vui lòng chọn file ảnh hợp lệ");
      e.target.value = "";
      return;
    }

    const imageUrl = await readFileAsDataURL(file);
    insertImage(imageUrl);
    e.target.value = "";
  };

  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size
    if (file.size > MAX_VIDEO_SIZE) {
      toast.error("Video không được vượt quá 50MB");
      e.target.value = "";
      return;
    }

    // Validate file type
    if (!file.type.startsWith("video/")) {
      toast.error("Vui lòng chọn file video hợp lệ");
      e.target.value = "";
      return;
    }

    const videoUrl = await readFileAsDataURL(file);
    insertVideo(videoUrl);
    e.target.value = "";
  };


  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;

    if (e.key === "Enter" && target?.hasAttribute("data-caption")) {
      e.preventDefault();
      e.stopPropagation();

      const figure = target.closest(".editor-figure");
      if (figure) moveCaretAfterFigure(figure);
    }
  };

  const handleInput = (e: React.FormEvent<HTMLDivElement>) => {
    editorRef.current?.querySelectorAll<HTMLElement>("[data-caption]").forEach((caption) => {
      if (caption.innerHTML.trim() === "<br>" || caption.innerHTML.trim() === "&nbsp;") {
        caption.innerHTML = "";
      }
    });
    
    onContentChange((e.target as HTMLDivElement).innerHTML);
  };
  useEffect(() => {
    if (editorRef.current) {
      const isFocused = document.activeElement === editorRef.current 
        || editorRef.current.contains(document.activeElement);

      if (!isFocused && content !== editorRef.current.innerHTML) {
        editorRef.current.innerHTML = content || "";
      }
    }
  }, [content]);

  const renderPrivacyLabel = () => {
    switch (privacy) {
      case "public":
        return (
          <span className="flex items-center gap-1 font-medium">
            <FiGlobe /> Tất cả mọi người
          </span>
        );
      case "private":
        return (
          <span className="flex items-center gap-1 font-medium">
            <FiUser /> Chỉ mình bạn
          </span>
        );
      default:
        return "Không rõ";
    }
  };

  return (
    <div className="bg-[var(--background)] rounded-lg border border-[var(--gray-5)] p-5">
      <h3 className="font-bold mb-3 text-[var(--foreground)] pt-2">THÔNG TIN BÀI ĐĂNG</h3>

      <div className="flex items-center justify-between mb-2 pt-2">
        <label className="font-medium text-[var(--gray-2)]">Tiêu đề</label>
        <button
          type="button"
          onClick={onPrivacyClick}
          className="cursor-pointer px-3 py-1 bg-[#F9F9FC] border border-[var(--gray-5)] rounded-lg text-[var(--gray-2)] hover:bg-gray-100 flex items-center gap-1"
        >
          {renderPrivacyLabel()}
        </button>
      </div>

      <input
        type="text"
        value={title}
        onChange={(e) => onTitleChange(e.target.value)}
        className="w-full bg-[#F9F9FC] border border-[var(--gray-5)] rounded-lg p-3 mb-4 outline-none focus:ring-2 focus:ring-[var(--primary)]"
      />

      <div className="flex justify-between items-center mb-2 pt-2">
        <span className="font-medium text-[var(--gray-2)]">Nội dung</span>
        <div className="flex gap-2 ">
          <button type="button" title="In đậm" className="cursor-pointer p-2 hover:bg-[var(--gray-6)] rounded" onClick={() => execCommand("bold")}>
            <FiBold />
          </button>
          <button type="button" title="In nghiêng" className="cursor-pointer p-2 hover:bg-[var(--gray-6)] rounded" onClick={() => execCommand("italic")}>
            <FiItalic />
          </button>
          <button type="button" title="Gạch chân" className="cursor-pointer p-2 hover:bg-[var(--gray-6)] rounded" onClick={() => execCommand("underline")}>
            <FiUnderline />
          </button>
          <button type="button" title="Thêm hình" className="cursor-pointer p-2 hover:bg-[var(--gray-6)] rounded" onClick={() => imageInputRef.current?.click()}>
            <FiImage />
          </button>
          <input ref={imageInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
          <button type="button" title="Thêm video" className="cursor-pointer p-2 hover:bg-[var(--gray-6)] rounded" onClick={() => videoInputRef.current?.click()}>
            <FiVideo />
          </button>
          <input ref={videoInputRef} type="file" accept="video/*" className="hidden" onChange={handleVideoUpload} />
        </div>
      </div>

      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        className="w-full bg-[#F9F9FC] border border-[var(--gray-5)] rounded-lg p-3 outline-none focus:ring-2 focus:ring-[var(--primary)] h-[600px] overflow-y-auto"
        onKeyDown={handleKeyDown}
        onInput={handleInput}
      />

      <style jsx global>{`
        [data-caption]:empty::before,
        [data-caption]:has(> br:only-child)::before {
          content: attr(data-placeholder);
          color: #9ca3af;
          font-style: italic;
          pointer-events: none;
        }
        .editor-figure img,
        .editor-figure video {
          max-width: 100%;
          border-radius: 6px;
        }
      `}</style>
    </div>
  );
}