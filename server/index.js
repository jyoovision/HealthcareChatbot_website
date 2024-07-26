const express = require('express'); // 웹 서버 프레임워크
const bodyParser = require('body-parser'); // 요청 바디를 파싱하는 미들웨어
const cors = require('cors'); // CORS 미들웨어, 다른 도메인에서의 요청을 허용
const axios = require('axios'); // HTTP 클라이언트 라이브러리 (사용되지 않음)
const fs = require('fs'); // 파일 시스템 모듈
const path = require('path'); // 파일 경로 모듈
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

        // console.log('TTS Response:', ttsResponse); // TTS 응답 로그 (디버깅용)

        const audioDir = path.join(__dirname, 'audio'); // 오디오 파일을 저장할 디렉토리 경로
        if (!fs.existsSync(audioDir)) {
            fs.mkdirSync(audioDir); // 디렉토리가 존재하지 않으면 생성
        }

        const speechFilePath = path.join(audioDir, 'speech.mp3'); // 오디오 파일 경로
        const writer = fs.createWriteStream(speechFilePath); // 파일 스트림을 생성

        ttsResponse.body.pipe(writer); // TTS 응답 스트림을 파일로 저장
        writer.on('finish', () => {
            res.json({ response, audioUrl: `/audio/speech.mp3` }); // 파일 저장이 완료되면 클라이언트에 응답
        });
        writer.on('error', (error) => {
            console.error('Error writing audio file:', error); // 파일 저장 중 에러 발생 시 로그 출력
            res.status(500).json({ error: 'Failed to save audio file' }); // 클라이언트에 에러 응답
        });
    } catch (error) {
        console.error('Error calling OpenAI API:', error); // OpenAI API 호출 중 에러 발생 시 로그 출력
        res.status(error.status || 500).json({ error: error.message || 'Failed to get response from OpenAI API' }); // 클라이언트에 에러 응답
    }
});

// 오디오 파일을 정적 파일로 제공하는 엔드포인트를 설정합니다.
app.use('/audio', express.static(path.join(__dirname, 'audio')));

// 서버를 지정된 포트에서 실행합니다.
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
