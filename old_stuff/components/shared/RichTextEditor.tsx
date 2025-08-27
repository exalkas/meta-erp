"use client";

import { useMemo } from "react";
import dynamic from "next/dynamic";
import "react-quill/dist/quill.snow.css";

// Dynamically import ReactQuill to avoid SSR issues
const ReactQuill = dynamic(() => import("react-quill"), { ssr: false });

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  height?: string;
  error?: string;
  disabled?: boolean;
}

export default function RichTextEditor({
  value,
  onChange,
  placeholder = "Write your content here...",
  height = "200px",
  error,
  disabled = false,
}: RichTextEditorProps) {
  const modules = useMemo(
    () => ({
      toolbar: [
        [{ header: [1, 2, 3, false] }],
        ["bold", "italic", "underline", "strike"],
        [{ color: [] }, { background: [] }],
        [{ list: "ordered" }, { list: "bullet" }],
        [{ indent: "-1" }, { indent: "+1" }],
        ["blockquote", "code-block"],
        ["link"],
        ["clean"],
      ],
      clipboard: {
        matchVisual: false,
      },
    }),
    []
  );

  const formats = [
    "header",
    "bold",
    "italic",
    "underline",
    "strike",
    "color",
    "background",
    "list",
    "bullet",
    "indent",
    "blockquote",
    "code-block",
    "link",
  ];

  return (
    <div className="rich-text-editor">
      <ReactQuill
        theme="snow"
        value={value}
        onChange={onChange}
        modules={modules}
        formats={formats}
        placeholder={placeholder}
        readOnly={disabled}
        style={{
          height: height,
          marginBottom: "42px", // Account for toolbar height
        }}
        className={`${error ? "border-red-300" : "border-gray-300"} rounded-md`}
      />
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}

      <style jsx global>{`
        .ql-toolbar {
          border-top: 1px solid #d1d5db;
          border-left: 1px solid #d1d5db;
          border-right: 1px solid #d1d5db;
          border-bottom: none;
          border-radius: 0.375rem 0.375rem 0 0;
        }

        .ql-container {
          border-bottom: 1px solid #d1d5db;
          border-left: 1px solid #d1d5db;
          border-right: 1px solid #d1d5db;
          border-top: none;
          border-radius: 0 0 0.375rem 0.375rem;
          font-family: inherit;
        }

        .ql-editor {
          min-height: ${height};
          font-family: inherit;
          line-height: 1.6;
        }

        .ql-editor.ql-blank::before {
          color: #9ca3af;
          font-style: normal;
        }

        .ql-toolbar.ql-snow {
          background-color: #f9fafb;
        }

        .ql-snow .ql-tooltip {
          z-index: 1000;
        }

        .border-red-300 .ql-toolbar,
        .border-red-300 .ql-container {
          border-color: #fca5a5;
        }
      `}</style>
    </div>
  );
}
