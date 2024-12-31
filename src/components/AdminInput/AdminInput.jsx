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
        <div className="adminForm">
            <input
                type="text"
                placeholder="URL"
                onChange={(e) => setSearchName(e.target.value)}
            />
            <button onClick={handleSend}>Send</button>
        </div>
    );
}
