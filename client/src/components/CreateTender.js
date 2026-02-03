import { useState } from 'react';
import api from '../api/axios';

const CreateTender = ({ onTenderCreated }) => {
    const [formData, setFormData] = useState({ title: '', description: '', deadline: '' });

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            // Convert local datetime-local value to proper UTC ISO string
            const payload = {
                ...formData,
                deadline: new Date(formData.deadline).toISOString()
            };
            await api.post('/tenders', payload);
            alert('Tender Created Successfully!');
            setFormData({ title: '', description: '', deadline: '' });
            if (onTenderCreated) onTenderCreated();
        } catch (err) {
            alert('Failed to create tender');
        }
    };

    return (
        <div className="glass-panel" style={{ marginBottom: '2rem' }}>
            <h3 style={{ color: 'var(--primary)', marginBottom: '1rem' }}>🚀 POST NEW TENDER</h3>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <input
                    className="glass-input"
                    placeholder="Project Title"
                    value={formData.title}
                    onChange={e => setFormData({ ...formData, title: e.target.value })}
                    required
                />
                <textarea
                    className="glass-input"
                    placeholder="Description"
                    value={formData.description}
                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                    required
                />
                <div>
                    <label style={{ color: '#94a3b8', fontSize: '0.8rem', display: 'block', marginBottom: '0.5rem' }}>DEADLINE</label>
                    <input
                        type="datetime-local"
                        className="glass-input"
                        value={formData.deadline}
                        onChange={e => setFormData({ ...formData, deadline: e.target.value })}
                        required
                    />
                </div>
                <button className="glass-btn">PUBLISH TENDER</button>
            </form>
        </div>
    );
};

export default CreateTender;
