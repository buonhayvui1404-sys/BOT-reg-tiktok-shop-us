import React from 'react';
import { Snippet } from '../types';
import { X, Trash2, Copy, BookOpen, Code, Plus } from 'lucide-react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

interface SnippetLibraryProps {
  isOpen: boolean;
  onClose: () => void;
  snippets: Snippet[];
  onDeleteSnippet: (id: string) => void;
  onUseSnippet: (code: string) => void;
}

const SnippetLibrary: React.FC<SnippetLibraryProps> = ({ 
  isOpen, 
  onClose, 
  snippets, 
  onDeleteSnippet,
  onUseSnippet
}) => {
  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 transition-opacity"
          onClick={onClose}
        />
      )}

      {/* Drawer */}
      <div className={`
        fixed top-0 right-0 h-full w-full sm:w-[400px] bg-slate-950 border-l border-slate-800 shadow-2xl z-50 transform transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : 'translate-x-full'}
      `}>
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-900/50">
            <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
              <BookOpen size={20} className="text-violet-400" />
              Thư viện Code
            </h2>
            <button 
              onClick={onClose}
              className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {snippets.length === 0 ? (
              <div className="text-center text-slate-500 mt-10">
                <Code size={48} className="mx-auto mb-4 opacity-20" />
                <p>Chưa có đoạn mã nào được lưu.</p>
                <p className="text-xs mt-2 opacity-60">Nhấn nút "Lưu" trên các khối code trong chat.</p>
              </div>
            ) : (
              snippets.map((snippet) => (
                <div key={snippet.id} className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-lg group">
                  <div className="px-3 py-2 bg-slate-800/50 border-b border-slate-800 flex justify-between items-center">
                    <span className="text-xs font-mono text-emerald-400 font-bold">{snippet.title}</span>
                    <span className="text-[10px] text-slate-500">{new Date(snippet.timestamp).toLocaleDateString()}</span>
                  </div>
                  
                  <div className="max-h-[150px] overflow-hidden relative">
                    <SyntaxHighlighter
                      style={vscDarkPlus}
                      language={snippet.language}
                      customStyle={{ margin: 0, padding: '0.75rem', fontSize: '0.7rem' }}
                    >
                      {snippet.code}
                    </SyntaxHighlighter>
                    {/* Fade out effect */}
                    <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-slate-900 to-transparent" />
                  </div>

                  <div className="p-2 flex gap-2 justify-end bg-slate-900/80 border-t border-slate-800">
                    <button 
                      onClick={() => onDeleteSnippet(snippet.id)}
                      className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-slate-800 rounded-md transition-colors"
                      title="Xóa"
                    >
                      <Trash2 size={14} />
                    </button>
                    <button 
                      onClick={() => {
                        onUseSnippet(snippet.code);
                        onClose();
                      }}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-violet-600/20 hover:bg-violet-600/40 text-violet-300 text-xs rounded-md transition-colors border border-violet-500/30"
                    >
                      <Plus size={14} />
                      Sử dụng
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default SnippetLibrary;