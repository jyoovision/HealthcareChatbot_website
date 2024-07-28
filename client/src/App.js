import React, { useState, useEffect } from 'react'; // React와 Hook을 불러옵니다.
import { Canvas, useLoader } from '@react-three/fiber';
// import { OrbitControls } from '@react-three/drei';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { TextureLoader, ClampToEdgeWrapping, LinearFilter } from 'three';
import axios from 'axios'; // HTTP 요청을 보내기 위한 axios를 불러옵니다.
import './App.css'; // CSS 파일을 불러옵니다.

// 모델 컴포넌트
function Model({ url, position, texture, rotation }) {
    const gltf = useLoader(GLTFLoader, url);

    useEffect(() => {
        if (texture && gltf.scene) {
            gltf.scene.traverse((child) => {
                if (child.isMesh) {
                    child.material.map = texture;
                    child.material.needsUpdate = true;
                }
            });
        }
    }, [texture, gltf.scene]);

    return <primitive object={gltf.scene} position={position} rotation={rotation} />;
}

// // 카메라 컨트롤 컴포넌트
// function CameraControls({ fov }) {
//     const { camera } = useThree();
//     useEffect(() => {
//         camera.fov = fov;
//         camera.updateProjectionMatrix();
//     }, [fov, camera]);
//     return null;
// }

