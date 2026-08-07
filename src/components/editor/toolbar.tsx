"use client";

import { useRef, useState } from "react";
import { useEditorState, type Editor } from "@tiptap/react";
import { useMutation } from "convex/react";
import {
  AlignCenter,
  AlignJustify,
  AlignLeft,
  AlignRight,
  AlignVerticalSpaceAround,
  Baseline,
  Bold,
  Highlighter,
  ImageIcon,
  IndentDecrease,
  IndentIncrease,
  Italic,
  Link as LinkIcon,
  List,
  ListOrdered,
  Minus,
  Plus,
  Printer,
  Redo,
  RemoveFormatting,
  Settings,
  Strikethrough,
  Subscript as SubscriptIcon,
  Superscript as SuperscriptIcon,
  Underline,
  Undo,
} from "lucide-react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { Toggle } from "@/components/ui/toggle";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ToolbarColorInput } from "./toolbar-color-input";

type BlockType = "paragraph" | "1" | "2" | "3";

const ZOOM_LEVELS = [50, 75, 90, 100, 110, 125, 150, 175, 200] as const;

// System/web-safe fonts only — no next/font loading, so the doc's paper
// text stays free of the app-chrome font budget. "Free choice" here means
// free among these, not an arbitrary text field: an unavailable font name
// would just silently fall back and mislead the user about what applied.
const FONT_FAMILIES = [
  { label: "Times New Roman", value: "Times New Roman" },
  { label: "Georgia", value: "Georgia" },
  { label: "Garamond", value: "Garamond" },
  { label: "Cambria", value: "Cambria" },
  { label: "Arial", value: "Arial" },
  { label: "Helvetica", value: "Helvetica" },
  { label: "Calibri", value: "Calibri" },
  { label: "Verdana", value: "Verdana" },
  { label: "Tahoma", value: "Tahoma" },
  { label: "Courier New", value: "Courier New" },
  { label: "Consolas", value: "Consolas" },
] as const;

const LINE_SPACING_OPTIONS = [
  { label: "Single", value: "1" },
  { label: "1.15", value: "1.15" },
  { label: "1.5", value: "1.5" },
  { label: "Double", value: "2" },
] as const;

const MIN_FONT_SIZE = 6;
const MAX_FONT_SIZE = 96;
const DEFAULT_FONT_SIZE = 12;
const DEFAULT_TEXT_COLOR = "#000000";
const DEFAULT_HIGHLIGHT_COLOR = "#fef08a";

function getCurrentBlockType(editor: Editor): BlockType {
  if (editor.isActive("heading", { level: 1 })) return "1";
  if (editor.isActive("heading", { level: 2 })) return "2";
  if (editor.isActive("heading", { level: 3 })) return "3";
  return "paragraph";
}

