"use client";
// import dynamic from 'next/dynamic';
import { useEffect, useRef } from 'react';
import { Editor, EditorEventType, invertCommand, SerializableCommand } from 'js-draw';
import axios from 'axios';
import { useParams } from 'next/navigation';

export default function DrawingBoard(userId: any) {
  const editorRef = useRef<HTMLDivElement>(null);
  const editorInstance = useRef<Editor | null>(null);
  const params = useParams();
  useEffect(() => {
    // Prevent double init (StrictMode fix in dev)
    if (editorInstance.current) return;
    const ws = new WebSocket("ws://localhost:8080");
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

      let strokeStorage: any[] = [];
      let hasChanged = false;

      // Fetch and apply strokes on mount
      (async () => {
        try {
          ws.onopen = () => {
            ws.send(
              JSON.stringify({
                type: "join",
                payload: {
                  "roomId": params.roomId,
                  "userId": userId
                }
              })
            )
          }
          const response = await axios.get('/api/room/strokes', {
            params: { roomId: params.roomId },
          });
          const strokesFromDB = response.data.strokeData;
          if (Array.isArray(strokesFromDB)) {
            strokeStorage = strokesFromDB;
            strokesFromDB.forEach((x) => {
              const command = SerializableCommand.deserialize(x, editor);
              command.apply(editor);
            });
          }
        } catch (err) {
          console.error("Failed to load strokes:", err);
        }
      })();

      const applySerializedCommand = (serializedCommand: any) => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(
            JSON.stringify({
              type: "stroke",
              payload: {
                "roomId": params.roomId,
                "userId": userId,
                "message": serializedCommand
              }
            })
          );
        } else {
          ws.addEventListener('open', () => {
            ws.send(
              JSON.stringify({
                type: "stroke",
                payload: {
                  "roomId": params.roomId,
                  "userId": userId,
                  "message": serializedCommand
                }
              })
            );
          }, { once: true });
        }
      };
      const applyCommandsToOthers = (sourceEditor: Editor) => {
        sourceEditor.notifier.on(EditorEventType.CommandDone, (evt) => {
          console.log('Command done:', evt);
          console.log(strokeStorage);
          if (evt.kind !== EditorEventType.CommandDone) {
            throw new Error('Incorrect event type');
          }

          if (evt.command instanceof SerializableCommand) {
            const serializedCommand = evt.command.serialize();
            strokeStorage.push(serializedCommand);
            hasChanged = true; // Mark as changed
            applySerializedCommand(serializedCommand);
          } else {
            console.log('Nonserializable command');
          }
        });
        sourceEditor.notifier.on(EditorEventType.CommandUndone, (evt) => {
          // Type assertion.
          if (evt.kind !== EditorEventType.CommandUndone) {
            throw new Error('Incorrect event type');
          }

          if (evt.command instanceof SerializableCommand) {
            const serializedCommand = invertCommand(evt.command).serialize();
            strokeStorage = strokeStorage.filter((c) => c.id !== serializedCommand.id);
            hasChanged = true; // Mark as changed
            applySerializedCommand(serializedCommand);
          } else {
            console.log('Nonserializable command');
          }
        });
      };
      applyCommandsToOthers(editor);
      setInterval(async () => {
        if (hasChanged) {
          try {
            const response = await axios.put('/api/room/strokes', {
              strokeData: strokeStorage,
              roomId: params.roomId,
            });
            console.log('Full API response:', response.data);
            const strokesFromDB = response.data.strokeData;
            if (Array.isArray(strokesFromDB)) {
              strokeStorage = strokesFromDB;
              strokeStorage.forEach((x) => {
                const command = SerializableCommand.deserialize(x, editor);
                command.apply(editor);
              });
              hasChanged = false; // Reset flag after successful save
            } else {
              console.warn("Server did not return strokes array:", response.data);
            }
          } catch (err) {
            console.error("API error:", err);
          }
        }
      }, 5000);
      ws.onmessage = (event) => {
        const msg = JSON.parse(event.data);
        const command = SerializableCommand.deserialize(msg.message, editor);
        command.apply(editor);
      }
      return () => {
        window.removeEventListener('resize', handleResize);
        if (editorRef.current) {
          // eslint-disable-next-line react-hooks/exhaustive-deps
          editorRef.current.innerHTML = '';
        }
      };
    }
  }, []);

  useEffect(() => {

  }, [])

  return <div ref={editorRef}></div>;
}
