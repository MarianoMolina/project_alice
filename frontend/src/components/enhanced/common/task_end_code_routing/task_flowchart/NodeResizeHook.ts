import { useCallback, useRef, useState } from 'react';

interface NodeSize {
  width: number;
  height: number;
}

export const useNodeResizing = () => {
  const [nodeSizes, setNodeSizes] = useState(new Map<string, NodeSize>());
  const observers = useRef(new Map<string, ResizeObserver>());
  
  const nodeRef = useCallback((element: HTMLElement | null, nodeId: string) => {
    // Clean up old observer if it exists
    if (observers.current.has(nodeId)) {
      observers.current.get(nodeId)?.disconnect();
      observers.current.delete(nodeId);
    }

    if (element) {
      const observer = new ResizeObserver(entries => {
        const entry = entries[0];
        setNodeSizes(prev => new Map(prev).set(nodeId, {
          width: entry.contentRect.width,
          height: entry.contentRect.height
        }));
      });
      
      observer.observe(element);
      observers.current.set(nodeId, observer);
    }
  }, []);

  const cleanupObservers = useCallback(() => {
    observers.current.forEach(observer => observer.disconnect());
    observers.current.clear();
    setNodeSizes(new Map());
  }, []);

  return {
    nodeRef,
    nodeSizes,
    cleanupObservers
  };
};