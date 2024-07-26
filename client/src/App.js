import React, { useState } from 'react';
import axios from 'axios';
import './App.css';

function App() {
    const [message, setMessage] = useState('');
    const [response, setResponse] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (message.trim() === '') return;

        setLoading(true);
        setResponse('');
        setError('');
        setMessage('');

        try {
            const res = await axios.post('http://localhost:5000/api/chat', { message });
            setResponse(res.data.response);
        } catch (error) {
            console.error('Error sending message:', error);
            setError(error.response?.data?.error || 'Failed to get response from server.');
        }
        setLoading(false);
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            handleSubmit(e);
        }
    };

    return (
        <div className="App">
            <header className="App-header">
                <h1>GPT Chatbot</h1>
                <form onSubmit={handleSubmit}>
                    <textarea
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Type your message here"
                        rows="5"
                        cols="50"
                    />
                    <br />
                    <button type="submit">Send</button>
                </form>
                <div className="response">
                    <h2>Response:</h2>
                    {loading ? <p>...</p> : <p>{response}</p>}
                    {error && <p className="error">{error}</p>}
                </div>
            </header>
        </div>
    );
}

export default App;
