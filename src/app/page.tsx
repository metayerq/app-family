import FileUpload from './components/FileUpload'

export default function Home() {
  return (
    <div className="min-h-screen p-8">
      <div className="max-w-6xl mx-auto">
        <header className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">Family App</h1>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            Share files and memories with your family
          </p>
        </header>
        
        <FileUpload />
      </div>
    </div>
  )
}
