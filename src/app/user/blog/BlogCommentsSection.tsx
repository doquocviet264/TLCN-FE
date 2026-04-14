"use client";

import { useRef, useState } from "react";
import { MessageSquare, TrendingUp } from "lucide-react";
import CommentBox from "./CommentBox";
import CommentsList from "./CommentsList";

interface BlogCommentsSectionProps {
  slug: string;
}

const BlogCommentsSection = ({ slug }: BlogCommentsSectionProps) => {
  const commentsListRef = useRef<{
    handleCommentAdded: (data: any) => void;
  }>(null);

  const [refreshKey, setRefreshKey] = useState(0);
  const [commentCount, setCommentCount] = useState<number | null>(null);

  const handleCommentAddedInBox = (commentData: {
    userId: string;
    fullName: string;
    avatar?: string;
  }) => {
    // Call the CommentsList method to update cache and refetch
    commentsListRef.current?.handleCommentAdded(commentData);
    // Also trigger a refresh
    setRefreshKey((k) => k + 1);
  };

  return (
    <section className="mt-12">
      {/* Section Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center shadow-lg shadow-orange-500/25">
            <MessageSquare className="h-5 w-5 text-white" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-slate-900">
              Bình luận
              {commentCount !== null && (
                <span className="ml-2 text-base font-semibold text-orange-500">({commentCount})</span>
              )}
            </h3>
            <p className="text-xs text-slate-500">
              Chia sẻ cảm nhận của bạn về bài viết
            </p>
          </div>
        </div>
      </div>

      {/* Comment Box */}
      <div className="mb-8">
        <CommentBox slug={slug} onCommentAdded={handleCommentAddedInBox} />
      </div>

      {/* Comments List */}
      <div>
        <CommentsList slug={slug} ref={commentsListRef} refresh={refreshKey > 0} onCountChange={setCommentCount} />
      </div>
    </section>
  );
};

export default BlogCommentsSection;
