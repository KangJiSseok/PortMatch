from celery import Celery
import os
from dotenv import load_dotenv

load_dotenv()

celery_app = Celery(
    'portmatch_analysis',
    broker=f'redis://:{os.getenv("REDIS_PASSWORD")}@{os.getenv("REDIS_HOST", "localhost")}:{os.getenv("REDIS_PORT", "16379")}/0',
    backend=f'redis://:{os.getenv("REDIS_PASSWORD")}@{os.getenv("REDIS_HOST", "localhost")}:{os.getenv("REDIS_PORT", "16379")}/0'
)

celery_app.conf.update(
    task_serializer='json',
    accept_content=['json'],
    result_serializer='json',
    timezone='Asia/Seoul',
    enable_utc=True,
    task_track_started=True,  # Task 시작 추적
    task_time_limit=3600,     # 1시간 타임아웃
)

celery_app.autodiscover_tasks(['web.api'])