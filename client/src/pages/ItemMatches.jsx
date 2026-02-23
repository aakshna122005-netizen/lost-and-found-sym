import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../utils/api';
import { Shield, MessageSquare, MapPin } from 'lucide-react';

const ItemMatches = () => {
    const { itemId } = useParams();
    const [matches, setMatches] = useState([]);
    const [loading, setLoading] = useState(true);
    const [verifying, setVerifying] = useState(null); // Found Item ID to claim
    const [answers, setAnswers] = useState({ description: '', marks: '', inventory: '' });

    useEffect(() => {
        const fetchMatches = async () => {
            try {
                const res = await api.post(`/matches/match/${itemId}`, {});
                setMatches(res.data.matches); // Expects [{ foundItem, score, details }]
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchMatches();
    }, [itemId]);

    const handleClaim = (foundItemId) => {
        setVerifying(foundItemId);
    };

    const handleAnswerChange = (e) => {
        setAnswers({ ...answers, [e.target.name]: e.target.value });
    };

    const submitVerification = async (e) => {
        e.preventDefault();
        try {
            // 1. Init Claim
            const claimRes = await api.post('/claims/init', {
                lostItemId: itemId,
                foundItemId: verifying
            });

            // 2. Submit Answers
            await api.post(`/claims/verify/${claimRes.data.id}`, {
                detailedDescription: answers.description,
                secretMarks: answers.marks,
                contentInventory: answers.inventory
            });

            alert('Verification Submitted! The finder and admin have been notified.');
            setVerifying(null);
            setAnswers({ description: '', marks: '', inventory: '' });
        } catch (err) {
            console.error(err);
            alert('Error submitting claim');
        }
    };

    if (loading) return <div className="p-8 text-center text-slate-500">Scanning for matches...</div>;

    return (
        <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold text-slate-900 mb-6">Potential Matches Found</h2>

            {matches.length === 0 ? (
                <div className="bg-white p-8 rounded-xl shadow-sm text-center">
                    <p className="text-slate-600">No matches found yet. We will notify you when something similar is reported.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-6">
                    {matches.map(m => {
                        const { foundItem, score, details } = m;
                        return (
                            <div key={foundItem.id} className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex flex-col md:flex-row gap-6">
                                <div className="w-full md:w-48 h-48 bg-slate-100 rounded-lg overflow-hidden flex-shrink-0">
                                    {foundItem.imageUrl ? (
                                        <img src={`${import.meta.env.VITE_API_BASE_URL?.replace('/api', '') || 'http://localhost:5000'}/${foundItem.imageUrl}`} alt="Found Item" className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-slate-400">No Image</div>
                                    )}
                                </div>
                                <div className="flex-1">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <h3 className="text-xl font-bold text-slate-800">{foundItem.category}</h3>
                                            <p className="text-slate-500 text-sm flex items-center gap-1 mt-1">
                                                <MapPin size={16} /> Location: {foundItem.locationFound || 'Nearby'}
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <span className={`px-3 py-1 rounded-full text-xs font-bold ${score > 70 ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                                                {score}% Match
                                            </span>
                                            <div className="text-xs text-slate-400 mt-1">
                                                {Object.keys(details).map(k => (
                                                    <div key={k}>{k}: {details[k]}</div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>

                                    <p className="mt-4 text-slate-600">
                                        <span className="font-semibold">Condition:</span> {foundItem.condition || 'Unknown'} <br />
                                        <span className="font-semibold">Storage:</span> {foundItem.storagePlace || 'Unknown'}
                                    </p>

                                    <div className="mt-6 flex gap-3">
                                        <button onClick={() => handleClaim(foundItem.id)} className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-indigo-700">
                                            <Shield size={18} /> This is mine
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )
                    })}
                </div>
            )}

            {verifying && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white p-8 rounded-2xl max-w-md w-full">
                        <h3 className="text-2xl font-bold mb-4">Verify Ownership</h3>
                        <p className="text-slate-600 mb-4 text-sm">To prevent fraud, please answer specific questions only the owner would know.</p>
                        <form onSubmit={submitVerification} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Detailed Description</label>
                                <textarea name="description" onChange={handleAnswerChange} className="w-full border rounded-lg px-4 py-2" required placeholder="Describe contents, unique features..."></textarea>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Unique Marks / Scratches</label>
                                <input type="text" name="marks" onChange={handleAnswerChange} className="w-full border rounded-lg px-4 py-2" required placeholder="Safety pin on strap, etc." />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">What's inside?</label>
                                <input type="text" name="inventory" onChange={handleAnswerChange} className="w-full border rounded-lg px-4 py-2" required placeholder="3 books, blue bottle..." />
                            </div>
                            <div className="flex justify-end gap-2 mt-6">
                                <button type="button" onClick={() => setVerifying(null)} className="px-4 py-2 text-slate-500 font-medium">Cancel</button>
                                <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium">Submit Verification</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ItemMatches;
