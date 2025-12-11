"use client";

import { useRef } from "react";
import CommentBox from "./CommentBox";
import CommentsList from "./CommentsList";

interface BlogCommentsSectionProps {
  slug: string;
}

const BlogCommentsSection = ({ slug }: BlogCommentsSectionProps) => {
  const commentsListRef = useRef<{
    handleCommentAdded: (data: any) => void;
  }>(null);

  const handleCommentAddedInBox = (commentData: {
    userId: string;
    fullName: string;
    avatar?: string;
  }) => {
    console.log("BlogCommentsSection received comment data:", commentData);
    // Call the CommentsList method to update cache and refetch
    commentsListRef.current?.handleCommentAdded(commentData);
  };

  return (
    <>
      <div className="mt-10">
        <h3 className="text-2xl font-bold text-slate-900 mb-6">Bình luận</h3>
        <CommentBox slug={slug} onCommentAdded={handleCommentAddedInBox} />
      </div>

      <div className="mt-8">
        <CommentsList slug={slug} ref={commentsListRef} />
      </div>
    </>
  );
};

export default BlogCommentsSection;
