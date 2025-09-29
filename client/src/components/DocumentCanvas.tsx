'use client';
import { Stage, Layer, Image as KonvaImage, Rect, Transformer } from 'react-konva';
import { useEffect, useState, useRef } from 'react';
import { KonvaEventObject } from 'konva/lib/Node';
import Konva from 'konva';
import { 
  MousePointer, 
  Square, 
  ZoomIn, 
  ZoomOut, 
  RotateCcw, 
  Trash2
} from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { HexColorPicker } from 'react-colorful';
import { Palette } from 'lucide-react';
import { Download } from 'lucide-react';

interface DocumentCanvasProps {
  imageUrl: string;
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
}

export default function DocumentCanvas({ imageUrl }: DocumentCanvasProps) {
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const [selectedTool, setSelectedTool] = useState<'select' | 'annotate'>('select');
  const [selectedAnnotationId, setSelectedAnnotationId] = useState<string | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [newAnnotation, setNewAnnotation] = useState({ x: 0, y: 0, width: 0, height: 0 });
  const [scale, setScale] = useState(1);
  const [showAnnotationDialog, setShowAnnotationDialog] = useState(false);
  const [pendingAnnotation, setPendingAnnotation] = useState<{ x: number; y: number; width: number; height: number } | null>(null);
  const [annotationText, setAnnotationText] = useState('');
  
  const stageRef = useRef<Konva.Stage>(null);
  const transformerRef = useRef<Konva.Transformer>(null);
  const [annotationCategory, setAnnotationCategory] = useState('general');



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

  // Handle selection
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

  const [annotationColor, setAnnotationColor] = useState('#facc15'); // Default yellow
  const [showColorPicker, setShowColorPicker] = useState(false);

  const handleMouseDown = (e: KonvaEventObject<MouseEvent>) => {
    // Deselect when clicking on empty area
    const clickedOnEmpty = e.target === e.target.getStage();
    if (clickedOnEmpty) {
      setSelectedAnnotationId(null);
    }

    if (selectedTool !== 'annotate') return;
    
    const stage = e.target.getStage();
    if (!stage) return;
    
    const pos = stage.getPointerPosition();
    if (!pos) return;
    
    // Adjust for scale
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
    
    // Only create annotation if it has meaningful size
    if (Math.abs(newAnnotation.width) > 10 && Math.abs(newAnnotation.height) > 10) {
      // Normalize rectangle (handle negative width/height)
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

  const handleAddAnnotation = () => {
    if (pendingAnnotation && annotationText.trim()) {
    const annotation: Annotation = {
      id: uuidv4(),
      x: pendingAnnotation.x,
      y: pendingAnnotation.y,
      width: pendingAnnotation.width,
      height: pendingAnnotation.height,
      text: annotationText,
      timestamp: new Date(),
      color: annotationColor, // Add this
      category: annotationCategory
    };
    
    setAnnotations([...annotations, annotation]);
    setShowAnnotationDialog(false);
    setPendingAnnotation(null);
    setSelectedTool('select');
    }
  };

  const handleDeleteAnnotation = (id: string) => {
    setAnnotations(annotations.filter(a => a.id !== id));
    setSelectedAnnotationId(null);
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

  const getCursor = () => {
    if (selectedTool === 'annotate') return 'crosshair';
    return 'default';
  };



  // Keyboard shortcuts
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

  const handleDownload = () => {
  const stage = stageRef.current;
  if (!stage) return;
  
  // Get the data URL of the canvas
  const dataURL = stage.toDataURL({
    pixelRatio: 2 // Higher quality
  });
  
  // Create download link
  const link = document.createElement('a');
  link.download = `annotated-document-${Date.now()}.png`;
  link.href = dataURL;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

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
              title="Select tool"
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
              title="Annotation tool"
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
              title="Zoom in"
            >
              <ZoomIn size={18} />
            </button>
            <button
              className="p-2 bg-slate-100 rounded hover:bg-slate-200"
              onClick={handleZoomOut}
              title="Zoom out"
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

            {/* Download Button */}
<button
  className="p-2 bg-green-500 text-white rounded hover:bg-green-600 flex items-center space-x-1"
  onClick={handleDownload}
  title="Download annotated document"
>
  <Download size={18} />
  <span className="text-sm">Download</span>
</button>

            <span className="text-sm text-slate-600 ml-2">
              {Math.round(scale * 100)}%
            </span>
          </div>
          
          <div className="text-sm text-slate-500">
            {annotations.length} annotation{annotations.length !== 1 ? 's' : ''}
          </div>
        </div>

        {/* Canvas and Annotations Panel */}
        <div className="lex flex-col lg:flex-row">
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
    stroke={annotation.color} // Changed
    strokeWidth={2}
    fill={annotation.color} // Changed
    opacity={0.3}
    onClick={() => setSelectedAnnotationId(annotation.id)}
    onTap={() => setSelectedAnnotationId(annotation.id)}
    draggable={selectedTool === 'select'}
    onDragEnd={(e) => {
      const node = e.target;
      const updatedAnnotations = annotations.map(a => 
        a.id === annotation.id 
          ? { ...a, x: node.x(), y: node.y() }
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

          {/* Annotations Sidebar - hidden on mobile by default*/}
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
                      {/* In the annotation card in sidebar, add after the text */}
<span className="inline-block px-2 py-1 text-xs rounded-full bg-slate-100 text-slate-600 mt-2">
  {annotation.category}
</span>
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
                    <p className="text-xs text-slate-500">
                      {annotation.timestamp.toLocaleString()}
                    </p>
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