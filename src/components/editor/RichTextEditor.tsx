"use client";

import { useEffect } from "react";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import Image from "@tiptap/extension-image";
import Placeholder from "@tiptap/extension-placeholder";
import { Table } from "@tiptap/extension-table";
import TableRow from "@tiptap/extension-table-row";
import TableHeader from "@tiptap/extension-table-header";
import TableCell from "@tiptap/extension-table-cell";

const toolbarButtonClass =
    "inline-flex items-center justify-center rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-700 transition hover:bg-gray-50 hover:border-gray-300 [&_*]:text-inherit";
const activeToolbarButtonClass =
    "border-gray-900 bg-gray-900 text-white hover:bg-gray-800 hover:border-gray-800";

const SECTION_TEMPLATES = [
    {
        label: "Insert Intro Block",
        html: `<h2>Quick Overview</h2><p>Use this section to explain what the guide is about and who it is for.</p>`,
    },
    {
        label: "Insert Step-by-Step Guide",
        html: `<h2>Step-by-Step Completion Guide</h2><ol><li><strong>Start with the tutorial.</strong> Complete the required intro steps first.</li><li><strong>Focus on the main progression path.</strong> Avoid wasting time on side content early.</li><li><strong>Use rewards efficiently.</strong> Save boosts, energy, and currency for important milestones.</li></ol>`,
    },
    {
        label: "Insert Pros & Cons",
        html: `<h2>Pros &amp; Cons</h2><h3>Pros</h3><ul><li>High payout potential</li><li>Clear milestone structure</li><li>Beginner-friendly progression</li></ul><h3>Cons</h3><ul><li>Can be time-consuming</li><li>May require daily activity</li><li>Some milestones may be difficult without spending</li></ul>`,
    },
    {
        label: "Insert FAQ Block",
        html: `<h2>FAQ</h2><h3>Is this offer worth doing?</h3><p>Yes, if the payout is high enough and the requirements are realistic.</p><h3>Can this offer be completed for free?</h3><p>Some users may complete it free-to-play, but spending can reduce completion time.</p>`,
    },
    {
        label: "Insert Tips Block",
        html: `<h2>Tips Before You Start</h2><ul><li>Screenshot the offer requirements before starting.</li><li>Do not use a VPN.</li><li>Track your progress daily.</li><li>Compare payouts across multiple platforms before starting.</li></ul>`,
    },
    {
        label: "Insert Offer Requirements",
        html: `<h2>Offer Requirements</h2><ul><li>Register and start playing the game</li><li>Complete the tutorial</li><li>Reach the required account level</li><li>Complete all required milestones before the deadline</li></ul>`,
    },
    {
        label: "Insert Final Verdict",
        html: `<h2>Final Verdict</h2><p>This offer is best for users who can log in daily, follow an efficient strategy, and avoid wasting resources. If the payout is strong, it can be one of the better game offers to complete.</p>`,
    },
] as const;

function ToolbarButton({
    active = false,
    onClick,
    children,
    title,
}: {
    active?: boolean;
    onClick: () => void;
    children: React.ReactNode;
    title?: string;
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            title={title}
            className={`${toolbarButtonClass} ${active ? activeToolbarButtonClass : ""}`}
        >
            {children}
        </button>
    );
}

