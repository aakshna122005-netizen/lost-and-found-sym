import { Link } from 'react-router-dom';
import { Search, PlusCircle, ShieldCheck } from 'lucide-react';

const Home = () => {
    return (
        <div className="flex flex-col gap-16">
            {/* Hero Section */}
            <section className="text-center py-20 px-4 bg-gradient-to-b from-indigo-50 to-white rounded-3xl mt-4">
                <h1 className="text-5xl md:text-7xl font-extrabold text-slate-900 tracking-tight mb-8">
                    Reuniting People with <br />
                    <span className="text-indigo-600">What Matters</span>
                </h1>
                <p className="text-xl text-slate-600 max-w-2xl mx-auto mb-12">
                    The most advanced AI-powered platform to identify and claim lost items securely.
                    Privacy-first, community-driven.
                </p>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                    <Link to="/report/lost" className="flex items-center gap-2 px-8 py-4 bg-indigo-600 text-white rounded-xl font-bold text-lg hover:bg-indigo-700 transition-all shadow-lg hover:shadow-indigo-200">
                        <Search size={24} />
                        I Lost Something
                    </Link>
                    <Link to="/report/found" className="flex items-center gap-2 px-8 py-4 bg-white text-indigo-600 border-2 border-indigo-100 rounded-xl font-bold text-lg hover:border-indigo-200 hover:bg-indigo-50 transition-all">
                        <PlusCircle size={24} />
                        I Found Something
                    </Link>
                </div>
            </section>

            {/* Stats / Trust Section */}
            <section className="grid grid-cols-1 md:grid-cols-3 gap-8 px-4">
                <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 text-center">
                    <div className="mx-auto w-12 h-12 bg-green-100 rounded-full flex items-center justify-center text-green-600 mb-4">
                        <ShieldCheck size={28} />
                    </div>
                    <h3 className="text-lg font-bold text-slate-800 mb-2">Verified Claims</h3>
                    <p className="text-slate-500">Every claim goes through a strict verification process to prevent fraud.</p>
                </div>
                <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 text-center">
                    <div className="mx-auto w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 mb-4">
                        <Search size={28} />
                    </div>
                    <h3 className="text-lg font-bold text-slate-800 mb-2">AI Matching</h3>
                    <p className="text-slate-500">Our Smart Engine automatically matches lost descriptions with found items.</p>
                </div>
                <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 text-center">
                    <div className="mx-auto w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center text-purple-600 mb-4">
                        <PlusCircle size={28} />
                    </div>
                    <h3 className="text-lg font-bold text-slate-800 mb-2">Community Trust</h3>
                    <p className="text-slate-500">Earn trust scores by successfully returning items and helping others.</p>
                </div>
            </section>
        </div>
    );
};

export default Home;
