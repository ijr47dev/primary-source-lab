'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import dynamic from 'next/dynamic';
import { api, Document } from '@/lib/api';
import { Loader2 } from 'lucide-react';

const DocumentCanvas = dynamic(() => import('@/components/DocumentCanvas'), {
  ssr: false,
});

export default function DocumentPage() {
  const params = useParams();
  const [document, setDocument] = useState<Document | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (params.shareToken) {
      loadDocument(params.shareToken as string);
    }
  }, [params.shareToken]);

  const loadDocument = async (shareToken: string) => {
    try {
      setLoading(true);
      const doc = await api.getDocument(shareToken);
      setDocument(doc);
    } catch (err) {
      setError('Document not found');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="animate-spin h-8 w-8 text-blue-500" />
      </div>
    );
  }

  if (error || !document) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-500 mb-4">{error || 'Document not found'}</p>
          <a href="/" className="text-blue-500 hover:underline">
            Go back home
          </a>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50">
      <header className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold text-slate-900">
            {document.title}
          </h1>
          {document.description && (
            <p className="text-slate-600">{document.description}</p>
          )}
        </div>
      </header>
      
      <div className="max-w-7xl mx-auto p-4">
        <DocumentCanvas 
          imageUrl={document.imageUrl} 
          documentId={document.id}
          initialAnnotations={document.annotations}
        />
      </div>
    </main>
  );
}