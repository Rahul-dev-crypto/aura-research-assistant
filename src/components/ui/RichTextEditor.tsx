import dynamic from 'next/dynamic';
import 'react-quill/dist/quill.snow.css';
import { useEffect, useRef } from 'react';

const ReactQuill = dynamic(
    async () => {
        const { default: RQ } = await import("react-quill");
        return RQ;
    },
    { 
        ssr: false, 
        loading: () => <div className="p-8 text-[#999999]">Loading editor...</div> 
    }
);

const modules = {
    toolbar: [
        [{ 'font': ['serif', 'sans-serif', 'monospace'] }],
        [{ 'size': ['small', false, 'large', 'huge'] }],
        [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
        ['bold', 'italic', 'underline', 'strike'],
        [{ 'color': [] }, { 'background': [] }],
        [{ 'list': 'ordered' }, { 'list': 'bullet' }],
        [{ 'indent': '-1' }, { 'indent': '+1' }],
        [{ 'align': [] }],
        ['blockquote', 'code-block'],
        ['link'],
        ['clean']
    ],
};

const formats = [
    'font', 'size', 'header',
    'bold', 'italic', 'underline', 'strike',
    'color', 'background',
    'list', 'bullet',
    'indent', 'align',
    'blockquote', 'code-block',
    'link'
];

interface RichTextEditorProps {
    value: string;
    onChange: (value: string) => void;
}

export default function RichTextEditor({ value, onChange }: RichTextEditorProps) {
    const quillRef = useRef<any>(null);

    return (
        <div className="bg-white mx-auto shadow-2xl relative" style={{
            width: "100%", maxWidth: "816px", minHeight: "1056px", color: "black", padding: "40px"
        }}>
            <style jsx global>{`
                .ql-editor { 
                    font-family: 'Times New Roman', Times, serif !important; 
                    font-size: 12pt !important; 
                    line-height: 1.5 !important;
                    color: black !important;
                    min-height: 800px !important;
                }
                .ql-editor h1 { 
                    font-size: 18pt !important;
                    font-weight: bold !important;
                    color: black !important;
                    margin-top: 24pt !important;
                    margin-bottom: 12pt !important;
                }
                .ql-editor h2 { 
                    font-size: 14pt !important;
                    font-weight: bold !important;
                    color: black !important;
                    margin-top: 18pt !important;
                    margin-bottom: 8pt !important;
                }
                .ql-editor h3 { 
                    font-size: 12pt !important;
                    font-weight: bold !important;
                    color: black !important;
                    margin-top: 14pt !important;
                    margin-bottom: 6pt !important;
                }
                .ql-editor p {
                    margin-bottom: 10pt !important;
                }
                .ql-editor strong {
                    font-weight: bold !important;
                }
                .ql-editor em {
                    font-style: italic !important;
                }
                .ql-toolbar.ql-snow {
                    border: none !important;
                    background: #f9f9f9 !important;
                    position: sticky !important;
                    top: 0 !important;
                    z-index: 10 !important;
                    box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1) !important;
                    border-radius: 8px 8px 0 0 !important;
                    margin-bottom: 24px !important;
                    padding: 12px !important;
                }
                .ql-container.ql-snow {
                    border: none !important;
                }
                .ql-toolbar button {
                    margin: 2px !important;
                }
                .ql-toolbar .ql-picker {
                    margin: 2px !important;
                }
            `}</style>

            <ReactQuill
                theme="snow"
                value={value}
                onChange={onChange}
                modules={modules}
                formats={formats}
                placeholder="Start editing your document..."
            />
        </div>
    );
}
