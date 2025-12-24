import React, { useState, useEffect, useRef } from 'react';
import { Send, Code2, Sparkles, Trash2, Paperclip, X, FileText, Image as ImageIcon } from 'lucide-react';
import { VibeMode, Message, VIBE_CONFIGS, Attachment } from './types';
import { sendMessageStream } from './services/geminiService';
import ChatMessage from './components/ChatMessage';
import VibeSelector from './components/VibeSelector';

const App: React.FC = () => {
  const [vibe, setVibe] = useState<VibeMode>(VibeMode.CHILL);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, attachments]);

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
    // Add a system notification in chat
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

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newAttachments: Attachment[] = [];
      const files: File[] = Array.from(e.target.files);

      for (const file of files) {
        try {
          // Check if image
          if (file.type.startsWith('image/')) {
             const base64 = await new Promise<string>((resolve) => {
               const reader = new FileReader();
               reader.onloadend = () => resolve(reader.result as string);
               reader.readAsDataURL(file);
             });
             // Strip prefix "data:image/png;base64,"
             const content = base64.split(',')[1];
             newAttachments.push({
               id: Math.random().toString(36).substring(7),
               type: 'image',
               content: content,
               mimeType: file.type,
               fileName: file.name
             });
          } else {
             // Assume text/code
             const text = await new Promise<string>((resolve) => {
               const reader = new FileReader();
               reader.onload = () => resolve(reader.result as string);
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
      // Reset input
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const removeAttachment = (id: string) => {
    setAttachments(prev => prev.filter(a => a.id !== id));
  };

  const handleSubmit = async (e: React.FormEvent) => {
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
    setAttachments([]); // Clear attachments after sending
    setIsLoading(true);

    // Create a placeholder message for streaming
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
      // Refocus input for speed
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  };

  const activeConfig = VIBE_CONFIGS[vibe];
  // Determine gradient based on vibe
  let bgGradient = "from-slate-900 via-slate-900 to-emerald-900/20";
  if (vibe === VibeMode.TEN_X) bgGradient = "from-slate-900 via-slate-900 to-violet-900/20";
  if (vibe === VibeMode.CYBERPUNK) bgGradient = "from-slate-900 via-slate-900 to-cyan-900/20";

  return (
    <div className={`flex flex-col h-screen bg-slate-950 text-slate-200 overflow-hidden font-sans selection:bg-${activeConfig.themeColor.split('-')[1]}-500/30`}>
      
      {/* Background Ambience */}
      <div className={`absolute inset-0 bg-gradient-to-br ${bgGradient} opacity-50 pointer-events-none z-0 transition-colors duration-1000`} />
      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 pointer-events-none z-0" />

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
        
        <button 
          onClick={handleClear}
          className="p-2 text-slate-500 hover:text-red-400 hover:bg-red-950/30 rounded-lg transition-colors"
          title="Xóa lịch sử"
        >
          <Trash2 size={18} />
        </button>
      </header>

      {/* Main Chat Area */}
      <main className="relative z-10 flex-1 overflow-y-auto p-4 md:p-8 flex flex-col items-center">
        <div className="w-full max-w-4xl flex-1 flex flex-col">
          
          <VibeSelector currentVibe={vibe} onVibeChange={handleVibeChange} />

          <div className="flex-1 min-h-[200px]">
             {messages.map((msg) => (
               <ChatMessage key={msg.id} message={msg} vibe={vibe} />
             ))}
             <div ref={messagesEndRef} className="h-4" />
          </div>

        </div>
      </main>

      {/* Input Area */}
      <footer className="relative z-20 p-4 md:p-6 bg-slate-950/80 backdrop-blur-xl border-t border-slate-800/60 flex flex-col items-center">
        
        {/* Attachment Previews */}
        {attachments.length > 0 && (
          <div className="w-full max-w-4xl flex flex-wrap gap-2 mb-3">
            {attachments.map(att => (
              <div key={att.id} className="group relative flex items-center gap-2 bg-slate-900 border border-slate-700 rounded-lg pl-2 pr-8 py-1.5 text-xs text-slate-300 shadow-lg animate-fadeIn">
                 {att.type === 'image' ? <ImageIcon size={14} className="text-purple-400" /> : <FileText size={14} className="text-blue-400" />}
                 <span className="truncate max-w-[150px]">{att.fileName}</span>
                 <button 
                  onClick={() => removeAttachment(att.id)}
                  className="absolute right-1 top-1/2 -translate-y-1/2 p-1 hover:text-red-400 transition-colors rounded-full"
                >
                  <X size={14} />
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
          
          <div className="relative flex items-center bg-slate-900 rounded-2xl border border-slate-800 shadow-xl overflow-hidden">
            
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleFileSelect} 
              className="hidden" 
              multiple 
            />
            
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="pl-4 pr-2 text-slate-500 hover:text-slate-200 transition-colors"
              title="Đính kèm file hoặc ảnh"
            >
              <Paperclip size={20} />
            </button>

            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={`Hỏi bất cứ điều gì... (Chế độ ${activeConfig.label})`}
              className="flex-1 bg-transparent px-2 py-4 text-slate-200 placeholder-slate-500 focus:outline-none font-medium"
              disabled={isLoading}
            />
            <div className="pr-2 flex items-center gap-1">
              <button 
                type="submit"
                disabled={(!input.trim() && attachments.length === 0) || isLoading}
                className={`
                  p-3 rounded-xl transition-all duration-200 flex items-center justify-center
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