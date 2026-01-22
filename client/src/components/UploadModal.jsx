import React, {useState, useCallback, useEffect} from 'react';
import {useDropzone} from 'react-dropzone';
import api from '../services/api';
import { MAX_VIDEO_FILE_SIZE } from '../services/config';

const UploadModal = ({isOpen, onClose, onUploaded}) => {
  const [file, setFile] = useState(null);
  const [filename, setFilename] = useState('');
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isOpen) {
      setFile(null);
      setFilename('');
      setError('');
    }
  }, [isOpen]);

  const onDrop = useCallback(acceptedFiles => {
    if (acceptedFiles && acceptedFiles.length) {
      const f = acceptedFiles[0];
      setFile(f);
      if (!filename) setFilename(f.name);
    }
  }, [filename]);

  const {getRootProps, getInputProps, isDragActive} = useDropzone({
    onDrop,
    accept: {
      'video/*': []
    },
    multiple: false
  });

  const handleBrowse = (e) => {
    const f = e.target.files[0];
    if (f) {
      setFile(f);
      if (!filename) setFilename(f.name);
    }
  }

  const handleUpload = async () => {
    if (!file) {
      setError('Please select a file first');
      return;
    }
    if (file.size > MAX_VIDEO_FILE_SIZE) {
      setError(`File too large. Limit is ${Math.round(MAX_VIDEO_FILE_SIZE / (1024 * 1024))}MB`);
      return;
    }
    setError('');
    setUploading(true);
    try {
      const form = new FormData();
      form.append('file', file);
      form.append('filename', filename);

      await api.post('/apiVideos', form, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      onUploaded && onUploaded();
      onClose && onClose();
    } catch (e) {
      setError(e.response?.data?.error || e.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50">
      <div className="absolute inset-0 bg-black opacity-40" onClick={onClose} />
      <div className="bg-white rounded shadow-xl max-w-lg w-full p-6 z-10">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium">Upload Video</h3>
          <button className="text-gray-500" onClick={onClose}>Close</button>
        </div>

        <div className="mt-4">
          <div {...getRootProps()} className="border-2 border-dashed border-gray-300 p-6 rounded text-center cursor-pointer">
            <input {...getInputProps()} />
            {isDragActive ? (
              <p>Drop the video here ...</p>
            ) : (
              <p>Drag & drop a video file here, or click to browse.</p>
            )}

            <div className="mt-3">
              <label className="inline-flex items-center px-3 py-2 rounded bg-gray-100 cursor-pointer">
                Browse
                <input onChange={handleBrowse} type="file" accept="video/*" className="hidden" />
              </label>
            </div>
          </div>

          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700">Filename</label>
            <input value={filename} onChange={e => setFilename(e.target.value)} className="mt-1 block w-full border rounded p-2" />
          </div>

          {file && (
            <div className="mt-4">
              <p className="text-sm text-gray-600">Selected: {file.name}</p>
            </div>
          )}

          {error && <div className="text-red-500 mt-3">{error}</div>}

          <div className="mt-6 flex justify-end gap-3">
            <button onClick={onClose} className="px-4 py-2 border rounded">Cancel</button>
            <button disabled={uploading} onClick={handleUpload} className="px-4 py-2 bg-blue-600 text-white rounded">{uploading ? 'Uploading...' : 'Upload'}</button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default UploadModal;
