import React, { useState, useRef } from 'react';
import { X, Image, ArrowLeft, ChevronLeft, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../services/api';

interface CreatePostModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPostCreated?: () => void;
}

const CreatePostModal: React.FC<CreatePostModalProps> = ({ isOpen, onClose, onPostCreated }) => {
  const [step, setStep] = useState<'upload' | 'edit'>('upload');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [caption, setCaption] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const createPostMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const response = await api.post('/posts', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      queryClient.invalidateQueries({ queryKey: ['userPosts'] });
      handleClose();
      if (onPostCreated) {
        onPostCreated();
      } else {
        window.location.reload();
      }
    },
    onError: (error) => {
      console.error('Failed to create post:', error);
      alert('게시물 생성에 실패했습니다.');
    },
  });

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    // 최대 10개 파일만 허용
    const validFiles = files.slice(0, 10).filter(file => 
      file.type.startsWith('image/') || file.type.startsWith('video/')
    );

    if (validFiles.length === 0) {
      alert('이미지 또는 비디오 파일만 업로드 가능합니다.');
      return;
    }

    setSelectedFiles(validFiles);

    // 미리보기 URL 생성
    const urls = validFiles.map(file => URL.createObjectURL(file));
    setPreviewUrls(urls);
    setStep('edit');
  };

  const handleSubmit = async () => {
    if (selectedFiles.length === 0) {
      alert('이미지를 선택해주세요.');
      return;
    }

    const formData = new FormData();
    selectedFiles.forEach((file, index) => {
      formData.append('images', file);
    });
    formData.append('caption', caption);

    createPostMutation.mutate(formData);
  };

  const handleClose = () => {
    // URL 객체 정리
    previewUrls.forEach(url => URL.revokeObjectURL(url));
    
    // 상태 초기화
    setStep('upload');
    setSelectedFiles([]);
    setPreviewUrls([]);
    setCurrentImageIndex(0);
    setCaption('');
    
    onClose();
  };

  const handleBack = () => {
    if (step === 'edit') {
      setStep('upload');
      // URL 객체 정리
      previewUrls.forEach(url => URL.revokeObjectURL(url));
      setSelectedFiles([]);
      setPreviewUrls([]);
      setCurrentImageIndex(0);
    }
  };

  const handlePrevImage = () => {
    setCurrentImageIndex(prev => 
      prev === 0 ? previewUrls.length - 1 : prev - 1
    );
  };

  const handleNextImage = () => {
    setCurrentImageIndex(prev => 
      prev === previewUrls.length - 1 ? 0 : prev + 1
    );
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 md:p-0"
      onClick={handleClose}
    >
      <div 
        className="bg-white rounded-lg w-full max-w-md md:max-w-5xl max-h-[70vh] md:max-h-[90vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-3 border-b">
          <button
            onClick={step === 'upload' ? handleClose : handleBack}
            className="p-1"
          >
            {step === 'upload' ? <X size={24} /> : <ArrowLeft size={24} />}
          </button>
          <h2 className="font-semibold">
            {step === 'upload' ? '새 게시물 만들기' : '편집'}
          </h2>
          {step === 'edit' ? (
            <button
              onClick={handleSubmit}
              disabled={createPostMutation.isPending}
              className="text-blue-500 font-semibold hover:text-blue-600 disabled:opacity-50"
            >
              {createPostMutation.isPending ? '공유 중...' : '공유'}
            </button>
          ) : (
            <div className="w-6" />
          )}
        </div>

        {/* Content */}
        <div className="flex flex-col md:flex-row h-[calc(70vh-60px)] md:h-[calc(90vh-60px)]">
          {/* Image Section */}
          <div className="flex-1 bg-gray-50 flex items-center justify-center relative min-h-[200px] md:min-h-[400px]">
            {step === 'upload' ? (
              <div className="text-center p-4 md:p-8">
                <Image size={48} className="mx-auto mb-3 text-gray-400 md:w-24 md:h-24" />
                <p className="text-base md:text-xl mb-3 md:mb-4 hidden md:block">사진을 여기에 끌어다 놓으세요</p>
                <p className="text-base md:text-xl mb-3 md:mb-4 md:hidden">사진과 동영상을 공유해보세요</p>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600"
                >
                  <span className="hidden md:inline">컴퓨터에서 선택</span>
                  <span className="md:hidden">갤러리에서 선택</span>
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept="image/*,video/*"
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </div>
            ) : (
              <>
                {previewUrls.length > 0 && (
                  <>
                    <img
                      src={previewUrls[currentImageIndex]}
                      alt={`Preview ${currentImageIndex + 1}`}
                      className="max-w-full max-h-full object-contain"
                    />
                    
                    {/* Image navigation */}
                    {previewUrls.length > 1 && (
                      <>
                        <button
                          onClick={handlePrevImage}
                          className="absolute left-2 top-1/2 -translate-y-1/2 bg-black bg-opacity-50 text-white rounded-full p-1 hover:bg-opacity-70"
                        >
                          <ChevronLeft size={24} />
                        </button>
                        <button
                          onClick={handleNextImage}
                          className="absolute right-2 top-1/2 -translate-y-1/2 bg-black bg-opacity-50 text-white rounded-full p-1 hover:bg-opacity-70"
                        >
                          <ChevronRight size={24} />
                        </button>
                        
                        {/* Image indicators */}
                        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1">
                          {previewUrls.map((_, index) => (
                            <div
                              key={index}
                              className={`w-1.5 h-1.5 rounded-full ${
                                index === currentImageIndex ? 'bg-white' : 'bg-white bg-opacity-50'
                              }`}
                            />
                          ))}
                        </div>
                      </>
                    )}
                  </>
                )}
              </>
            )}
          </div>

          {/* Caption Section (only in edit step) */}
          {step === 'edit' && (
            <div className="w-full md:w-80 p-3 md:p-4 border-t md:border-t-0 md:border-l">
              <div className="space-y-3 md:space-y-4">
                <div>
                  <textarea
                    value={caption}
                    onChange={(e) => setCaption(e.target.value)}
                    placeholder="문구를 작성하세요..."
                    className="w-full p-2 border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm md:text-base"
                    rows={3}
                    maxLength={2200}
                  />
                  <p className="text-xs text-gray-500 text-right mt-1">
                    {caption.length}/2,200
                  </p>
                </div>

                <div className="text-xs text-gray-500 hidden md:block">
                  <p>• 사진 {previewUrls.length}장이 선택되었습니다</p>
                  <p>• 좌우 화살표로 사진을 확인할 수 있습니다</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CreatePostModal;