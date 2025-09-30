'use client';
import { Stage, Layer, Image as KonvaImage, Rect, Transformer } from 'react-konva';
import { useEffect, useState, useRef, useCallback } from 'react';
import { KonvaEventObject } from 'konva/lib/Node';
import Konva from 'konva';
import { 
  MousePointer, 
  Square, 
  ZoomIn, 
  ZoomOut, 
  RotateCcw, 
  Trash2, 
  Download,
  Palette,
  Save,
  Cloud,
  CloudOff
} from 'lucide-react';
import { HexColorPicker } from 'react-colorful';
import { v4 as uuidv4 } from 'uuid';
import { api } from '@/lib/api';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';

interface DocumentCanvasProps {
  imageUrl: string;
  documentId?: string;  // Optional - only provided when viewing saved document
  initialAnnotations?: any[];  // Optional - annotations from database
}

interface Annotation {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  text: string;
  timestamp: Date;
  color: string;
  category: string;
  author?: string;
  documentId?: string;
  isSynced?: boolean;  // Track if saved to database
}

export default function DocumentCanvas({ 
  imageUrl, 
  documentId, 
  initialAnnotations = [] 
}: DocumentCanvasProps) {
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const [selectedTool, setSelectedTool] = useState<'select' | 'annotate'>('select');
  const [selectedAnnotationId, setSelectedAnnotationId] = useState<string | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [newAnnotation, setNewAnnotation] = useState({ x: 0, y: 0, width: 0, height: 0 });
  const [scale, setScale] = useState(1);
  const [showAnnotationDialog, setShowAnnotationDialog] = useState(false);
  const [pendingAnnotation, setPendingAnnotation] = useState<any>(null);
  const [annotationText, setAnnotationText] = useState('');
  const [annotationColor, setAnnotationColor] = useState('#facc15');
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [annotationCategory, setAnnotationCategory] = useState('general');
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  
  const stageRef = useRef<Konva.Stage>(null);
  const transformerRef = useRef<Konva.Transformer>(null);
  const saveTimeoutRef = useRef<NodeJS.Timeout>();

  // Load initial annotations from database
  useEffect(() => {
    if (initialAnnotations && initialAnnotations.length > 0) {
      const loadedAnnotations = initialAnnotations.map(ann => ({
        ...ann,
        timestamp: new Date(ann.createdAt || ann.timestamp),
        isSynced: true
      }));
      setAnnotations(loadedAnnotations);
    }
  }, [initialAnnotations]);

  // Auto-save annotations when they change (debounced)
  useEffect(() => {
    if (!documentId) return;  // Don't auto-save if no documentId

    // Clear existing timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    // Set new timeout for auto-save (2 seconds after last change)
    saveTimeoutRef.current = setTimeout(() => {
      saveAnnotations();
    }, 2000);

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [annotations, documentId]);

  // Save annotations to database
  const saveAnnotations = async () => {
    if (!documentId || annotations.length === 0) return;

    setIsSaving(true);
    setSaveError(null);

    try {
      // Prepare annotations for saving
      const annotationsToSave = annotations.map(ann => ({
        x: ann.x,
        y: ann.y,
        width: ann.width,
        height: ann.height,
        text: ann.text,
        color: ann.color,
        category: ann.category,
        author: ann.author || 'anonymous'
      }));

      await api.syncAnnotations(documentId, annotationsToSave);
      
      setLastSaved(new Date());
      // Mark all annotations as synced
      setAnnotations(prev => prev.map(ann => ({ ...ann, isSynced: true })));
    } catch (error) {
      console.error('Failed to save annotations:', error);
      setSaveError('Failed to save annotations');
    } finally {
      setIsSaving(false);
    }
  };

  // Manual save function
  const handleManualSave = () => {
    if (documentId) {
      saveAnnotations();
    }
  };

  useEffect(() => {
    const img = new window.Image();
    img.src = imageUrl;
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      setImage(img);
      const maxWidth = 1000;
      const scale = img.width > maxWidth ? maxWidth / img.width : 1;
      setDimensions({
        width: img.width * scale,
        height: img.height * scale
      });
    };
  }, [imageUrl]);

  useEffect(() => {
    if (selectedAnnotationId && transformerRef.current) {
      const stage = stageRef.current;
      const selectedNode = stage?.findOne('#' + selectedAnnotationId);
      if (selectedNode) {
        transformerRef.current.nodes([selectedNode]);
        transformerRef.current.getLayer()?.batchDraw();
      }
    } else if (transformerRef.current) {
      transformerRef.current.nodes([]);
    }
  }, [selectedAnnotationId]);

  const handleMouseDown = (e: KonvaEventObject<MouseEvent>) => {
    const clickedOnEmpty = e.target === e.target.getStage();
    if (clickedOnEmpty) {
      setSelectedAnnotationId(null);
    }

    if (selectedTool !== 'annotate') return;
    
    const stage = e.target.getStage();
    if (!stage) return;
    
    const pos = stage.getPointerPosition();
    if (!pos) return;
    
    const scaledPos = {
      x: pos.x / scale,
      y: pos.y / scale
    };
    
    setIsDrawing(true);
    setNewAnnotation({ x: scaledPos.x, y: scaledPos.y, width: 0, height: 0 });
  };

  const handleMouseMove = (e: KonvaEventObject<MouseEvent>) => {
    if (!isDrawing) return;
    
    const stage = e.target.getStage();
    if (!stage) return;
    
    const pos = stage.getPointerPosition();
    if (!pos) return;
    
    const scaledPos = {
      x: pos.x / scale,
      y: pos.y / scale
    };
    
    setNewAnnotation(prev => ({
      ...prev,
      width: scaledPos.x - prev.x,
      height: scaledPos.y - prev.y
    }));
  };

  const handleMouseUp = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    
    if (Math.abs(newAnnotation.width) > 10 && Math.abs(newAnnotation.height) > 10) {
      const normalized = {
        x: newAnnotation.width < 0 ? newAnnotation.x + newAnnotation.width : newAnnotation.x,
        y: newAnnotation.height < 0 ? newAnnotation.y + newAnnotation.height : newAnnotation.y,
        width: Math.abs(newAnnotation.width),
        height: Math.abs(newAnnotation.height)
      };
      
      setPendingAnnotation(normalized);
      setShowAnnotationDialog(true);
      setAnnotationText('');
    }
    
    setNewAnnotation({ x: 0, y: 0, width: 0, height: 0 });
  };

  const handleAddAnnotation = async () => {
    if (pendingAnnotation && annotationText.trim()) {
      const annotation: Annotation = {
        id: uuidv4(),
        x: pendingAnnotation.x,
        y: pendingAnnotation.y,
        width: pendingAnnotation.width,
        height: pendingAnnotation.height,
        text: annotationText,
        timestamp: new Date(),
        color: annotationColor,
        category: annotationCategory,
        documentId: documentId,
        isSynced: false
      };
      
      setAnnotations([...annotations, annotation]);
      
      // If we have a documentId, save to database immediately
      if (documentId) {
        try {
          const savedAnnotation = await api.createAnnotation({
            documentId,
            ...annotation
          });
          // Update the annotation with the database ID
          setAnnotations(prev => 
            prev.map(ann => 
              ann.id === annotation.id 
                ? { ...ann, id: savedAnnotation.id, isSynced: true }
                : ann
            )
          );
        } catch (error) {
          console.error('Failed to save annotation:', error);
        }
      }
      
      setShowAnnotationDialog(false);
      setPendingAnnotation(null);
      setSelectedTool('select');
    }
  };

  const handleDeleteAnnotation = async (id: string) => {
    // Remove from local state immediately
    setAnnotations(annotations.filter(a => a.id !== id));
    setSelectedAnnotationId(null);
    
    // If we have a documentId, delete from database
    if (documentId) {
      try {
        await api.deleteAnnotation(id);
      } catch (error) {
        console.error('Failed to delete annotation:', error);
        // Could show an error toast here
      }
    }
  };

  const handleZoomIn = () => {
    setScale(prev => Math.min(prev * 1.2, 3));
  };

  const handleZoomOut = () => {
    setScale(prev => Math.max(prev * 0.8, 0.5));
  };

  const handleResetZoom = () => {
    setScale(1);
  };

  const handleDownload = () => {
    const stage = stageRef.current;
    if (!stage) return;
    
    const dataURL = stage.toDataURL({
      pixelRatio: 2
    });
    
    const link = document.createElement('a');
    link.download = `annotated-document-${Date.now()}.png`;
    link.href = dataURL;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getCursor = () => {
    if (selectedTool === 'annotate') return 'crosshair';
    return 'default';
  };

  useKeyboardShortcuts({
    onSelectTool: () => setSelectedTool('select'),
    onAnnotateTool: () => setSelectedTool('annotate'),
    onZoomIn: handleZoomIn,
    onZoomOut: handleZoomOut,
    onDelete: () => {
      if (selectedAnnotationId) {
        handleDeleteAnnotation(selectedAnnotationId);
      }
    }
  });

  return (
    <>
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {/* Toolbar */}
        <div className="border-b p-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <button
              className={`p-2 rounded flex items-center space-x-2 ${
                selectedTool === 'select' 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-slate-100 hover:bg-slate-200'
              }`}
              onClick={() => setSelectedTool('select')}
              title="Select tool (V)"
            >
              <MousePointer size={18} />
              <span className="text-sm">Select</span>
            </button>
            <button
              className={`p-2 rounded flex items-center space-x-2 ${
                selectedTool === 'annotate' 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-slate-100 hover:bg-slate-200'
              }`}
              onClick={() => setSelectedTool('annotate')}
              title="Annotation tool (A)"
            >
              <Square size={18} />
              <span className="text-sm">Annotate</span>
            </button>

            <div className="relative">
              <button
                className="p-2 bg-slate-100 rounded hover:bg-slate-200 flex items-center space-x-1"
                onClick={() => setShowColorPicker(!showColorPicker)}
                title="Annotation color"
              >
                <Palette size={18} />
                <div 
                  className="w-4 h-4 rounded border border-slate-300" 
                  style={{ backgroundColor: annotationColor }}
                />
              </button>
              
              {showColorPicker && (
                <div className="absolute top-12 left-0 z-50 bg-white rounded-lg shadow-lg p-3">
                  <HexColorPicker color={annotationColor} onChange={setAnnotationColor} />
                  <button
                    className="mt-2 w-full text-xs bg-slate-100 rounded py-1 hover:bg-slate-200"
                    onClick={() => setShowColorPicker(false)}
                  >
                    Close
                  </button>
                </div>
              )}
            </div>
            
            <div className="h-6 w-px bg-slate-300 mx-2" />
            
            <button
              className="p-2 bg-slate-100 rounded hover:bg-slate-200"
              onClick={handleZoomIn}
              title="Zoom in (Ctrl +)"
            >
              <ZoomIn size={18} />
            </button>
            <button
              className="p-2 bg-slate-100 rounded hover:bg-slate-200"
              onClick={handleZoomOut}
              title="Zoom out (Ctrl -)"
            >
              <ZoomOut size={18} />
            </button>
            <button
              className="p-2 bg-slate-100 rounded hover:bg-slate-200"
              onClick={handleResetZoom}
              title="Reset zoom"
            >
              <RotateCcw size={18} />
            </button>
            <span className="text-sm text-slate-600 ml-2">
              {Math.round(scale * 100)}%
            </span>

            <div className="h-6 w-px bg-slate-300 mx-2" />

            <button
              className="p-2 bg-green-500 text-white rounded hover:bg-green-600 flex items-center space-x-1"
              onClick={handleDownload}
              title="Download annotated document"
            >
              <Download size={18} />
              <span className="text-sm">Download</span>
            </button>

            {documentId && (
              <>
                <button
                  className="p-2 bg-blue-500 text-white rounded hover:bg-blue-600 flex items-center space-x-1"
                  onClick={handleManualSave}
                  disabled={isSaving}
                  title="Save annotations"
                >
                  <Save size={18} />
                  <span className="text-sm">Save</span>
                </button>

                <div className="flex items-center space-x-2 text-sm text-slate-600">
                  {isSaving ? (
                    <>
                      <Cloud className="animate-pulse" size={16} />
                      <span>Saving...</span>
                    </>
                  ) : saveError ? (
                    <>
                      <CloudOff size={16} className="text-red-500" />
                      <span className="text-red-500">Error saving</span>
                    </>
                  ) : lastSaved ? (
                    <>
                      <Cloud size={16} className="text-green-500" />
                      <span>Saved {lastSaved.toLocaleTimeString()}</span>
                    </>
                  ) : null}
                </div>
              </>
            )}
          </div>
          
          <div className="text-sm text-slate-500">
            {annotations.length} annotation{annotations.length !== 1 ? 's' : ''}
          </div>
        </div>

        {/* Canvas and Annotations Panel */}
        <div className="flex flex-col lg:flex-row">
          {/* Canvas */}
          <div className="flex-1 p-2 md:p-4 bg-slate-50 overflow-auto max-h-[400px] md:max-h-[600px]">
            <div style={{ cursor: getCursor() }}>
              <Stage
                ref={stageRef}
                width={dimensions.width * scale}
                height={dimensions.height * scale}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                scaleX={scale}
                scaleY={scale}
              >
                <Layer>
                  {image && (
                    <KonvaImage
                      image={image}
                      width={dimensions.width}
                      height={dimensions.height}
                    />
                  )}
                  
                  {/* Render annotations */}
                  {annotations.map((annotation) => (
                    <Rect
                      key={annotation.id}
                      id={annotation.id}
                      x={annotation.x}
                      y={annotation.y}
                      width={annotation.width}
                      height={annotation.height}
                      stroke={annotation.color}
                      strokeWidth={2}
                      fill={annotation.color}
                      opacity={0.3}
                      onClick={() => setSelectedAnnotationId(annotation.id)}
                      onTap={() => setSelectedAnnotationId(annotation.id)}
                      draggable={selectedTool === 'select'}
                      onDragEnd={(e) => {
                        const node = e.target;
                        const updatedAnnotations = annotations.map(a => 
                          a.id === annotation.id 
                            ? { ...a, x: node.x(), y: node.y(), isSynced: false }
                            : a
                        );
                        setAnnotations(updatedAnnotations);
                      }}
                    />
                  ))}
                  
                  {/* Drawing preview */}
                  {isDrawing && (
                    <Rect
                      x={newAnnotation.x}
                      y={newAnnotation.y}
                      width={newAnnotation.width}
                      height={newAnnotation.height}
                      stroke="#3b82f6"
                      strokeWidth={2}
                      dash={[5, 5]}
                      fill="rgb(59, 130, 246, 0.1)"
                    />
                  )}
                  
                  <Transformer ref={transformerRef} />
                </Layer>
              </Stage>
            </div>
          </div>

          {/* Annotations Sidebar */}
          <div className="w-full lg:w-80 border-t lg:border-t-0 lg:border-l bg-white p-4">
            <h3 className="font-semibold mb-3 text-slate-900">Annotations</h3>
            <div className="space-y-2 max-h-[500px] overflow-y-auto">
              {annotations.length === 0 ? (
                <p className="text-sm text-slate-500 italic">
                  No annotations yet. Use the Annotate tool to add one.
                </p>
              ) : (
                annotations.map((annotation) => (
                  <div
                    key={annotation.id}
                    className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                      selectedAnnotationId === annotation.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                    onClick={() => setSelectedAnnotationId(annotation.id)}
                  >
                    <div className="flex justify-between items-start mb-1">
                      <p className="text-sm font-medium text-slate-900">
                        {annotation.text}
                      </p>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteAnnotation(annotation.id);
                        }}
                        className="text-red-500 hover:text-red-700"
                        title="Delete annotation"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                    <span className="inline-block px-2 py-1 text-xs rounded-full bg-slate-100 text-slate-600">
                      {annotation.category}
                    </span>
                    <p className="text-xs text-slate-500 mt-1">
                      {annotation.timestamp.toLocaleString()}
                    </p>
                    {!annotation.isSynced && documentId && (
                      <p className="text-xs text-orange-500 mt-1">Unsaved</p>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Annotation Dialog */}
      {showAnnotationDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96">
            <h3 className="text-lg font-semibold mb-4">Add Annotation</h3>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Category
              </label>
              <select
                className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={annotationCategory}
                onChange={(e) => setAnnotationCategory(e.target.value)}
              >
                <option value="general">General Note</option>
                <option value="transcription">Transcription</option>
                <option value="context">Historical Context</option>
                <option value="question">Question</option>
                <option value="important">Important</option>
                <option value="translation">Translation</option>
              </select>
            </div>

            <textarea
              className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={4}
              placeholder="Enter your annotation..."
              value={annotationText}
              onChange={(e) => setAnnotationText(e.target.value)}
              autoFocus
            />
            
            <div className="flex justify-end space-x-2 mt-4">
              <button
                className="px-4 py-2 text-slate-600 hover:text-slate-800"
                onClick={() => {
                  setShowAnnotationDialog(false);
                  setPendingAnnotation(null);
                }}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                onClick={handleAddAnnotation}
              >
                Add Annotation
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}