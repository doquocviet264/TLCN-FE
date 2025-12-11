// 'use client';

// import { dataBlogPosts } from '@/data/data';
// import BloggerCard from './BloggerCard';

// const FeaturedBloggers = () => {
//   // Lấy 4 bài viết mới nhất
//   const topPosts = [...dataBlogPosts]
//     .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
//     .slice(0, 4);

//   // Tạo danh sách blogger từ các bài viết
//   const bloggers = topPosts.map((post) => ({
//     name: post.author,
//     description: 'Đưa Mộc Châu Ra Thế Giới - Mang Thế Giới Về Mộc Châu',
//     avatar: post.authorAvatar ?? '/avatars/default.jpg',
//     facebookLink: 'https://facebook.com',
//     zaloLink: 'https://zalo.me',
//   }));

//   return (
//     <div className="mt-10">
//       <h3 className="text-xl font-bold mb-4">CÁC BLOGGER NỔI BẬT</h3>
//       <div className="flex flex-col gap-5">
//         {bloggers.map((blogger, index) => (
//           <BloggerCard key={index} {...blogger} />
//         ))}
//       </div>
//     </div>
//   );
// };

// export default FeaturedBloggers;
