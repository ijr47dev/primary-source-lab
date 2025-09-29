'use client';
import { useState } from 'react';
import dynamic from 'next/dynamic';
import { Upload, FileText, Info } from 'lucide-react';

const DocumentCanvas = dynamic(() => import('@/components/DocumentCanvas'), {
  ssr: false,
});

export default function Home() {
  const [imageUrl, setImageUrl] = useState<string | null>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      const url = URL.createObjectURL(file);
      setImageUrl(url);
    }
  };

  const loadSampleDocument = () => {
    // Load a sample historical document from the web
    setImageUrl('https://www.archives.gov/files/historical-docs/doc-content/images/constitution-pg1-of-4-630.jpg');
  };

  return (
    <main className="min-h-screen bg-slate-50">
      <header className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">
                Primary Source Lab
              </h1>
              <p className="text-slate-600">
                Collaborative historical document analysis
              </p>
            </div>
            {imageUrl && (
              <button
                onClick={() => setImageUrl(null)}
                className="px-4 py-2 text-sm bg-slate-100 rounded-lg hover:bg-slate-200"
              >
                Upload New Document
              </button>
            )}
          </div>
        </div>
      </header>
      
      <div className="max-w-7xl mx-auto p-4">
        {!imageUrl ? (
          <>
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
                  className="border-2 border-slate-300 rounded-lg p-8 hover:border-blue-400 hover:bg-blue-50 transition text-center"
                >
                  <FileText className="mx-auto h-8 w-8 text-slate-400 mb-2" />
                  <p className="text-sm font-medium text-slate-700">
                    Try Sample Document
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    U.S. Constitution Page 1
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
                    <li>Select the Annotate tool to draw boxes around important areas</li>
                    <li>Add notes to explain what you&#39;ve highlighted</li>
                    <li>Use Select tool to move or resize annotations</li>
                    <li>Zoom in/out to see details clearly</li>
                  </ol>
                </div>
              </div>
            </div>
          </>
        ) : (
          <DocumentCanvas imageUrl={imageUrl} />
        )}
      </div>
    </main>
  );
}