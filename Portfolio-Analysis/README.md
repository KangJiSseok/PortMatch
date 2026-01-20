# Portfolio-Analysis

MinerU 컨테이너를 빌드하고 API 서버를 띄우는 메모입니다.

## 요구 사항
- Docker / Docker Compose
- NVIDIA GPU + 드라이버 (compose가 GPU를 사용하도록 설정됨)

## Docker 이미지 빌드
`mineru` 디렉터리에서 실행합니다.

```bash
cd mineru
# 필요 시 최신 Dockerfile을 가져옵니다.
wget https://gcore.jsdelivr.net/gh/opendatalab/MinerU@master/docker/global/Dockerfile -O Dockerfile

docker build -t mineru:latest -f Dockerfile .
```

## 컨테이너 실행 (API 프로필)
```bash
cd mineru
docker compose -f compose.yaml --profile api up -d
```

## 기타 프로필
- OpenAI 호환 서버: `--profile openai-server` (포트 `30000`)
- Gradio UI: `--profile gradio` (포트 `7860`)

## 종료
```bash
cd mineru
docker compose -f compose.yaml --profile api down
```

## 포트 매핑
- API: `18000 -> 8000`
- OpenAI 서버: `30000 -> 30000`
- Gradio: `7860 -> 7860`


## fastapi 빌드
```bash
uvicorn web.api.app:app --host 0.0.0.0 --port 8000
```