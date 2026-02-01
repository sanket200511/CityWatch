import { useEffect, useCallback, useRef } from 'react';

const useKeyboard = (shortcuts = {}) => {
    const shortcutsRef = useRef(shortcuts);

    // Keep ref updated without re-registering listener
    useEffect(() => {
        shortcutsRef.current = shortcuts;
    }, [shortcuts]);

    const handleKeyDown = useCallback((event) => {
        // Don't trigger shortcuts when typing in inputs
        const tagName = event.target.tagName.toLowerCase();
        if (tagName === 'input' || tagName === 'textarea' || event.target.isContentEditable) {
            return;
        }

        const key = event.key.toLowerCase();
        const ctrl = event.ctrlKey || event.metaKey;
        const shift = event.shiftKey;
        const alt = event.altKey;

        // Build shortcut key string for modified keys
        let shortcutKey = '';
        if (ctrl) shortcutKey += 'ctrl+';
        if (shift) shortcutKey += 'shift+';
        if (alt) shortcutKey += 'alt+';
        shortcutKey += key;

        const currentShortcuts = shortcutsRef.current;

        // Check for modified shortcut first
        if (currentShortcuts[shortcutKey]) {
            event.preventDefault();
            currentShortcuts[shortcutKey](event);
            return;
        }

        // Check simple key (without modifiers)
        if (!ctrl && !shift && !alt && currentShortcuts[key]) {
            event.preventDefault();
            currentShortcuts[key](event);
        }
    }, []);

    useEffect(() => {
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [handleKeyDown]);
};

export default useKeyboard;
