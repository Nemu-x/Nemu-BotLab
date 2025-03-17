import React, { useState, useRef } from 'react';
import { TrashIcon, PaperClipIcon, DocumentIcon, PhotoIcon, VideoCameraIcon, MusicalNoteIcon } from '@heroicons/react/24/outline';
import { useTranslation } from '@/app/hooks/useTranslation';

export type MediaType = 'photo' | 'video' | 'audio' | 'document';

export interface MediaFile {
  type: MediaType;
  url: string;
  file_id?: string;
  caption?: string;
  filename?: string;
  mime_type?: string;
  local_file?: File;
}

interface StepMediaUploaderProps {
  media: MediaFile | null;
  onMediaChange: (media: MediaFile | null) => void;
  onMediaRemove: () => void;
}

const StepMediaUploader: React.FC<StepMediaUploaderProps> = ({ media, onMediaChange, onMediaRemove }) => {
  const { t } = useTranslation();
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Имитация загрузки для демонстрации (в реальности здесь будет отправка на сервер)
  const simulateUpload = async (file: File): Promise<string> => {
    setIsUploading(true);
    setUploadError(null);
    
    // Имитация задержки загрузки файла
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        // Для демонстрации создаем локальный URL
        const localUrl = URL.createObjectURL(file);
        setIsUploading(false);
        resolve(localUrl);
      }, 1500);
    });
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const fileUrl = await simulateUpload(file);
      
      // Определение типа медиа по MIME типу
      let mediaType: MediaType = 'document';
      if (file.type.startsWith('image/')) {
        mediaType = 'photo';
      } else if (file.type.startsWith('video/')) {
        mediaType = 'video';
      } else if (file.type.startsWith('audio/')) {
        mediaType = 'audio';
      }
      
      onMediaChange({
        type: mediaType,
        url: fileUrl,
        caption: '',
        filename: file.name,
        mime_type: file.type,
        local_file: file
      });
    } catch (err) {
      console.error('Error uploading file:', err);
      setUploadError(t('flows.media.uploadError'));
      setIsUploading(false);
    }
  };

  const handleRemoveMedia = () => {
    onMediaRemove();
    setUploadError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleCaptionChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!media) return;
    onMediaChange({
      ...media,
      caption: e.target.value
    });
  };

  const getMediaTypeIcon = (type: MediaType) => {
    switch (type) {
      case 'photo':
        return <PhotoIcon className="h-5 w-5 text-blue-500" />;
      case 'video':
        return <VideoCameraIcon className="h-5 w-5 text-red-500" />;
      case 'audio':
        return <MusicalNoteIcon className="h-5 w-5 text-green-500" />;
      case 'document':
      default:
        return <DocumentIcon className="h-5 w-5 text-gray-500" />;
    }
  };

  return (
    <div className="space-y-4">
      {!media ? (
        <div className="flex justify-center items-center h-full px-2 py-2">
          <div className="text-center">
            <PaperClipIcon className="mx-auto h-8 w-8 text-gray-400" />
            <div className="flex flex-col text-xs text-gray-600 dark:text-gray-300 mt-1">
              <label
                htmlFor="file-upload"
                className="cursor-pointer font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300"
              >
                <span>{t('flows.media.uploadFile')}</span>
                <input
                  id="file-upload"
                  name="file-upload"
                  type="file"
                  className="sr-only"
                  onChange={handleFileSelect}
                  ref={fileInputRef}
                  accept="image/*,video/*,audio/*,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain"
                  disabled={isUploading}
                />
              </label>
              <p className="text-xs">{t('flows.media.orDrag')}</p>
            </div>
          </div>
        </div>
      ) : (
        <div className="border border-gray-200 rounded-md p-4 dark:border-gray-700">
          <div className="flex justify-between items-start">
            <div className="flex items-center">
              {getMediaTypeIcon(media.type)}
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-900 dark:text-white truncate max-w-xs">
                  {media.filename || t('flows.media.untitledFile')}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {media.mime_type || `${t('flows.media.type')}: ${media.type}`}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleRemoveMedia}
              className="ml-2 inline-flex items-center p-1 border border-transparent rounded-full text-red-600 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 dark:hover:bg-red-900"
            >
              <TrashIcon className="h-5 w-5" />
            </button>
          </div>

          {media.type === 'photo' && media.url && (
            <div className="mt-3">
              <img 
                src={media.url} 
                alt={media.caption || t('flows.media.imagePreview')} 
                className="max-h-48 rounded-md object-contain" 
              />
            </div>
          )}

          {media.type === 'video' && media.url && (
            <div className="mt-3">
              <video 
                src={media.url} 
                controls 
                className="max-h-48 rounded-md w-full" 
              />
            </div>
          )}

          {media.type === 'audio' && media.url && (
            <div className="mt-3">
              <audio 
                src={media.url} 
                controls 
                className="w-full" 
              />
            </div>
          )}

          <div className="mt-3">
            <label 
              htmlFor="media-caption" 
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
            >
              {t('flows.media.caption')}
            </label>
            <input
              type="text"
              id="media-caption"
              value={media.caption || ''}
              onChange={handleCaptionChange}
              placeholder={t('flows.media.captionPlaceholder')}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white sm:text-sm"
            />
          </div>
        </div>
      )}

      {isUploading && (
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-indigo-500"></div>
          <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">{t('flows.media.uploading')}</span>
        </div>
      )}

      {uploadError && (
        <div className="text-sm text-red-600 dark:text-red-400">
          {uploadError}
        </div>
      )}
    </div>
  );
};

export default StepMediaUploader; 