import { useState } from 'react';
import api from '../utils/api';
import { useNavigate } from 'react-router-dom';
import LocationPicker from '../components/ui/LocationPicker';

const ReportFound = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        itemName: '',
        category: '',
        condition: '',
        storagePlace: '',
        finderPreference: 'meet',
        locationText: '',
    });
    const [location, setLocation] = useState(null);
    const [image, setImage] = useState(null);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!image) return alert('Image is mandatory for found items');
        if (!location) return alert('Please select a specific location on the map where the item was found.');

        const data = new FormData();
        Object.keys(formData).forEach(key => {
            if (formData[key]) data.append(key, formData[key]);
        });

        data.append('lat', location.lat);
        data.append('lng', location.lng);
        data.append('image', image);

        try {
            await api.post('/items/found', data, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            alert('Thank you! Found item reported successfully.');
            navigate('/');
        } catch (err) {
            console.error('Submission Error:', err);
            const errMsg = err.response?.data?.error || err.message || 'Error submitting report';
            alert(`Error submitting report: ${errMsg}`);
        }
    };

    return (
        <div className="max-w-2xl mx-auto bg-white p-8 rounded-2xl shadow-sm border border-slate-100">
            <h1 className="text-3xl font-bold text-slate-900 mb-8">Report Found Item</h1>
            <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Item Name / Title</label>
                    <input
                        type="text"
                        name="itemName"
                        required
                        className="w-full px-4 py-2 border rounded-lg"
                        onChange={handleChange}
                        placeholder="e.g. Found iPhone 13, Blue Backpack"
                        value={formData.itemName}
                    />
                </div>

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
                    <label className="block text-sm font-medium text-slate-700 mb-1">Condition</label>
                    <select name="condition" className="w-full px-4 py-2 border rounded-lg" onChange={handleChange}>
                        <option value="Good">Good</option>
                        <option value="Damaged">Damaged</option>
                        <option value="Old">Old</option>
                    </select>
                </div>

                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Current Storage Location</label>
                    <input type="text" name="storagePlace" className="w-full px-4 py-2 border rounded-lg" onChange={handleChange} placeholder="e.g. Security Guard Desk, My Office" />
                </div>

                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Preferred Return Method</label>
                    <select name="finderPreference" className="w-full px-4 py-2 border rounded-lg" onChange={handleChange}>
                        <option value="meet">Willing to Meet</option>
                        <option value="police">Dropped at Police/Security</option>
                        <option value="courier">Courier (Verified Only)</option>
                    </select>
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
                    <label className="block text-sm font-medium text-slate-700 mb-1">Image (Mandatory)</label>
                    <input type="file" required onChange={(e) => setImage(e.target.files[0])} className="w-full" />
                </div>

                <button type="submit" className="w-full bg-emerald-600 text-white py-3 rounded-lg font-bold hover:bg-emerald-700 transition-colors">
                    Report Found Item
                </button>
            </form>
        </div>
    );
};

export default ReportFound;
