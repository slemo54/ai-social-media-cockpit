'use client';

import React, { useRef, useEffect, useCallback, useState } from 'react';
import { Bold, Italic, List, Heading, RemoveFormatting } from 'lucide-react';

interface RichTextEditorProps {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
}

export function RichTextEditor({ value, onChange, placeholder }: RichTextEditorProps) {
    const editorRef = useRef<HTMLDivElement>(null);
    const [isFocused, setIsFocused] = useState(false);

    // Convert plain text to HTML initially if value doesn't contain HTML tags
    const formatInitialValue = (val: string) => {
        if (!val) return '';
        if (!val.includes('<') && val.includes('\n')) {
            return val.replace(/\n/g, '<br/>');
        }
        return val;
    };

    useEffect(() => {
        if (editorRef.current && document.activeElement !== editorRef.current) {
            const formatted = formatInitialValue(value);
            if (editorRef.current.innerHTML !== formatted) {
                editorRef.current.innerHTML = formatted;
            }
        }
    }, [value]);

    const handleInput = useCallback(() => {
        if (editorRef.current) {
            onChange(editorRef.current.innerHTML);
        }
    }, [onChange]);

    const executeCommand = (command: string, arg?: string) => {
        document.execCommand(command, false, arg);
        editorRef.current?.focus();
        handleInput();
    };

    return (
        <div className={`flex flex-col border rounded-xl overflow-hidden transition-all duration-300 ${isFocused ? 'border-[#003366] shadow-[0_0_0_2px_rgba(0,51,102,0.2)]' : 'border-[#262626] bg-[#0F0F0F]/50'}`}>
            {/* Toolbar */}
            <div className="flex items-center gap-1 p-2 border-b border-[#262626] bg-[#1A1A1A]/80 backdrop-blur-sm">
                <button
                    type="button"
                    onClick={() => executeCommand('bold')}
                    className="p-1.5 text-[#A3A3A3] hover:text-[#FAFAFA] hover:bg-[#262626] rounded-md transition-colors"
                    title="Grassetto"
                >
                    <Bold className="w-4 h-4" />
                </button>
                <button
                    type="button"
                    onClick={() => executeCommand('italic')}
                    className="p-1.5 text-[#A3A3A3] hover:text-[#FAFAFA] hover:bg-[#262626] rounded-md transition-colors"
                    title="Corsivo"
                >
                    <Italic className="w-4 h-4" />
                </button>
                <div className="w-px h-4 bg-[#333333] mx-1" />
                <button
                    type="button"
                    onClick={() => executeCommand('insertUnorderedList')}
                    className="p-1.5 text-[#A3A3A3] hover:text-[#FAFAFA] hover:bg-[#262626] rounded-md transition-colors"
                    title="Elenco Puntato"
                >
                    <List className="w-4 h-4" />
                </button>
                <button
                    type="button"
                    onClick={() => executeCommand('formatBlock', 'H3')}
                    className="p-1.5 text-[#A3A3A3] hover:text-[#FAFAFA] hover:bg-[#262626] rounded-md transition-colors"
                    title="Intestazione"
                >
                    <Heading className="w-4 h-4" />
                </button>
                <button
                    type="button"
                    onClick={() => executeCommand('removeFormat')}
                    className="p-1.5 text-[#A3A3A3] hover:text-[#FAFAFA] hover:bg-[#262626] rounded-md transition-colors ml-auto"
                    title="Rimuovi Formattazione"
                >
                    <RemoveFormatting className="w-4 h-4" />
                </button>
            </div>

            {/* Editor Area */}
            <div
                ref={editorRef}
                contentEditable
                onInput={handleInput}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                className="p-4 min-h-[150px] max-h-[400px] overflow-y-auto w-full outline-none text-[#FAFAFA] text-[13px] leading-relaxed relative"
                style={{
                    emptyCells: 'show',
                    fontFamily: 'inherit'
                }}
            />
        </div>
    );
}
