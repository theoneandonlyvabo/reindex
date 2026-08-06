"use client";

import { useRef } from "react";
import type { Editor } from "@tiptap/react";
import { useMutation } from "convex/react";
import {
  AlignCenter,
  AlignJustify,
  AlignLeft,
  AlignRight,
  Bold,
  ImageIcon,
  Italic,
  Link as LinkIcon,
  List,
  ListOrdered,
  Printer,
  Redo,
  Strikethrough,
  Underline,
  Undo,
} from "lucide-react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { Toggle } from "@/components/ui/toggle";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

export function Toolbar({
  editor,
  documentId,
}: {
  editor: Editor | null;
  documentId: Id<"documents">;
}) {
  const generateUploadUrl = useMutation(api.documentFiles.generateUploadUrl);
  const attachFile = useMutation(api.documentFiles.attach);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!editor) return null;

  function setHeading(level: 1 | 2 | 3 | 0) {
    if (level === 0) {
      editor!.chain().focus().setParagraph().run();
    } else {
      editor!.chain().focus().toggleHeading({ level }).run();
    }
  }

  function setLink() {
    const previousUrl = editor!.getAttributes("link").href as
      | string
      | undefined;
    const url = window.prompt("URL tautan:", previousUrl ?? "");
    if (url === null) return;
    if (url === "") {
      editor!.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }
    editor!.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  }

  async function handleImageSelected(file: File) {
    const uploadUrl = await generateUploadUrl({});
    const result = await fetch(uploadUrl, {
      method: "POST",
      headers: { "Content-Type": file.type },
      body: file,
    });
    const { storageId } = await result.json();
    const url = await attachFile({ documentId, storageId });
    if (url) {
      editor!.chain().focus().setImage({ src: url }).run();
    }
  }

  return (
    <div className="no-print flex flex-wrap items-center gap-1 border-b bg-background px-3 py-2">
      <Toggle
        size="sm"
        pressed={editor.isActive("heading", { level: 1 })}
        onPressedChange={() => setHeading(1)}
      >
        H1
      </Toggle>
      <Toggle
        size="sm"
        pressed={editor.isActive("heading", { level: 2 })}
        onPressedChange={() => setHeading(2)}
      >
        H2
      </Toggle>
      <Toggle
        size="sm"
        pressed={editor.isActive("heading", { level: 3 })}
        onPressedChange={() => setHeading(3)}
      >
        H3
      </Toggle>

      <Separator orientation="vertical" className="mx-1 h-6" />

      <Toggle
        size="sm"
        pressed={editor.isActive("bold")}
        onPressedChange={() => editor.chain().focus().toggleBold().run()}
      >
        <Bold />
      </Toggle>
      <Toggle
        size="sm"
        pressed={editor.isActive("italic")}
        onPressedChange={() => editor.chain().focus().toggleItalic().run()}
      >
        <Italic />
      </Toggle>
      <Toggle
        size="sm"
        pressed={editor.isActive("underline")}
        onPressedChange={() => editor.chain().focus().toggleUnderline().run()}
      >
        <Underline />
      </Toggle>
      <Toggle
        size="sm"
        pressed={editor.isActive("strike")}
        onPressedChange={() => editor.chain().focus().toggleStrike().run()}
      >
        <Strikethrough />
      </Toggle>

      <Separator orientation="vertical" className="mx-1 h-6" />

      <Toggle
        size="sm"
        pressed={editor.isActive("bulletList")}
        onPressedChange={() =>
          editor.chain().focus().toggleBulletList().run()
        }
      >
        <List />
      </Toggle>
      <Toggle
        size="sm"
        pressed={editor.isActive("orderedList")}
        onPressedChange={() =>
          editor.chain().focus().toggleOrderedList().run()
        }
      >
        <ListOrdered />
      </Toggle>

      <Separator orientation="vertical" className="mx-1 h-6" />

      <Toggle
        size="sm"
        pressed={editor.isActive({ textAlign: "left" })}
        onPressedChange={() =>
          editor.chain().focus().setTextAlign("left").run()
        }
      >
        <AlignLeft />
      </Toggle>
      <Toggle
        size="sm"
        pressed={editor.isActive({ textAlign: "center" })}
        onPressedChange={() =>
          editor.chain().focus().setTextAlign("center").run()
        }
      >
        <AlignCenter />
      </Toggle>
      <Toggle
        size="sm"
        pressed={editor.isActive({ textAlign: "right" })}
        onPressedChange={() =>
          editor.chain().focus().setTextAlign("right").run()
        }
      >
        <AlignRight />
      </Toggle>
      <Toggle
        size="sm"
        pressed={editor.isActive({ textAlign: "justify" })}
        onPressedChange={() =>
          editor.chain().focus().setTextAlign("justify").run()
        }
      >
        <AlignJustify />
      </Toggle>

      <Separator orientation="vertical" className="mx-1 h-6" />

      <Toggle size="sm" pressed={editor.isActive("link")} onPressedChange={setLink}>
        <LinkIcon />
      </Toggle>
      <Button
        variant="ghost"
        size="icon-sm"
        onClick={() => fileInputRef.current?.click()}
      >
        <ImageIcon />
      </Button>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) void handleImageSelected(file);
          e.target.value = "";
        }}
      />

      <Separator orientation="vertical" className="mx-1 h-6" />

      <Button
        variant="ghost"
        size="icon-sm"
        onClick={() => editor.chain().focus().undo().run()}
        disabled={!editor.can().undo()}
      >
        <Undo />
      </Button>
      <Button
        variant="ghost"
        size="icon-sm"
        onClick={() => editor.chain().focus().redo().run()}
        disabled={!editor.can().redo()}
      >
        <Redo />
      </Button>

      <div className="flex-1" />

      <Button variant="outline" size="sm" onClick={() => window.print()}>
        <Printer />
        Ekspor PDF
      </Button>
    </div>
  );
}
