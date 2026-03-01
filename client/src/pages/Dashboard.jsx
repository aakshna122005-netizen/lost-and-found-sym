import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../utils/api';
import { Package, Shield, Search, ChevronRight, Clock, CheckCircle2, XCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Dashboard = () => {
    const { user } = useAuth();
    const [stats, setStats] = useState({ lostCount: 0, foundCount: 0, claimCount: 0 });
    const [recentLost, setRecentLost] = useState([]);
    const [recentClaims, setRecentClaims] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                // In a real app, these would be filtered by userId on backend
                const [lostRes, foundRes, claimsRes] = await Promise.all([
                    api.get('items/lost'),
                    api.get('items/found'),
                    api.get('claims/my-claims') // Assuming this exists or we add it
                ]);

                // Mocking filtering for demo if backend doesn't have it yet
                const myLost = lostRes.data.filter(i => i.userId === user.id);
                const myFound = foundRes.data.filter(i => i.finderId === user.id);

                setRecentLost(myLost);
                setRecentClaims(claimsRes.data || []);
                setStats({
                    lostCount: myLost.length,
                    foundCount: myFound.length,
                    claimCount: (claimsRes.data || []).length
                });
            } catch (err) {
                console.error('Error fetching dashboard data:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchDashboardData();
    }, [user.id]);

    if (loading) return <div className="p-8 text-center text-slate-500">Preparing your dashboard...</div>;

    const getStatusStyle = (status) => {
        switch (status) {
            case 'approved': return 'bg-green-100 text-green-700 border-green-200';
            case 'admin_review': return 'bg-amber-100 text-amber-700 border-amber-200';
            case 'completed': return 'bg-indigo-100 text-indigo-700 border-indigo-200';
            default: return 'bg-slate-100 text-slate-600 border-slate-200';
        }
    };

    return (
        <div className="max-w-6xl mx-auto px-4">
            <div className="mb-10">
                <h1 className="text-3xl font-extrabold text-slate-900">Welcome back, {user.username}!</h1>
                <p className="text-slate-500 font-medium">Here's what's happening with your items and claims.</p>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-4">
                    <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600">
                        <Search size={24} />
                    </div>
                    <div>
                        <p className="text-sm font-bold text-slate-400 uppercase tracking-wider">Lost Reports</p>
                        <p className="text-2xl font-black text-slate-900">{stats.lostCount}</p>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-4">
                    <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600">
                        <Package size={24} />
                    </div>
                    <div>
                        <p className="text-sm font-bold text-slate-400 uppercase tracking-wider">Found Reports</p>
                        <p className="text-2xl font-black text-slate-900">{stats.foundCount}</p>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-4">
                    <div className="w-12 h-12 bg-purple-50 rounded-2xl flex items-center justify-center text-purple-600">
                        <Shield size={24} />
                    </div>
                    <div>
                        <p className="text-sm font-bold text-slate-400 uppercase tracking-wider">Active Claims</p>
                        <p className="text-2xl font-black text-slate-900">{stats.claimCount}</p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                {/* My Lost Items */}
                <div>
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                            <Clock className="text-indigo-500" /> My Lost Reports
                        </h2>
                        <Link to="/report/lost" className="text-sm font-bold text-indigo-600 hover:text-indigo-700">+ New Report</Link>
                    </div>
                    <div className="space-y-4">
                        {recentLost.length === 0 ? (
                            <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-3xl p-8 text-center text-slate-400">
                                No lost items reported yet.
                            </div>
                        ) : recentLost.map(item => (
                            <Link key={item.id} to={`/matches/${item.id}`} className="block group bg-white p-4 rounded-2xl border border-slate-100 hover:border-indigo-200 transition-all shadow-sm">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center text-slate-400 overflow-hidden">
                                            {item.imageUrl ? <img src={`${import.meta.env.VITE_API_BASE_URL?.replace('/api', '')}/${item.imageUrl}`} className="w-full h-full object-cover" alt="" /> : <Package />}
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-slate-800">{item.itemName || item.category}</h4>
                                            <p className="text-xs text-slate-400">Reported {new Date(item.createdAt).toLocaleDateString()}</p>
                                        </div>
                                    </div>
                                    <ChevronRight className="text-slate-300 group-hover:text-indigo-500 transition-colors" />
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>

                {/* My Active Claims */}
                <div>
                    <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
                        <Shield className="text-emerald-500" /> My Ownership Claims
                    </h2>
                    <div className="space-y-4">
                        {recentClaims.length === 0 ? (
                            <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-3xl p-8 text-center text-slate-400">
                                No active claims in the system.
                            </div>
                        ) : recentClaims.map(claim => (
                            <Link key={claim.id} to={`/claim/${claim.id}`} className="block group bg-white p-5 rounded-2xl border border-slate-100 hover:border-indigo-200 transition-all shadow-sm">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h4 className="font-bold text-slate-800">Claim for {claim.foundItem.category}</h4>
                                        <div className={`mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold border uppercase tracking-wider ${getStatusStyle(claim.status)}`}>
                                            {claim.status === 'approved' && <CheckCircle2 size={12} />}
                                            {claim.status === 'rejected' && <XCircle size={12} />}
                                            {claim.status.replace('_', ' ')}
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Matched with</p>
                                        <p className="text-xs font-bold text-slate-700">#{claim.lostItemId}</p>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
