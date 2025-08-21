import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { adminService } from '../../services/admin.service';
import { useToast } from '../../hooks/useToast';
import { Users, FileText, Heart, MessageCircle, LogOut, UserX, Trash2 } from 'lucide-react';

interface User {
  id: string;
  username: string;
  email: string;
  created_at: string;
}

interface DayCount {
  day: string;
  count: number;
}

interface Stats {
  totals: {
    users: number;
    posts: number;
    likes: number;
    comments: number;
  };
  recent: {
    users: User[];
  };
  daily: {
    users: DayCount[];
  };
}

const AdminDashboard: React.FC = () => {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { showToast } = useToast();

  const checkAuthAndLoadStatsCallback = useCallback(() => {
    checkAuthAndLoadStats();
  }, []);

  useEffect(() => {
    checkAuthAndLoadStatsCallback();
  }, [checkAuthAndLoadStatsCallback]);

  const checkAuthAndLoadStats = async () => {
    const token = localStorage.getItem('admin_access_token');
    if (!token) {
      navigate('/admin');
      return;
    }

    try {
      const data = await adminService.getStats();
      setStats(data);
    } catch (error) {
      if ((error as any).response?.status === 401) {
        localStorage.removeItem('admin_access_token');
        navigate('/admin');
        showToast('관리자 인증이 만료되었습니다.', 'error');
      } else {
        showToast('통계를 불러오는데 실패했습니다.', 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('admin_access_token');
    navigate('/admin');
    showToast('로그아웃되었습니다.', 'info');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-lg">로딩중...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* 헤더 */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <h1 className="text-3xl font-bold text-gray-900">관리자 대시보드</h1>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
            >
              <LogOut size={20} />
              로그아웃
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 통계 카드 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-indigo-500 rounded-md p-3">
                <Users className="h-6 w-6 text-white" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">전체 사용자</dt>
                  <dd className="text-3xl font-semibold text-gray-900">{stats?.totals?.users || 0}</dd>
                </dl>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-green-500 rounded-md p-3">
                <FileText className="h-6 w-6 text-white" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">전체 게시물</dt>
                  <dd className="text-3xl font-semibold text-gray-900">{stats?.totals?.posts || 0}</dd>
                </dl>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-red-500 rounded-md p-3">
                <Heart className="h-6 w-6 text-white" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">전체 좋아요</dt>
                  <dd className="text-3xl font-semibold text-gray-900">{stats?.totals?.likes || 0}</dd>
                </dl>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-yellow-500 rounded-md p-3">
                <MessageCircle className="h-6 w-6 text-white" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">전체 댓글</dt>
                  <dd className="text-3xl font-semibold text-gray-900">{stats?.totals?.comments || 0}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        {/* 관리 메뉴 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <Link
            to="/admin/users"
            className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow"
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">회원 관리</h3>
                <p className="mt-1 text-sm text-gray-500">회원 목록 조회 및 탈퇴 처리</p>
              </div>
              <UserX className="h-8 w-8 text-gray-400" />
            </div>
          </Link>

          <Link
            to="/admin/posts"
            className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow"
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">게시물 관리</h3>
                <p className="mt-1 text-sm text-gray-500">게시물 조회 및 삭제</p>
              </div>
              <Trash2 className="h-8 w-8 text-gray-400" />
            </div>
          </Link>
        </div>

        {/* 최근 활동 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">최근 가입 사용자</h3>
            </div>
            <div className="p-6">
              <div className="space-y-3">
                {(stats?.recent?.users || []).map((user) => (
                  <div key={user.id} className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{user.username}</p>
                      <p className="text-sm text-gray-500">{user.email}</p>
                    </div>
                    <span className="text-xs text-gray-400">
                      {new Date(user.created_at).toLocaleDateString('ko-KR')}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">일별 가입자 수 (최근 7일)</h3>
            </div>
            <div className="p-6">
              <div className="space-y-3">
                {(stats?.daily?.users || []).map((day) => (
                  <div key={day.day} className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">{day.day}</span>
                    <span className="text-sm font-semibold text-gray-900">{day.count}명</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;