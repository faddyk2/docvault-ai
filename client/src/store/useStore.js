import { create } from 'zustand';
import { documentsAPI, queryAPI, authAPI, usersAPI } from '../services/api';

export const useAuthStore = create((set, get) => ({
  user: null,
  token: localStorage.getItem('token'),
  loading: false,
  error: null,

  login: async (email, password) => {
    set({ loading: true, error: null });
    try {
      const data = await authAPI.login(email, password);
      localStorage.setItem('token', data.token);
      set({ user: data.user, token: data.token, loading: false });
      return data;
    } catch (error) {
      set({
        error: error.response?.data?.error || 'Login failed',
        loading: false
      });
      throw error;
    }
  },

  logout: async () => {
    try {
      await authAPI.logout();
    } catch (error) {
      console.error('Logout error:', error);
    }
    localStorage.removeItem('token');
    set({ user: null, token: null });
  },

  getCurrentUser: async () => {
    const token = get().token;
    if (!token) {
      set({ user: null, loading: false });
      return;
    }
    
    set({ loading: true, error: null });
    try {
      const data = await authAPI.getCurrentUser();
      set({ user: data.user, loading: false });
    } catch (error) {
      localStorage.removeItem('token');
      set({ user: null, token: null, loading: false, error: error.response?.data?.error });
    }
  },

  clearError: () => {
    set({ error: null });
  },
}));

export const useDocumentsStore = create((set, get) => ({
  documents: [],
  loading: false,
  error: null,
  uploadProgress: 0,

  fetchDocuments: async () => {
    set({ loading: true, error: null });
    try {
      const data = await documentsAPI.getDocuments();
      set({ documents: data.documents, loading: false });
    } catch (error) {
      set({ 
        error: error.response?.data?.error || 'Failed to fetch documents',
        loading: false 
      });
    }
  },

  uploadDocument: async (formData) => {
    set({ loading: true, error: null, uploadProgress: 0 });
    try {
      await documentsAPI.uploadDocument(formData, (progress) => {
        set({ uploadProgress: progress });
      });
      
      // Refresh documents list
      await get().fetchDocuments();
      set({ uploadProgress: 0 });
    } catch (error) {
      set({ 
        error: error.response?.data?.error || 'Failed to upload document',
        loading: false,
        uploadProgress: 0
      });
      throw error;
    }
  },

  updateDocument: async (id, formData) => {
    set({ loading: true, error: null, uploadProgress: 0 });
    try {
      await documentsAPI.updateDocument(id, formData, (progress) => {
        set({ uploadProgress: progress });
      });
      
      // Refresh documents list
      await get().fetchDocuments();
      set({ uploadProgress: 0 });
    } catch (error) {
      set({ 
        error: error.response?.data?.error || 'Failed to update document',
        loading: false,
        uploadProgress: 0
      });
      throw error;
    }
  },

  deleteDocument: async (id) => {
    set({ loading: true, error: null });
    try {
      await documentsAPI.deleteDocument(id);
      
      // Remove from local state
      const documents = get().documents.filter(doc => doc._id !== id);
      set({ documents, loading: false });
    } catch (error) {
      set({ 
        error: error.response?.data?.error || 'Failed to delete document',
        loading: false 
      });
      throw error;
    }
  },

  setUploadProgress: (progress) => {
    set({ uploadProgress: progress });
  },

  clearError: () => {
    set({ error: null });
  },
}));

export const useQueryStore = create((set, get) => ({
  messages: [],
  loading: false,
  error: null,
  showChunks: false,

  queryKB: async (query) => {
    if (!query.trim()) return;

    const userMessage = {
      id: Date.now().toString(),
      type: 'user',
      content: query.trim(),
      timestamp: new Date(),
    };

    set({ 
      messages: [...get().messages, userMessage],
      loading: true, 
      error: null
    });

    try {
      const result = await queryAPI.queryKB(query.trim(), 5);
      
      const assistantMessage = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: result.answer,
        chunks: result.chunks,
        videoUrl: result.videoUrl,
        timestamp: new Date(),
      };

      set({ 
        messages: [...get().messages, assistantMessage],
        loading: false 
      });
    } catch (error) {
      set({ 
        error: error.response?.data?.error || error.message || 'Failed to query knowledge base',
        loading: false
      });
    }
  },

  clearMessages: () => {
    set({ messages: [] });
  },

  toggleShowChunks: () => {
    set({ showChunks: !get().showChunks });
  },

  clearError: () => {
    set({ error: null });
  },
}));

export const useUserStore = create((set, get) => ({
  users: [],
  loading: false,
  error: null,

  fetchUsers: async () => {
    set({ loading: true, error: null });
    try {
      const data = await usersAPI.getAllUsers();
      set({ users: data.users, loading: false });
    } catch (error) {
      set({ 
        error: error.response?.data?.error || 'Failed to fetch users',
        loading: false 
      });
    }
  },

  createUser: async (userData) => {
    set({ loading: true, error: null });
    try {
      await usersAPI.createUser(userData);
      await get().fetchUsers();
      set({ loading: false });
    } catch (error) {
      set({ 
        error: error.response?.data?.error || 'Failed to create user',
        loading: false 
      });
      throw error;
    }
  },

  updateUser: async (id, userData) => {
    set({ loading: true, error: null });
    try {
      await usersAPI.updateUser(id, userData);
      await get().fetchUsers();
      set({ loading: false });
    } catch (error) {
      set({ 
        error: error.response?.data?.error || 'Failed to update user',
        loading: false 
      });
      throw error;
    }
  },

  deleteUser: async (id) => {
    set({ loading: true, error: null });
    try {
      await usersAPI.deleteUser(id);
      const users = get().users.filter(user => user.id !== id);
      set({ users, loading: false });
    } catch (error) {
      set({ 
        error: error.response?.data?.error || 'Failed to delete user',
        loading: false 
      });
      throw error;
    }
  },

  clearError: () => {
    set({ error: null });
  },
}));