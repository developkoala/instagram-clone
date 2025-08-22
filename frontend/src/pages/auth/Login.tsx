import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import SEO from '../../components/common/SEO';
import { useAuth } from "../../hooks/useAuth";

const Login: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const from = location.state?.from?.pathname || '/';

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(formData);
      navigate(from, { replace: true });
    } catch (err: any) {
      // 에러 메시지를 한글로 변환
      const errorMessage = err.response?.data?.detail || err.message || '로그인에 실패했습니다.';
      
      if (errorMessage.toLowerCase().includes('invalid email or password')) {
        setError('이메일 또는 비밀번호가 올바르지 않습니다.');
      } else if (errorMessage.toLowerCase().includes('network')) {
        setError('네트워크 오류가 발생했습니다. 다시 시도해주세요.');
      } else {
        setError(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  const isFormValid = formData.email && formData.password;

  return (
    <>
      <SEO 
        title="로그인"
        description="먹스타그램에 로그인하여 맛있는 음식 사진과 맛집 정보를 공유하세요."
        keywords="먹스타그램 로그인, 음식 SNS 로그인, 맛집 공유"
      />
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-mukstagram-secondary via-white to-mukstagram-lightGray px-4">
      <div className="max-w-sm w-full space-y-3">
        {/* Login Form */}
        <div className="bg-white border border-instagram-border rounded-sm p-10">
          <div className="text-center mb-8">
            <h1 className="text-5xl font-bold text-mukstagram-primary mb-2">
              🍽️ 먹스타그램
            </h1>
            <p className="text-mukstagram-dark text-sm">
              맛있는 순간을 공유하세요
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <input
                type="email"
                name="email"
                placeholder="이메일"
                value={formData.email}
                onChange={handleChange}
                className="input-field"
                required
              />
            </div>

            <div>
              <input
                type="password"
                name="password"
                placeholder="비밀번호"
                value={formData.password}
                onChange={handleChange}
                className="input-field"
                required
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 text-sm p-3 rounded mb-3 text-center">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={!isFormValid || loading}
              className="w-full bg-mukstagram-primary text-white font-semibold py-2 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-mukstagram-accent transition-all transform hover:scale-105 shadow-md"
            >
              {loading ? '로그인 중...' : '로그인'}
            </button>
          </form>

          <Link
            to="/forgot-password"
            className="block text-center text-mukstagram-accent text-xs mt-6 hover:text-mukstagram-primary"
          >
            비밀번호를 잊으셨나요?
          </Link>
        </div>

        {/* Sign up link */}
        <div className="bg-white border border-instagram-border rounded-sm p-6 text-center">
          <p className="text-sm">
            계정이 없으신가요?{' '}
            <Link to="/register" className="text-mukstagram-primary font-bold hover:text-mukstagram-accent transition-colors">
              맛집 탐험 시작하기
            </Link>
          </p>
        </div>
      </div>
    </div>
    </>
  );
};

export default Login;