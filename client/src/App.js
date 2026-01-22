
import React, { useEffect, useState } from 'react';
import './App.css';
import { useDocumentsStore, useAuthStore } from './store/useStore';
import DocumentList from './components/DocumentList';
import DocumentUploadForm from './components/DocumentUploadForm';
import QueryChat from './components/QueryChat';
import VideoList from './components/VideoList';
import Login from './components/Login';
import UserManagement from './components/UserManagement';

function App() {
  const [activeTab, setActiveTab] = useState('query');
  const [editDocument, setEditDocument] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { fetchDocuments, clearError } = useDocumentsStore();
  const { user, getCurrentUser, logout, loading: authLoading } = useAuthStore();

  useEffect(() => {
    getCurrentUser();
  }, [getCurrentUser]);

  useEffect(() => {
    if (user) {
      fetchDocuments();
    }
  }, [user, fetchDocuments]);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setEditDocument(null);
    clearError();
  };

  const handleEdit = (document) => {
    setEditDocument(document);
    setActiveTab('upload');
  };

  const handleUploadSuccess = () => {
    setActiveTab('documents');
    setEditDocument(null);
  };

  const handleCancelEdit = () => {
    setEditDocument(null);
    setActiveTab('documents');
  };

  const handleLogout = async () => {
    await logout();
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  const isAdmin = user.role === 'admin';
  const tabs = isAdmin
    ? ['query', 'documents', 'upload', 'videos', 'users']
    : ['query'];

  return (
     <>
       <div className="min-h-screen bg-gray-50">
 
         <header className="bg-white shadow-sm border-b border-gray-200">
           <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
             <div className="flex items-center justify-between h-16">
               <div className="flex items-center space-x-4">
                 <div className="flex items-center space-x-2">
                   <svg className="h-8 w-8 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                   </svg>
                   <h1 className="text-xl font-bold text-gray-900">Chatbot</h1>
                 </div>
               </div>

               <nav className="hidden sm:flex space-x-1">
                 <button
                   onClick={() => handleTabChange('query')}
                   className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                     activeTab === 'query'
                       ? 'bg-primary-600 text-white'
                       : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                   }`}
                 >
                   Query
                 </button>
                 {isAdmin && (
                   <>
                     <button
                       onClick={() => handleTabChange('documents')}
                       className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                         activeTab === 'documents'
                           ? 'bg-primary-600 text-white'
                           : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                       }`}
                     >
                       Documents
                     </button>
                     <button
                       onClick={() => handleTabChange('upload')}
                       className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                         activeTab === 'upload'
                           ? 'bg-primary-600 text-white'
                           : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                       }`}
                     >
                       {editDocument ? 'Edit Document' : 'Upload'}
                     </button>
                     <button
                       onClick={() => handleTabChange('videos')}
                       className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                         activeTab === 'videos'
                           ? 'bg-primary-600 text-white'
                           : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                       }`}
                     >
                       Videos
                     </button>
                     <button
                       onClick={() => handleTabChange('users')}
                       className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                         activeTab === 'users'
                           ? 'bg-primary-600 text-white'
                           : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                       }`}
                     >
                       Users
                     </button>
                   </>
                 )}
                 <div className='logged-in-as ml-4 flex items-center text-sm text-gray-500 border-bg-primary-600 border-2 px-3 py-1 rounded-lg'>
                   <svg className="h-5 w-5 text-gray-400 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                   </svg>
                   <span className='ml-1 font-medium'>{user.email}</span>
                   <span className='ml-2 text-xs bg-primary-100 text-primary-700 px-2 py-0.5 rounded'>{user.role}</span>
                 </div>
                 <button
                   onClick={handleLogout}
                   className="ml-2 px-4 py-2 rounded-lg text-sm font-medium bg-red-600 text-white hover:bg-red-800 transition-colors hover:scale-105"
                 >
                   Logout
                 </button>
               </nav>
               <div className="sm:hidden">
                 <button
                   onClick={() => setMobileMenuOpen((s) => !s)}
                   className="p-2 rounded-md text-gray-600 hover:bg-gray-100"
                   aria-label="Open menu"
                 >
                   <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                   </svg>
                 </button>
               </div>
             </div>
           </div>
         </header>
        {mobileMenuOpen && (
          <div className="sm:hidden bg-white border-b border-gray-200">
            <div className="px-4 pt-2 pb-4 space-y-1">
              <button onClick={() => { handleTabChange('query'); setMobileMenuOpen(false); }} className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'query' ? 'bg-primary-600 text-white' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'}`}>Query</button>
              {isAdmin && (
                <>
                  <button onClick={() => { handleTabChange('documents'); setMobileMenuOpen(false); }} className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'documents' ? 'bg-primary-600 text-white' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'}`}>Documents</button>
                  <button onClick={() => { handleTabChange('upload'); setMobileMenuOpen(false); }} className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'upload' ? 'bg-primary-600 text-white' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'}`}>{editDocument ? 'Edit Document' : 'Upload'}</button>
                  <button onClick={() => { handleTabChange('videos'); setMobileMenuOpen(false); }} className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'videos' ? 'bg-primary-600 text-white' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'}`}>Videos</button>
                  <button onClick={() => { handleTabChange('users'); setMobileMenuOpen(false); }} className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'users' ? 'bg-primary-600 text-white' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'}`}>Users</button>
                </>
              )}
              <button onClick={handleLogout} className="w-full text-left px-3 py-2 rounded-lg text-sm font-medium">Logout</button>
            </div>
          </div>
        )}
 
         <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
           <div className={`transition-opacity duration-200 ${activeTab === 'query' ? 'block' : 'hidden'}`}>
             <div className="h-[calc(100vh-12rem)]">
               <QueryChat />
             </div>
           </div>

           {isAdmin && (
             <>
               <div className={`transition-opacity duration-200 ${activeTab === 'documents' ? 'block' : 'hidden'}`}>
                 <DocumentList onEdit={handleEdit} />
               </div>

               <div className={`transition-opacity duration-200 ${activeTab === 'upload' ? 'block' : 'hidden'}`}>
                 <DocumentUploadForm
                   onSuccess={handleUploadSuccess}
                   editDocument={editDocument}
                   onCancel={editDocument ? handleCancelEdit : undefined}
                 />
               </div>

               <div className={`transition-opacity duration-200 ${activeTab === 'videos' ? 'block' : 'hidden'}`}>
                 <VideoList />
               </div>

               <div className={`transition-opacity duration-200 ${activeTab === 'users' ? 'block' : 'hidden'}`}>
                 <UserManagement />
               </div>
             </>
           )}
         </main>
       </div>
     </>
   );
}

export default App;
