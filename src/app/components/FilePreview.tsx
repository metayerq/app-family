'use client'

import { useState, useEffect } from 'react'

interface FilePreviewProps {
  file: {
    id: string
    fileName: string
    originalName?: string
    size: number
    type: string
    url: string
    uploadedAt: string | Date
  } | null
  isOpen: boolean
  onClose: () => void
  onNext?: () => void
  onPrevious?: () => void
  currentIndex?: number
  totalFiles?: number
}

export default function FilePreview({ 
  file, 
  isOpen, 
  onClose, 
  onNext, 
  onPrevious, 
  currentIndex, 
  totalFiles 
}: FilePreviewProps) {
  const [textContent, setTextContent] = useState<string>('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string>('')

  // Load text content for text files
  useEffect(() => {
    if (file && file.type.startsWith('text/') && isOpen) {
      setIsLoading(true)
      setError('')
      
      fetch(file.url)
        .then(response => response.text())
        .then(content => {
          setTextContent(content)
          setIsLoading(false)
        })
        .catch(() => {
          setError('Failed to load file content')
          setIsLoading(false)
        })
    }
  }, [file, isOpen])

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return
      
      if (e.key === 'Escape') {
        onClose()
      } else if (e.key === 'ArrowLeft' && onPrevious) {
        onPrevious()
      } else if (e.key === 'ArrowRight' && onNext) {
        onNext()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose, onNext, onPrevious])

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  if (!isOpen || !file) return null

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const formatDate = (dateString: string | Date) => {
    const date = new Date(dateString)
    return date.toLocaleString()
  }

  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) return '🖼️'
    if (type === 'application/pdf') return '📄'
    if (type.startsWith('text/')) return '📝'
    if (type.includes('word')) return '📄'
    return '📁'
  }

  const renderPreviewContent = () => {
    if (file.type.startsWith('image/')) {
      return (
        <div className="flex items-center justify-center h-full p-4">
          <img
            src={file.url}
            alt={file.originalName || file.fileName}
            className="max-w-full max-h-full object-contain rounded-lg shadow-lg"
            style={{ maxHeight: 'calc(100vh - 200px)' }}
          />
        </div>
      )
    }

    if (file.type === 'application/pdf') {
      return (
        <div className="h-full">
          <iframe
            src={file.url}
            className="w-full h-full rounded-lg"
            style={{ height: 'calc(100vh - 200px)' }}
            title={file.originalName || file.fileName}
          />
        </div>
      )
    }

    if (file.type.startsWith('text/')) {
      return (
        <div className="h-full p-4">
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-gray-500">Loading content...</div>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-red-500">{error}</div>
            </div>
          ) : (
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 h-full overflow-auto">
              <pre className="whitespace-pre-wrap text-sm font-mono">
                {textContent}
              </pre>
            </div>
          )}
        </div>
      )
    }

    // Unsupported file type
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <div className="text-6xl">{getFileIcon(file.type)}</div>
        <div className="text-center">
          <p className="text-lg font-medium">Preview not available</p>
          <p className="text-gray-500 text-sm">
            This file type cannot be previewed in the browser
          </p>
          <a
            href={file.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
          >
            Download File
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black bg-opacity-75 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-white dark:bg-gray-900 rounded-lg shadow-2xl max-w-6xl max-h-screen w-full mx-4 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-3 min-w-0 flex-1">
            <div className="text-2xl">{getFileIcon(file.type)}</div>
            <div className="min-w-0 flex-1">
              <h3 className="text-lg font-semibold truncate">
                {file.originalName || file.fileName}
              </h3>
              <div className="flex items-center space-x-4 text-sm text-gray-500">
                <span>{formatFileSize(file.size)}</span>
                <span>•</span>
                <span>{formatDate(file.uploadedAt)}</span>
                {currentIndex !== undefined && totalFiles && (
                  <>
                    <span>•</span>
                    <span>{currentIndex + 1} of {totalFiles}</span>
                  </>
                )}
              </div>
            </div>
          </div>
          
          {/* Navigation and Close */}
          <div className="flex items-center space-x-2">
            {onPrevious && (
              <button
                onClick={onPrevious}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                title="Previous file (←)"
              >
                ←
              </button>
            )}
            {onNext && (
              <button
                onClick={onNext}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                title="Next file (→)"
              >
                →
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              title="Close (Esc)"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="overflow-auto" style={{ maxHeight: 'calc(100vh - 120px)' }}>
          {renderPreviewContent()}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
          <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400">
            <span>Type: {file.type}</span>
          </div>
          
          <div className="flex items-center space-x-2">
            <a
              href={file.url}
              download={file.originalName || file.fileName}
              className="px-3 py-1 text-sm bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
            >
              Download
            </a>
            <a
              href={file.url}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
            >
              Open in New Tab
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}