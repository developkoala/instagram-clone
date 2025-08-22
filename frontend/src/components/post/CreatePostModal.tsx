import React, { useState, useRef } from 'react';
import ReactDOM from 'react-dom';
import { X, Image, ArrowLeft, ChevronLeft, ChevronRight, RotateCw } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../services/api';

interface CreatePostModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPostCreated?: () => void;
}

const CreatePostModal: React.FC<CreatePostModalProps> = ({ isOpen, onClose, onPostCreated }) => {
  const [step, setStep] = useState<'upload' | 'rotate' | 'edit'>('upload');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [caption, setCaption] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [rotationAngles, setRotationAngles] = useState<number[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
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
      alert('맛집 공유에 실패했습니다.');
    },
  });


  // 각도로 이미지 회전하는 함수
  const rotateImageByAngle = (file: File, angle: number): Promise<File> => {
    return new Promise((resolve) => {
      if (angle === 0) {
        resolve(file);
        return;
      }

      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d')!;
      const img = document.createElement('img');
      
      img.onload = () => {
        try {
          const { width, height } = img;
          
          // 90도 또는 270도 회전 시 캔버스 크기 변경
          if (angle === 90 || angle === 270) {
            canvas.width = height;
            canvas.height = width;
          } else {
            canvas.width = width;
            canvas.height = height;
          }

          // 회전 중심점을 캔버스 중앙으로 설정
          ctx.save();
          ctx.translate(canvas.width / 2, canvas.height / 2);
          ctx.rotate((angle * Math.PI) / 180);
          ctx.drawImage(img, -width / 2, -height / 2);
          ctx.restore();

          canvas.toBlob((blob) => {
            if (blob) {
              const rotatedFile = new File([blob], file.name, { type: file.type });
              resolve(rotatedFile);
            } else {
              resolve(file);
            }
          }, file.type, 0.9);
        } catch (error) {
          console.error('Canvas 회전 처리 오류:', error);
          resolve(file);
        }
      };

      img.onerror = () => {
        console.error('이미지 로드 실패');
        resolve(file);
      };
      
      img.src = URL.createObjectURL(file);
    });
  };



  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement> | Event) => {
    if (isProcessing) {
      return; // 중복 실행 방지
    }
    
    const target = e.target as HTMLInputElement;
    const files = Array.from(target.files || []);
    
    if (files.length === 0) {
      setIsProcessing(false);
      return;
    }
    
    setIsProcessing(true);

    try {
      // 최대 10개 파일만 허용
      const validFiles = files.slice(0, 10).filter(file => 
        file.type.startsWith('image/') || file.type.startsWith('video/')
      );

      if (validFiles.length === 0) {
        alert('이미지 또는 비디오 파일만 업로드 가능합니다.');
        setIsProcessing(false);
        return;
      }

      // 원본 파일 그대로 사용 (EXIF 자동 처리 없음)
      const processedFiles = validFiles;

      setSelectedFiles(processedFiles);

      // 미리보기 URL 생성
      const urls = processedFiles.map(file => URL.createObjectURL(file));
      setPreviewUrls(urls);
      
      // 각 이미지의 초기 회전 각도를 0으로 설정
      setRotationAngles(new Array(processedFiles.length).fill(0));
      
      setStep('rotate');
      setIsProcessing(false);
    } catch (error) {
      console.error('파일 처리 오류:', error);
      setIsProcessing(false);
    }
  };

  const handleSubmit = async () => {
    if (selectedFiles.length === 0) {
      alert('이미지를 선택해주세요.');
      return;
    }

    // 회전 각도가 적용된 파일들을 처리
    const finalFiles = await Promise.all(
      selectedFiles.map(async (file, index) => {
        const angle = rotationAngles[index] || 0;
        if (angle !== 0 && file.type.startsWith('image/')) {
          try {
            return await rotateImageByAngle(file, angle);
          } catch (error) {
            console.error('이미지 회전 처리 오류:', error);
            return file; // 오류 시 원본 파일 사용
          }
        }
        return file;
      })
    );

    const formData = new FormData();
    finalFiles.forEach((file) => {
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
    setIsProcessing(false);
    setRotationAngles([]);
    
    onClose();
  };

  const handleBack = () => {
    if (step === 'edit') {
      setStep('rotate');
    } else if (step === 'rotate') {
      setStep('upload');
      // URL 객체 정리
      previewUrls.forEach(url => URL.revokeObjectURL(url));
      setSelectedFiles([]);
      setPreviewUrls([]);
      setCurrentImageIndex(0);
      setRotationAngles([]);
      setIsProcessing(false);
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

  const handleRotateImage = () => {
    setRotationAngles(prev => {
      const newAngles = [...prev];
      newAngles[currentImageIndex] = (newAngles[currentImageIndex] + 90) % 360;
      return newAngles;
    });
  };

  const handleProceedToEdit = () => {
    setStep('edit');
  };

  if (!isOpen) return null;

  return ReactDOM.createPortal(
    <div 
      className="fixed top-0 left-0 right-0 bottom-0 z-[9999] bg-black bg-opacity-75"
      onClick={handleClose}
      style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
    >
      <div 
        className="bg-white rounded-lg w-11/12 max-w-md md:max-w-4xl max-h-[80vh] overflow-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-3 border-b min-h-[60px]">
          <button
            onClick={step === 'upload' ? handleClose : handleBack}
            className="p-1 flex-shrink-0"
          >
            {step === 'upload' ? <X size={24} /> : <ArrowLeft size={24} />}
          </button>
          <h2 className="font-semibold flex-1 text-center px-2 text-muksta-dark">
            {step === 'upload' ? '🍴 맛집 사진 공유하기' : step === 'rotate' ? '편집' : '🍴 맛집 소개'}
          </h2>
          <div className="flex-shrink-0 min-w-[80px] flex justify-end">
            {step === 'rotate' ? (
              <button
                onClick={handleProceedToEdit}
                className="text-white font-bold bg-muksta-orange hover:bg-muksta-red px-4 py-2 rounded text-base shadow-lg"
              >
                다음
              </button>
            ) : step === 'edit' ? (
              <button
                onClick={handleSubmit}
                disabled={createPostMutation.isPending}
                className="text-white font-bold bg-muksta-orange hover:bg-muksta-red disabled:opacity-50 px-4 py-2 rounded text-base shadow-lg"
              >
                {createPostMutation.isPending ? '공유 중...' : '🍴 맛집 공유'}
              </button>
            ) : null}
          </div>
        </div>


        {/* Content */}
        <div className="flex flex-col md:flex-row h-[400px] md:h-[500px]">
          {/* Image Section */}
          <div className="flex-1 bg-gray-50 flex items-center justify-center relative min-h-[200px] md:min-h-[400px]">
            {step === 'upload' ? (
              <div className="text-center p-4 md:p-8">
                <Image size={48} className="mx-auto mb-3 text-gray-400 md:w-24 md:h-24" />
                <p className="text-base md:text-xl mb-3 md:mb-4 hidden md:block text-muksta-dark">📸 맛있는 음식 사진을 여기에 끌어다 놓으세요</p>
                <p className="text-base md:text-xl mb-3 md:mb-4 md:hidden text-muksta-dark">🍔 맛집 사진을 공유해보세요</p>
                <button
                  onClick={() => {
                    if (fileInputRef.current) {
                      fileInputRef.current.value = ''; // 이전 선택 초기화
                      fileInputRef.current.click();
                    }
                  }}
                  className="bg-muksta-orange text-white px-4 py-2 rounded-lg hover:bg-muksta-red shadow-md transition-all transform hover:scale-105"
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
            ) : step === 'rotate' ? (
              <>
                {previewUrls.length > 0 && (
                  <>
                    <img
                      src={previewUrls[currentImageIndex]}
                      alt={`Preview ${currentImageIndex + 1}`}
                      className="max-w-full max-h-full object-contain"
                      style={{
                        transform: `rotate(${rotationAngles[currentImageIndex] || 0}deg)`,
                        transition: 'transform 0.3s ease'
                      }}
                    />
                    
                    {/* 회전 버튼 */}
                    <button
                      onClick={handleRotateImage}
                      className="absolute bottom-4 right-4 bg-blue-500 text-white rounded-full p-3 hover:bg-blue-600 shadow-lg z-10"
                    >
                      <RotateCw size={24} />
                    </button>
                    
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
    </div>,
    document.getElementById('root')!
  );
};

export default CreatePostModal;