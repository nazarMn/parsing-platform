import React, { useEffect } from 'react'
import axios from 'axios'
import { useState } from 'react';
import './Goods.css'

export default function Goods() {
    const [goods, setGoods] = useState([]);
    const getGoods = async () => {
        try {
            const response = await axios.get(`http://localhost:3000/items`);
            setGoods(response.data);

            console.log(response.data);
        } catch (error) {
            console.error(error);
        }
    }

    useEffect(() => {
        getGoods();
    }, [])

    const setFollow = async (id) => {
        try {
            const response = await axios.post(`http://localhost:3000/getUpdate`, { url });
            console.log(response.data);
        } catch (error) {
            console.error(error);
        }
    }

    return (
        <div className='goodsContainer'>
            {goods.map((good) => (
                <div className='goodItem' key={good._id}>
                    <p>{good.title}</p>
                    <p>{good.price}</p>
                    <p>{good.status}</p>
                    <a href={good.url}>Viwe</a>
                    <button type="button" className='followButton' onClick={() => setFollow(good._id)}>{good.follow ? 'Unfollow' : 'Follow'}</button>
                </div>
            ))}




        </div>
    )
}