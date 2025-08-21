import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { adminService } from '../../services/admin.service';
import { useToast } from '../../hooks/useToast';
import { getImageUrl } from '../../utils/imageUrl';
import { ArrowLeft, Trash2, ChevronLeft, ChevronRight, Heart, MessageCircle } from 'lucide-react';

interface Post {
  id: string;
  username: string;
  caption: string;
  image_url: string;
  likes_count: number;
  comments_count: number;
  created_at: string;
}

const AdminPosts: React.FC = () => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasNext, setHasNext] = useState(false);
  const [totalPosts, setTotalPosts] = useState(0);
  const navigate = useNavigate();
  const { showToast } = useToast();

  const checkAuthCallback = useCallback(() => {
    checkAuth();
  }, []);

  const loadPostsCallback = useCallback(() => {
    loadPosts();
  }, [currentPage]);

  useEffect(() => {
    checkAuthCallback();
  }, [checkAuthCallback]);

  useEffect(() => {
    loadPostsCallback();
  }, [loadPostsCallback]);

  const checkAuth = () => {
    const token = localStorage.getItem('admin_access_token');
    if (!token) {
      navigate('/admin');
      return;
    }
  };

  const loadPosts = async () => {
    setLoading(true);
    try {
      const data = await adminService.listPosts(currentPage, 20);
      setPosts(data.posts);
      setHasNext(data.has_next);
      setTotalPosts(data.total);
    } catch (error) {
      if ((error as any).response?.status === 401) {
        localStorage.removeItem('admin_access_token');
        navigate('/admin');
        showToast('관리자 인증이 만료되었습니다.', 'error');
      } else {
        showToast('게시물 목록을 불러오는데 실패했습니다.', 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePost = async (postId: string, username: string) => {
    if (!confirm(`정말로 ${username}님의 게시물을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.`)) {
      return;
    }

    try {
      await adminService.deletePost(postId);
      showToast('게시물이 삭제되었습니다.', 'success');
      loadPosts();
    } catch (error) {
      showToast('게시물 삭제에 실패했습니다.', 'error');
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* 헤더 */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center gap-4">
              <Link
                to="/admin/dashboard"
                className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
              >
                <ArrowLeft size={20} />
                대시보드로 돌아가기
              </Link>
              <h1 className="text-3xl font-bold text-gray-900">게시물 관리</h1>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 게시물 테이블 */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-semibold text-gray-900">전체 게시물 ({totalPosts}개)</h2>
            </div>
          </div>

          {loading ? (
            <div className="p-6 text-center">로딩중...</div>
          ) : posts.length === 0 ? (
            <div className="p-6 text-center text-gray-500">게시물이 없습니다.</div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        미리보기
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        작성자
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        캡션
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        상호작용
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        작성일
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        작업
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {posts.map((post) => (
                      <tr key={post.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          {post.image_url ? (
                            <img
                              src={getImageUrl(post.image_url)}
                              alt="게시물 이미지"
                              className="w-16 h-16 object-cover rounded"
                            />
                          ) : (
                            <div className="w-16 h-16 bg-gray-200 rounded flex items-center justify-center">
                              <span className="text-xs text-gray-500">No Image</span>
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{post.username}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900 max-w-xs truncate">
                            {post.caption || '(캡션 없음)'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-3 text-sm">
                            <span className="flex items-center gap-1">
                              <Heart size={16} className="text-red-500" />
                              {post.likes_count}
                            </span>
                            <span className="flex items-center gap-1">
                              <MessageCircle size={16} className="text-blue-500" />
                              {post.comments_count}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-500">
                            {new Date(post.created_at).toLocaleDateString('ko-KR', {
                              year: 'numeric',
                              month: '2-digit',
                              day: '2-digit'
                            })}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <button
                            onClick={() => handleDeletePost(post.id, post.username)}
                            className="inline-flex items-center gap-1 px-3 py-1 bg-red-600 text-white text-sm rounded-md hover:bg-red-700"
                          >
                            <Trash2 size={16} />
                            삭제
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* 페이지네이션 */}
              <div className="px-6 py-4 border-t border-gray-200">
                <div className="flex justify-between items-center">
                  <div className="text-sm text-gray-700">
                    페이지 {currentPage}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                      className="px-3 py-1 border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                    >
                      <ChevronLeft size={20} />
                    </button>
                    <button
                      onClick={() => setCurrentPage(prev => prev + 1)}
                      disabled={!hasNext}
                      className="px-3 py-1 border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                    >
                      <ChevronRight size={20} />
                    </button>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
};

export default AdminPosts;