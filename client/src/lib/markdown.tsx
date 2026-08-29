export const markdownComponents = {
  h1: ({ children }: any) => (
    <h1 className="text-xs sm:text-sm font-bold text-slate-900 mt-2 mb-1 tracking-tight border-b border-slate-200 pb-0.5">
      {children}
    </h1>
  ),
  h2: ({ children }: any) => (
    <h2 className="text-xs font-bold text-slate-900 mt-2 mb-1 tracking-tight">
      {children}
    </h2>
  ),
  h3: ({ children }: any) => (
    <h3 className="text-[11px] font-semibold text-slate-800 mt-1.5 mb-0.5">
      {children}
    </h3>
  ),
  p: ({ children }: any) => (
    <p className="text-xs text-slate-800 leading-relaxed my-1 font-normal">
      {children}
    </p>
  ),
  ul: ({ children }: any) => (
    <ul className="text-xs list-disc pl-4 my-1 space-y-0.5 text-slate-800">
      {children}
    </ul>
  ),
  ol: ({ children }: any) => (
    <ol className="text-xs list-decimal pl-4 my-1 space-y-0.5 text-slate-800">
      {children}
    </ol>
  ),
  li: ({ children }: any) => (
    <li className="text-xs leading-normal">{children}</li>
  ),
  strong: ({ children }: any) => (
    <strong className="font-semibold text-slate-900">{children}</strong>
  ),
  em: ({ children }: any) => (
    <em className="italic text-slate-700">{children}</em>
  ),
  blockquote: ({ children }: any) => (
    <blockquote className="border-l-2 border-indigo-500 pl-2.5 my-1.5 text-slate-700 italic bg-indigo-50/60 py-1 rounded-r text-xs leading-normal">
      {children}
    </blockquote>
  ),
  a: ({ href, children }: any) => (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="text-indigo-600 hover:underline font-medium"
    >
      {children}
    </a>
  ),
  hr: () => <hr className="my-2 border-t border-slate-200" />,

  // --- COMPACT & SHARP CODE / BADGE RENDERER ---
  code: ({ inline, className, children, ...props }: any) => {
    const rawContent = Array.isArray(children) ? children.join('') : String(children || '')
    const isSingleLine = !rawContent.includes('\n')
    const isInlineCode = inline || isSingleLine

    // Single-line code renders as a tight, sharp inline badge
    if (isInlineCode) {
      return (
        <code
          className="bg-slate-800 text-slate-100 font-mono text-[11px] px-2 py-0.5 rounded font-medium border border-slate-700 inline-block align-middle my-0.5 tracking-wide shadow-xs"
          {...props}
        >
          {rawContent.trim()}
        </code>
      )
    }

    // Multi-line code block
    return (
      <div className="my-1.5 overflow-x-auto rounded-md border border-slate-800 bg-slate-900 p-2 font-mono text-[11px] text-slate-100 leading-tight custom-scrollbar">
        <code {...props}>{children}</code>
      </div>
    )
  },

  // --- TABLES (COMPACT & SHARP) ---
  table: ({ children }: any) => (
    <div className="my-1.5 overflow-hidden rounded-md border border-slate-200 bg-white shadow-xs">
      <div className="overflow-x-auto custom-scrollbar">
        <table className="w-full text-left text-xs border-collapse">
          {children}
        </table>
      </div>
    </div>
  ),
  thead: ({ children }: any) => (
    <thead className="bg-slate-100 border-b border-slate-200 text-slate-700 font-semibold text-[10px] uppercase tracking-wider">
      {children}
    </thead>
  ),
  tbody: ({ children }: any) => (
    <tbody className="divide-y divide-slate-100 text-slate-800">{children}</tbody>
  ),
  tr: ({ children }: any) => (
    <tr className="hover:bg-slate-50 transition-colors">{children}</tr>
  ),
  th: ({ children }: any) => (
    <th className="px-2.5 py-1.5 font-semibold whitespace-nowrap">{children}</th>
  ),
  td: ({ children }: any) => (
    <td className="px-2.5 py-1.5 leading-normal">{children}</td>
  ),
}



