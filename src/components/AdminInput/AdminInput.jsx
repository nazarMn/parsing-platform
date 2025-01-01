import React, { useState } from 'react';
import './AdminInput.css';
import axios from 'axios';

export default function AdminInput() {
    const [searchName, setSearchName] = useState('');

    const handleSend = async () => {
        try {
            const response = await axios.post('http://localhost:3000/goodsTargetName', { URL: searchName });
            alert(`Data fetched and logged successfully: ${response.data.message}`);
        } catch (error) {
            console.error('Error:', error);
            alert('Error fetching or logging data');
        }
    };

    return (
        <div className="admin-form">
            <input
                type="text"
                className="admin-input"
                placeholder="Enter URL..."
                value={searchName}
                onChange={(e) => setSearchName(e.target.value)}
            />
            <button onClick={handleSend} className="admin-button">Send</button>
        </div>
    );
}