"use client";

import { useEffect, useRef } from 'react';
import Editor, { EditorEventType, invertCommand, SerializableCommand } from 'js-draw';
import 'js-draw/styles';
import { useParams } from 'next/navigation';
import axios from 'axios';

interface DrawingBoardProps {
  userId: string;
}

interface StoredStroke {
  id?: string;
  [key: string]: unknown;
}

function getWsUrl(): string {
  if (process.env.NEXT_PUBLIC_WS_URL) {
    if (typeof window !== "undefined") {
      try {
        const parsed = new URL(process.env.NEXT_PUBLIC_WS_URL);
        if (parsed.hostname === "localhost" && window.location.hostname !== "localhost") {
          parsed.hostname = window.location.hostname;
          return parsed.toString();
        }
      } catch {
        // use default
      }
    }
    return process.env.NEXT_PUBLIC_WS_URL;
  }
  const host = typeof window !== "undefined" ? window.location.hostname : "localhost";
  return `ws://${host}:3001`;
}

export default function DrawingBoard({ userId }: DrawingBoardProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const editorInstance = useRef<Editor | null>(null);
  const isApplyingRemoteCommand = useRef<boolean>(false);
  const params = useParams();

  useEffect(() => {
    // Prevent double init (StrictMode fix in dev)
    if (editorInstance.current) return;
    const container = editorRef.current;

    if (container) {
      // Set full-screen dimensions before initializing
      container.style.position = 'fixed';
      container.style.top = '0';
      container.style.left = '0';
      container.style.width = `${window.innerWidth}px`;
      container.style.height = `${window.innerHeight}px`;

      const editor = new Editor(container);
      editor.addToolbar();
      editor.getRootElement().style.width = '100%';
      editor.getRootElement().style.height = '100%';
      editorInstance.current = editor;

      // Auto-resize
      const addToHistory = false;
      editor.dispatch(editor.setBackgroundStyle({ autoresize: true }), addToHistory);

      const handleResize = () => {
        container.style.width = `${window.innerWidth}px`;
        container.style.height = `${window.innerHeight}px`;
      };

      window.addEventListener('resize', handleResize);

      let strokeStorage: StoredStroke[] = [];
      let hasChanged = false;
      let isCleanedUp = false;
      let ws: WebSocket | null = null;
      let reconnectTimer: ReturnType<typeof setTimeout> | null = null;

      const sendJoin = () => {
        if (ws && ws.readyState === WebSocket.OPEN) {
          ws.send(
            JSON.stringify({
              type: "join",
              payload: {
                roomId: params.roomId,
                userId: userId,
              },
            })
          );
        }
      };

      const setupWs = () => {
        if (isCleanedUp) return;
        try {
          const wsUrl = getWsUrl();
          ws = new WebSocket(wsUrl);

          ws.onopen = () => {
            console.log("Whiteboard WebSocket connected");
            sendJoin();
          };

          ws.onmessage = (event) => {
            try {
              const msg = JSON.parse(event.data);
              if (msg.type !== "stroke") return;

              const strokePayload = msg.payload?.message ?? msg.message;
              if (!strokePayload) return;

              isApplyingRemoteCommand.current = true;
              const command = SerializableCommand.deserialize(strokePayload, editor);
              command.apply(editor);
              strokeStorage.push(strokePayload as StoredStroke);
            } catch (err) {
              console.warn("Failed to apply remote stroke:", err);
            } finally {
              isApplyingRemoteCommand.current = false;
            }
          };

          ws.onclose = () => {
            if (!isCleanedUp) {
              reconnectTimer = setTimeout(setupWs, 2000);
            }
          };

          ws.onerror = () => {
            if (ws && ws.readyState === WebSocket.OPEN) {
              ws.close();
            }
          };
        } catch {
          if (!isCleanedUp) {
            reconnectTimer = setTimeout(setupWs, 2000);
          }
        }
      };

      setupWs();

      // Fetch and apply strokes on mount
      (async () => {
        try {
          const response = await axios.get('/api/room/strokes', {
            params: { roomId: params.roomId },
          });
          const strokesFromDB = response.data.strokeData;
          if (Array.isArray(strokesFromDB)) {
            strokeStorage = strokesFromDB as StoredStroke[];
            isApplyingRemoteCommand.current = true;
            strokesFromDB.forEach((x) => {
              try {
                const command = SerializableCommand.deserialize(x, editor);
                command.apply(editor);
              } catch (deserializeErr) {
                console.warn("Failed to deserialize initial stroke:", deserializeErr);
              }
            });
            isApplyingRemoteCommand.current = false;
          }
        } catch (err) {
          console.error("Failed to load initial strokes:", err);
          isApplyingRemoteCommand.current = false;
        }
      })();

      const applySerializedCommand = (serializedCommand: unknown) => {
        const payload = JSON.stringify({
          type: "stroke",
          payload: {
            roomId: params.roomId,
            userId: userId,
            message: serializedCommand,
          },
        });

        if (ws && ws.readyState === WebSocket.OPEN) {
          ws.send(payload);
        }
      };

      const applyCommandsToOthers = (sourceEditor: Editor) => {
        sourceEditor.notifier.on(EditorEventType.CommandDone, (evt) => {
          if (isApplyingRemoteCommand.current) return;
          if (evt.kind !== EditorEventType.CommandDone) return;

          if (evt.command instanceof SerializableCommand) {
            const serializedCommand = evt.command.serialize() as StoredStroke;
            strokeStorage.push(serializedCommand);
            hasChanged = true;
            applySerializedCommand(serializedCommand);
          }
        });

        sourceEditor.notifier.on(EditorEventType.CommandUndone, (evt) => {
          if (isApplyingRemoteCommand.current) return;
          if (evt.kind !== EditorEventType.CommandUndone) return;

          if (evt.command instanceof SerializableCommand) {
            const serializedCommand = invertCommand(evt.command).serialize() as StoredStroke;
            strokeStorage = strokeStorage.filter(
              (c) => c.id !== serializedCommand.id
            );
            hasChanged = true;
            applySerializedCommand(serializedCommand);
          }
        });
      };

      applyCommandsToOthers(editor);

      // Auto-save changed strokes to database
      const saveInterval = setInterval(async () => {
        if (hasChanged) {
          try {
            await axios.put('/api/room/strokes', {
              strokeData: strokeStorage,
              roomId: params.roomId,
            });
            hasChanged = false;
          } catch (err) {
            console.error("Auto-save stroke API error:", err);
          }
        }
      }, 5000);

      return () => {
        isCleanedUp = true;
        if (reconnectTimer) clearTimeout(reconnectTimer);
        clearInterval(saveInterval);
        window.removeEventListener('resize', handleResize);
        if (ws && (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING)) {
          ws.close();
        }
        if (container) {
          container.innerHTML = '';
        }
        editorInstance.current = null;
      };
    }
  }, [userId, params.roomId]);

  return <div ref={editorRef} />;
}
