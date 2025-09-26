'use client';
import { useState } from 'react';
import dynamic from 'next/dynamic';

// Dynamically import canvas component (Konva doesn't work with SSR)
const DocumentCanvas = dynamic(() => import('@/components/DocumentCanvas'), {
  ssr: false,
});

export default function Home() {
  const [imageUrl, setImageUrl] = useState<string | null>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setImageUrl(url);
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
        {!imageUrl ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <label className="cursor-pointer">
              <input
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
              />
              <div className="border-2 border-dashed border-slate-300 rounded-lg p-12 hover:border-slate-400 transition">
                <p className="text-lg text-slate-600">
                  Click to upload a historical document
                </p>
                <p className="text-sm text-slate-400 mt-2">
                  PNG, JPG up to 10MB
                </p>
              </div>
            </label>
          </div>
        ) : (
          <DocumentCanvas imageUrl={imageUrl} />
        )}
      </div>
    </main>
  );
}