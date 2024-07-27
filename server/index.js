const express = require('express'); // 웹 서버 프레임워크
const bodyParser = require('body-parser'); // 요청 바디를 파싱하는 미들웨어
const cors = require('cors'); // CORS 미들웨어, 다른 도메인에서의 요청을 허용
const fs = require('fs'); // 파일 시스템 모듈
const path = require('path'); // 파일 경로 모듈
const { exec } = require('child_process'); // 명령어 실행 모듈
require('dotenv').config(); // .env 파일에서 환경 변수를 로드

// OpenAI 라이브러리를 불러오고, Express 앱을 생성합니다.
const OpenAI = require('openai');
const app = express();
const PORT = process.env.PORT || 5000; // 서버가 실행될 포트 번호

// 미들웨어를 설정합니다.
app.use(bodyParser.json()); // JSON 형태의 요청 바디를 파싱
app.use(cors()); // 모든 도메인에서의 요청을 허용

// OpenAI 클라이언트를 초기화합니다.
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY, // 환경 변수에서 OpenAI API 키를 불러옴
});

// ffmpeg 바이너리 경로 설정
const ffmpegPath = path.join(__dirname, 'ffmpeg', 'ffmpeg.exe');

// POST 요청을 처리하는 엔드포인트를 정의합니다.
app.post('/api/chat', async (req, res) => {
    const { message } = req.body; // 요청 바디에서 메시지를 추출

    if (!message) {
        return res.status(400).json({ error: 'Message is required' }); // 메시지가 없으면 400 에러를 반환
    }

    try {
        // OpenAI의 GPT 모델을 사용하여 응답을 생성합니다.
        const completion = await openai.chat.completions.create({
            messages: [
                {
                    role: 'system',
                    content:
                        'You are an eye doctor who provides information about eye health. Please provide concise and clear responses that are no longer than 150 characters.',
                },
                { role: 'user', content: message },
            ],
            model: 'gpt-4o-mini',
            max_tokens: 100,
        });

        const response = completion.choices[0].message.content.trim(); // GPT 응답에서 텍스트를 추출

        // OpenAI의 TTS (Text-to-Speech) 모델을 사용하여 음성 파일을 생성합니다.
        const ttsResponse = await openai.audio.speech.create({
            model: 'tts-1',
            voice: 'alloy',
            input: response,
        });

        const audioDir = path.join(__dirname, 'audio'); // 오디오 파일을 저장할 디렉토리 경로
        if (!fs.existsSync(audioDir)) {
            fs.mkdirSync(audioDir); // 디렉토리가 존재하지 않으면 생성
        }

        const speechFilePath = path.join(audioDir, 'speech.mp3'); // 오디오 파일 경로
        const tempFilePath = path.join(audioDir, 'temp_speech.mp3'); // 임시 오디오 파일 경로
        const writer = fs.createWriteStream(tempFilePath); // 임시 파일 스트림을 생성

        ttsResponse.body.pipe(writer); // TTS 응답 스트림을 임시 파일로 저장
        writer.on('finish', () => {
            // 임시 파일이 저장된 후 속도와 피치를 조정
            const command = `${ffmpegPath} -y -i "${tempFilePath}" -filter:a "asetrate=38000" "${speechFilePath}"`;
            exec(command, (error) => {
                if (error) {
                    return res.status(500).json({ error: 'Failed to process audio file' });
                }
                res.json({ response, audioUrl: `/audio/speech.mp3` });
            });
        });
        writer.on('error', (error) => {
            console.error('Error writing temp audio file:', error);
            res.status(500).json({ error: 'Failed to save temp audio file' });
        });
    } catch (error) {
        console.error('Error calling OpenAI API:', error);
        res.status(error.status || 500).json({ error: error.message || 'Failed to get response from OpenAI API' });
    }
});

// 오디오 파일을 정적 파일로 제공하는 엔드포인트를 설정합니다.
app.use('/audio', express.static(path.join(__dirname, 'audio')));

// 서버를 지정된 포트에서 실행합니다.
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
