const BACKEND_PORT = 5001;

const getAPIBaseURL = () => {
  if (typeof window !== 'undefined') {
    return `${window.location.protocol}//${window.location.hostname}:${BACKEND_PORT}`;
  }
  return `http://localhost:${BACKEND_PORT}`;
};

export const API_BASE_URL = getAPIBaseURL();
export const MAX_VIDEO_FILE_SIZE = 200 * 1024 * 1024;

export default API_BASE_URL;