function getCurrentNodeType(editor: Editor): "heading" | "paragraph" {
  return editor.isActive("heading") ? "heading" : "paragraph";
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
  const [fontSizeInput, setFontSizeInput] = useState<string | null>(null);
  // Purely a live DOM attribute (see editorProps in use-document-editor.ts
  // for the default) — no autosave/undo implications, so it doesn't need
  // to round-trip through the editor hook like autocompleteEnabled does.
  const [spellcheckEnabled, setSpellcheckEnabledState] = useState(true);

  // Reactive to EVERY transaction (selection moves included), not just doc
  // changes — plain `editor.isActive(...)` calls in JSX only re-evaluate
  // when something else re-renders this component, so moving the cursor
  // into e.g. a heading without editing left every button showing stale
  // (pre-move) active state.
  const toolbarState = useEditorState({
    editor,
    selector: ({ editor }) => {
      if (!editor) return null;
      const textStyle = editor.getAttributes("textStyle");
      return {
        blockType: getCurrentBlockType(editor),
        isBold: editor.isActive("bold"),
        isItalic: editor.isActive("italic"),
        isUnderline: editor.isActive("underline"),
        isStrike: editor.isActive("strike"),
        isSuperscript: editor.isActive("superscript"),
        isSubscript: editor.isActive("subscript"),
        isBulletList: editor.isActive("bulletList"),
        isOrderedList: editor.isActive("orderedList"),
        alignLeft: editor.isActive({ textAlign: "left" }),
        alignCenter: editor.isActive({ textAlign: "center" }),
        alignRight: editor.isActive({ textAlign: "right" }),
        alignJustify: editor.isActive({ textAlign: "justify" }),
        canUndo: editor.can().undo(),
        canRedo: editor.can().redo(),
        canIndent: editor.can().indent(),
        canOutdent: editor.can().outdent(),
        fontFamily: (textStyle.fontFamily as string | undefined) ?? null,
        fontSize: (textStyle.fontSize as string | undefined) ?? null,
        textColor: (textStyle.color as string | undefined) ?? null,
        highlightColor:
          (editor.getAttributes("highlight").color as string | undefined) ??
          null,
        lineHeight:
          (editor.getAttributes(getCurrentNodeType(editor))
            .lineHeight as string | undefined) ?? "1.5",
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

  const currentFontSize = fontSizeInput ?? String(
    toolbarState.fontSize ? parseInt(toolbarState.fontSize, 10) : DEFAULT_FONT_SIZE,
  );

  function commitFontSize(raw: string) {
    const parsed = Math.min(
      MAX_FONT_SIZE,
      Math.max(MIN_FONT_SIZE, parseInt(raw, 10) || DEFAULT_FONT_SIZE),
    );
    editor!.chain().focus().setFontSize(`${parsed}pt`).run();
    setFontSizeInput(null);
  }

  function stepFontSize(delta: number) {
    const current = toolbarState!.fontSize
      ? parseInt(toolbarState!.fontSize, 10)
      : DEFAULT_FONT_SIZE;
    const next = Math.min(MAX_FONT_SIZE, Math.max(MIN_FONT_SIZE, current + delta));
    editor!.chain().focus().setFontSize(`${next}pt`).run();
  }

  function setSpellcheckEnabled(enabled: boolean) {
    setSpellcheckEnabledState(enabled);
    editor!.view.dom.setAttribute("spellcheck", String(enabled));
  }

  // Same fix as the selected-text-edit popup's `pendingSelection` decoration
  // (see extensions/pending-selection.ts): clicking a toolbar control blurs
  // the editor, and the browser dims/drops the native selection on blur.
  // Firing on mousedown (before that blur happens) pins a focus-independent
  // highlight over the still-current selection so it stays visible for the
  // whole toolbar interaction.
  function handleToolbarMouseDown() {
    const { from, to } = editor!.state.selection;
    if (from === to) return;
    editor!.commands.setPendingSelection(from, to);
  }

  return (
    <div
      onMouseDown={handleToolbarMouseDown}
      className="no-print scrollbar-hide flex h-11 flex-nowrap items-center gap-1 overflow-x-auto border-b bg-background px-3 py-2"
    >
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon-sm" aria-label="Document settings">
            <Settings />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          <DropdownMenuCheckboxItem
            checked={spellcheckEnabled}
            onCheckedChange={setSpellcheckEnabled}
          >
            Spelling check
          </DropdownMenuCheckboxItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onSelect={setLink}>
            <LinkIcon />
            Insert link
          </DropdownMenuItem>
          <DropdownMenuItem
            onSelect={(e) => {
              e.preventDefault();
              fileInputRef.current?.click();
            }}
          >
            <ImageIcon />
            Insert image
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => window.print()}>
            <Printer />
            Export as PDF
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
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

      <Separator orientation="vertical" className="mx-1 h-6" />

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

      <Select
        value={toolbarState.fontFamily ?? "Times New Roman"}
        onValueChange={(value) =>
          editor.chain().focus().setFontFamily(value).run()
        }
      >
        <SelectTrigger size="sm" className="w-36">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {FONT_FAMILIES.map((font) => (
            <SelectItem key={font.value} value={font.value}>
              <span style={{ fontFamily: font.value }}>{font.label}</span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <div className="flex items-center gap-0.5">
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={() => stepFontSize(-1)}
          aria-label="Decrease font size"
        >
          <Minus />
        </Button>
        <Input
          value={currentFontSize}
          onChange={(e) => setFontSizeInput(e.target.value)}
          onFocus={() => setFontSizeInput(currentFontSize)}
          onBlur={(e) => commitFontSize(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") e.currentTarget.blur();
          }}
          className="h-7 w-11 px-1 text-center text-sm"
        />
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={() => stepFontSize(1)}
          aria-label="Increase font size"
        >
          <Plus />
        </Button>
      </div>

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
      <Toggle
        size="sm"
        pressed={toolbarState.isSuperscript}
        onPressedChange={() =>
          editor.chain().focus().toggleSuperscript().run()
        }
        aria-label="Superscript"
      >
        <SuperscriptIcon />
      </Toggle>
      <Toggle
        size="sm"
        pressed={toolbarState.isSubscript}
        onPressedChange={() => editor.chain().focus().toggleSubscript().run()}
        aria-label="Subscript"
      >
        <SubscriptIcon />
      </Toggle>

      <Separator orientation="vertical" className="mx-1 h-6" />

      <ToolbarColorInput
        icon={Baseline}
        color={toolbarState.textColor}
        fallback={DEFAULT_TEXT_COLOR}
        label="Text color"
        onChange={(color) => editor.chain().focus().setColor(color).run()}
      />
      <ToolbarColorInput
        icon={Highlighter}
        color={toolbarState.highlightColor}
        fallback={DEFAULT_HIGHLIGHT_COLOR}
        label="Highlight color"
        onChange={(color) =>
          editor.chain().focus().setHighlight({ color }).run()
        }
      />

      <Separator orientation="vertical" className="mx-1 h-6" />

      <Select
        value={toolbarState.lineHeight}
        onValueChange={(value) =>
          editor.chain().focus().setLineHeight(value).run()
        }
      >
        <SelectTrigger size="sm" className="w-16">
          <AlignVerticalSpaceAround className="size-4" />
        </SelectTrigger>
        <SelectContent>
          {LINE_SPACING_OPTIONS.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

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

      <Button
        variant="ghost"
        size="icon-sm"
        onClick={() => editor.chain().focus().outdent().run()}
        disabled={!toolbarState.canOutdent}
        aria-label="Decrease indent"
      >
        <IndentDecrease />
      </Button>
      <Button
        variant="ghost"
        size="icon-sm"
        onClick={() => editor.chain().focus().indent().run()}
        disabled={!toolbarState.canIndent}
        aria-label="Increase indent"
      >
        <IndentIncrease />
      </Button>

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

      <Button
        variant="ghost"
        size="icon-sm"
        onClick={() =>
          editor.chain().focus().unsetAllMarks().clearNodes().run()
        }
        aria-label="Clear formatting"
      >
        <RemoveFormatting />
      </Button>
    </div>
  );
}
