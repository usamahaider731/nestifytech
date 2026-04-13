import React, { useState, useRef, useEffect } from 'react';
import { RiMessage3Line, RiCloseLine, RiSendPlaneFill, RiRobotLine } from 'react-icons/ri';
import axios from 'axios';

const FrontendChatBot = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([
        { role: 'assistant', content: 'Hi there! 👋 How can I help you today? I can help you find products or answer questions about our store.' }
    ]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const scrollRef = useRef(null);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    const handleSend = async () => {
        if (!input.trim() || loading) return;

        const userMsg = { role: 'user', content: input };
        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setLoading(true);

        try {
            const response = await axios.post('/ai/generate/text', {
                type: 'chatbot',
                requiredFieldsValue: {
                    message: input,
                    history: messages.slice(-4).map(m => `${m.role}: ${m.content}`).join('\n')
                }
            });

            if (response.data.status === 'success') {
                setMessages(prev => [...prev, { role: 'assistant', content: response.data.text }]);
            } else {
                setMessages(prev => [...prev, { role: 'assistant', content: 'I am sorry, but I am having trouble connecting right now.' }]);
            }
        } catch (error) {
            setMessages(prev => [...prev, { role: 'assistant', content: 'Under maintenance. Please try again later.' }]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed bottom-6 right-6 z-[2000] font-sans">
            {/* Bubble */}
            {!isOpen && (
                <button 
                    onClick={() => setIsOpen(true)}
                    className="bg-primary hover:bg-primary/90 text-white p-4 rounded-full shadow-2xl transition-transform hover:scale-110 active:scale-95 flex items-center justify-center"
                >
                    <RiMessage3Line className="text-2xl" />
                </button>
            )}

            {/* Window */}
            {isOpen && (
                <div className="w-[350px] sm:w-[400px] h-[500px] bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-gray-100 animate-in slide-in-from-bottom-5 duration-300">
                    {/* Header */}
                    <div className="bg-primary p-4 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="size-10 bg-white/20 rounded-full flex items-center justify-center">
                                <RiRobotLine className="text-white text-xl" />
                            </div>
                            <div>
                                <h4 className="text-white font-bold text-sm leading-none">Nestify Assistant</h4>
                                <p className="text-white/70 text-[10px] mt-1 flex items-center gap-1">
                                    <span className="size-1.5 bg-green-400 rounded-full"></span> Online
                                </p>
                            </div>
                        </div>
                        <button onClick={() => setIsOpen(false)} className="text-white/80 hover:text-white">
                            <RiCloseLine className="text-2xl" />
                        </button>
                    </div>

                    {/* Messages */}
                    <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50 scroll-hidden">
                        {messages.map((msg, i) => (
                            <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-[85%] p-3 rounded-2xl text-sm ${
                                    msg.role === 'user' 
                                    ? 'bg-primary text-white rounded-tr-none' 
                                    : 'bg-white text-gray-800 shadow-sm border border-gray-100 rounded-tl-none'
                                }`}>
                                    {msg.content}
                                </div>
                            </div>
                        ))}
                        {loading && (
                            <div className="flex justify-start">
                                <div className="bg-white p-3 rounded-2xl rounded-tl-none border border-gray-100 flex gap-1">
                                    <span className="size-1.5 bg-primary/40 rounded-full animate-bounce"></span>
                                    <span className="size-1.5 bg-primary/40 rounded-full animate-bounce [animation-delay:0.2s]"></span>
                                    <span className="size-1.5 bg-primary/40 rounded-full animate-bounce [animation-delay:0.4s]"></span>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="p-4 bg-white border-t border-gray-100">
                        <div className="flex items-center gap-2 bg-gray-100 rounded-xl px-4 py-1 border border-transparent focus-within:bg-white focus-within:border-primary/20 transition-all">
                            <input 
                                type="text" 
                                placeholder="Type your message..."
                                className="flex-1 bg-transparent border-none focus:ring-0 text-sm py-2 text-gray-700"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                            />
                            <button 
                                onClick={handleSend}
                                disabled={loading || !input.trim()}
                                className={`p-1.5 transition-colors ${input.trim() ? 'text-primary' : 'text-gray-400'}`}
                            >
                                <RiSendPlaneFill className="text-xl" />
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default FrontendChatBot;
