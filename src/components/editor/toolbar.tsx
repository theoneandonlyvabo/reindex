"use client";

import { useRef } from "react";
import { useEditorState, type Editor } from "@tiptap/react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type BlockType = "paragraph" | "1" | "2" | "3";

const ZOOM_LEVELS = [50, 75, 90, 100, 110, 125, 150, 175, 200] as const;

function getCurrentBlockType(editor: Editor): BlockType {
  if (editor.isActive("heading", { level: 1 })) return "1";
  if (editor.isActive("heading", { level: 2 })) return "2";
  if (editor.isActive("heading", { level: 3 })) return "3";
  return "paragraph";
}

export function Toolbar({
  editor,
  documentId,
  zoom,
  onZoomChange,
}: {
  editor: Editor | null;
  documentId: Id<"documents">;
  zoom: number;
  onZoomChange: (zoom: number) => void;
}) {
  const generateUploadUrl = useMutation(api.documentFiles.generateUploadUrl);
  const attachFile = useMutation(api.documentFiles.attach);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Reactive to EVERY transaction (selection moves included), not just doc
  // changes — plain `editor.isActive(...)` calls in JSX only re-evaluate
  // when something else re-renders this component, so moving the cursor
  // into e.g. a heading without editing left every button showing stale
  // (pre-move) active state.
  const toolbarState = useEditorState({
    editor,
    selector: ({ editor }) => {
      if (!editor) return null;
      return {
        blockType: getCurrentBlockType(editor),
        isBold: editor.isActive("bold"),
        isItalic: editor.isActive("italic"),
        isUnderline: editor.isActive("underline"),
        isStrike: editor.isActive("strike"),
        isBulletList: editor.isActive("bulletList"),
        isOrderedList: editor.isActive("orderedList"),
        alignLeft: editor.isActive({ textAlign: "left" }),
        alignCenter: editor.isActive({ textAlign: "center" }),
        alignRight: editor.isActive({ textAlign: "right" }),
        alignJustify: editor.isActive({ textAlign: "justify" }),
        isLink: editor.isActive("link"),
        canUndo: editor.can().undo(),
        canRedo: editor.can().redo(),
      };
    },
  });

  if (!editor || !toolbarState) return null;

  function setBlockType(value: BlockType) {
    if (value === "paragraph") {
      editor!.chain().focus().setParagraph().run();
    } else {
      editor!
        .chain()
        .focus()
        .setHeading({ level: Number(value) as 1 | 2 | 3 })
        .run();
    }
  }

  function setLink() {
    const previousUrl = editor!.getAttributes("link").href as
      | string
      | undefined;
    const url = window.prompt("Link URL:", previousUrl ?? "");
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
    <div className="no-print flex h-11 flex-nowrap items-center gap-1 overflow-x-auto border-b bg-background px-3 py-2">
      <Select
        value={String(zoom)}
        onValueChange={(value) => onZoomChange(Number(value))}
      >
        <SelectTrigger size="sm" className="w-20">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {ZOOM_LEVELS.map((level) => (
            <SelectItem key={level} value={String(level)}>
              {level}%
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Separator orientation="vertical" className="mx-1 h-6" />

      <Select value={toolbarState.blockType} onValueChange={setBlockType}>
        <SelectTrigger size="sm" className="w-32">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="paragraph">Normal text</SelectItem>
          <SelectItem value="1">Heading 1</SelectItem>
          <SelectItem value="2">Heading 2</SelectItem>
          <SelectItem value="3">Heading 3</SelectItem>
        </SelectContent>
      </Select>

      <Separator orientation="vertical" className="mx-1 h-6" />

      <Toggle
        size="sm"
        pressed={toolbarState.isBold}
        onPressedChange={() => editor.chain().focus().toggleBold().run()}
      >
        <Bold />
      </Toggle>
      <Toggle
        size="sm"
        pressed={toolbarState.isItalic}
        onPressedChange={() => editor.chain().focus().toggleItalic().run()}
      >
        <Italic />
      </Toggle>
      <Toggle
        size="sm"
        pressed={toolbarState.isUnderline}
        onPressedChange={() => editor.chain().focus().toggleUnderline().run()}
      >
        <Underline />
      </Toggle>
      <Toggle
        size="sm"
        pressed={toolbarState.isStrike}
        onPressedChange={() => editor.chain().focus().toggleStrike().run()}
      >
        <Strikethrough />
      </Toggle>

      <Separator orientation="vertical" className="mx-1 h-6" />

      <Toggle
        size="sm"
        pressed={toolbarState.isBulletList}
        onPressedChange={() =>
          editor.chain().focus().toggleBulletList().run()
        }
      >
        <List />
      </Toggle>
      <Toggle
        size="sm"
        pressed={toolbarState.isOrderedList}
        onPressedChange={() =>
          editor.chain().focus().toggleOrderedList().run()
        }
      >
        <ListOrdered />
      </Toggle>

      <Separator orientation="vertical" className="mx-1 h-6" />

      <Toggle
        size="sm"
        pressed={toolbarState.alignLeft}
        onPressedChange={() =>
          editor.chain().focus().setTextAlign("left").run()
        }
      >
        <AlignLeft />
      </Toggle>
      <Toggle
        size="sm"
        pressed={toolbarState.alignCenter}
        onPressedChange={() =>
          editor.chain().focus().setTextAlign("center").run()
        }
      >
        <AlignCenter />
      </Toggle>
      <Toggle
        size="sm"
        pressed={toolbarState.alignRight}
        onPressedChange={() =>
          editor.chain().focus().setTextAlign("right").run()
        }
      >
        <AlignRight />
      </Toggle>
      <Toggle
        size="sm"
        pressed={toolbarState.alignJustify}
        onPressedChange={() =>
          editor.chain().focus().setTextAlign("justify").run()
        }
      >
        <AlignJustify />
      </Toggle>

      <Separator orientation="vertical" className="mx-1 h-6" />

      <Toggle size="sm" pressed={toolbarState.isLink} onPressedChange={setLink}>
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
        disabled={!toolbarState.canUndo}
      >
        <Undo />
      </Button>
      <Button
        variant="ghost"
        size="icon-sm"
        onClick={() => editor.chain().focus().redo().run()}
        disabled={!toolbarState.canRedo}
      >
        <Redo />
      </Button>

      <div className="flex-1" />

      <Button variant="outline" size="sm" onClick={() => window.print()}>
        <Printer />
        Export PDF
      </Button>
    </div>
  );
}
