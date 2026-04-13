import React, { useState, useRef, useEffect, useMemo } from 'react';
import { 
  RiRobotLine, 
  RiCloseLine, 
  RiSendPlaneFill, 
  RiDeleteBin7Line, 
  RiAddLine, 
  RiChat3Line, 
  RiUser3Line,
  RiMagicLine,
  RiHistoryLine
} from 'react-icons/ri';
import axios from 'axios';
import { Dialog, Transition } from '@headlessui/react';

const ChatBot = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [conversations, setConversations] = useState([]);
    const [currentChatId, setCurrentChatId] = useState(null);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const scrollRef = useRef(null);

    // Load conversations from LocalStorage
    useEffect(() => {
        const stored = localStorage.getItem('nestify_chats');
        if (stored) {
            const parsed = JSON.parse(stored);
            setConversations(parsed);
            if (parsed.length > 0) setCurrentChatId(parsed[0].id);
        } else {
            // Create initial chat
            const newChat = { 
                id: Date.now(), 
                title: 'New Chat', 
                messages: [{ role: 'assistant', content: 'Hello! I am NestifyAI. How can I help you today?' }] 
            };
            setConversations([newChat]);
            setCurrentChatId(newChat.id);
        }
    }, [isOpen]);

    // Save conversations to LocalStorage whenever they change
    useEffect(() => {
        if (conversations.length > 0) {
            localStorage.setItem('nestify_chats', JSON.stringify(conversations));
        }
    }, [conversations]);

    const activeChat = useMemo(() => 
        conversations.find(c => c.id === currentChatId) || conversations[0],
    [conversations, currentChatId]);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [activeChat, loading]);

    const startNewChat = () => {
        const newChat = {
            id: Date.now(),
            title: 'New Chat',
            messages: [{ role: 'assistant', content: 'How can I assist you with your project today?' }]
        };
        setConversations(prev => [newChat, ...prev]);
        setCurrentChatId(newChat.id);
    };

    const handleSend = async () => {
        if (!input.trim() || loading) return;

        const userMsg = { role: 'user', content: input };
        const updatedChat = { ...activeChat, messages: [...activeChat.messages, userMsg] };
        
        // Update title if it's the first real question
        if (activeChat.messages.length <= 1) {
            updatedChat.title = input.slice(0, 30) + (input.length > 30 ? '...' : '');
        }

        setConversations(prev => prev.map(c => c.id === currentChatId ? updatedChat : c));
        setInput('');
        setLoading(true);

        try {
            const response = await axios.post(route('ai.generate.text'), {
                type: 'chatbot',
                requiredFieldsValue: {
                    message: input,
                    history: updatedChat.messages.slice(-6).map(m => `${m.role}: ${m.content}`).join('\n')
                }
            });

            if (response.data.status === 'success') {
                const assistantMsg = { role: 'assistant', content: response.data.text };
                setConversations(prev => prev.map(c => 
                    c.id === currentChatId ? { ...c, messages: [...c.messages, assistantMsg] } : c
                ));
            }
        } catch (err) {
            console.error('AI Error:', err);
        } finally {
            setLoading(false);
        }
    };

    const deleteChat = (id) => {
        const filtered = conversations.filter(c => c.id !== id);
        setConversations(filtered);
        if (currentChatId === id && filtered.length > 0) {
            setCurrentChatId(filtered[0].id);
        } else if (filtered.length === 0) {
            startNewChat();
        }
    };

    return (
        <>
            {/* Toggle Button */}
            <button
                onClick={() => setIsOpen(true)}
                className="fixed bottom-6 right-6 bg-primary p-4 rounded-full shadow-2xl hover:scale-110 active:scale-95 transition-all z-[999]"
            >
                <RiRobotLine className="text-white text-2xl" />
            </button>

            <Transition show={isOpen} as={React.Fragment}>
                <Dialog as="div" className="relative z-[1000]" onClose={() => setIsOpen(false)}>
                    <Transition.Child
                        as={React.Fragment}
                        enter="ease-out duration-300"
                        enterFrom="opacity-0"
                        enterTo="opacity-100"
                        leave="ease-in duration-200"
                        leaveFrom="opacity-100"
                        leaveTo="opacity-0"
                    >
                        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" />
                    </Transition.Child>

                    <div className="fixed inset-0 overflow-y-auto">
                        <div className="flex min-h-full items-center justify-center p-4">
                            <Transition.Child
                                as={React.Fragment}
                                enter="ease-out duration-300"
                                enterFrom="opacity-0 scale-95"
                                enterTo="opacity-100 scale-100"
                                leave="ease-in duration-200"
                                leaveFrom="opacity-100 scale-100"
                                leaveTo="opacity-0 scale-95"
                            >
                                <Dialog.Panel className="w-full max-w-6xl h-[85vh] bg-[#25293c] border border-white/5 rounded-2xl shadow-2xl flex overflow-hidden">
                                    {/* Sidebar */}
                                    <div className="w-64 bg-accent/50 border-r border-white/5 flex flex-col p-4">
                                        <button 
                                            onClick={startNewChat}
                                            className="w-full border border-white/10 hover:bg-white/5 text-heading py-2.5 rounded-lg flex items-center justify-center gap-2 text-sm font-medium transition-all mb-6"
                                        >
                                            <RiAddLine /> New Chat
                                        </button>
                                        
                                        <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                                            <p className='text-[10px] text-res/40 font-bold uppercase tracking-widest pl-2 mb-2'>Recent Chats</p>
                                            {conversations.map(chat => (
                                                <div 
                                                    key={chat.id}
                                                    onClick={() => setCurrentChatId(chat.id)}
                                                    className={`group flex items-center justify-between p-2.5 rounded-lg cursor-pointer transition-colors ${currentChatId === chat.id ? 'bg-primary/20 text-primary border border-primary/20' : 'text-res hover:bg-white/5'}`}
                                                >
                                                    <div className="flex items-center gap-3 overflow-hidden">
                                                        <RiChat3Line className="flex-shrink-0" />
                                                        <span className="text-sm truncate font-medium">{chat.title}</span>
                                                    </div>
                                                    <RiDeleteBin7Line 
                                                        onClick={(e) => { e.stopPropagation(); deleteChat(chat.id); }}
                                                        className="size-3.5 opacity-0 group-hover:opacity-60 hover:!opacity-100 text-res hover:text-red-500" 
                                                    />
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Chat Area */}
                                    <div className="flex-1 flex flex-col relative bg-[#252a41]/20">
                                        {/* Top Bar */}
                                        <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <RiMagicLine className="text-primary text-xl" />
                                                <h3 className="text-heading font-bold">{activeChat?.title || 'Nestify AI'}</h3>
                                            </div>
                                            <button 
                                                onClick={() => setIsOpen(false)}
                                                className="p-1.5 hover:bg-white/10 rounded-lg text-res transition-colors"
                                            >
                                                <RiCloseLine className="text-xl" />
                                            </button>
                                        </div>

                                        {/* Messages Area */}
                                        <div 
                                            ref={scrollRef}
                                            className="flex-1 overflow-y-auto p-4 md:px-24 space-y-8 scroll-hidden"
                                        >
                                            {activeChat?.messages.map((msg, i) => (
                                                <div key={i} className={`flex gap-4 animate-in fade-in slide-in-from-bottom-2 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                                                    <div className={`mt-1 size-8 rounded-lg flex items-center justify-center shrink-0 border ${
                                                        msg.role === 'user' 
                                                        ? 'bg-primary border-primary shadow-lg shadow-primary/20' 
                                                        : 'bg-accent border-white/5 shadow-md'
                                                    }`}>
                                                        {msg.role === 'user' ? <RiUser3Line className='text-white' /> : <RiRobotLine className='text-primary' />}
                                                    </div>
                                                    <div className={`flex flex-col gap-2 max-w-[85%] ${msg.role === 'user' ? 'items-end' : ''}`}>
                                                        <span className='text-[11px] font-bold text-res/50 uppercase tracking-widest'>{msg.role === 'assistant' ? 'NestifyAI' : 'You'}</span>
                                                        <div className={`p-4 rounded-2xl text-[15px] leading-relaxed whitespace-pre-wrap ${
                                                            msg.role === 'user' 
                                                            ? 'bg-primary/10 text-heading rounded-tr-none' 
                                                            : 'bg-[#2f3349] text-[#cfcde4] rounded-tl-none border border-white/5 shadow-xl'
                                                        }`}>
                                                            {msg.content}
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                            {loading && (
                                                <div className="flex gap-4">
                                                    <div className="size-8 rounded-lg bg-accent border border-white/5 flex items-center justify-center">
                                                        <RiRobotLine className='text-primary animate-pulse' />
                                                    </div>
                                                    <div className="flex items-center gap-1.5 px-4 py-3 bg-[#2f3349] rounded-2xl rounded-tl-none border border-white/5">
                                                        <span className="size-1.5 bg-primary rounded-full animate-bounce [animation-delay:0s]"></span>
                                                        <span className="size-1.5 bg-primary rounded-full animate-bounce [animation-delay:0.2s]"></span>
                                                        <span className="size-1.5 bg-primary rounded-full animate-bounce [animation-delay:0.4s]"></span>
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        {/* Input Area */}
                                        <div className="px-6 pb-8 pt-4 md:px-32">
                                            <div className="relative group">
                                                <div className="absolute inset-0 bg-primary/20 blur-xl opacity-0 group-focus-within:opacity-20 transition-opacity rounded-full"></div>
                                                <div className="relative flex items-end gap-2 bg-[#2f3349] border border-white/10 rounded-2xl p-2 px-4 shadow-2xl focus-within:border-primary/50 transition-all">
                                                    <textarea
                                                        rows={1}
                                                        placeholder="Send a message..."
                                                        className="flex-1 bg-transparent border-none focus:ring-0 text-[15px] py-3 text-heading placeholder:text-res/30 resize-none max-h-32 scroll-hidden"
                                                        value={input}
                                                        onChange={(e) => {
                                                            setInput(e.target.value);
                                                            e.target.style.height = 'auto';
                                                            e.target.style.height = e.target.scrollHeight + 'px';
                                                        }}
                                                        onKeyDown={(e) => {
                                                            if (e.key === 'Enter' && !e.shiftKey) {
                                                                e.preventDefault();
                                                                handleSend();
                                                            }
                                                        }}
                                                    />
                                                    <button 
                                                        onClick={handleSend}
                                                        disabled={loading || !input.trim()}
                                                        className={`p-2.5 rounded-xl transition-all mb-0.5 ${input.trim() ? 'bg-primary text-white shadow-lg shadow-primary/30' : 'bg-white/5 text-res/30'}`}
                                                    >
                                                        <RiSendPlaneFill className="text-xl" />
                                                    </button>
                                                </div>
                                            </div>
                                            <p className='text-[10px] text-center text-res/30 mt-4 font-medium uppercase tracking-[0.2em]'>
                                                Nestify AI - Enhanced for Project Management
                                            </p>
                                        </div>
                                    </div>
                                </Dialog.Panel>
                            </Transition.Child>
                        </div>
                    </div>
                </Dialog>
            </Transition>
        </>
    );
};

export default ChatBot;