// 메인 애플리케이션 컴포넌트
function App() {
    // 상태 변수들을 정의합니다.
    const [message, setMessage] = useState(''); // 사용자가 입력한 메시지를 저장합니다.
    const [response, setResponse] = useState(''); // 서버의 응답을 저장합니다.
    const [loading, setLoading] = useState(false); // 로딩 상태를 저장합니다.
    const [error, setError] = useState(''); // 에러 메시지를 저장합니다.
    const [audioUrl, setAudioUrl] = useState(''); // 오디오 파일의 URL을 저장합니다.
    const [eyeTextureIndex, setEyeTextureIndex] = useState(0); // 현재 눈 텍스처의 인덱스
    const [mouthTextureIndex, setMouthTextureIndex] = useState(0); // 현재 입 텍스처의 인덱스
    const [isPlaying, setIsPlaying] = useState(false); // 오디오 재생 상태를 저장합니다.
    // const [fov, setFov] = useState(75); // 카메라의 시야각 (FOV)

    // 눈 텍스처를 로드합니다.
    const eyeTextures = [
        useLoader(TextureLoader, '/textures/eye_close.png'),
        useLoader(TextureLoader, '/textures/eye_open.png'),
    ];

    // 입 텍스처를 로드합니다.
    const mouthTextures = [
        useLoader(TextureLoader, '/textures/mouth_close.png'),
        useLoader(TextureLoader, '/textures/mouth_half.png'),
        useLoader(TextureLoader, '/textures/mouth_open.png'),
    ];

    // 텍스처 래핑 및 필터 설정
    useEffect(() => {
        eyeTextures.forEach((texture) => {
            texture.wrapS = ClampToEdgeWrapping;
            texture.wrapT = ClampToEdgeWrapping;
            texture.minFilter = LinearFilter;
            texture.magFilter = LinearFilter;
        });

        mouthTextures.forEach((texture) => {
            texture.wrapS = ClampToEdgeWrapping;
            texture.wrapT = ClampToEdgeWrapping;
            texture.minFilter = LinearFilter;
            texture.magFilter = LinearFilter;
        });
    }, [eyeTextures, mouthTextures]);

    // 사용자가 메시지를 제출했을 때 호출되는 함수
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

    // 눈과 입의 애니메이션을 설정합니다.
    useEffect(() => {
        let eyeTimeoutId;
        let mouthTimeoutId;

        const startEyeBlink = () => {
            setEyeTextureIndex(0); // eye_close
            setTimeout(() => {
                setEyeTextureIndex(1); // eye_open
                const randomInterval = Math.floor(Math.random() * 3000) + 2000;
                eyeTimeoutId = setTimeout(startEyeBlink, randomInterval);
            }, 200); // 200ms for eye close
        };

        const startMouthAnimation = () => {
            if (isPlaying) {
                setMouthTextureIndex((prevIndex) => (prevIndex + 1) % mouthTextures.length);
            } else {
                setMouthTextureIndex(0); // mouth_close
            }
            const randomInterval = Math.floor(Math.random() * 150) + 50;
            mouthTimeoutId = setTimeout(startMouthAnimation, randomInterval);
        };

        startEyeBlink();
        startMouthAnimation();

        return () => {
            clearTimeout(eyeTimeoutId);
            clearTimeout(mouthTimeoutId);
        };
    }, [isPlaying, eyeTextures.length, mouthTextures.length]);

    // // FOV 슬라이더의 값을 변경할 때 호출되는 함수
    // const handleSliderChange = (event) => {
    //     setFov(Number(event.target.value));
    // };

    // 오디오 URL이 변경될 때마다 오디오를 재생합니다.
    useEffect(() => {
        if (audioUrl) {
            const audio = new Audio(audioUrl); // 새로운 오디오 객체를 생성합니다.

            audio.onplaying = () => {
                setIsPlaying(true); // 오디오가 재생되면 isPlaying을 true로 설정합니다.
            };

            audio.onended = () => {
                setIsPlaying(false); // 오디오가 끝나면 isPlaying을 false로 설정합니다.
            };

            audio.play(); // 오디오를 재생합니다.
        }
    }, [audioUrl]); // audioUrl이 변경될 때만 실행됩니다.

    return (
        <div
            className="background"
            style={{ display: 'flex', height: '100vh', width: '100vw', backgroundColor: 'black' }}
        >
            {/* 카메라 슬라이드 */}
            {/* <div style={{ position: 'absolute', top: 10, left: 10, zIndex: 1, color: 'white' }}>
        <label>
            FOV: {fov}
            <input
                type="range"
                min="10"
                max="120"
                value={fov}
                onChange={handleSliderChange}
                style={{ marginLeft: '10px' }}
            />
        </label>
    </div> */}
            <Canvas style={{ height: '100vh', width: '100vw' }}>
                {/* 조명 설정 */}
                <ambientLight intensity={0.5} />
                <directionalLight position={[10, 10, 5]} intensity={1} />
                <directionalLight position={[-10, -10, -5]} intensity={1} />
                <pointLight position={[0, 10, 0]} intensity={1} />
                {/* 모델 */}
                <Model url="/models/character.glb" position={[-2.5, 0, 0]} rotation={[0, Math.PI / 8, 0]} />
                <Model
                    url="/models/eye.glb"
                    position={[-2.5, 0, 0]}
                    rotation={[0, Math.PI / 8, 0]}
                    texture={eyeTextures[eyeTextureIndex]}
                />
                <Model
                    url="/models/mouth.glb"
                    position={[-2.5, 0, 0]}
                    rotation={[0, Math.PI / 8, 0]}
                    texture={mouthTextures[mouthTextureIndex]}
                />
                {/* <CameraControls fov={fov} /> */}
                {/* <OrbitControls /> */}
            </Canvas>
            <div
                className="chat-box"
                style={{
                    backgroundColor: 'white',
                    border: '2px solid black',
                    borderRadius: '30px',
                    position: 'absolute',
                    width: '700px',
                    height: '500px',
                    top: '50%',
                    right: '15%',
                    transform: 'translateY(-50%)',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    alignItems: 'center',
                    padding: '10px',
                    boxSizing: 'border-box',
                }}
            >
                <header style={{ textAlign: 'center', width: '100%' }}>
                    <h1>Chatbot</h1>
                    <form
                        onSubmit={handleSubmit}
                        style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}
                    >
                        <textarea
                            value={message} // 입력 메시지 상태를 바인딩합니다.
                            onChange={(e) => setMessage(e.target.value)} // 입력 값이 변경될 때 메시지 상태를 업데이트합니다.
                            onKeyDown={handleKeyDown} // 키가 눌릴 때 handleKeyDown 함수를 호출합니다.
                            placeholder="Type your message here" // 플레이스홀더 텍스트를 설정합니다.
                            rows="5" // 텍스트 영역의 행 수를 설정합니다.
                            cols="50" // 텍스트 영역의 열 수를 설정합니다.
                            style={{ width: '90%', marginBottom: '10px' }}
                        />
                        <button type="submit">Send</button> {/* 폼 제출 버튼을 생성합니다. */}
                    </form>
                    <div className="response" style={{ marginTop: '10px', width: '100%' }}>
                        <h2>Response:</h2>
                        {loading ? <p>...</p> : <p>{response}</p>}{' '}
                        {/* 로딩 중이면 ...를 표시하고, 로딩이 끝나면 응답을 표시합니다. */}
                        {error && <p className="error">{error}</p>} {/* 에러가 있으면 에러 메시지를 표시합니다. */}
                    </div>
                </header>
            </div>
        </div>
    );
}

export default App;
