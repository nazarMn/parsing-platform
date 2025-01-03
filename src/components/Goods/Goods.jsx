import React, { useState, useEffect } from 'react';
import './Goods.css';
import axios from 'axios';

export default function Goods() {
  const [goods, setGoods] = useState([]);

  const getGoods = () => {
    axios.get('http://localhost:3000/items')
      .then(res => {
        setGoods(res.data);
      })
      .catch(err => console.error(err));
  };

  useEffect(() => {
    getGoods();
  }, []);

  const setFollow = async (id) => {
    try {
      const response = await axios.post('http://localhost:3000/follow', { id });
      console.log(response.data);
    } catch {
      console.error('Error');
    }
  };

  const getUpdate = async (id) => {
    try {
      const response = await axios.post('http://localhost:3000/getUpdate', { id });
      console.log(response.data);

      // Display the update message on the frontend (optional)
      alert(response.data.message);
    } catch (error) {
      console.error('Error checking update:', error);
    }
};


  const deleteItem = async (id) => {
    try {
      const response = await axios.delete(`http://localhost:3000/deleteItem/${id}`);
      console.log(response.data);
      // Refresh the goods list after deletion
      getGoods();
    } catch (error) {
      console.error('Error deleting item:', error);
    }
  };

  return (
    <div className="goods-container">
      {goods.map((item, index) => (
        <div className="goods-item" key={index}>
          <p className="item-title">{item.title}</p>
          <p className="item-price">${item.price}</p>
          <p className={`item-status ${item.status ? 'available' : 'not-available'}`}>
            {item.status ? 'Available' : 'Not available'}
          </p>
          <a href={item.url} target="_blank" rel="noopener noreferrer" className="view-btn">View</a>
          <div className="item-buttons">
            <button onClick={() => setFollow(item._id)} className="follow-btn">
              {item.follow ? 'Unfollow' : 'Follow'}
            </button>
            <button onClick={() => getUpdate(item._id)} className="update-btn">Check update</button>
            <button onClick={() => deleteItem(item._id)} className="delete-btn">Delete</button>
          </div>
        </div>
      ))}
    </div>
  );
}
