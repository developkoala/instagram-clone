import React, { useState } from 'react';

interface CreateStoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  file: File | null;
}

const CreateStoryModal: React.FC<CreateStoryModalProps> = ({ isOpen, onClose, file: initialFile }) => {
  const [caption, setCaption] = useState('');
  const [uploading, setUploading] = useState(false);
  const [file] = useState<File | null>(initialFile);

  if (!isOpen) return null;



  const handleSubmit = async () => {
    setUploading(true);
    try {
      // TODO: 실제 스토리 업로드 API 호출
      
      // 임시로 2초 후 성공 메시지
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      alert('스토리가 업로드되었습니다!');
      onClose();
    } catch (error) {
      console.error('Story upload failed:', error);
      alert('스토리 업로드에 실패했습니다.');
    } finally {
      setUploading(false);
    }
  };

  const fileUrl = file ? URL.createObjectURL(file) : '';
  const isVideo = file?.type.startsWith('video/') || false;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-instagram-border">
          <button onClick={onClose} className="text-instagram-secondary hover:text-black">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <h2 className="text-lg font-semibold">새 스토리 만들기</h2>
          <button
            onClick={handleSubmit}
            disabled={uploading}
            className="text-instagram-accent font-semibold disabled:opacity-50"
          >
            {uploading ? '업로드 중...' : '공유하기'}
          </button>
        </div>

        <div className="flex flex-col md:flex-row h-[calc(90vh-73px)]">
          {/* Preview */}
          <div className="flex-1 bg-black flex items-center justify-center">
            {isVideo ? (
              <video
                src={fileUrl}
                controls
                className="max-w-full max-h-full object-contain"
              />
            ) : (
              <img
                src={fileUrl}
                alt="Story preview"
                className="max-w-full max-h-full object-contain"
              />
            )}
          </div>

          {/* Caption */}
          <div className="w-full md:w-80 p-4 border-t md:border-t-0 md:border-l border-instagram-border">
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">
                캡션 추가 (선택사항)
              </label>
              <textarea
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                placeholder="스토리에 대해 설명해주세요..."
                className="w-full p-2 border border-instagram-border rounded-lg resize-none focus:outline-none focus:border-instagram-secondary"
                rows={4}
                maxLength={200}
              />
              <p className="text-xs text-instagram-gray mt-1">
                {caption.length}/200
              </p>
            </div>

            <div className="text-sm text-instagram-gray">
              <p className="mb-2">
                <svg className="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                스토리는 24시간 후 자동으로 사라집니다
              </p>
              <p>
                <svg className="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                모든 팔로워가 볼 수 있습니다
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateStoryModal;