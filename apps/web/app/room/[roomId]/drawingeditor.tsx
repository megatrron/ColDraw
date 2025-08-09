// import dynamic from 'next/dynamic';
import { useEffect, useRef } from 'react';
import Editor from 'js-draw';

export default function DrawingBoard() {
  const editorRef = useRef<HTMLDivElement>(null);
  const editorInstance = useRef<Editor | null>(null);

  useEffect(() => {
    // Prevent double init (StrictMode fix in dev)
    if (editorInstance.current) return;

    if (editorRef.current) {
      // Set full-screen dimensions before initializing
      editorRef.current.style.position = 'fixed';
      editorRef.current.style.top = '0';
      editorRef.current.style.left = '0';
      editorRef.current.style.width = `${window.innerWidth}px`;
      editorRef.current.style.height = `${window.innerHeight}px`;

      const editor = new Editor(editorRef.current);
      editor.addToolbar();
      editor.getRootElement().style.width = '100%';
      editor.getRootElement().style.height = '100%';
      console.log("Editor initialized:", editor);
      editorInstance.current = editor;

      // Auto-resize
      const addToHistory = false;
      editor.dispatch(editor.setBackgroundStyle({ autoresize: true }), addToHistory);

      const handleResize = () => {
        if (editorRef.current) {
          editorRef.current.style.width = `${window.innerWidth}px`;
          editorRef.current.style.height = `${window.innerHeight}px`;
        }
      };

      window.addEventListener('resize', handleResize);

      return () => {
        window.removeEventListener('resize', handleResize);
        if (editorRef.current) {
          // eslint-disable-next-line react-hooks/exhaustive-deps
          editorRef.current.innerHTML = '';
        }
      };
    }
  }, []);

  return <div ref={editorRef}></div>;
}
