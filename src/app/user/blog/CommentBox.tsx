'use client';

import React, { useState } from 'react';
import Button from '@/components/ui/Button';

const CommentBox = () => {
  const [content, setContent] = useState('');

  const handleSubmit = () => {
    if (content.trim()) {
      // TODO: Implement comment submission
      setContent('');
    }
  };

  return (
    <div className="pt-4 ">
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Bạn đang nghĩ gì!"
        className="w-full h-[60px] p-4 shadow-lg resize-none text-sm focus:outline-none bg-[var-white]"
      />
      <div className="flex justify-end mt-2">
        <Button
          onClick={handleSubmit}
          variant="primary"
          className="rounded-full px-4 py-1 text-sm focus:outline-none"
        >
          Bình luận
        </Button>
      </div>
    </div>
  );
};

export default CommentBox;
