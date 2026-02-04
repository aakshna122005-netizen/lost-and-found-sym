import { useState } from 'react';
import api from '../utils/api';
import { useNavigate } from 'react-router-dom';
import LocationPicker from '../components/ui/LocationPicker';

const ReportLost = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        itemName: '',
        category: '',
        color: '',
        material: '',
        dateLost: '',
        locationText: '',
        description: '',
        uniqueMarks: '',
    });
    const [location, setLocation] = useState(null);
    const [image, setImage] = useState(null);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!location) {
            return alert('Please select a specific location on the map by clicking it.');
        }

        const data = new FormData();
        Object.keys(formData).forEach(key => {
            if (formData[key]) data.append(key, formData[key]);
        });

        data.append('lat', location.lat);
        data.append('lng', location.lng);

        if (image) {
            data.append('image', image);
        }

        try {
            const res = await api.post('/items/lost', data, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            alert('Lost report submitted successfully! Redirecting to matches...');
            navigate(`/matches/${res.data.id}`);
        } catch (err) {
            console.error('Submission Error:', err);
            const errMsg = err.response?.data?.error || err.message || 'Error submitting report';
            alert(`Error submitting report: ${errMsg}`);
        }
    };

    return (
        <div className="max-w-2xl mx-auto bg-white p-8 rounded-2xl shadow-sm border border-slate-100">
            <h1 className="text-3xl font-bold text-slate-900 mb-8">Report Lost Item</h1>
            <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Item Name / Title</label>
                    <input
                        type="text"
                        name="itemName"
                        required
                        className="w-full px-4 py-2 border rounded-lg"
                        onChange={handleChange}
                        placeholder="e.g. Black iPhone 13, Leather Wallet"
                        value={formData.itemName}
                    />
                </div>

                <div className="grid grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Category</label>
                        <select name="category" required className="w-full px-4 py-2 border rounded-lg" onChange={handleChange}>
                            <option value="">Select Category</option>
                            <option value="Electronics">Electronics</option>
                            <option value="Wallet">Wallet</option>
                            <option value="Keys">Keys</option>
                            <option value="Clothing">Clothing</option>
                            <option value="Accessories">Accessories</option>
                            <option value="Bag">Bag</option>
                            <option value="Other">Other</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Color</label>
                        <input type="text" name="color" className="w-full px-4 py-2 border rounded-lg" onChange={handleChange} placeholder="e.g. Black, Red" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Material</label>
                        <select name="material" className="w-full px-4 py-2 border rounded-lg" onChange={handleChange}>
                            <option value="">Select Material</option>
                            <option value="Leather">Leather</option>
                            <option value="Plastic">Plastic</option>
                            <option value="Metal">Metal</option>
                            <option value="Fabric">Fabric</option>
                            <option value="Glass">Glass</option>
                            <option value="Other">Other</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Unique Marks</label>
                        <input type="text" name="uniqueMarks" className="w-full px-4 py-2 border rounded-lg" onChange={handleChange} placeholder="e.g. Sticker on back" />
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                    <textarea name="description" className="w-full px-4 py-2 border rounded-lg h-24" onChange={handleChange} placeholder="Provide details..."></textarea>
                </div>

                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Pin Location on Map</label>
                    <LocationPicker onLocationSelect={(loc) => {
                        setLocation(loc);
                        if (loc.address) {
                            setFormData(prev => ({ ...prev, locationText: loc.address }));
                        }
                    }} />
                </div>

                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Specific Location Details</label>
                    <input
                        type="text"
                        name="locationText"
                        required
                        className="w-full px-4 py-2 border rounded-lg bg-slate-50"
                        value={formData.locationText}
                        onChange={handleChange}
                        placeholder="Select location on map or type here..."
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Date Lost</label>
                    <input type="date" name="dateLost" required className="w-full px-4 py-2 border rounded-lg" onChange={handleChange} />
                </div>

                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Upload Image (Optional)</label>
                    <input type="file" onChange={(e) => setImage(e.target.files[0])} className="w-full" />
                </div>

                <button type="submit" className="w-full bg-indigo-600 text-white py-3 rounded-lg font-bold hover:bg-indigo-700 transition-colors">
                    Submit & Find Matches
                </button>
            </form>
        </div>
    );
};

export default ReportLost;
