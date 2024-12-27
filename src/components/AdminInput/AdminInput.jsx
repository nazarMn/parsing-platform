import React, { useState, useEffect } from 'react';
import './AdminInput.css';
import axios from 'axios';

export default function AdminInput() {
    const [searchName, setSearchName] = useState('');
    const [items, setItems] = useState([]);

    const fetchItems = async () => {
        try {
            const response = await axios.get('http://localhost:3000/getItems');
            setItems(response.data);
        } catch (error) {
            console.error('Error fetching items:', error);
        }
    };

    const handleSend = async () => {
        try {
            await axios.post('http://localhost:3000/goodsTargetName', { URL: searchName });
            fetchItems(); // Update table after saving
        } catch (error) {
            console.error('Error sending URL:', error);
        }
    };

    useEffect(() => {
        fetchItems(); // Load data on component mount
    }, []);

    return (
        <div className='adminForm'>
            <input
                type="text"
                placeholder='Введіть URL'
                onChange={(e) => setSearchName(e.target.value)}
            />
            <button onClick={handleSend}>Отримати та зберегти</button>
            <table>
                <thead>
                    <tr>
                        <th>Назва товару</th>
                        <th>Ціна</th>
                        <th>Статус</th>
                    </tr>
                </thead>
                <tbody>
                    {items.map((item, index) => (
                        <tr key={index}>
                            <td>{item.title}</td>
                            <td>{item.price}</td>
                            <td>{item.status ? 'Є в наявності' : 'Немає в наявності'}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
