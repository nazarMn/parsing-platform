import React, { useState } from 'react'
import './AdminInput.css'
import axios from 'axios'
export default function AdminInput() {
    const [searchName, setSearchName] = useState('')
  return (
    <div className='adminForm'>
        <input type="text" placeholder='URL' onChange={(e) => setSearchName(e.target.value)} />
        <button onClick={() => axios.post('http://localhost:3000/goodsTargetName', {URL: searchName})}>Send</button>
    </div>
  )
}
