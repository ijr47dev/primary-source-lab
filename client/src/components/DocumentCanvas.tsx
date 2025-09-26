'use client';
import { Stage, Layer, Image as KonvaImage } from 'react-konva';
import { useEffect, useState } from 'react';

// Define the props interface - this was missing!
interface DocumentCanvasProps {
  imageUrl: string;
}

export default function DocumentCanvas({ imageUrl }: DocumentCanvasProps) {
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });

  useEffect(() => {
    const img = new window.Image();
    img.src = imageUrl;
    img.onload = () => {
      setImage(img);
      // Scale image to fit container
      const maxWidth = 1200;
      const scale = maxWidth / img.width;
      setDimensions({
        width: Math.min(img.width, maxWidth),
        height: img.height * (img.width > maxWidth ? scale : 1)
      });
    };
  }, [imageUrl]);

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="border-b p-4 flex items-center space-x-4">
        <button className="px-4 py-2 bg-slate-100 rounded hover:bg-slate-200">
          Zoom In
        </button>
        <button className="px-4 py-2 bg-slate-100 rounded hover:bg-slate-200">
          Zoom Out
        </button>
        <button className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
          Add Annotation
        </button>
      </div>
      
      <div className="p-4">
        <Stage width={dimensions.width} height={dimensions.height}>
          <Layer>
            {image && (
              <KonvaImage
                image={image}
                width={dimensions.width}
                height={dimensions.height}
              />
            )}
          </Layer>
        </Stage>
      </div>
    </div>
  );
}