export default function RichTextEditor({
    value,
    onChange,
}: {
    value: string;
    onChange: (html: string) => void;
}) {
    const editor = useEditor({
        immediatelyRender: false,
        extensions: [
            StarterKit.configure({
                heading: {
                    levels: [2, 3],
                },
            }),
            Link.configure({
                openOnClick: false,
                autolink: true,
                HTMLAttributes: {
                    target: "_blank",
                    rel: "noopener noreferrer nofollow",
                },
            }),
            Image.configure({
                inline: false,
                allowBase64: false,
                HTMLAttributes: {
                    class: "rounded-xl my-6 max-w-full h-auto",
                },
            }),
            Placeholder.configure({
                placeholder: "Write your guide content…",
            }),
            Table.configure({
                resizable: true,
            }),
            TableRow,
            TableHeader,
            TableCell,
        ],
        content: value,
        editorProps: {
            attributes: {
                class:
                    "prose prose-slate max-w-none min-h-[320px] px-4 py-4 focus:outline-none prose-img:rounded-xl prose-img:my-6 prose-img:max-w-full prose-table:border prose-th:border prose-th:bg-gray-100 prose-td:border",
            },
        },
        onUpdate({ editor: nextEditor }) {
            onChange(nextEditor.getHTML());
        },
    });

    useEffect(() => {
        if (!editor) return;
        const current = editor.getHTML();
        if (value !== current) {
            editor.commands.setContent(value || "", { emitUpdate: false });
        }
    }, [editor, value]);

    if (!editor) return null;

    function setLink() {
        if (!editor) return;
        const previousUrl = editor.getAttributes("link").href || "";
        const url = window.prompt("Enter link URL", previousUrl);
        if (url === null) return;
        if (url === "") {
            editor.chain().focus().unsetLink().run();
            return;
        }
        editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
    }

    function insertImage() {
        if (!editor) return;
        const src = window.prompt("Enter image URL");
        if (!src) return;
        const alt = window.prompt("Enter image alt text (optional)") || "";
        editor.chain().focus().setImage({ src, alt, title: alt || undefined }).run();
    }

    return (
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
            <div className="sticky top-4 z-20 border-b border-gray-200 bg-white/95 px-4 py-3 backdrop-blur supports-[backdrop-filter]:bg-white/85">
                <div className="flex flex-wrap gap-2">
                    <ToolbarButton
                        active={editor.isActive("heading", { level: 2 })}
                        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
                    >
                        H2
                    </ToolbarButton>
                    <ToolbarButton
                        active={editor.isActive("heading", { level: 3 })}
                        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
                    >
                        H3
                    </ToolbarButton>
                    <ToolbarButton
                        active={editor.isActive("paragraph")}
                        onClick={() => editor.chain().focus().setParagraph().run()}
                    >
                        Paragraph
                    </ToolbarButton>
                    <ToolbarButton
                        active={editor.isActive("bold")}
                        onClick={() => editor.chain().focus().toggleBold().run()}
                        title="Bold"
                    >
                        <span className="font-extrabold text-inherit">B</span>
                    </ToolbarButton>
                    <ToolbarButton
                        active={editor.isActive("italic")}
                        onClick={() => editor.chain().focus().toggleItalic().run()}
                        title="Italic"
                    >
                        <span className="italic text-inherit">I</span>
                    </ToolbarButton>
                    <ToolbarButton
                        active={editor.isActive("bulletList")}
                        onClick={() => editor.chain().focus().toggleBulletList().run()}
                    >
                        Bullet List
                    </ToolbarButton>
                    <ToolbarButton
                        active={editor.isActive("orderedList")}
                        onClick={() => editor.chain().focus().toggleOrderedList().run()}
                    >
                        Numbered List
                    </ToolbarButton>
                    <ToolbarButton active={editor.isActive("link")} onClick={setLink}>
                        Link
                    </ToolbarButton>
                    <ToolbarButton onClick={insertImage}>Image</ToolbarButton>
                    <ToolbarButton
                        active={editor.isActive("table")}
                        onClick={() =>
                            editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()
                        }
                    >
                        Table
                    </ToolbarButton>
                    <ToolbarButton onClick={() => editor.chain().focus().undo().run()}>Undo</ToolbarButton>
                    <ToolbarButton onClick={() => editor.chain().focus().redo().run()}>Redo</ToolbarButton>
                    <ToolbarButton onClick={() => editor.chain().focus().unsetAllMarks().clearNodes().run()}>
                        Clear
                    </ToolbarButton>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                    {SECTION_TEMPLATES.map((template) => (
                        <button
                            key={template.label}
                            type="button"
                            onClick={() => editor.chain().focus().insertContent(template.html).run()}
                            className="rounded-full border border-gray-200 bg-gray-50 px-3 py-1.5 text-[11px] font-semibold text-gray-700 transition hover:bg-white hover:border-gray-300"
                        >
                            {template.label}
                        </button>
                    ))}
                </div>
            </div>
            <EditorContent editor={editor} className="min-h-[320px] [&_.ProseMirror]:pt-2" />
        </div>
    );
}
