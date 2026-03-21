import { useEffect, useRef, useCallback } from 'react';
import { initSocket } from '../socket';
import ACTIONS from '../actions';

/**
 * Manages socket lifecycle: join, client list, typing, disconnect.
 * CODE_CHANGE is intentionally NOT handled here — Editor.js owns that listener
 * to avoid double-firing.
 */
export function useSocket({ roomId, username, onClientsUpdate, onTyping }) {
    const socketRef = useRef(null);

    useEffect(() => {
        let mounted = true;

        const init = async () => {
            socketRef.current = await initSocket();

            socketRef.current.on('connect_error', () => {
                if (mounted) onClientsUpdate(null);
            });

            socketRef.current.emit(ACTIONS.JOIN, { roomId, username });

            socketRef.current.on(ACTIONS.JOINED, ({ clients, username: joinedUser, socketId }) => {
                if (!mounted) return;

                // Deduplicate by username
                const seen = new Set();
                const unique = clients.filter(c => {
                    if (seen.has(c.username)) return false;
                    seen.add(c.username);
                    return true;
                });

                onClientsUpdate(unique, joinedUser !== username ? joinedUser : null);

                // Sync current code snapshot to the newly joined socket
                socketRef.current.emit(ACTIONS.SYNC_CODE, {
                    socketId,
                    code: socketRef.current._codeSnapshot || '',
                });
            });

            socketRef.current.on(ACTIONS.DISCONNECTED, ({ socketId, username: leftUser }) => {
                if (!mounted) return;
                onClientsUpdate({ remove: socketId }, leftUser);
            });

            socketRef.current.on(ACTIONS.TYPING, ({ username: typingUser, isTyping }) => {
                if (mounted && onTyping) onTyping(typingUser, isTyping);
            });
        };

        init();

        return () => {
            mounted = false;
            if (socketRef.current) {
                socketRef.current.off(ACTIONS.JOINED);
                socketRef.current.off(ACTIONS.DISCONNECTED);
                socketRef.current.off(ACTIONS.TYPING);
                socketRef.current.disconnect();
            }
        };
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    const setCodeSnapshot = useCallback((code) => {
        if (socketRef.current) socketRef.current._codeSnapshot = code;
    }, []);

    return { socketRef, setCodeSnapshot };
}
