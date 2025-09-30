'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Upload, FileText, Info, Loader2 } from 'lucide-react';
import { api } from '@/lib/api';

export default function Home() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith('image/')) return;

    setIsLoading(true);
    setError(null);

    try {
      // Step 1: Upload the image
      const uploadResponse = await api.uploadImage(file);
      
      // Step 2: Create a document in the database
      const document = await api.createDocument({
        title: file.name || 'Untitled Document',
        imageUrl: uploadResponse.imageUrl,
        description: `Uploaded on ${new Date().toLocaleDateString()}`
      });

      // Step 3: Redirect to the document page
      router.push(`/document/${document.shareToken}`);
    } catch (err) {
      console.error('Upload error:', err);
      setError('Failed to upload document. Please try again.');
      setIsLoading(false);
    }
  };

  const loadSampleDocument = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Create a document with the sample image
      const document = await api.createDocument({
        title: 'U.S. Bill of Rights - Sample',
        imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/79/Bill_of_Rights_Pg1of1_AC.jpg/1280px-Bill_of_Rights_Pg1of1_AC.jpg',
        description: 'Sample historical document for testing'
      });

      // Redirect to the document page
      router.push(`/document/${document.shareToken}`);
    } catch (err) {
      console.error('Sample load error:', err);
      setError('Failed to load sample. Please check your backend is running.');
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-50">
      <header className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold text-slate-900">
            Primary Source Lab
          </h1>
          <p className="text-slate-600">
            Collaborative historical document analysis
          </p>
        </div>
      </header>
      
      <div className="max-w-7xl mx-auto p-4">
        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        {/* Loading Overlay */}
        {isLoading && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 flex flex-col items-center">
              <Loader2 className="animate-spin h-8 w-8 text-blue-500 mb-2" />
              <p>Uploading document...</p>
            </div>
          </div>
        )}

        {/* Upload Section */}
        <div className="bg-white rounded-lg shadow p-8">
          <div className="text-center mb-8">
            <FileText className="mx-auto h-12 w-12 text-slate-400 mb-4" />
            <h2 className="text-xl font-semibold text-slate-900 mb-2">
              Get Started with a Document
            </h2>
            <p className="text-slate-600">
              Upload a historical document to begin annotating and analyzing
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-4 max-w-2xl mx-auto">
            {/* Upload Box */}
            <label className="cursor-pointer">
              <input
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
                disabled={isLoading}
              />
              <div className="border-2 border-dashed border-slate-300 rounded-lg p-8 hover:border-blue-400 hover:bg-blue-50 transition text-center">
                <Upload className="mx-auto h-8 w-8 text-slate-400 mb-2" />
                <p className="text-sm font-medium text-slate-700">
                  Upload Your Document
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  PNG, JPG up to 10MB
                </p>
              </div>
            </label>

            {/* Sample Document */}
            <button
              onClick={loadSampleDocument}
              disabled={isLoading}
              className="border-2 border-slate-300 rounded-lg p-8 hover:border-blue-400 hover:bg-blue-50 transition text-center"
            >
              <FileText className="mx-auto h-8 w-8 text-slate-400 mb-2" />
              <p className="text-sm font-medium text-slate-700">
                Try Sample Document
              </p>
              <p className="text-xs text-slate-500 mt-1">
                U.S. Bill of Rights
              </p>
            </button>
          </div>
        </div>

        {/* Instructions */}
        <div className="bg-blue-50 rounded-lg p-6 mt-6">
          <div className="flex">
            <Info className="h-5 w-5 text-blue-500 mt-0.5 mr-3 flex-shrink-0" />
            <div className="text-sm text-blue-900">
              <p className="font-semibold mb-2">How to use Primary Source Lab:</p>
              <ol className="list-decimal list-inside space-y-1">
                <li>Upload a document or try our sample</li>
                <li>Your document will be saved with a shareable link</li>
                <li>Add annotations that auto-save to the database</li>
                <li>Share the link with others to collaborate</li>
                <li>All annotations persist across sessions</li>
              </ol>
            </div>
          </div>
        </div>

        {/* Recent Documents (optional feature for later) */}
        <div className="mt-6 text-center text-sm text-slate-500">
          <p>Tip: Bookmark your document&apos;s URL to return to it later</p>
        </div>
      </div>
    </main>
  );
}