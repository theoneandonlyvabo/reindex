import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";

const components: Components = {
  p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
  ul: ({ children }) => (
    <ul className="mb-2 list-disc space-y-0.5 pl-4 last:mb-0">{children}</ul>
  ),
  ol: ({ children }) => (
    <ol className="mb-2 list-decimal space-y-0.5 pl-4 last:mb-0">
      {children}
    </ol>
  ),
  li: ({ children }) => <li>{children}</li>,
  strong: ({ children }) => (
    <strong className="font-semibold">{children}</strong>
  ),
  em: ({ children }) => <em className="italic">{children}</em>,
  a: ({ children, href }) => (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="text-primary underline underline-offset-2"
    >
      {children}
    </a>
  ),
  code: ({ children }) => (
    <code className="rounded-sm bg-muted px-1 py-0.5 font-mono text-[0.85em]">
      {children}
    </code>
  ),
  h1: ({ children }) => (
    <p className="mb-2 font-semibold last:mb-0">{children}</p>
  ),
  h2: ({ children }) => (
    <p className="mb-2 font-semibold last:mb-0">{children}</p>
  ),
  h3: ({ children }) => (
    <p className="mb-2 font-semibold last:mb-0">{children}</p>
  ),
};

/** Renders AI-generated markdown (bold, lists, links) as real elements — never raw `**text**`. */
export function ChatMarkdown({ text }: { text: string }) {
  return (
    <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
      {text}
    </ReactMarkdown>
  );
}
