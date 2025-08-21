import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { adminService } from '../../services/admin.service';
import { useToast } from '../../hooks/useToast';
import { ArrowLeft, Search, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';

interface User {
  id: string;
  username: string;
  email: string;
  created_at: string;
}

const AdminUsers: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [hasNext, setHasNext] = useState(false);
  const [totalUsers, setTotalUsers] = useState(0);
  const navigate = useNavigate();
  const { showToast } = useToast();

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    loadUsers();
  }, [currentPage]);

  const checkAuth = () => {
    const token = localStorage.getItem('admin_access_token');
    if (!token) {
      navigate('/admin');
      return;
    }
  };

  const loadUsers = async () => {
    setLoading(true);
    try {
      const data = await adminService.listUsers(currentPage, 20, searchQuery || undefined);
      setUsers(data.users);
      setHasNext(data.has_next);
      setTotalUsers(data.total);
    } catch (error: any) {
      if (error.response?.status === 401) {
        localStorage.removeItem('admin_access_token');
        navigate('/admin');
        showToast('관리자 인증이 만료되었습니다.', 'error');
      } else {
        showToast('사용자 목록을 불러오는데 실패했습니다.', 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (userId: string, username: string) => {
    if (!confirm(`정말로 ${username} 사용자를 탈퇴시키겠습니까? 이 작업은 되돌릴 수 없습니다.`)) {
      return;
    }

    try {
      await adminService.deleteUser(userId);
      showToast(`${username} 사용자가 탈퇴 처리되었습니다.`, 'success');
      loadUsers();
    } catch (error) {
      showToast('사용자 탈퇴 처리에 실패했습니다.', 'error');
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    loadUsers();
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
              <h1 className="text-3xl font-bold text-gray-900">회원 관리</h1>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 검색 바 */}
        <div className="bg-white rounded-lg shadow mb-6 p-4">
          <form onSubmit={handleSearch} className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="사용자명 또는 이메일로 검색..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <button
              type="submit"
              className="px-6 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
            >
              검색
            </button>
          </form>
        </div>

        {/* 사용자 테이블 */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-semibold text-gray-900">전체 사용자 ({totalUsers}명)</h2>
            </div>
          </div>

          {loading ? (
            <div className="p-6 text-center">로딩중...</div>
          ) : users.length === 0 ? (
            <div className="p-6 text-center text-gray-500">사용자가 없습니다.</div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        사용자명
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        이메일
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        가입일
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        작업
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {users.map((user) => (
                      <tr key={user.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{user.username}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-500">{user.email}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-500">
                            {new Date(user.created_at).toLocaleDateString('ko-KR', {
                              year: 'numeric',
                              month: '2-digit',
                              day: '2-digit',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <button
                            onClick={() => handleDeleteUser(user.id, user.username)}
                            className="inline-flex items-center gap-1 px-3 py-1 bg-red-600 text-white text-sm rounded-md hover:bg-red-700"
                          >
                            <Trash2 size={16} />
                            탈퇴
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

export default AdminUsers;