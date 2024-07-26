import React, { useState, useEffect } from 'react'; // React와 Hook을 불러옵니다.
import axios from 'axios'; // HTTP 요청을 보내기 위한 axios를 불러옵니다.
import './App.css'; // CSS 파일을 불러옵니다.

function App() {
    // 상태 변수들을 정의합니다.
    const [message, setMessage] = useState(''); // 사용자가 입력한 메시지를 저장합니다.
    const [response, setResponse] = useState(''); // 서버의 응답을 저장합니다.
    const [loading, setLoading] = useState(false); // 로딩 상태를 저장합니다.
    const [error, setError] = useState(''); // 에러 메시지를 저장합니다.
    const [audioUrl, setAudioUrl] = useState(''); // 오디오 파일의 URL을 저장합니다.

    // audioUrl이 변경될 때마다 오디오를 재생합니다.
    useEffect(() => {
        if (audioUrl) {
            const audio = new Audio(audioUrl); // 새로운 오디오 객체를 생성합니다.
            audio.play(); // 오디오를 재생합니다.
        }
    }, [audioUrl]); // audioUrl이 변경될 때만 실행됩니다.

    // 폼 제출 시 호출되는 함수입니다.
    const handleSubmit = async (e) => {
        e.preventDefault(); // 기본 폼 제출 동작을 막습니다.
        if (message.trim() === '') return; // 메시지가 비어있으면 아무것도 하지 않습니다.

        setLoading(true); // 로딩 상태를 true로 설정합니다.
        setResponse(''); // 기존 응답을 지웁니다.
        setError(''); // 기존 에러를 지웁니다.
        setMessage(''); // 입력 메시지를 지웁니다.

        try {
            // 서버에 메시지를 보내고 응답을 받습니다.
            const res = await axios.post('http://localhost:5000/api/chat', { message });
            setResponse(res.data.response); // 서버의 응답을 상태에 저장합니다.
            const timestamp = new Date().getTime(); // 타임스탬프를 생성합니다.
            setAudioUrl(`http://localhost:5000${res.data.audioUrl}?t=${timestamp}`); // 오디오 URL을 상태에 저장합니다.
        } catch (error) {
            console.error('Error sending message:', error); // 에러를 콘솔에 출력합니다.
            setError(error.response?.data?.error || 'Failed to get response from server.'); // 에러 메시지를 상태에 저장합니다.
        }
        setLoading(false); // 로딩 상태를 false로 설정합니다.
    };

    // Enter 키를 눌렀을 때 폼을 제출합니다.
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
                        value={message} // 입력 메시지 상태를 바인딩합니다.
                        onChange={(e) => setMessage(e.target.value)} // 입력 값이 변경될 때 메시지 상태를 업데이트합니다.
                        onKeyDown={handleKeyDown} // 키가 눌릴 때 handleKeyDown 함수를 호출합니다.
                        placeholder="Type your message here" // 플레이스홀더 텍스트를 설정합니다.
                        rows="5" // 텍스트 영역의 행 수를 설정합니다.
                        cols="50" // 텍스트 영역의 열 수를 설정합니다.
                    />
                    <br />
                    <button type="submit">Send</button> {/* 폼 제출 버튼을 생성합니다. */}
                </form>
                <div className="response">
                    <h2>Response:</h2>
                    {loading ? <p>...</p> : <p>{response}</p>}{' '}
                    {/* 로딩 중이면 ...를 표시하고, 로딩이 끝나면 응답을 표시합니다. */}
                    {error && <p className="error">{error}</p>} {/* 에러가 있으면 에러 메시지를 표시합니다. */}
                </div>
            </header>
        </div>
    );
}

export default App;
