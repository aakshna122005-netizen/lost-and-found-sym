import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../utils/api';
import { Shield, Check, X } from 'lucide-react';

const ClaimVerification = () => {
    const { claimId } = useParams();
    const [claim, setClaim] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchClaim = async () => {
            try {
                const res = await api.get(`/claims/${claimId}`);
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

    return (
        <div className="max-w-2xl mx-auto bg-white p-8 rounded-2xl shadow-sm border border-slate-100">
            <div className="flex items-center justify-between mb-8">
                <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                    <Shield className="text-indigo-600" /> Ownership Verification
                </h1>
                <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm font-bold capitalize">{claim.status}</span>
            </div>

            <div className="space-y-8">
                <div className="bg-slate-50 p-6 rounded-xl">
                    <h2 className="font-bold text-slate-800 mb-4 border-b pb-2">Information Provided by Claimant</h2>
                    <div className="space-y-4">
                        <div>
                            <label className="text-xs font-bold text-slate-500 uppercase">Detailed Description</label>
                            <p className="text-slate-900 mt-1">{verificationData.detailedDescription}</p>
                        </div>
                        <div>
                            <label className="text-xs font-bold text-slate-500 uppercase">Secret Marks</label>
                            <p className="text-slate-900 mt-1">{verificationData.secretMarks}</p>
                        </div>
                        <div>
                            <label className="text-xs font-bold text-slate-500 uppercase">Inventory (What's Inside)</label>
                            <p className="text-slate-900 mt-1">{verificationData.contentInventory}</p>
                        </div>
                    </div>
                </div>

                <div className="flex gap-4">
                    <button onClick={() => handleAction('approve')} className="flex-1 bg-green-600 text-white py-3 rounded-lg font-bold hover:bg-green-700 flex items-center justify-center gap-2">
                        <Check /> Approve Claim & Release Item
                    </button>
                    <button onClick={() => handleAction('reject')} className="flex-1 bg-red-600 text-white py-3 rounded-lg font-bold hover:bg-red-700 flex items-center justify-center gap-2">
                        <X /> Reject Claim
                    </button>
                </div>

                <p className="text-center text-xs text-slate-400">
                    Warning: Do not release the item unless you are 100% sure. Check ID proof in person if meeting.
                </p>
            </div>
        </div>
    );
};

export default ClaimVerification;
