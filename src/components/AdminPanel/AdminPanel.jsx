import React from 'react'
const axios = require('axios');
import { useState } from 'react';

export default function AdminPanel() {

    const [url, setUrl] = useState('');



    function send() {
      axios.post('/api/admin', {url}).then(console.log)
    
  }
  return (
    <div>
      <h1>Admin Panel</h1>

      <input type="text" placeholder='URL' onChange={(e) => setUrl(e.target.value)} />
      <button onClick={send}>Send</button>

      
    </div>
  )
}
