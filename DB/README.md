### 실행방법

```
docker compose up -d --build
```

### 중지

```
docker compose down
```

### DB 초기화까지 포함해서 완전 리셋

```
docker compose down -v
docker compose up --build
```

