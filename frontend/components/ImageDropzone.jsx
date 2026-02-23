'use client';

import { useRef, useState } from 'react';

/**
 * 재사용 가능한 이미지 드래그앤드롭 업로드 컴포넌트
 * 메인 이미지, 보조 이미지 모두 이 컴포넌트를 사용
 */
export default function ImageDropzone({ previewUrl, onFileChange, onRemove, label, maxSize = 20 }) {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);

  const maxFileSize = maxSize * 1024 * 1024;

  // 파일 유효성 검사 및 처리
  const processFile = (file) => {
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('이미지 파일만 업로드 가능합니다.');
      return;
    }

    if (file.size > maxFileSize) {
      alert(`파일 용량이 너무 큽니다.\n최대 ${maxSize}MB까지 업로드 가능합니다.\n현재 파일: ${(file.size / 1024 / 1024).toFixed(2)}MB`);
      return;
    }

    onFileChange(file);
  };

  const handleInputChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      processFile(file);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) {
      processFile(file);
    }
  };

  const handleRemove = (e) => {
    e.stopPropagation();
    if (fileInputRef.current) fileInputRef.current.value = '';
    onRemove();
  };

  // 보조 이미지 여부 판단 (label에 "보조" 포함)
  const isSub = label?.includes('보조');

  return (
    <div
      className={`dropzone ${isSub ? 'sub-dropzone' : ''} ${isDragging ? 'dragging' : ''}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={() => fileInputRef.current?.click()}
    >
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleInputChange}
        accept="image/*"
        style={{ display: 'none' }}
      />
      {previewUrl ? (
        <div className="image-preview">
          <img src={previewUrl} alt={label || '미리보기'} />
          <button type="button" className="remove-image" onClick={handleRemove}>
            ✕ {label ? `${label} 삭제` : '이미지 삭제'}
          </button>
        </div>
      ) : (
        <div className="dropzone-text">
          <span>📷 {label || '이미지'}를 드래그하거나 클릭하여 선택</span>
          <span className="file-limit">(최대 {maxSize}MB)</span>
        </div>
      )}
    </div>
  );
}
