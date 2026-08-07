"use client";

import { useEditorState, type Editor } from "@tiptap/react";
import { PanelLeftClose } from "lucide-react";
import { buildOutline } from "@/lib/editor/heading-outline";
import { Button } from "@/components/ui/button";

const LEVEL_INDENT_PX = 12;

export function DocumentOutline({
  editor,
  onCollapse,
}: {
  editor: Editor | null;
  onCollapse: () => void;
}) {
  const outline = useEditorState({
    editor,
    selector: ({ editor }) => (editor ? buildOutline(editor) : []),
  });

  function jumpTo(pos: number) {
    editor?.chain().focus().setTextSelection(pos).scrollIntoView().run();
  }

  return (
    <aside className="no-print hidden w-full flex-col overflow-hidden border-r lg:flex lg:basis-[24%]">
      <div className="flex h-12 items-center justify-between border-b px-4 py-2">
        <span className="text-sm font-medium">Outline</span>
        <Button variant="ghost" size="icon-sm" onClick={onCollapse}>
          <PanelLeftClose />
        </Button>
      </div>
      <nav className="flex-1 overflow-y-auto px-2 py-2">
        {!outline || outline.length === 0 ? (
          <p className="px-2 py-4 text-xs text-muted-foreground">
            Headings you add will show up here.
          </p>
        ) : (
          <ul className="space-y-0.5">
            {outline.map((entry) => (
              <li key={entry.pos}>
                <button
                  type="button"
                  onClick={() => jumpTo(entry.pos)}
                  style={{
                    paddingLeft: `${(entry.level - 1) * LEVEL_INDENT_PX + 8}px`,
                  }}
                  className={`w-full truncate rounded-md py-1 pr-2 text-left text-sm hover:bg-accent ${
                    entry.level === 1 ? "font-medium" : "text-muted-foreground"
                  }`}
                >
                  {entry.number} {entry.text}
                </button>
              </li>
            ))}
          </ul>
        )}
      </nav>
    </aside>
  );
}
