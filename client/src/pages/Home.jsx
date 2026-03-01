import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, PlusCircle, ShieldCheck, Shield, LayoutDashboard, TrendingUp, Users, Heart } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';

const Home = () => {
    const { user } = useAuth();
    const [stats, setStats] = useState({ lost: 0, found: 0, completed: 0 });

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const res = await api.get('stats');
                setStats(res.data);
            } catch (err) {
                console.error('Stats error:', err);
            }
        };
        fetchStats();
    }, []);

    return (
        <div className="flex flex-col gap-16">
            {/* Hero Section */}
            <section className="text-center py-20 px-4 bg-gradient-to-b from-indigo-50 to-white rounded-3xl mt-4 relative overflow-hidden">
                <div className="absolute top-0 right-0 -mr-20 -mt-20 w-64 h-64 bg-indigo-100 rounded-full blur-3xl opacity-50"></div>
                <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-64 h-64 bg-purple-100 rounded-full blur-3xl opacity-50"></div>

                <div className="relative z-10">
                    <h1 className="text-5xl md:text-7xl font-extrabold text-slate-900 tracking-tight mb-8">
                        Reuniting People with <br />
                        <span className="text-indigo-600">What Matters</span>
                    </h1>
                    <p className="text-xl text-slate-600 max-w-2xl mx-auto mb-12 font-medium">
                        The most advanced AI-powered platform to identify and claim lost items securely.
                        Privacy-first, community-driven.
                    </p>
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                        {user ? (
                            <Link to="/dashboard" className="flex items-center gap-2 px-10 py-5 bg-slate-900 text-white rounded-2xl font-bold text-lg hover:bg-slate-800 transition-all shadow-2xl hover:shadow-slate-200">
                                <LayoutDashboard size={24} />
                                View My Dashboard
                            </Link>
                        ) : (
                            <Link to="/report/lost" className="flex items-center gap-2 px-10 py-5 bg-indigo-600 text-white rounded-2xl font-bold text-lg hover:bg-indigo-700 transition-all shadow-xl hover:shadow-indigo-200">
                                <Search size={24} />
                                I Lost Something
                            </Link>
                        )}
                        <Link to="/report/found" className="flex items-center gap-2 px-10 py-5 bg-white text-indigo-600 border-2 border-indigo-100 rounded-2xl font-bold text-lg hover:border-indigo-300 hover:bg-indigo-50 transition-all shadow-sm">
                            <PlusCircle size={24} />
                            I Found Something
                        </Link>
                    </div>
                </div>
            </section>

            {/* Live Community Dashboard Section */}
            <section className="px-4">
                <div className="text-center mb-10">
                    <h2 className="text-sm font-bold text-indigo-600 uppercase tracking-widest mb-2">Live Community Dashboard</h2>
                    <p className="text-3xl font-black text-slate-900">Our Real-time Impact</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div className="bg-white p-10 rounded-3xl shadow-sm border border-slate-100 text-center group hover:border-indigo-200 transition-all">
                        <div className="mx-auto w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 mb-6 group-hover:scale-110 transition-transform">
                            <Search size={32} />
                        </div>
                        <h3 className="text-4xl font-black text-slate-900 mb-1">{stats.lost}</h3>
                        <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Active Searches</p>
                        <p className="text-slate-500 mt-4 text-sm font-medium">People currently looking for their missing items in the area.</p>
                    </div>

                    <div className="bg-white p-10 rounded-3xl shadow-sm border border-slate-100 text-center group hover:border-emerald-200 transition-all">
                        <div className="mx-auto w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600 mb-6 group-hover:scale-110 transition-transform">
                            <TrendingUp size={32} />
                        </div>
                        <h3 className="text-4xl font-black text-slate-900 mb-1">{stats.found}</h3>
                        <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Items Recovered</p>
                        <p className="text-slate-500 mt-4 text-sm font-medium">Verified items found by our community awaiting their owners.</p>
                    </div>

                    <div className="bg-white p-10 rounded-3xl shadow-sm border border-slate-100 text-center group hover:border-purple-200 transition-all">
                        <div className="mx-auto w-16 h-16 bg-purple-50 rounded-2xl flex items-center justify-center text-purple-600 mb-6 group-hover:scale-110 transition-transform">
                            <Heart size={32} />
                        </div>
                        <h3 className="text-4xl font-black text-slate-900 mb-1">{stats.completed}</h3>
                        <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Successful Reunions</p>
                        <p className="text-slate-500 mt-4 text-sm font-medium">Happy endings achieved through our AI-powered verification logic.</p>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default Home;
