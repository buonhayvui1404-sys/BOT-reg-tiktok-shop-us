import React, { useState, useEffect, useRef } from 'react';
import { Send, Code2, Sparkles, Trash2, Paperclip, X, FileText, Image as ImageIcon, FolderInput, BookOpen } from 'lucide-react';
import { VibeMode, Message, VIBE_CONFIGS, Attachment, Snippet } from './types';
import { sendMessageStream } from './services/geminiService';
import ChatMessage from './components/ChatMessage';
import VibeSelector from './components/VibeSelector';
import SnippetLibrary from './components/SnippetLibrary';

const App: React.FC = () => {
  const [vibe, setVibe] = useState<VibeMode>(VibeMode.CHILL);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  
  // Snippet State
  const [isSnippetOpen, setIsSnippetOpen] = useState(false);
  const [snippets, setSnippets] = useState<Snippet[]>(() => {
    try {
      const saved = localStorage.getItem('vibe_snippets');
      return saved ? JSON.parse(saved) : [];
    } catch (e) { return []; }
  });

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, attachments]);

  useEffect(() => {
    localStorage.setItem('vibe_snippets', JSON.stringify(snippets));
  }, [snippets]);

  // Auto-resize textarea
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.style.height = 'auto';
      inputRef.current.style.height = `${Math.min(inputRef.current.scrollHeight, 200)}px`;
    }
  }, [input]);

  // Initial greeting
  useEffect(() => {
    if (messages.length === 0) {
      setMessages([
        {
          id: 'init',
          role: 'model',
          content: `**Hệ thống đã trực tuyến.** \n\nTôi đang chạy giao thức *${VIBE_CONFIGS[vibe].label}*. Tôi có thể giúp bạn viết code gì hôm nay?`,
          timestamp: Date.now()
        }
      ]);
    }
  }, []);

  const handleVibeChange = (newVibe: VibeMode) => {
    if (newVibe === vibe) return;
    setVibe(newVibe);
    setMessages(prev => [
      ...prev,
      {
        id: Date.now().toString(),
        role: 'model',
        content: `*Đã chuyển sang chế độ ${VIBE_CONFIGS[newVibe].label}.* \n\n${newVibe === VibeMode.CYBERPUNK ? 'Đã kết nối. Sẵn sàng.' : newVibe === VibeMode.TEN_X ? 'Đang tối ưu hóa quy trình.' : 'Hãy cùng flow nào.'}`,
        timestamp: Date.now()
      }
    ]);
  };

  const handleClear = () => {
    setMessages([{
       id: Date.now().toString(),
       role: 'model',
       content: `Bộ nhớ đã bị xóa. Sẵn sàng cho dữ liệu mới.`,
       timestamp: Date.now()
    }]);
    setAttachments([]);
  };

  // --- File Handling ---

  const processFiles = async (files: File[]) => {
    const newAttachments: Attachment[] = [];
    const maxFiles = 20;
    const processList = files.slice(0, maxFiles);

    if (files.length > maxFiles) {
      alert(`Chỉ xử lý ${maxFiles} file đầu tiên để đảm bảo hiệu suất.`);
    }

    for (const file of processList) {
      const isImage = file.type.startsWith('image/');
      if (!isImage && file.size > 1024 * 1024) {
         console.warn(`Skipping large file: ${file.name}`);
         continue; 
      }

      try {
        if (isImage) {
           const base64 = await new Promise<string>((resolve) => {
             const reader = new FileReader();
             reader.onloadend = () => resolve(reader.result as string);
             reader.readAsDataURL(file);
           });
           newAttachments.push({
             id: Math.random().toString(36).substring(7),
             type: 'image',
             content: base64.split(',')[1],
             mimeType: file.type,
             fileName: file.name
           });
        } else {
           const text = await new Promise<string>((resolve, reject) => {
             const reader = new FileReader();
             reader.onload = () => resolve(reader.result as string);
             reader.onerror = reject;
             reader.readAsText(file);
           });
           
           newAttachments.push({
             id: Math.random().toString(36).substring(7),
             type: 'text',
             content: text,
             fileName: file.name
           });
        }
      } catch (err) {
        console.error("Error reading file", file.name, err);
      }
    }
    setAttachments(prev => [...prev, ...newAttachments]);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFiles(Array.from(e.target.files));
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleFolderSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFiles(Array.from(e.target.files));
      if (folderInputRef.current) folderInputRef.current.value = '';
    }
  };

  const removeAttachment = (id: string) => {
    setAttachments(prev => prev.filter(a => a.id !== id));
  };

  // --- Paste Handling ---
  const handlePaste = async (e: React.ClipboardEvent) => {
    const items = e.clipboardData.items;
    const newAttachments: Attachment[] = [];

    for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
            const blob = items[i].getAsFile();
            if (blob) {
                try {
                    const base64 = await new Promise<string>((resolve) => {
                        const reader = new FileReader();
                        reader.onloadend = () => resolve(reader.result as string);
                        reader.readAsDataURL(blob);
                    });
                    newAttachments.push({
                        id: Math.random().toString(36).substring(7),
                        type: 'image',
                        content: base64.split(',')[1],
                        mimeType: blob.type,
                        fileName: `Screenshot ${new Date().toLocaleTimeString('vi-VN')}.png`
                    });
                } catch (err) {
                    console.error("Paste error", err);
                }
            }
        }
    }
    
    if (newAttachments.length > 0) {
        e.preventDefault(); // Stop image binary from pasting into textarea
        setAttachments(prev => [...prev, ...newAttachments]);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSubmit(e);
    }
  };

  // --- Snippet Handling ---

  const handleSaveSnippet = (code: string, language: string) => {
    const titlePrompt = prompt("Đặt tên cho đoạn mã này:", `${language} snippet`);
    if (!titlePrompt) return;

    const newSnippet: Snippet = {
      id: Date.now().toString(),
      title: titlePrompt,
      code,
      language,
      timestamp: Date.now()
    };
    
    setSnippets(prev => [newSnippet, ...prev]);
    setIsSnippetOpen(true);
  };

  const handleDeleteSnippet = (id: string) => {
    setSnippets(prev => prev.filter(s => s.id !== id));
  };

  const handleUseSnippet = (code: string) => {
    setInput(prev => prev ? prev + '\n' + code : code);
    // Need timeout to allow state update before focusing
    setTimeout(() => {
        if (inputRef.current) {
            inputRef.current.focus();
            // Trigger auto-resize manually or let effect handle it
        }
    }, 100);
  };

  // --- Chat Submission ---

  const handleSubmit = async (e: React.FormEvent | React.KeyboardEvent) => {
    e.preventDefault();
    if ((!input.trim() && attachments.length === 0) || isLoading) return;

    const currentAttachments = [...attachments];
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: Date.now(),
      attachments: currentAttachments
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setAttachments([]); 
    setIsLoading(true);
    
    // Reset height manually to prevent jank
    if (inputRef.current) inputRef.current.style.height = 'auto';

    const botMessageId = (Date.now() + 1).toString();
    setMessages(prev => [
      ...prev,
      {
        id: botMessageId,
        role: 'model',
        content: '',
        timestamp: Date.now(),
        isStreaming: true
      }
    ]);

    try {
      await sendMessageStream(userMessage.content, vibe, currentAttachments, (chunkText) => {
        setMessages(prev => 
          prev.map(msg => 
            msg.id === botMessageId 
              ? { ...msg, content: chunkText } 
              : msg
          )
        );
      });
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
      setMessages(prev => 
        prev.map(msg => 
          msg.id === botMessageId 
            ? { ...msg, isStreaming: false } 
            : msg
        )
      );
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  };

  const activeConfig = VIBE_CONFIGS[vibe];
  let bgGradient = "from-slate-900 via-slate-900 to-emerald-900/20";
  if (vibe === VibeMode.TEN_X) bgGradient = "from-slate-900 via-slate-900 to-violet-900/20";
  if (vibe === VibeMode.CYBERPUNK) bgGradient = "from-slate-900 via-slate-900 to-cyan-900/20";

  return (
    <div className={`flex flex-col h-screen bg-slate-950 text-slate-200 overflow-hidden font-sans selection:bg-${activeConfig.themeColor.split('-')[1]}-500/30`}>
      
      {/* Background Ambience */}
      <div className={`absolute inset-0 bg-gradient-to-br ${bgGradient} opacity-50 pointer-events-none z-0 transition-colors duration-1000`} />
      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 pointer-events-none z-0" />

      <SnippetLibrary 
        isOpen={isSnippetOpen} 
        onClose={() => setIsSnippetOpen(false)}
        snippets={snippets}
        onDeleteSnippet={handleDeleteSnippet}
        onUseSnippet={handleUseSnippet}
      />

      {/* Header */}
      <header className="relative z-10 flex items-center justify-between px-6 py-4 border-b border-slate-800/60 bg-slate-950/50 backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg bg-slate-800 border border-slate-700 ${activeConfig.themeColor.split(' ')[0]}`}>
            <Code2 size={24} />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-slate-100 flex items-center gap-2">
              Vibe Code <span className="text-[10px] font-mono opacity-50 border border-slate-700 px-1 rounded">BETA</span>
            </h1>
            <p className="text-xs text-slate-500 font-medium">Sức mạnh từ Gemini 3 Pro</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setIsSnippetOpen(true)}
            className="p-2 text-slate-400 hover:text-violet-400 hover:bg-slate-800 rounded-lg transition-colors relative"
            title="Thư viện Code"
          >
            <BookOpen size={20} />
            {snippets.length > 0 && (
              <span className="absolute top-1 right-1 w-2 h-2 bg-violet-500 rounded-full"></span>
            )}
          </button>
          <div className="h-6 w-px bg-slate-800 mx-1"></div>
          <button 
            onClick={handleClear}
            className="p-2 text-slate-500 hover:text-red-400 hover:bg-red-950/30 rounded-lg transition-colors"
            title="Xóa lịch sử"
          >
            <Trash2 size={18} />
          </button>
        </div>
      </header>

      {/* Main Chat Area */}
      <main className="relative z-10 flex-1 overflow-y-auto p-4 md:p-8 flex flex-col items-center">
        <div className="w-full max-w-4xl flex-1 flex flex-col">
          
          <VibeSelector currentVibe={vibe} onVibeChange={handleVibeChange} />

          <div className="flex-1 min-h-[200px]">
             {messages.map((msg) => (
               <ChatMessage 
                 key={msg.id} 
                 message={msg} 
                 vibe={vibe} 
                 onSaveSnippet={handleSaveSnippet}
               />
             ))}
             <div ref={messagesEndRef} className="h-4" />
          </div>

        </div>
      </main>

      {/* Input Area */}
      <footer className="relative z-20 p-4 md:p-6 bg-slate-950/80 backdrop-blur-xl border-t border-slate-800/60 flex flex-col items-center">
        
        {/* Attachment Previews */}
        {attachments.length > 0 && (
          <div className="w-full max-w-4xl flex flex-wrap gap-3 mb-4 px-1">
            {attachments.map(att => (
              <div key={att.id} className="relative group animate-fadeIn">
                {att.type === 'image' ? (
                  <div className="w-16 h-16 rounded-xl overflow-hidden border border-slate-700 bg-slate-900 shadow-md">
                     <img 
                       src={`data:${att.mimeType};base64,${att.content}`}
                       alt={att.fileName}
                       className="w-full h-full object-cover"
                     />
                  </div>
                ) : (
                  <div className="flex items-center gap-2 bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-300 shadow-md h-full">
                     <FileText size={14} className="text-blue-400" />
                     <span className="truncate max-w-[120px]">{att.fileName}</span>
                  </div>
                )}
                
                <button 
                  onClick={() => removeAttachment(att.id)}
                  className="absolute -top-2 -right-2 bg-slate-800 text-slate-400 border border-slate-600 hover:text-red-400 hover:border-red-500 rounded-full p-0.5 shadow-sm transition-all scale-90 hover:scale-100"
                >
                  <X size={12} />
                </button>
              </div>
            ))}
          </div>
        )}

        <form onSubmit={handleSubmit} className="w-full max-w-4xl relative group">
          
          <div className={`
            absolute -inset-0.5 rounded-2xl opacity-20 group-hover:opacity-40 transition duration-500 blur
            ${vibe === VibeMode.CHILL ? 'bg-gradient-to-r from-emerald-600 to-teal-600' : ''}
            ${vibe === VibeMode.TEN_X ? 'bg-gradient-to-r from-violet-600 to-fuchsia-600' : ''}
            ${vibe === VibeMode.CYBERPUNK ? 'bg-gradient-to-r from-cyan-600 to-blue-600' : ''}
          `} />
          
          <div className="relative flex items-end bg-slate-900 rounded-2xl border border-slate-800 shadow-xl overflow-hidden">
            
            {/* Hidden Inputs */}
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleFileSelect} 
              className="hidden" 
              multiple 
            />
             <input 
              type="file" 
              ref={folderInputRef} 
              onChange={handleFolderSelect} 
              className="hidden" 
              multiple 
              // @ts-ignore
              webkitdirectory="" 
              directory=""
            />
            
            <div className="flex border-r border-slate-800 pr-1 mr-1 mb-1">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="p-3 text-slate-500 hover:text-slate-200 transition-colors"
                title="Đính kèm file"
              >
                <Paperclip size={20} />
              </button>
              <button
                type="button"
                onClick={() => folderInputRef.current?.click()}
                className="p-3 text-slate-500 hover:text-emerald-400 transition-colors"
                title="Nhập cả thư mục (Dự án)"
              >
                <FolderInput size={20} />
              </button>
            </div>

            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              onPaste={handlePaste}
              placeholder={`Hỏi bất cứ điều gì... (Shift+Enter để xuống dòng)`}
              rows={1}
              className="flex-1 bg-transparent px-2 py-4 text-slate-200 placeholder-slate-500 focus:outline-none font-medium resize-none max-h-[200px] overflow-y-auto"
              disabled={isLoading}
            />

            <div className="pr-2 pb-2 flex items-center gap-1">
              <button 
                type="submit"
                disabled={(!input.trim() && attachments.length === 0) || isLoading}
                className={`
                  p-3 rounded-xl transition-all duration-200 flex items-center justify-center h-[46px] w-[46px]
                  ${(input.trim() || attachments.length > 0) && !isLoading
                    ? `text-slate-100 ${vibe === VibeMode.CHILL ? 'bg-emerald-600 hover:bg-emerald-500' : vibe === VibeMode.TEN_X ? 'bg-violet-600 hover:bg-violet-500' : 'bg-cyan-600 hover:bg-cyan-500'}` 
                    : 'text-slate-600 bg-slate-800/50 cursor-not-allowed'
                  }
                `}
              >
                {isLoading ? <Sparkles size={20} className="animate-spin" /> : <Send size={20} />}
              </button>
            </div>
          </div>
          
          <div className="absolute -bottom-6 left-0 right-0 text-center">
            <p className="text-[10px] text-slate-600">
              Vibe Code AI có thể mắc lỗi. Hãy kiểm tra mã được tạo trước khi chạy.
            </p>
          </div>
        </form>
      </footer>
    </div>
  );
};

export default App;