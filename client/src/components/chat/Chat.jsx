import { useState, useEffect } from 'react';
import api from '../../utils/api';
import { Send, ShieldCheck, Lock } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const Chat = ({ claimId }) => {
    const { user } = useAuth();
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchMessages = async () => {
            try {
                const res = await api.get(`/chat/${claimId}`);
                setMessages(res.data);
            } catch (err) {
                console.error('Failed to load chat', err);
            } finally {
                setLoading(false);
            }
        };

        fetchMessages();
        const intervalId = setInterval(fetchMessages, 5000); // Polling every 5 seconds
        return () => clearInterval(intervalId);
    }, [claimId]);

    const handleSend = async (e) => {
        e.preventDefault();
        if (!newMessage.trim()) return;

        try {
            const res = await api.post(`/chat/${claimId}`, { content: newMessage });
            setMessages([...messages, res.data]);
            setNewMessage('');
        } catch (err) {
            console.error(err);
            alert(err.response?.data?.error || 'Error sending message');
        }
    };

    if (loading) return <div className="text-center p-4">Loading secure chat...</div>;

    return (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col h-[500px]">
            <div className="bg-slate-900 text-white p-4 flex items-center gap-3">
                <ShieldCheck className="text-emerald-400" />
                <div>
                    <h3 className="font-bold">Secure Encrypted Chat</h3>
                    <p className="text-[10px] text-slate-400 flex items-center gap-1">
                        <Lock size={10} /> Contact info is hidden. Admin monitored.
                    </p>
                </div>
            </div>

            <div className="flex-1 p-4 overflow-y-auto bg-slate-50 space-y-4">
                {messages.length === 0 ? (
                    <div className="text-center text-slate-400 text-sm mt-10">
                        No messages yet. Say hello!
                    </div>
                ) : (
                    messages.map((msg, i) => {
                        const isMe = msg.senderId === user?.id;
                        return (
                            <div key={i} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                                <div className={`max-w-[70%] px-4 py-2 rounded-2xl ${isMe ? 'bg-indigo-600 text-white rounded-br-sm' : 'bg-white text-slate-800 border border-slate-200 rounded-bl-sm'}`}>
                                    {msg.content}
                                </div>
                                <span className="text-[10px] text-slate-400 mt-1 mx-1">
                                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                            </div>
                        );
                    })
                )}
            </div>

            <form onSubmit={handleSend} className="p-3 bg-white border-t border-slate-100 flex gap-2">
                <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type a message..."
                    className="flex-1 px-4 py-2 bg-slate-100 rounded-full text-sm outline-none focus:ring-2 focus:ring-indigo-100 transition-all"
                />
                <button type="submit" disabled={!newMessage.trim()} className="bg-indigo-600 text-white p-2 rounded-full hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                    <Send size={18} className="m-1" />
                </button>
            </form>
        </div>
    );
};

export default Chat;
