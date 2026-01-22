
import React, { useState,useEffect } from 'react';
import LoadingSpinner from './LoadingSpinner';
import UploadModal from './UploadModal';
import api from '../services/api';
import { API_BASE_URL } from '../services/config';




const VideoList = () => {
  const [loading, setLoading] = useState(false);
  const [videos, setVideos] = useState([]);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
    const fetchVideos = async () => {
    setLoading(true);
    try {
      const response = await api.get('/apiVideos');
      setVideos(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error('Error fetching videos:', error);
      setVideos([]);
    } finally {
        setLoading(false);
    }
  };

  const deleteVideo = async (filename) => {
    try {
      await api.delete(`/apiVideos/${filename}`);
      setVideos(videos.filter(video => video.filename !== filename));
    } catch (error) {
      console.error('Error deleting video:', error);
    }
  };

  useEffect(() => {
    fetchVideos();
  }, []);


  return (
    <div className="card">
        <div className="card-header flex justify-between items-center">
          <span>Videos</span>
          <button onClick={() => setIsUploadOpen(true)} className="btn btn-primary">Upload Video</button>
        </div>
      <div className="card-body">
        {loading ? (
          <LoadingSpinner />
        ) : videos.length === 0 ? (
          <p>No videos available.</p>
        ) : (
          <div className="flex flex-col gap-4">
            {videos.map((video) => (
              <div
                key={video.filename}
                className="flex flex-col sm:flex-row items-start sm:items-center bg-white rounded shadow p-4 gap-4 sm:gap-6"
                style={{ minHeight: 'auto', maxHeight: 'none' }}
              >
                <div className="flex justify-center items-center">
                  <div className="w-full sm:w-[180px] h-auto sm:h-[120px] bg-black rounded-lg overflow-hidden flex items-center justify-center">
                    <video
                      width="100%"
                      height="100%"
                      controls
                      autoPlay={false}
                      style={{ objectFit: 'contain', width: '100%', height: '100%', background: '#000' }}
                    >
                      <source src={`${API_BASE_URL}${video.url}`} type="video/mp4" />
                      Your browser does not support the video tag.
                    </video>
                  </div>
                </div>
                 <span className="mt-2 sm:mt-0 font-semibold text-base w-full sm:w-1/4 truncate">{video.filename}</span>
                <button
                  onClick={() => deleteVideo(video.filename)}
                  className="ml-0 sm:ml-auto mt-2 sm:mt-0 w-full sm:w-auto text-red-500 hover:text-red-700 px-3 py-2 border border-red-300 rounded text-center"
                >
                  Delete
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
      <UploadModal isOpen={isUploadOpen} onClose={() => setIsUploadOpen(false)} onUploaded={fetchVideos} />
    </div>
  );
};

export default VideoList;