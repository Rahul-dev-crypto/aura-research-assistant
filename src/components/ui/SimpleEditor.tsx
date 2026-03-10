"use client";

import { useState, useRef } from "react";

interface SimpleEditorProps {
    value: string;
    onChange: (value: string) => void;
}

export default function SimpleEditor({ value, onChange }: SimpleEditorProps) {
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const applyFormatting = (type: 'bold' | 'italic' | 'strikethrough' | 'h1' | 'h2' | 'h3' | 'bullet' | 'number') => {
        const textarea = textareaRef.current;
        if (!textarea) return;

        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const selectedText = value.substring(start, end);
        
        if (!selectedText && (type === 'bold' || type === 'italic' || type === 'strikethrough')) {
            alert('Please select text first to apply formatting');
            return;
        }

        let before = '';
        let after = '';
        let newText = '';

        switch (type) {
            case 'bold':
                before = '**';
                after = '**';
                newText = value.substring(0, start) + before + selectedText + after + value.substring(end);
                break;
            case 'italic':
                before = '*';
                after = '*';
                newText = value.substring(0, start) + before + selectedText + after + value.substring(end);
                break;
            case 'strikethrough':
                before = '~~';
                after = '~~';
                newText = value.substring(0, start) + before + selectedText + after + value.substring(end);
                break;
            case 'h1':
                const lineStart1 = value.lastIndexOf('\n', start - 1) + 1;
                newText = value.substring(0, lineStart1) + '# ' + value.substring(lineStart1);
                break;
            case 'h2':
                const lineStart2 = value.lastIndexOf('\n', start - 1) + 1;
                newText = value.substring(0, lineStart2) + '## ' + value.substring(lineStart2);
                break;
            case 'h3':
                const lineStart3 = value.lastIndexOf('\n', start - 1) + 1;
                newText = value.substring(0, lineStart3) + '### ' + value.substring(lineStart3);
                break;
            case 'bullet':
                const lineStartB = value.lastIndexOf('\n', start - 1) + 1;
                newText = value.substring(0, lineStartB) + '- ' + value.substring(lineStartB);
                break;
            case 'number':
                const lineStartN = value.lastIndexOf('\n', start - 1) + 1;
                newText = value.substring(0, lineStartN) + '1. ' + value.substring(lineStartN);
                break;
        }
        
        onChange(newText);
        
        setTimeout(() => {
            textarea.focus();
            if (type === 'bold' || type === 'italic' || type === 'strikethrough') {
                textarea.setSelectionRange(start + before.length, end + before.length);
            }
        }, 0);
    };

    const changeFontSize = (size: string) => {
        if (textareaRef.current) {
            textareaRef.current.style.fontSize = size;
        }
    };

    return (
        <div className="bg-white mx-auto shadow-2xl relative" style={{
            width: "100%", maxWidth: "816px", minHeight: "1056px", color: "black", padding: "40px"
        }}>
            {/* Toolbar */}
            <div className="sticky top-0 z-10 bg-gray-100 p-3 rounded-lg mb-4 flex flex-wrap gap-2 items-center border border-gray-300">
                {/* Font Size */}
                <select 
                    onChange={(e) => changeFontSize(e.target.value)}
                    className="px-2 py-1 border border-gray-300 rounded text-sm bg-white [&>option]:bg-white [&>option]:text-black"
                    defaultValue="12pt"
                >
                    <option value="10pt" className="bg-white text-black">10pt</option>
                    <option value="11pt" className="bg-white text-black">11pt</option>
                    <option value="12pt" className="bg-white text-black">12pt</option>
                    <option value="14pt" className="bg-white text-black">14pt</option>
                    <option value="16pt" className="bg-white text-black">16pt</option>
                    <option value="18pt">18pt</option>
                </select>

                <div className="w-px h-6 bg-gray-300"></div>

                {/* Formatting Buttons */}
                <button
                    onClick={() => applyFormatting('bold')}
                    className="px-3 py-1 bg-white border border-gray-300 rounded hover:bg-gray-50 font-bold text-sm"
                    title="Bold (select text first)"
                >
                    B
                </button>
                <button
                    onClick={() => applyFormatting('italic')}
                    className="px-3 py-1 bg-white border border-gray-300 rounded hover:bg-gray-50 italic text-sm"
                    title="Italic (select text first)"
                >
                    I
                </button>
                <button
                    onClick={() => applyFormatting('strikethrough')}
                    className="px-3 py-1 bg-white border border-gray-300 rounded hover:bg-gray-50 line-through text-sm"
                    title="Strikethrough (select text first)"
                >
                    S
                </button>

                <div className="w-px h-6 bg-gray-300"></div>

                {/* Headers */}
                <button
                    onClick={() => applyFormatting('h1')}
                    className="px-3 py-1 bg-white border border-gray-300 rounded hover:bg-gray-50 text-sm font-bold"
                    title="Heading 1"
                >
                    H1
                </button>
                <button
                    onClick={() => applyFormatting('h2')}
                    className="px-3 py-1 bg-white border border-gray-300 rounded hover:bg-gray-50 text-sm font-bold"
                    title="Heading 2"
                >
                    H2
                </button>
                <button
                    onClick={() => applyFormatting('h3')}
                    className="px-3 py-1 bg-white border border-gray-300 rounded hover:bg-gray-50 text-sm font-bold"
                    title="Heading 3"
                >
                    H3
                </button>

                <div className="w-px h-6 bg-gray-300"></div>

                {/* Lists */}
                <button
                    onClick={() => applyFormatting('bullet')}
                    className="px-3 py-1 bg-white border border-gray-300 rounded hover:bg-gray-50 text-sm"
                    title="Bullet List"
                >
                    • List
                </button>
                <button
                    onClick={() => applyFormatting('number')}
                    className="px-3 py-1 bg-white border border-gray-300 rounded hover:bg-gray-50 text-sm"
                    title="Numbered List"
                >
                    1. List
                </button>
            </div>

            {/* Editor */}
            <textarea
                ref={textareaRef}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className="w-full min-h-[800px] p-4 border border-gray-300 rounded resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                style={{
                    fontFamily: '"Times New Roman", Times, serif',
                    fontSize: '12pt',
                    lineHeight: '1.5',
                    color: 'black'
                }}
                placeholder="Start editing your document..."
            />

            {/* Help Text */}
            <div className="mt-4 text-xs text-gray-600 bg-gray-50 p-3 rounded">
                <strong>Markdown Tips:</strong>
                <ul className="mt-2 space-y-1 ml-4">
                    <li>• Select text and click B for **bold**</li>
                    <li>• Select text and click I for *italic*</li>
                    <li>• # Heading 1, ## Heading 2, ### Heading 3</li>
                    <li>• - item for bullet lists</li>
                    <li>• 1. item for numbered lists</li>
                </ul>
            </div>
        </div>
    );
}
