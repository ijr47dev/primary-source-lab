import { useEffect } from 'react';

interface ShortcutHandlers {
  onSelectTool?: () => void;
  onAnnotateTool?: () => void;
  onZoomIn?: () => void;
  onZoomOut?: () => void;
  onDelete?: () => void;
}

export function useKeyboardShortcuts(handlers: ShortcutHandlers) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is typing in an input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      switch(e.key.toLowerCase()) {
        case 'v':
        case 'escape':
          handlers.onSelectTool?.();
          break;
        case 'a':
          handlers.onAnnotateTool?.();
          break;
        case '=':
        case '+':
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            handlers.onZoomIn?.();
          }
          break;
        case '-':
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            handlers.onZoomOut?.();
          }
          break;
        case 'delete':
        case 'backspace':
          handlers.onDelete?.();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handlers]);
}