export const markdownDarkComponents = {
  h1: ({ children }: any) => (
    <h1 className="text-xs sm:text-sm font-bold text-slate-100 mt-2 mb-1 tracking-tight border-b border-slate-700 pb-0.5">
      {children}
    </h1>
  ),
  h2: ({ children }: any) => (
    <h2 className="text-xs font-bold text-slate-100 mt-2 mb-1 tracking-tight">
      {children}
    </h2>
  ),
  h3: ({ children }: any) => (
    <h3 className="text-[11px] font-semibold text-slate-200 mt-1.5 mb-0.5">
      {children}
    </h3>
  ),
  p: ({ children }: any) => (
    <p className="text-xs text-slate-300 leading-relaxed my-1 font-normal">
      {children}
    </p>
  ),
  ul: ({ children }: any) => (
    <ul className="text-xs list-disc pl-4 my-1 space-y-0.5 text-slate-300">
      {children}
    </ul>
  ),
  ol: ({ children }: any) => (
    <ol className="text-xs list-decimal pl-4 my-1 space-y-0.5 text-slate-300">
      {children}
    </ol>
  ),
  li: ({ children }: any) => (
    <li className="text-xs leading-normal">{children}</li>
  ),
  strong: ({ children }: any) => (
    <strong className="font-semibold text-slate-100">{children}</strong>
  ),
  em: ({ children }: any) => (
    <em className="italic text-slate-400">{children}</em>
  ),
  blockquote: ({ children }: any) => (
    <blockquote className="border-l-2 border-indigo-400 pl-2.5 my-1.5 text-slate-300 italic bg-indigo-500/10 py-1.5 rounded-r text-xs leading-normal">
      {children}
    </blockquote>
  ),
  a: ({ href, children }: any) => (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="text-indigo-400 hover:text-indigo-300 hover:underline font-medium transition-colors"
    >
      {children}
    </a>
  ),
  hr: () => <hr className="my-2 border-t border-slate-700" />,

  // --- COMPACT & SHARP CODE / BADGE RENDERER ---
  code: ({ inline, className, children, ...props }: any) => {
    const rawContent = Array.isArray(children) ? children.join('') : String(children || '')
    const isSingleLine = !rawContent.includes('\n')
    const isInlineCode = inline || isSingleLine

    // Single-line code renders as a tight, sharp inline badge
    if (isInlineCode) {
      return (
        <code
          className="bg-slate-800/80 text-indigo-300 font-mono text-[11px] px-2 py-0.5 rounded font-medium border border-slate-700 inline-block align-middle my-0.5 tracking-wide shadow-sm"
          {...props}
        >
          {rawContent.trim()}
        </code>
      )
    }

    // Multi-line code block
    return (
      <div className="my-1.5 overflow-x-auto rounded-md border border-slate-700 bg-[#0B0F19] p-2.5 font-mono text-[11px] text-slate-300 leading-relaxed custom-scrollbar shadow-inner">
        <code {...props}>{children}</code>
      </div>
    )
  },

  // --- TABLES (COMPACT & SHARP) ---
  table: ({ children }: any) => (
    <div className="my-1.5 overflow-hidden rounded-md border border-slate-700 bg-slate-900/50 shadow-sm">
      <div className="overflow-x-auto custom-scrollbar">
        <table className="w-full text-left text-xs border-collapse">
          {children}
        </table>
      </div>
    </div>
  ),
  thead: ({ children }: any) => (
    <thead className="bg-slate-800/80 border-b border-slate-700 text-slate-300 font-semibold text-[10px] uppercase tracking-wider">
      {children}
    </thead>
  ),
  tbody: ({ children }: any) => (
    <tbody className="divide-y divide-slate-700/80 text-slate-300">{children}</tbody>
  ),
  tr: ({ children }: any) => (
    <tr className="hover:bg-slate-800/50 transition-colors">{children}</tr>
  ),
  th: ({ children }: any) => (
    <th className="px-2.5 py-1.5 font-semibold whitespace-nowrap">{children}</th>
  ),
  td: ({ children }: any) => (
    <td className="px-2.5 py-1.5 leading-normal">{children}</td>
  ),
}