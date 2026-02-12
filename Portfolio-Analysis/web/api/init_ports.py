#!/usr/bin/env python3
"""
MinerU 포트 초기화 스크립트
서버 시작 전 또는 재시작 시 한 번 실행하여 Redis에 포트 등록
"""
import os
import redis

# Redis 연결
redis_client = redis.Redis(
    host=os.getenv("REDIS_HOST", "127.0.0.1"),
    port=int(os.getenv("REDIS_PORT", 8379)),
    password=os.getenv("REDIS_PASSWORD")
)

# 기존 포트 큐 삭제 (중복 방지)
redis_client.delete("available_mineru_ports")

# 사용 가능한 MinerU 포트 등록
ports = ["18001", "18000", "18002"]

for port in ports:
    redis_client.rpush("available_mineru_ports", port)

print(f"✅ MinerU 포트 초기화 완료: {ports}")
print(f"   Redis: {os.getenv('REDIS_HOST', '127.0.0.1')}:{os.getenv('REDIS_PORT', 8379)}")

# 현재 등록된 포트 확인
registered = redis_client.lrange("available_mineru_ports", 0, -1)
print(f"   등록된 포트: {[p.decode() for p in registered]}")