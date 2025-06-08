import { NextRequest, NextResponse } from 'next/server'
import { unlink } from 'fs/promises'
import { join } from 'path'
import { readdir } from 'fs/promises'

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params
    const fileId = params.id
    
    // Find and delete file with matching ID
    const uploadDir = join(process.cwd(), 'public', 'uploads')
    
    try {
      const files = await readdir(uploadDir)
      const fileToDelete = files.find(file => file.startsWith(fileId))
      
      if (fileToDelete) {
        const filePath = join(uploadDir, fileToDelete)
        await unlink(filePath)
        return NextResponse.json({ success: true, message: 'File deleted successfully' })
      } else {
        return NextResponse.json({ error: 'File not found' }, { status: 404 })
      }
    } catch (error) {
      console.error('Delete error:', error)
      return NextResponse.json({ error: 'File not found or already deleted' }, { status: 404 })
    }
    
  } catch (error) {
    console.error('Delete error:', error)
    return NextResponse.json({ error: 'Delete failed.' }, { status: 500 })
  }
} 