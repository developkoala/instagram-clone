import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { ChevronRight, User, Lock, HelpCircle, Info, LogOut, X, Camera } from 'lucide-react';
import { getImageUrl } from '../../utils/imageUrl';
import { userService } from '../../services/user.service';
import { useToast } from '../../contexts/ToastContext';

const Settings: React.FC = () => {
  const { user, logout, updateUser } = useAuth();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const modalFileInputRef = useRef<HTMLInputElement>(null);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState<string | null>(null); // For desktop view
  
  // Form states
  const [profileForm, setProfileForm] = useState({
    username: user?.username || '',
    bio: user?.bio || '',
    website: user?.website || '',
    email: user?.email || ''
  });
  
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const handleProfilePictureChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    try {
      const response = await userService.uploadProfilePicture(file);
      const profileData = await userService.getCurrentUserProfile();
      updateUser({
        ...profileData,
        profile_picture: response.profile_picture
      });
      showToast('프로필 사진이 변경되었습니다.', 'success');
    } catch (error) {
      showToast('프로필 사진 변경에 실패했습니다.', 'error');
      console.error('Failed to upload profile picture:', error);
    }
  };

  const handleProfileSubmit = async () => {
    try {
      await userService.updateProfile({
        bio: profileForm.bio,
        website: profileForm.website,
        email: profileForm.email
      });
      
      // AuthContext 업데이트
      const profileData = await userService.getCurrentUserProfile();
      updateUser(profileData);
      
      showToast('프로필이 업데이트되었습니다.', 'success');
    } catch (error) {
      showToast('프로필 업데이트에 실패했습니다.', 'error');
      console.error('Failed to update profile:', error);
    }
  };

  const handlePasswordChange = async () => {
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      showToast('새 비밀번호가 일치하지 않습니다.', 'error');
      return;
    }
    
    if (passwordForm.newPassword.length < 6) {
      showToast('비밀번호는 최소 6자 이상이어야 합니다.', 'error');
      return;
    }
    
    try {
      await userService.changePassword({
        current_password: passwordForm.currentPassword,
        new_password: passwordForm.newPassword
      });
      
      showToast('비밀번호가 변경되었습니다.', 'success');
      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
      setActiveSection(null);
      setActiveModal(null);
    } catch (error: any) {
      showToast(error.response?.data?.detail || '비밀번호 변경에 실패했습니다.', 'error');
      console.error('Failed to change password:', error);
    }
  };

  const settingsSections = [
    {
      title: '계정',
      items: [
        {
          icon: <User size={20} />,
          label: '프로필 편집',
          action: () => setActiveModal('profile'),
          description: '프로필 사진, 이름, 소개 변경'
        },
        {
          icon: <Lock size={20} />,
          label: '비밀번호 변경',
          action: () => setActiveModal('password'),
          description: '계정 비밀번호 업데이트'
        }
      ]
    },
    {
      title: '정보',
      items: [
        {
          icon: <HelpCircle size={20} />,
          label: '도움말',
          action: () => setActiveModal('help'),
          description: '도움말 센터 및 지원'
        },
        {
          icon: <Info size={20} />,
          label: '정보',
          action: () => setActiveModal('about'),
          description: '버전 정보 및 약관'
        }
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile Version */}
      <div className="block md:hidden">
        <div className="max-w-4xl mx-auto">
          {/* Mobile Header */}
          <div className="bg-white border-b sticky top-0 z-10">
            <div className="px-4 py-4 flex items-center">
              <button 
                onClick={() => navigate(-1)}
                className="mr-4"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <h1 className="text-xl font-semibold">설정</h1>
            </div>
          </div>

          {/* Mobile User Info */}
          <div className="bg-white mt-2 px-4 py-4 border-b">
            <div className="flex items-center">
              <div className="w-16 h-16 rounded-full overflow-hidden mr-4">
                {user?.profile_picture ? (
                  <img
                    src={getImageUrl(user.profile_picture) || ''}
                    alt={user.username}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                    <User size={24} className="text-gray-500" />
                  </div>
                )}
              </div>
              <div>
                <h2 className="font-semibold text-lg">{user?.username}</h2>
                <p className="text-gray-500">{user?.email}</p>
              </div>
            </div>
          </div>

          {/* Mobile Settings Sections */}
          {settingsSections.map((section, index) => (
            <div key={index} className="mt-6">
              <h3 className="px-4 py-2 text-sm font-semibold text-gray-500 uppercase tracking-wider">
                {section.title}
              </h3>
              <div className="bg-white">
                {section.items.map((item, itemIndex) => (
                  <button
                    key={itemIndex}
                    onClick={item.action}
                    className="w-full flex items-center px-4 py-4 hover:bg-gray-50 transition-colors border-b last:border-b-0"
                  >
                    <div className="mr-4 text-gray-600">
                      {item.icon}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">{item.label}</p>
                      <p className="text-sm text-gray-500">{item.description}</p>
                    </div>
                    <ChevronRight size={20} className="text-gray-400" />
                  </button>
                ))}
              </div>
            </div>
          ))}

          {/* Mobile Logout Button */}
          <div className="mt-6 mb-8">
            <button
              onClick={() => setShowLogoutConfirm(true)}
              className="w-full bg-white px-4 py-4 flex items-center hover:bg-gray-50 transition-colors"
            >
              <LogOut size={20} className="mr-4 text-red-500" />
              <span className="text-red-500 font-medium">로그아웃</span>
            </button>
          </div>

          {/* Mobile Account Info */}
          <div className="px-4 pb-8 text-center text-sm text-gray-500">
            <p>Instagram Clone</p>
            <p className="mt-1">버전 1.0.0</p>
          </div>
        </div>
      </div>

      {/* Desktop Version */}
      <div className="hidden md:block">
        <div className="max-w-6xl mx-auto flex">
          {/* Desktop Sidebar */}
          <div className="w-64 border-r bg-white min-h-screen">
            <div className="p-8">
              <h1 className="text-2xl font-semibold mb-8">설정</h1>
              
              {settingsSections.map((section, sectionIndex) => (
                <div key={sectionIndex} className="mb-8">
                  <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">
                    {section.title}
                  </h3>
                  <div className="space-y-1">
                    {section.items.map((item, itemIndex) => (
                      <button
                        key={itemIndex}
                        onClick={() => setActiveSection(item.label)}
                        className={`w-full flex items-center px-3 py-2 text-left hover:bg-gray-100 rounded-lg transition-colors ${
                          activeSection === item.label ? 'bg-gray-100' : ''
                        }`}
                      >
                        <div className="mr-3 text-gray-600">
                          {item.icon}
                        </div>
                        <span className="text-sm">{item.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
              
              <div className="border-t pt-4">
                <button
                  onClick={() => setShowLogoutConfirm(true)}
                  className="w-full flex items-center px-3 py-2 text-left hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <LogOut size={20} className="mr-3 text-red-500" />
                  <span className="text-sm text-red-500">로그아웃</span>
                </button>
              </div>
            </div>
          </div>

          {/* Desktop Content Area */}
          <div className="flex-1 bg-white">
            <div className="p-8">
              <div className="max-w-2xl mx-auto">
                {/* Default view when no section is selected */}
                {!activeSection && (
                  <div className="text-center py-20">
                    <div className="w-32 h-32 rounded-full mx-auto mb-6 overflow-hidden">
                      {user?.profile_picture ? (
                        <img
                          src={getImageUrl(user.profile_picture) || ''}
                          alt={user.username}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                          <User size={48} className="text-gray-400" />
                        </div>
                      )}
                    </div>
                    <h2 className="text-2xl font-semibold mb-2">{user?.username}</h2>
                    <p className="text-gray-500 mb-8">{user?.email}</p>
                    <p className="text-gray-400">설정 메뉴를 선택하세요</p>
                  </div>
                )}

                {/* Profile Edit Section */}
                {activeSection === '프로필 편집' && (
                  <div>
                    <h2 className="text-2xl font-semibold mb-8">프로필 편집</h2>
                    <div className="flex items-center mb-8">
                      <div className="w-20 h-20 rounded-full bg-gray-200 flex items-center justify-center mr-6">
                        {user?.profile_picture ? (
                          <img src={getImageUrl(user.profile_picture) || ''} alt="" className="w-full h-full rounded-full object-cover" />
                        ) : (
                          <Camera size={32} className="text-gray-400" />
                        )}
                      </div>
                      <div>
                        <h3 className="font-semibold">{user?.username}</h3>
                        <button 
                          onClick={() => fileInputRef.current?.click()}
                          className="text-blue-500 text-sm font-semibold"
                        >
                          프로필 사진 변경
                        </button>
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={handleProfilePictureChange}
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-6">
                      <div>
                        <label className="block text-sm font-medium mb-2">사용자 이름</label>
                        <input
                          type="text"
                          value={profileForm.username}
                          onChange={(e) => setProfileForm({...profileForm, username: e.target.value})}
                          className="w-full p-3 border rounded-lg"
                          disabled
                        />
                        <p className="text-xs text-gray-500 mt-1">사용자 이름은 변경할 수 없습니다</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2">소개</label>
                        <textarea
                          value={profileForm.bio}
                          onChange={(e) => setProfileForm({...profileForm, bio: e.target.value})}
                          className="w-full p-3 border rounded-lg resize-none"
                          rows={4}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2">웹사이트</label>
                        <input
                          type="url"
                          value={profileForm.website}
                          onChange={(e) => setProfileForm({...profileForm, website: e.target.value})}
                          className="w-full p-3 border rounded-lg"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2">이메일</label>
                        <input
                          type="email"
                          value={profileForm.email}
                          onChange={(e) => setProfileForm({...profileForm, email: e.target.value})}
                          className="w-full p-3 border rounded-lg"
                        />
                      </div>
                      <button 
                        onClick={handleProfileSubmit}
                        className="bg-blue-500 text-white px-6 py-2 rounded-lg font-semibold hover:bg-blue-600">
                        제출
                      </button>
                    </div>
                  </div>
                )}

                {/* Password Change Section */}
                {activeSection === '비밀번호 변경' && (
                  <div>
                    <h2 className="text-2xl font-semibold mb-8">비밀번호 변경</h2>
                    <div className="space-y-6">
                      <div>
                        <label className="block text-sm font-medium mb-2">현재 비밀번호</label>
                        <input
                          type="password"
                          value={passwordForm.currentPassword}
                          onChange={(e) => setPasswordForm({...passwordForm, currentPassword: e.target.value})}
                          className="w-full p-3 border rounded-lg"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2">새 비밀번호</label>
                        <input
                          type="password"
                          value={passwordForm.newPassword}
                          onChange={(e) => setPasswordForm({...passwordForm, newPassword: e.target.value})}
                          className="w-full p-3 border rounded-lg"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2">새 비밀번호 확인</label>
                        <input
                          type="password"
                          value={passwordForm.confirmPassword}
                          onChange={(e) => setPasswordForm({...passwordForm, confirmPassword: e.target.value})}
                          className="w-full p-3 border rounded-lg"
                        />
                      </div>
                      <button 
                        onClick={handlePasswordChange}
                        className="bg-blue-500 text-white px-6 py-2 rounded-lg font-semibold hover:bg-blue-600">
                        비밀번호 변경
                      </button>
                    </div>
                  </div>
                )}


                {/* Help Section */}
                {activeSection === '도움말' && (
                  <div>
                    <h2 className="text-2xl font-semibold mb-8">도움말</h2>
                    <div className="space-y-8">
                      <div>
                        <h3 className="font-semibold text-lg mb-4">자주 묻는 질문</h3>
                        <div className="space-y-4">
                          <div className="border-b pb-4">
                            <p className="font-medium mb-2">Q: 비밀번호를 잊어버렸어요</p>
                            <p className="text-gray-600">A: 로그인 페이지에서 '비밀번호를 잊으셨나요?'를 클릭하세요.</p>
                          </div>
                          <div className="border-b pb-4">
                            <p className="font-medium mb-2">Q: 계정을 비공개로 설정하려면?</p>
                            <p className="text-gray-600">A: 설정 → 개인정보 및 보안에서 '비공개 계정'을 활성화하세요.</p>
                          </div>
                          <div className="border-b pb-4">
                            <p className="font-medium mb-2">Q: 게시물을 삭제하려면?</p>
                            <p className="text-gray-600">A: 게시물의 더보기 메뉴(...)를 클릭하고 '삭제'를 선택하세요.</p>
                          </div>
                        </div>
                      </div>
                      
                      <div>
                        <h3 className="font-semibold text-lg mb-4">문의하기</h3>
                        <p className="text-gray-600 mb-2">도움이 필요하신가요?</p>
                        <p className="text-gray-600">이메일: support@instagram-clone.com</p>
                        <p className="text-gray-600">전화: 1234-5678</p>
                      </div>
                      
                      <div>
                        <h3 className="font-semibold text-lg mb-4">안전 센터</h3>
                        <p className="text-gray-600">Instagram을 안전하게 사용하는 방법에 대해 알아보세요.</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* About Section */}
                {activeSection === '정보' && (
                  <div>
                    <h2 className="text-2xl font-semibold mb-8">정보</h2>
                    <div className="space-y-8">
                      <div className="text-center mb-8">
                        <h1 className="text-3xl font-bold mb-2">Instagram Clone</h1>
                        <p className="text-gray-500">버전 1.0.0</p>
                      </div>
                      
                      <div>
                        <h3 className="font-semibold text-lg mb-4">앱 정보</h3>
                        <p className="text-gray-600">이 앱은 학습 목적으로 만들어진 Instagram 클론입니다.</p>
                        <p className="text-gray-600 mt-2">React, TypeScript, FastAPI를 사용하여 개발되었습니다.</p>
                      </div>
                      
                      <div>
                        <h3 className="font-semibold text-lg mb-4">이용약관</h3>
                        <p className="text-gray-600">본 서비스를 이용함으로써 귀하는 다음 약관에 동의하게 됩니다:</p>
                        <ul className="list-disc list-inside text-gray-600 mt-2 space-y-1">
                          <li>서비스를 악용하지 않을 것</li>
                          <li>다른 사용자의 권리를 존중할 것</li>
                          <li>저작권을 침해하지 않을 것</li>
                        </ul>
                      </div>
                      
                      <div>
                        <h3 className="font-semibold text-lg mb-4">개인정보 처리방침</h3>
                        <p className="text-gray-600">우리는 귀하의 개인정보를 소중히 여깁니다.</p>
                        <p className="text-gray-600 mt-2">수집된 정보는 서비스 제공 목적으로만 사용됩니다.</p>
                      </div>
                      
                      <div>
                        <h3 className="font-semibold text-lg mb-4">오픈소스 라이선스</h3>
                        <p className="text-gray-600">이 앱은 다음 오픈소스 라이브러리를 사용합니다:</p>
                        <ul className="list-disc list-inside text-gray-600 mt-2 space-y-1">
                          <li>React (MIT License)</li>
                          <li>TypeScript (Apache 2.0)</li>
                          <li>FastAPI (MIT License)</li>
                          <li>TailwindCSS (MIT License)</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Logout Confirmation Modal */}
      {showLogoutConfirm && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          onClick={() => setShowLogoutConfirm(false)}
        >
          <div 
            className="bg-white rounded-lg w-80 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-8 text-center">
              <h3 className="text-lg font-semibold mb-2">로그아웃</h3>
              <p className="text-gray-500">정말 로그아웃 하시겠습니까?</p>
            </div>
            <div className="border-t">
              <button
                onClick={handleLogout}
                className="w-full py-3 font-semibold text-red-500 hover:bg-gray-50 transition-colors"
              >
                로그아웃
              </button>
            </div>
            <div className="border-t">
              <button
                onClick={() => setShowLogoutConfirm(false)}
                className="w-full py-3 hover:bg-gray-50 transition-colors"
              >
                취소
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Profile Edit Modal */}
      {activeModal === 'profile' && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          onClick={() => setActiveModal(null)}
        >
          <div 
            className="bg-white rounded-lg w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-white border-b p-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold">프로필 편집</h3>
              <button onClick={() => setActiveModal(null)}>
                <X size={24} />
              </button>
            </div>
            <div className="p-6">
              <div className="flex flex-col items-center mb-6">
                <div className="w-24 h-24 rounded-full bg-gray-200 flex items-center justify-center mb-3">
                  {user?.profile_picture ? (
                    <img src={getImageUrl(user.profile_picture) || ''} alt="" className="w-full h-full rounded-full object-cover" />
                  ) : (
                    <Camera size={32} className="text-gray-400" />
                  )}
                </div>
                <button 
                  onClick={() => modalFileInputRef.current?.click()}
                  className="text-blue-500 font-semibold"
                >
                  프로필 사진 변경
                </button>
                <input
                  ref={modalFileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleProfilePictureChange}
                />
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">사용자 이름</label>
                  <input
                    type="text"
                    value={profileForm.username}
                    onChange={(e) => setProfileForm({...profileForm, username: e.target.value})}
                    className="w-full p-2 border rounded-lg bg-gray-100"
                    disabled
                  />
                  <p className="text-xs text-gray-500 mt-1">사용자 이름은 변경할 수 없습니다</p>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">소개</label>
                  <textarea
                    value={profileForm.bio}
                    onChange={(e) => setProfileForm({...profileForm, bio: e.target.value})}
                    className="w-full p-2 border rounded-lg resize-none"
                    rows={3}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">웹사이트</label>
                  <input
                    type="url"
                    value={profileForm.website}
                    onChange={(e) => setProfileForm({...profileForm, website: e.target.value})}
                    className="w-full p-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">이메일</label>
                  <input
                    type="email"
                    value={profileForm.email}
                    onChange={(e) => setProfileForm({...profileForm, email: e.target.value})}
                    className="w-full p-2 border rounded-lg"
                  />
                </div>
              </div>
              
              <button 
                onClick={handleProfileSubmit}
                className="w-full mt-6 bg-blue-500 text-white py-2 rounded-lg font-semibold hover:bg-blue-600">
                저장
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Password Change Modal */}
      {activeModal === 'password' && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          onClick={() => setActiveModal(null)}
        >
          <div 
            className="bg-white rounded-lg w-full max-w-md mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="border-b p-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold">비밀번호 변경</h3>
              <button onClick={() => setActiveModal(null)}>
                <X size={24} />
              </button>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">현재 비밀번호</label>
                  <input
                    type="password"
                    value={passwordForm.currentPassword}
                    onChange={(e) => setPasswordForm({...passwordForm, currentPassword: e.target.value})}
                    className="w-full p-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">새 비밀번호</label>
                  <input
                    type="password"
                    value={passwordForm.newPassword}
                    onChange={(e) => setPasswordForm({...passwordForm, newPassword: e.target.value})}
                    className="w-full p-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">새 비밀번호 확인</label>
                  <input
                    type="password"
                    value={passwordForm.confirmPassword}
                    onChange={(e) => setPasswordForm({...passwordForm, confirmPassword: e.target.value})}
                    className="w-full p-2 border rounded-lg"
                  />
                </div>
              </div>
              
              <button 
                onClick={handlePasswordChange}
                className="w-full mt-6 bg-blue-500 text-white py-2 rounded-lg font-semibold hover:bg-blue-600">
                비밀번호 변경
              </button>
            </div>
          </div>
        </div>
      )}


      {/* Help Modal */}
      {activeModal === 'help' && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          onClick={() => setActiveModal(null)}
        >
          <div 
            className="bg-white rounded-lg w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-white border-b p-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold">도움말</h3>
              <button onClick={() => setActiveModal(null)}>
                <X size={24} />
              </button>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                <div className="border-b pb-4">
                  <h4 className="font-semibold mb-2">자주 묻는 질문</h4>
                  <div className="space-y-2 text-sm">
                    <p className="font-medium">Q: 비밀번호를 잊어버렸어요</p>
                    <p className="text-gray-600 mb-3">A: 로그인 페이지에서 '비밀번호를 잊으셨나요?'를 클릭하세요.</p>
                    
                    <p className="font-medium">Q: 계정을 비공개로 설정하려면?</p>
                    <p className="text-gray-600 mb-3">A: 설정 → 개인정보 및 보안에서 '비공개 계정'을 활성화하세요.</p>
                    
                    <p className="font-medium">Q: 게시물을 삭제하려면?</p>
                    <p className="text-gray-600">A: 게시물의 더보기 메뉴(...)를 클릭하고 '삭제'를 선택하세요.</p>
                  </div>
                </div>
                
                <div className="border-b pb-4">
                  <h4 className="font-semibold mb-2">문의하기</h4>
                  <p className="text-sm text-gray-600 mb-2">도움이 필요하신가요?</p>
                  <p className="text-sm text-gray-600">이메일: support@instagram-clone.com</p>
                  <p className="text-sm text-gray-600">전화: 1234-5678</p>
                </div>
                
                <div>
                  <h4 className="font-semibold mb-2">안전 센터</h4>
                  <p className="text-sm text-gray-600">Instagram을 안전하게 사용하는 방법에 대해 알아보세요.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* About Modal */}
      {activeModal === 'about' && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          onClick={() => setActiveModal(null)}
        >
          <div 
            className="bg-white rounded-lg w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-white border-b p-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold">정보</h3>
              <button onClick={() => setActiveModal(null)}>
                <X size={24} />
              </button>
            </div>
            <div className="p-6">
              <div className="text-center mb-6">
                <h1 className="text-2xl font-bold mb-2">Instagram Clone</h1>
                <p className="text-gray-500">버전 1.0.0</p>
              </div>
              
              <div className="space-y-4 text-sm">
                <div className="border-b pb-4">
                  <h4 className="font-semibold mb-2">앱 정보</h4>
                  <p className="text-gray-600">이 앱은 학습 목적으로 만들어진 Instagram 클론입니다.</p>
                  <p className="text-gray-600 mt-2">React, TypeScript, FastAPI를 사용하여 개발되었습니다.</p>
                </div>
                
                <div className="border-b pb-4">
                  <h4 className="font-semibold mb-2">이용약관</h4>
                  <p className="text-gray-600">본 서비스를 이용함으로써 귀하는 다음 약관에 동의하게 됩니다:</p>
                  <ul className="list-disc list-inside text-gray-600 mt-2 space-y-1">
                    <li>서비스를 악용하지 않을 것</li>
                    <li>다른 사용자의 권리를 존중할 것</li>
                    <li>저작권을 침해하지 않을 것</li>
                  </ul>
                </div>
                
                <div className="border-b pb-4">
                  <h4 className="font-semibold mb-2">개인정보 처리방침</h4>
                  <p className="text-gray-600">우리는 귀하의 개인정보를 소중히 여깁니다.</p>
                  <p className="text-gray-600 mt-2">수집된 정보는 서비스 제공 목적으로만 사용됩니다.</p>
                </div>
                
                <div>
                  <h4 className="font-semibold mb-2">오픈소스 라이선스</h4>
                  <p className="text-gray-600">이 앱은 다음 오픈소스 라이브러리를 사용합니다:</p>
                  <ul className="list-disc list-inside text-gray-600 mt-2 space-y-1">
                    <li>React (MIT License)</li>
                    <li>TypeScript (Apache 2.0)</li>
                    <li>FastAPI (MIT License)</li>
                    <li>TailwindCSS (MIT License)</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Settings;