import React, { useState, useRef } from 'react';
import { useDropzone } from 'react-dropzone';
import { useDocumentsStore } from '../store/useStore';
import LoadingSpinner from './LoadingSpinner';

const DocumentUploadForm = ({
  onSuccess,
  editDocument,
  onCancel
}) => {
  const [title, setTitle] = useState(editDocument?.title || '');
  const [tags, setTags] = useState(editDocument?.tags?.join(', ') || '');
  const [file, setFile] = useState(null);
  const fileInputRef = useRef(null);

  const { uploadDocument, updateDocument, loading, error, uploadProgress, clearError } = useDocumentsStore();

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'text/plain': ['.txt'],
      'text/html': ['.html']
    },
    maxFiles: 1,
    noClick: false,
    onDrop: (acceptedFiles) => {
      if (acceptedFiles.length > 0) {
        setFile(acceptedFiles[0]);
        if (!title) {
                    const filename = acceptedFiles[0].name;
          const nameWithoutExt = filename.substring(0, filename.lastIndexOf('.')) || filename;
          setTitle(nameWithoutExt);
        }
      }
    }
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    clearError();

    if (!title.trim()) {
      return;
    }

    if (!editDocument && !file) {
      return;
    }

    const formData = new FormData();
    formData.append('title', title.trim());
    if (tags.trim()) {
      formData.append('tags', tags.trim());
    }
    if (file) {
      formData.append('file', file);
    }

    try {
      if (editDocument) {
        await updateDocument(editDocument._id, formData);
      } else {
        await uploadDocument(formData);
      }
      
            setTitle('');
      setTags('');
      setFile(null);
      
      onSuccess?.();
    } catch (error) {
          }
  };

  const removeFile = () => {
    setFile(null);
  };

  return <div className="card">
      <h2 className="text-xl font-semibold mb-6">
        {editDocument ? 'Edit Document' : 'Upload New Document'}
      </h2>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Title */}
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
            Document Title *
          </label>
          <input
            type="text"
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="input-field"
            placeholder="Enter document title..."
            required
          />
        </div>

        {/* Tags */}
        <div>
          <label htmlFor="tags" className="block text-sm font-medium text-gray-700 mb-2">
            Tags (comma-separated)
          </label>
          <input
            type="text"
            id="tags"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            className="input-field"
            placeholder="tag1, tag2, tag3..."
          />
        </div>

        {/* File Upload */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            File {!editDocument && '*'}
          </label>
          
          {!file ? (
            <div
              {...getRootProps()}
              className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                isDragActive 
                  ? 'border-primary-500 bg-primary-50' 
                  : 'border-gray-300 hover:border-primary-400'
              }`}
            >
              <input {...getInputProps()} />
              <div className="space-y-2" style={{ pointerEvents: 'none' }}>
                <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                  <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <div className="text-gray-600">
                  {isDragActive ? (
                    <p>Drop the file here...</p>
                  ) : (
                    <div>
                      <p>Drag & drop a file here, or <span className="text-primary-600 font-medium">click to select</span></p>
                      <p className="text-sm text-gray-500">PDF, DOCX, TXT, HTML files up to 10MB</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="border border-gray-300 rounded-lg p-4 bg-gray-50">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="flex-shrink-0">
                    <svg className="h-8 w-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{file.name}</p>
                    <p className="text-sm text-gray-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={removeFile}
                  className="text-red-600 hover:text-red-800 p-1"
                >
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Upload Progress */}
        {loading && uploadProgress > 0 && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Uploading...</span>
              <span>{uploadProgress}%</span>
            </div>
            <div className="progress-bar">
              <div 
                className="progress-fill"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex">
              <svg className="h-5 w-5 text-red-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 15.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              <p className="text-sm text-red-800">{error}</p>
            </div>
          </div>
        )}

        {/* Buttons */}
        <div className="flex flex-col sm:flex-row justify-end space-y-3 sm:space-y-0 sm:space-x-3">
          {onCancel && (
              <button
              type="button"
              onClick={onCancel}
                className="btn-secondary w-full sm:w-auto"
              disabled={loading}
            >
              Cancel
            </button>
          )}
          <button
            type="submit"
            className="btn-primary w-full sm:w-auto"
            disabled={loading || !title.trim() || (!editDocument && !file)}
          >
            {loading ? (
              <div className="flex items-center space-x-2">
                <LoadingSpinner size="sm" />
                <span>{editDocument ? 'Updating...' : 'Uploading...'}</span>
              </div>
            ) : (
              editDocument ? 'Update Document' : 'Upload Document'
            )}
          </button>
        </div>
      </form>
    </div>
  ;
};

export default DocumentUploadForm;