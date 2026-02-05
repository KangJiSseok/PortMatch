from celery import Celery

import os
from dotenv import load_dotenv

load_dotenv()

# 환경 변수 읽기 (Docker 환경에 맞게 기본값 설정)
redis_host = os.getenv("REDIS_HOST", "portmatch-redis")
redis_port = os.getenv("REDIS_PORT", "6379")
redis_password = os.getenv("REDIS_PASSWORD", "")

redis_url = f'redis://:{redis_password}@{redis_host}:{redis_port}/0'

celery_app = Celery(
    'portmatch_analysis',
    broker=redis_url,
    backend=redis_url,
    # ⭐ 파일명이 task.py(단수)라면 반드시 이렇게 써야 함!
    include=['web.api.task'] 
)

celery_app.conf.update(
    task_serializer='json',
    accept_content=['json'],
    result_serializer='json',
    timezone='Asia/Seoul',
    enable_utc=True,
    task_track_started=True,
    task_time_limit=3600,
    # 브로커 연결 리트라이 관련 경고 해결용
    broker_connection_retry_on_startup=True)