import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const Register: React.FC = () => {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    username: '',
    password: '',
    confirmPassword: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    // 비밀번호 확인 체크
    if (formData.password !== formData.confirmPassword) {
      setError('비밀번호가 일치하지 않습니다.');
      return;
    }

    // 비밀번호 길이 체크
    if (formData.password.length < 6) {
      setError('비밀번호는 최소 6자 이상이어야 합니다.');
      return;
    }

    setLoading(true);

    try {
      await register({
        email: formData.email,
        username: formData.username,
        password: formData.password,
      });
      navigate('/');
    } catch (err: any) {
      // 에러 메시지를 한글로 처리
      const errorMessage = err.response?.data?.detail || err.message || '회원가입에 실패했습니다.';
      
      if (errorMessage.includes('이미 사용 중인 이메일')) {
        setError('이미 사용 중인 이메일입니다. 다른 이메일을 사용해주세요.');
      } else if (errorMessage.includes('이미 사용 중인 사용자 이름')) {
        setError('이미 사용 중인 사용자 이름입니다. 다른 이름을 선택해주세요.');
      } else if (errorMessage.toLowerCase().includes('network')) {
        setError('네트워크 오류가 발생했습니다. 다시 시도해주세요.');
      } else {
        setError(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  const isFormValid = 
    formData.email && 
    formData.username && 
    formData.password && 
    formData.confirmPassword &&
    formData.password === formData.confirmPassword;

  return (
    <div className="min-h-screen flex items-center justify-center bg-instagram-secondary px-4">
      <div className="max-w-sm w-full space-y-3">
        {/* Register Form */}
        <div className="bg-white border border-instagram-border rounded-sm p-10">
          <h1 className="text-4xl font-light text-center mb-4" style={{ fontFamily: 'Billabong' }}>
            Instagram
          </h1>

          <p className="text-center text-instagram-gray font-semibold mb-6">
            친구들의 사진과 동영상을 보려면 가입하세요.
          </p>

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
                type="text"
                name="username"
                placeholder="사용자 이름"
                value={formData.username}
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
                minLength={6}
              />
            </div>

            <div>
              <input
                type="password"
                name="confirmPassword"
                placeholder="비밀번호 확인"
                value={formData.confirmPassword}
                onChange={handleChange}
                className="input-field"
                required
                minLength={6}
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
              className="w-full bg-instagram-accent text-white font-semibold py-1.5 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-600 transition-colors"
            >
              {loading ? '가입 중...' : '가입'}
            </button>
          </form>

          <p className="text-xs text-center text-instagram-gray mt-6">
            가입하면 Instagram의 약관, 데이터 정책 및 쿠키 정책에 동의하게 됩니다.
          </p>
        </div>

        {/* Login link */}
        <div className="bg-white border border-instagram-border rounded-sm p-6 text-center">
          <p className="text-sm">
            계정이 있으신가요?{' '}
            <Link to="/login" className="text-instagram-accent font-semibold">
              로그인
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;