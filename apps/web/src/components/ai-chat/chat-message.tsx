"use client";

interface ChatMessageProps {
  role: "user" | "assistant";
  content: string;
}

function formatContent(text: string): string {
  return text
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.*?)\*/g, "<em>$1</em>")
    .replace(/^- (.+)$/gm, "<li>$1</li>")
    .replace(/(<li>.*<\/li>)/gs, "<ul class='list-disc pl-4 my-1'>$1</ul>")
    .replace(/\n/g, "<br />");
}

export function ChatMessage({ role, content }: ChatMessageProps) {
  if (role === "assistant") {
    return (
      <div className="flex items-start gap-2 mb-3">
        <div className="flex-shrink-0 w-7 h-7 rounded-full bg-red-600 flex items-center justify-center">
          <span className="text-white text-[10px] font-bold">AI</span>
        </div>
        <div className="max-w-[80%] bg-gray-100 text-gray-800 rounded-2xl rounded-tl-sm px-3.5 py-2.5 text-sm leading-relaxed">
          <span
            dangerouslySetInnerHTML={{ __html: formatContent(content) }}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-start justify-end mb-3">
      <div className="max-w-[80%] bg-red-600 text-white rounded-2xl rounded-tr-sm px-3.5 py-2.5 text-sm leading-relaxed">
        {content}
      </div>
    </div>
  );
}
