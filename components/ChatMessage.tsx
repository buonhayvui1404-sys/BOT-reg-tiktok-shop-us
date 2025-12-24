import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Message, VibeMode, VIBE_CONFIGS, Attachment } from '../types';
import { User, Bot, Terminal, FileText, Image as ImageIcon, ChevronDown, ChevronUp, BookmarkPlus, Check } from 'lucide-react';

interface ChatMessageProps {
  message: Message;
  vibe: VibeMode;
  onSaveSnippet?: (code: string, language: string) => void;
}

const AttachmentView: React.FC<{ attachment: Attachment }> = ({ attachment }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  if (attachment.type === 'image') {
    return (
      <div className="mb-2 group relative">
        <div className="rounded-lg overflow-hidden border border-slate-700 bg-slate-800 max-w-[200px]">
           <img 
             src={`data:${attachment.mimeType};base64,${attachment.content}`} 
             alt={attachment.fileName}
             className="w-full h-auto object-cover"
           />
           <div className="absolute bottom-0 left-0 right-0 bg-black/60 px-2 py-1 text-[10px] text-white truncate">
             {attachment.fileName}
           </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mb-2">
      <button 
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center gap-2 bg-slate-800 hover:bg-slate-750 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-300 w-full transition-colors"
      >
        <FileText size={14} className="text-slate-400" />
        <span className="truncate flex-1 text-left">{attachment.fileName}</span>
        {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
      </button>
      
      {isExpanded && (
        <div className="mt-1 rounded-lg border border-slate-700 overflow-hidden">
           <SyntaxHighlighter
              style={vscDarkPlus}
              language="javascript" // Default fallback
              PreTag="div"
              customStyle={{ margin: 0, padding: '0.75rem', fontSize: '0.75rem', backgroundColor: '#0f172a', maxHeight: '200px' }}
           >
             {attachment.content}
           </SyntaxHighlighter>
        </div>
      )}
    </div>
  );
};

const ChatMessage: React.FC<ChatMessageProps> = ({ message, vibe, onSaveSnippet }) => {
  const isUser = message.role === 'user';
  const config = VIBE_CONFIGS[vibe];

  // Helper for copy/save button state
  const CodeHeader = ({ language, code }: { language: string, code: string }) => {
    const [saved, setSaved] = useState(false);

    const handleSave = () => {
      if (onSaveSnippet) {
        onSaveSnippet(code, language);
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      }
    };

    return (
      <div className="bg-slate-800 px-3 py-1.5 text-xs text-slate-400 font-mono border-b border-slate-700 flex justify-between items-center">
        <span>{language}</span>
        <div className="flex items-center gap-2">
           {!isUser && onSaveSnippet && (
             <button 
               onClick={handleSave}
               className="flex items-center gap-1 hover:text-emerald-400 transition-colors"
               title="Lưu vào thư viện"
             >
               {saved ? <Check size={12} className="text-emerald-400" /> : <BookmarkPlus size={12} />}
               <span className="text-[10px]">{saved ? 'Đã lưu' : 'Lưu'}</span>
             </button>
           )}
        </div>
      </div>
    );
  };

  return (
    <div className={`flex w-full mb-6 ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div className={`flex max-w-[85%] md:max-w-[75%] gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
        
        {/* Avatar */}
        <div className={`
          flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center
          ${isUser ? 'bg-slate-700 text-slate-200' : 'bg-slate-900 border border-slate-700'}
          ${!isUser ? config.themeColor.split(' ')[0] : ''} 
        `}>
          {isUser ? <User size={20} /> : <Terminal size={20} />}
        </div>

        {/* Content Bubble */}
        <div className={`
          p-4 rounded-2xl shadow-lg backdrop-blur-sm
          ${isUser 
            ? 'bg-slate-700 text-slate-100 rounded-tr-none' 
            : 'bg-slate-900/80 border border-slate-800 text-slate-200 rounded-tl-none'}
        `}>
          {/* Attachments Display */}
          {message.attachments && message.attachments.length > 0 && (
            <div className="mb-4 flex flex-wrap gap-2">
              {message.attachments.map(att => (
                <AttachmentView key={att.id} attachment={att} />
              ))}
            </div>
          )}

          <div className="prose prose-invert prose-sm max-w-none font-sans">
            <ReactMarkdown
              components={{
                code({ node, inline, className, children, ...props }: any) {
                  const match = /language-(\w+)/.exec(className || '');
                  const codeString = String(children).replace(/\n$/, '');
                  
                  return !inline && match ? (
                    <div className="rounded-lg overflow-hidden my-3 border border-slate-700 shadow-md">
                      <CodeHeader language={match[1]} code={codeString} />
                      <SyntaxHighlighter
                        {...props}
                        style={vscDarkPlus}
                        language={match[1]}
                        PreTag="div"
                        customStyle={{ margin: 0, borderRadius: 0, padding: '1rem', backgroundColor: '#0f172a' }} 
                      >
                        {codeString}
                      </SyntaxHighlighter>
                    </div>
                  ) : (
                    <code {...props} className={`${className} bg-slate-800 px-1.5 py-0.5 rounded text-vibe-glow text-sm font-mono`}>
                      {children}
                    </code>
                  );
                }
              }}
            >
              {message.content}
            </ReactMarkdown>
          </div>
          {message.isStreaming && (
             <span className="inline-block w-2 h-4 ml-1 bg-current opacity-70 animate-pulse align-middle" />
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatMessage;