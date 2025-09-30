const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export interface Document {
  id: string;
  title: string;
  description?: string;
  imageUrl: string;
  shareToken: string;
  annotations: Annotation[];
}

export interface Annotation {
  id: string;
  documentId: string;
  x: number;
  y: number;
  width: number;
  height: number;
  text: string;
  color: string;
  category: string;
  author: string;
}

export const api = {
  // Documents
  async createDocument(data: { title: string; imageUrl: string; description?: string }) {
    const res = await fetch(`${API_URL}/api/documents`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return res.json();
  },

  async getDocument(shareToken: string) {
    const res = await fetch(`${API_URL}/api/documents/${shareToken}`);
    if (!res.ok) throw new Error('Document not found');
    return res.json();
  },

  async uploadImage(file: File) {
    const formData = new FormData();
    formData.append('file', file);
    
    const res = await fetch(`${API_URL}/api/documents/upload`, {
      method: 'POST',
      body: formData
    });
    return res.json();
  },

  // Annotations
  async createAnnotation(data: Partial<Annotation>) {
    const res = await fetch(`${API_URL}/api/annotations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return res.json();
  },

  async updateAnnotation(id: string, data: Partial<Annotation>) {
    const res = await fetch(`${API_URL}/api/annotations/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return res.json();
  },

  async deleteAnnotation(id: string) {
    await fetch(`${API_URL}/api/annotations/${id}`, {
      method: 'DELETE'
    });
  },

  async syncAnnotations(documentId: string, annotations: any[]) {
    const res = await fetch(`${API_URL}/api/annotations/bulk`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ documentId, annotations })
    });
    return res.json();
  }
};