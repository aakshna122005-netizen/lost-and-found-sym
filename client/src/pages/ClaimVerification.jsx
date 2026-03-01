import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../utils/api';
import { Shield, Check, X, Clock } from 'lucide-react';
import Chat from '../components/chat/Chat';
import { useAuth } from '../context/AuthContext';

const ClaimVerification = () => {
    const { claimId } = useParams();
    const { user } = useAuth();
    const [claim, setClaim] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchClaim = async () => {
            try {
                const res = await api.get(`claims/${claimId}`);
                setClaim(res.data);
            } catch (err) {
                console.error(err);
                alert('Error loading claim');
            } finally {
                setLoading(false);
            }
        };
        fetchClaim();
    }, [claimId]);

    const handleAction = async (action) => {
        try {
            const res = await api.post(`/admin/claims/${claimId}/action`, { action });
            alert(res.data.message);
            // Refresh claim data
            const updatedClaim = await api.get(`/claims/${claimId}`);
            setClaim(updatedClaim.data);
        } catch (err) {
            console.error(err);
            alert(err.response?.data?.error || 'Error performing action');
        }
    };

    if (loading) return <div className="p-8 text-center">Loading Verification Data...</div>;
    if (!claim) return <div className="p-8 text-center">Claim not found</div>;

    const verificationData = claim.verificationData ? JSON.parse(claim.verificationData) : {};
    const baseUrl = import.meta.env.VITE_API_BASE_URL?.replace('/api', '') || 'http://localhost:5000';

    return (
        <div className="max-w-2xl mx-auto bg-white p-8 rounded-2xl shadow-sm border border-slate-100">
            <div className="flex items-center justify-between mb-8">
                <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                    <Shield className="text-indigo-600" /> Administrative Review
                </h1>
                <span className={`px-3 py-1 rounded-full text-sm font-bold capitalize ${claim.status === 'approved' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                    }`}>{claim.status.replace('_', ' ')}</span>
            </div>

            <div className="space-y-8">
                {/* Image Section: Reveal logic */}
                <div className="bg-slate-100 rounded-xl p-2 aspect-video overflow-hidden">
                    <img
                        src={`${baseUrl}/${claim.status === 'approved' ? `api/images/original/${claim.foundItemId}` : claim.foundItem.imageUrl}`}
                        alt="Item evidence"
                        className="w-full h-full object-contain"
                    />
                    <p className="text-[10px] text-center text-slate-400 mt-1">
                        {claim.status === 'approved' ? '🔓 Full Detail Revealed' : '🔒 Privacy Mask Applied'}
                    </p>
                </div>

                <div className="bg-slate-50 p-6 rounded-xl border border-slate-100">
                    <h2 className="font-bold text-slate-800 mb-4 border-b pb-2">Claimant Proof</h2>
                    <div className="space-y-4">
                        <div>
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Description provided</label>
                            <p className="text-slate-900 mt-1 text-sm">{verificationData.detailedDescription}</p>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Secret Marks</label>
                                <p className="text-slate-900 mt-1 text-sm">{verificationData.secretMarks}</p>
                            </div>
                            <div>
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Contents</label>
                                <p className="text-slate-900 mt-1 text-sm">{verificationData.contentInventory}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {claim.status === 'admin_review' && user?.role === 'admin' && (
                    <div className="flex gap-4 pt-4 border-t">
                        <button onClick={() => handleAction('approve')} className="flex-1 bg-green-600 text-white py-4 rounded-xl font-bold hover:bg-green-700 shadow-md transition-all active:scale-95 flex items-center justify-center gap-2">
                            <Check size={20} /> Approve & Reveal
                        </button>
                        <button onClick={() => handleAction('reject')} className="flex-1 bg-white text-red-600 border-2 border-red-600 py-4 rounded-xl font-bold hover:bg-red-50 transition-all active:scale-95 flex items-center justify-center gap-2">
                            <X size={20} /> Reject Claim
                        </button>
                    </div>
                )}

                {claim.status === 'admin_review' && user?.role !== 'admin' && (
                    <div className="bg-amber-50 p-4 rounded-xl text-amber-700 font-bold flex items-center gap-2 justify-center">
                        <Clock size={20} /> Awaiting Admin Approval
                    </div>
                )}

                {claim.status === 'approved' && (
                    <div className="space-y-6 pt-4 border-t">
                        <div className="bg-green-50 p-4 rounded-xl text-green-700 text-center font-bold">
                            Verification Complete. Communication channel is now open.
                        </div>
                        <Chat claimId={claim.id} />
                    </div>
                )}

                <p className="text-center text-[10px] text-slate-400 px-4">
                    Security Policy: Identification must be verified in person during handover. Releasing item signifies transfer of liability.
                </p>
            </div>
        </div>
    );
};

export default ClaimVerification;
