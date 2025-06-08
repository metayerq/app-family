'use client'

import { useState, useCallback, useEffect } from 'react'
import { useDropzone } from 'react-dropzone'

interface UploadedFile {
  id: string
  fileName: string
  originalName?: string
  size: number
  type: string
  url: string
  uploadedAt: string | Date
}

interface UploadStatus {
  status: 'idle' | 'uploading' | 'success' | 'error'
  progress: number
  message?: string
}

export default function FileUpload() {
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([])
  const [uploadStatuses, setUploadStatuses] = useState<{ [key: string]: UploadStatus }>({})
  const [isLoading, setIsLoading] = useState(true)

  // Fetch existing files on component mount
  const fetchFiles = useCallback(async () => {
    try {
      const response = await fetch('/api/files')
      if (response.ok) {
        const data = await response.json()
        setUploadedFiles(data.files || [])
      }
    } catch (error) {
      console.error('Error fetching files:', error)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchFiles()
  }, [fetchFiles])

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    // Initialize upload status for each file
    const initialStatuses: { [key: string]: UploadStatus } = {}
    acceptedFiles.forEach(file => {
      initialStatuses[file.name] = { status: 'uploading', progress: 50 }
    })
    setUploadStatuses(prev => ({ ...prev, ...initialStatuses }))

    for (const file of acceptedFiles) {
      const formData = new FormData()
      formData.append('file', file)
      
      try {
        // Use fetch instead of XMLHttpRequest - this fixes the Content-Type issue
        const response = await fetch('/api/upload', {
          method: 'POST',
          body: formData
          // Don't set Content-Type header - browser sets it automatically with boundary
        })

        if (response.ok) {
          const result = await response.json()
          
          // Mark as success
          setUploadStatuses(prev => ({
            ...prev,
            [file.name]: { 
              status: 'success', 
              progress: 100, 
              message: 'Upload complete!' 
            }
          }))

          // Add to uploaded files list
          const newFile: UploadedFile = {
            id: result.id,
            fileName: result.filename,
            originalName: result.originalName,
            size: file.size,
            type: file.type,
            url: result.url,
            uploadedAt: result.uploadedAt || new Date().toISOString()
          }
          setUploadedFiles(prev => [newFile, ...prev])

          // Clear status after 2 seconds
          setTimeout(() => {
            setUploadStatuses(prev => {
              const newStatuses = { ...prev }
              delete newStatuses[file.name]
              return newStatuses
            })
          }, 2000)

        } else {
          const errorData = await response.json().catch(() => ({ error: 'Upload failed' }))
          setUploadStatuses(prev => ({
            ...prev,
            [file.name]: { 
              status: 'error', 
              progress: 0, 
              message: errorData.error || 'Upload failed' 
            }
          }))
        }
        
      } catch (error) {
        console.error('Upload failed:', error)
        setUploadStatuses(prev => ({
          ...prev,
          [file.name]: { 
            status: 'error', 
            progress: 0, 
            message: 'Upload failed' 
          }
        }))
      }
    }
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    maxSize: 10 * 1024 * 1024, // 10MB
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.gif'],
      'application/pdf': ['.pdf'],
      'text/*': ['.txt', '.md'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx']
    }
  })

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

  const deleteFile = async (fileId: string) => {
    try {
      const response = await fetch(`/api/upload/${fileId}`, { method: 'DELETE' })
      if (response.ok) {
        setUploadedFiles(prev => prev.filter(file => file.id !== fileId))
      } else {
        console.error('Failed to delete file')
      }
    } catch (error) {
      console.error('Delete failed:', error)
    }
  }

  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) return '🖼️'
    if (type === 'application/pdf') return '📄'
    if (type.startsWith('text/')) return '📝'
    if (type.includes('word')) return '📄'
    return '📁'
  }

  return (
    <div className="w-full max-w-6xl mx-auto p-6 space-y-8">
      {/* Upload Section */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <h2 className="text-2xl font-bold mb-6">Upload Files</h2>
        
        {/* Upload Zone */}
        <div
          {...getRootProps()}
          className={`
            border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
            ${isDragActive 
              ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
              : 'border-gray-300 dark:border-gray-600 hover:border-gray-400'
            }
          `}
        >
          <input {...getInputProps()} />
          <div className="space-y-4">
            <div className="text-6xl">📁</div>
            {isDragActive ? (
              <p className="text-lg text-blue-600 dark:text-blue-400">
                Drop the files here...
              </p>
            ) : (
              <div>
                <p className="text-lg mb-2">
                  Drag & drop files here, or click to select files
                </p>
                <p className="text-sm text-gray-500">
                  Supports: Images, PDF, Documents (Max 10MB)
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Upload Progress */}
        {Object.keys(uploadStatuses).length > 0 && (
          <div className="mt-6 space-y-3">
            {Object.entries(uploadStatuses).map(([fileName, status]) => (
              <div key={fileName} className="space-y-2">
                <div className="flex justify-between items-center text-sm">
                  <span className="truncate font-medium">{fileName}</span>
                  <div className="flex items-center space-x-2">
                    {status.status === 'success' && (
                      <span className="text-green-600 dark:text-green-400">✓</span>
                    )}
                    {status.status === 'error' && (
                      <span className="text-red-600 dark:text-red-400">✗</span>
                    )}
                    <span className={`
                      ${status.status === 'success' ? 'text-green-600 dark:text-green-400' : ''}
                      ${status.status === 'error' ? 'text-red-600 dark:text-red-400' : ''}
                    `}>
                      {status.message || `${status.progress}%`}
                    </span>
                  </div>
                </div>
                {status.status === 'uploading' && (
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${status.progress}%` }}
                    ></div>
                  </div>
                )}
                {status.status === 'success' && (
                  <div className="w-full bg-green-200 dark:bg-green-700 rounded-full h-2">
                    <div className="bg-green-600 h-2 rounded-full w-full"></div>
                  </div>
                )}
                {status.status === 'error' && (
                  <div className="w-full bg-red-200 dark:bg-red-700 rounded-full h-2">
                    <div className="bg-red-600 h-2 rounded-full w-full"></div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Uploaded Files Section */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-semibold">
            Uploaded Files ({uploadedFiles.length})
          </h3>
          <button
            onClick={fetchFiles}
            className="px-3 py-1 text-sm bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-md transition-colors"
            disabled={isLoading}
          >
            {isLoading ? 'Loading...' : 'Refresh'}
          </button>
        </div>

        {isLoading ? (
          <div className="text-center py-8 text-gray-500">
            Loading files...
          </div>
        ) : uploadedFiles.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No files uploaded yet. Upload your first file above!
          </div>
        ) : (
          <div className="space-y-3">
            {uploadedFiles.map((file) => (
              <div
                key={file.id}
                className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                <div className="flex items-center space-x-4">
                  <div className="text-2xl flex-shrink-0">
                    {getFileIcon(file.type)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium truncate">
                      {file.originalName || file.fileName}
                    </p>
                    <div className="flex items-center space-x-4 text-sm text-gray-500">
                      <span>{formatFileSize(file.size)}</span>
                      <span>•</span>
                      <span>{formatDate(file.uploadedAt)}</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2 flex-shrink-0">
                  <a
                    href={file.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                  >
                    View
                  </a>
                  <button
                    onClick={() => deleteFile(file.id)}
                    className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}