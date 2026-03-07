import { useState, useEffect, useRef } from 'react';
import api from '../../utils/api';
import { Send, ShieldCheck, Lock, Wifi } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const Chat = ({ claimId }) => {
    const { user } = useAuth();
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [sending, setSending] = useState(false);
    const [online, setOnline] = useState(true);
    const bottomRef = useRef(null);

    const fetchMessages = async () => {
        try {
            const res = await api.get(`chat/${claimId}`);
            setMessages(res.data);
            setOnline(true);
        } catch (err) {
            setOnline(false);
            console.error('Chat fetch error:', err.message);
        }
    };

    useEffect(() => {
        fetchMessages();
        // Poll every 3 seconds for new messages
        const interval = setInterval(fetchMessages, 3000);
        return () => clearInterval(interval);
    }, [claimId]);

    // Auto-scroll to bottom when new messages arrive
    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSend = async (e) => {
        e.preventDefault();
        if (!newMessage.trim() || sending) return;

        setSending(true);
        const optimisticMsg = {
            id: Date.now(),
            senderId: user?.id,
            content: newMessage,
            timestamp: new Date().toISOString(),
            pending: true
        };
        setMessages(prev => [...prev, optimisticMsg]);
        setNewMessage('');

        try {
            await api.post(`chat/${claimId}`, { content: optimisticMsg.content });
            await fetchMessages(); // Refresh to get server-confirmed messages
        } catch (err) {
            // Remove optimistic message on failure
            setMessages(prev => prev.filter(m => m.id !== optimisticMsg.id));
            setNewMessage(optimisticMsg.content);
            alert(err.response?.data?.error || 'Failed to send message');
        } finally {
            setSending(false);
        }
    };

    return (
        <div className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden flex flex-col" style={{ height: '480px' }}>
            {/* Chat Header */}
            <div className="bg-gradient-to-r from-slate-900 to-indigo-900 text-white px-5 py-4 flex items-center justify-between flex-shrink-0">
                <div className="flex items-center gap-3">
                    <ShieldCheck className="text-emerald-400" size={22} />
                    <div>
                        <h3 className="font-bold text-sm">Secure Encrypted Chat</h3>
                        <p className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                            <Lock size={9} /> End-to-end encrypted · Contact info hidden
                        </p>
                    </div>
                </div>
                <div className={`flex items-center gap-1.5 text-[10px] font-bold px-2 py-1 rounded-full ${online ? 'bg-emerald-500/20 text-emerald-300' : 'bg-red-500/20 text-red-300'}`}>
                    <Wifi size={10} />
                    {online ? 'Live' : 'Offline'}
                </div>
            </div>

            {/* Messages */}
            <div className="flex-1 p-4 overflow-y-auto bg-slate-50 space-y-3">
                {messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center">
                        <ShieldCheck size={40} className="text-slate-200 mb-3" />
                        <p className="text-slate-400 text-sm font-medium">Chat is open!</p>
                        <p className="text-slate-300 text-xs mt-1">Send a message to coordinate the return.</p>
                    </div>
                ) : (
                    messages.map((msg, i) => {
                        const isMe = msg.senderId === user?.id;
                        return (
                            <div key={msg.id || i} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                                <div className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed
                                    ${isMe
                                        ? `bg-indigo-600 text-white rounded-br-none ${msg.pending ? 'opacity-60' : ''}`
                                        : 'bg-white text-slate-800 border border-slate-200 rounded-bl-none shadow-sm'
                                    }`}>
                                    {msg.content}
                                </div>
                                <span className="text-[10px] text-slate-400 mt-1 mx-2">
                                    {isMe ? 'You' : 'Other'} · {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    {msg.pending && ' · sending...'}
                                </span>
                            </div>
                        );
                    })
                )}
                <div ref={bottomRef} />
            </div>

            {/* Input */}
            <form onSubmit={handleSend} className="p-3 bg-white border-t border-slate-100 flex gap-2 flex-shrink-0">
                <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type a message..."
                    className="flex-1 px-4 py-2.5 bg-slate-100 rounded-full text-sm outline-none focus:ring-2 focus:ring-indigo-200 transition-all"
                    onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(e); } }}
                />
                <button
                    type="submit"
                    disabled={!newMessage.trim() || sending}
                    className="bg-indigo-600 text-white p-2.5 rounded-full hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                >
                    <Send size={17} />
                </button>
            </form>
        </div>
    );
};

export default Chat;
