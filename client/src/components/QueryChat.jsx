// @ts-nocheck
import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { useQueryStore } from '../store/useStore';
import LoadingSpinner from './LoadingSpinner';
import { API_BASE_URL } from '../services/config';
import { useAuthStore } from '../store/useStore';

const QueryChat = () => {
  const [query, setQuery] = useState('');
  const { user, getCurrentUser, logout, loading: authLoading } = useAuthStore();

  const { 
    messages, 
    loading, 
    error, 
    showChunks, 
    queryKB, 
    clearMessages, 
    toggleShowChunks,
    clearError
  } = useQueryStore();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!query.trim() || loading) return;
    
    clearError();
    await queryKB(query);
    setQuery('');
  };

  const formatTime = (date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const ChunkDisplay = ({ chunk }) => (
    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-3">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center space-x-2">
          {chunk.document && (
            <>
              <span className="text-sm font-medium text-gray-900">{chunk.document.title}</span>
              <span className="text-xs text-gray-500 uppercase">{chunk.document.type}</span>
            </>
          )}
          {chunk.score && (
            <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
              {(chunk.score * 100).toFixed(1)}% match
            </span>
          )}
        </div>
        <span className="text-xs text-gray-500">Chunk {chunk.chunkId + 1}</span>
      </div>
      <p className="text-sm text-gray-700 leading-relaxed">{chunk.text}</p>
      {chunk.document?.tags && chunk.document.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2">
          {chunk.document.tags.map((tag, index) => (
            <span
              key={index}
              className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
            >
              {tag}
            </span>
          ))}
        </div>
      )}
    </div>
  );

  const MessageDisplay = ({ message }) => (
    <div className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in`}>
      <div className={`max-w-4xl ${message.type === 'user' ? 'ml-0 sm:ml-12' : 'mr-0 sm:mr-12'}`}>
        <div
          className={`rounded-lg p-4 ${
            message.type === 'user'
              ? 'bg-primary-600 text-white'
              : 'bg-white border border-gray-200'
          }`}
        >
          {message.type === 'assistant' && message.videoUrl && (
          <div className="mt-4 mb-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <svg className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z" />
              </svg>
              <div className="flex-1">
                <h4 className="text-sm font-medium text-blue-900 mb-1">Related Video</h4>
                <a 
                  href={`${API_BASE_URL}${message.videoUrl}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-blue-600 hover:text-blue-800 underline inline-flex items-center space-x-1"
                >
                  <span>Watch Tutorial Video</span>
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </a>
              </div>
            </div>
          </div>
        )}
          {message.type === 'user' ? (
            <p className="whitespace-pre-wrap">{message.content}</p>
          ) : (
            <div className="prose prose-sm max-w-none text-gray-800">
              <ReactMarkdown
                components={{
                  h1: ({node, ...props}) => <h1 className="text-xl font-bold mb-3 text-gray-900" {...props} />,
                  h2: ({node, ...props}) => <h2 className="text-lg font-semibold mb-2 text-gray-900" {...props} />,
                  h3: ({node, ...props}) => <h3 className="text-base font-medium mb-2 text-gray-900" {...props} />,
                  p: ({node, ...props}) => <p className="mb-2 last:mb-0" {...props} />,
                  ul: ({node, ...props}) => <ul className="list-disc ml-4 mb-2 space-y-1" {...props} />,
                  ol: ({node, ...props}) => <ol className="list-decimal ml-4 mb-2 space-y-1" {...props} />,
                  li: ({node, ...props}) => <li className="text-gray-700" {...props} />,
                  strong: ({node, ...props}) => <strong className="font-semibold text-gray-900" {...props} />,
                  em: ({node, ...props}) => <em className="italic" {...props} />,
                  code: ({node, inline, ...props}) => 
                    inline ? (
                      <code className="bg-gray-100 px-1 py-0.5 rounded text-sm font-mono" {...props} />
                    ) : (
                      <code className="block bg-gray-100 p-2 rounded text-sm font-mono overflow-x-auto" {...props} />
                    ),
                  blockquote: ({node, ...props}) => (
                    <blockquote className="border-l-4 border-gray-300 pl-3 italic text-gray-600" {...props} />
                  )
                }}
              >
                {message.content}
              </ReactMarkdown>
            </div>
          )}
          <div className="flex justify-between items-center mt-2">
            <span className={`text-xs ${message.type === 'user' ? 'text-primary-100' : 'text-gray-500'}`}>
              {formatTime(message.timestamp)}
            </span>
            {message.type === 'assistant' && message.chunks && message.chunks.length > 0 && (
              <span className="text-xs text-gray-500">
                {message.chunks.length} source{message.chunks.length !== 1 ? 's' : ''}
              </span>
            )}
          </div>
        </div>
        
        
        
        {/* Show chunks if enabled and message has chunks */}
        {message.type === 'assistant' && showChunks && message.chunks && message.chunks.length > 0 && (
          <div className="mt-4">
            <h4 className="text-sm font-medium text-gray-700 mb-2">Source Chunks:</h4>
            {message.chunks.map((chunk, index) => (
              <ChunkDisplay key={`${chunk.documentId}-${chunk.chunkId}-${index}`} chunk={chunk} />
            ))}
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="card h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-200">
        <h2 className="text-xl font-semibold">Chatbot</h2>
        <div className="flex items-center space-x-3">
            {user && user.role === 'admin' && (
          <label className="flex items-center space-x-2 text-sm">
            <input
              type="checkbox"
              checked={showChunks}
              onChange={toggleShowChunks}
              className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
            />
      
            <span>Show source chunks</span>
            
          </label>)}
          {messages.length > 0 && (
            <button
              onClick={clearMessages}
              className="text-sm text-gray-500 hover:text-gray-700 px-3 py-1 rounded hover:bg-gray-100"
            >
              Clear chat
            </button>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto mb-6 space-y-4 scrollbar-thin">
        {messages.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            <p>Ask a question about your documents to get started!</p>
          </div>
        ) : (
          messages.map((message) => (
            <MessageDisplay key={message.id} message={message} />
          ))
        )}
        
        {loading && (
          <div className="flex justify-start">
            <div className="bg-white border border-gray-200 rounded-lg p-4 max-w-xs">
              <div className="flex items-center space-x-3">
                <LoadingSpinner size="sm" />
                <span className="text-gray-600">
                  Searching knowledge base...
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex">
            <svg className="h-5 w-5 text-red-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 15.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            <p className="text-sm text-red-800">{error}</p>
          </div>
        </div>
      )}

      {/* Query Input */}
      <form onSubmit={handleSubmit} className="flex flex-row space-y-0 space-x-3">
        <div className="flex-1">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Ask a question about your documents..."
            className="input-field"
            disabled={loading}
          />
        </div>
        <button
          type="submit"
          disabled={loading || !query.trim()}
          className="btn-primary  w-auto px-6 flex-shrink-0"
        >
          {loading ? (
            <LoadingSpinner size="sm" />
          ) : (
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          )}
        </button>
      </form>
    </div>
  );
};

export default QueryChat;