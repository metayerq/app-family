import { NextResponse } from 'next/server'
import { readdir, stat } from 'fs/promises'
import { join } from 'path'

export async function GET() {
  try {
    const uploadDir = join(process.cwd(), 'public', 'uploads')
    
    try {
      const files = await readdir(uploadDir)
      
      const fileList = await Promise.all(
        files.map(async (fileName) => {
          try {
            const filePath = join(uploadDir, fileName)
            const stats = await stat(filePath)
            
            // Extract original filename from UUID filename if possible
            // Format: {uuid}.{extension}
            const parts = fileName.split('.')
            const extension = parts.pop()
            const id = parts.join('.')
            
            return {
              id,
              fileName,
              originalName: fileName, // We'll improve this later with a database
              size: stats.size,
              uploadedAt: stats.birthtime,
              url: `/uploads/${fileName}`,
              type: getFileType(extension || '')
            }
          } catch (error) {
            console.error(`Error reading file ${fileName}:`, error)
            return null
          }
        })
      )
      
      // Filter out any null entries and sort by upload date (newest first)
      const validFiles = fileList
        .filter(file => file !== null)
        .sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime())
      
      return NextResponse.json({ files: validFiles })
      
    } catch {
      // Directory doesn't exist or is empty
      return NextResponse.json({ files: [] })
    }
    
  } catch (error) {
    console.error('Error listing files:', error)
    return NextResponse.json({ error: 'Failed to list files' }, { status: 500 })
  }
}

function getFileType(extension: string): string {
  const ext = extension.toLowerCase()
  
  if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext)) {
    return 'image/' + (ext === 'jpg' ? 'jpeg' : ext)
  }
  if (ext === 'pdf') {
    return 'application/pdf'
  }
  if (['txt', 'md'].includes(ext)) {
    return 'text/plain'
  }
  if (ext === 'doc') {
    return 'application/msword'
  }
  if (ext === 'docx') {
    return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  }
  
  return 'application/octet-stream'
}