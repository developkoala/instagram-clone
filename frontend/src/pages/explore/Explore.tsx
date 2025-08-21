import React, { useState, useEffect, useRef } from 'react';
import { Post } from '../../types';
import PostModal from '../../components/post/PostModal';
import { postService } from '../../services/post.service';

const Explore: React.FC = () => {
  const [fullPost, setFullPost] = useState<Post | null>(null);
  const [explorePosts, setExplorePosts] = useState<Post[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isFetchingMore, setIsFetchingMore] = useState(false);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const limit = 21;
        const data = await postService.getExplore(1, limit);
        const posts: Post[] = data.posts.map((p: any) => ({
          id: p.id,
          caption: '',
          location: '',
          created_at: new Date().toISOString(),
          user: { id: '', email: '', username: '', full_name: '', is_private: false, is_verified: false, created_at: new Date().toISOString() },
          images: [{ id: p.id, image_url: p.images[0]?.image_url || '', position: 0 }],
          likes_count: p.likes_count,
          comments_count: 0,
          is_liked: false,
        }));
        setExplorePosts(posts);
        setPage(1);
        setHasMore(data.has_next);
      } catch (e) {
        setExplorePosts([]);
        setHasMore(false);
      }
    })();
  }, []);

  const loadMore = async () => {
    if (isFetchingMore || !hasMore) return;
    setIsFetchingMore(true);
    try {
      const nextPage = page + 1;
      const limit = 21;
      const data = await postService.getExplore(nextPage, limit);
      const posts: Post[] = data.posts.map((p: any) => ({
        id: p.id,
        caption: '',
        location: '',
        created_at: new Date().toISOString(),
        user: { id: '', email: '', username: '', full_name: '', is_private: false, is_verified: false, created_at: new Date().toISOString() },
        images: [{ id: p.id, image_url: p.images[0]?.image_url || '', position: 0 }],
        likes_count: p.likes_count,
        comments_count: 0,
        is_liked: false,
      }));
      setExplorePosts((prev) => [...prev, ...posts]);
      setPage(nextPage);
      setHasMore(data.has_next);
    } finally {
      setIsFetchingMore(false);
    }
  };

  useEffect(() => {
    if (!sentinelRef.current) return;
    const el = sentinelRef.current;
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          loadMore();
        }
      });
    }, { rootMargin: '200px 0px' });
    io.observe(el);
    return () => io.disconnect();
  }, [sentinelRef.current, page, hasMore]);

  return (
    <div className="max-w-4xl mx-auto pt-6 px-4 md:px-0 pb-20">
      <div className="grid grid-cols-3 gap-1 md:gap-4">
        {explorePosts.map((post) => (
          <button
            key={post.id}
            onClick={async () => {
              // 전체 게시글 정보 가져오기
              try {
                const fullPostData = await postService.getPostById(post.id);
                setFullPost(fullPostData);
              } catch (error) {
                console.error('Failed to load post details:', error);
              }
            }}
            className="aspect-square bg-instagram-lightGray relative group cursor-pointer overflow-hidden"
          >
            {/* Post image */}
            <img 
              src={post.images[0].image_url} 
              alt={post.caption}
              className="w-full h-full object-cover"
            />
            
            {/* Multiple images indicator */}
            {post.images.length > 1 && (
              <div className="absolute top-2 right-2">
                <svg className="w-5 h-5 text-white drop-shadow" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" />
                </svg>
              </div>
            )}

            {/* Hover overlay */}
            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-opacity flex items-center justify-center">
              <div className="hidden group-hover:flex items-center space-x-6 text-white">
                <div className="flex items-center space-x-2">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                  </svg>
                  <span className="font-semibold">{post.likes_count.toLocaleString()}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
                  </svg>
                  <span className="font-semibold">{post.comments_count}</span>
                </div>
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* Post Modal */}
      {fullPost && (
        <PostModal
          post={fullPost}
          isOpen={!!fullPost}
          onClose={() => {
            setFullPost(null);
          }}
        />
      )}
      <div ref={sentinelRef} />
      {isFetchingMore && (
        <div className="py-6 text-center text-sm text-instagram-gray">불러오는 중…</div>
      )}
    </div>
  );
};

export default Explore;