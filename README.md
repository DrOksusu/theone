# TheOneBook Monorepo

Frontend와 Backend를 통합한 모노레포지토리입니다.

## 구조

```
theOne/
├── frontend/          # React + Vite 프론트엔드
├── backend/           # Express.js + Prisma 백엔드
├── .github/workflows/ # CI/CD 워크플로우
└── package.json       # 워크스페이스 설정
```

## 개발 환경 실행

```bash
# 의존성 설치
npm install

# 프론트엔드 개발 서버
npm run dev:frontend

# 백엔드 개발 서버
npm run dev:backend
```

## CI/CD

- `main` 브랜치에 push 시 자동 배포
- **변경 감지 배포**: frontend 또는 backend 폴더의 변경사항만 감지하여 해당 부분만 배포

### 필요한 GitHub Secrets

| Secret | 설명 |
|--------|------|
| `DOCKER_USERNAME` | Docker Hub 사용자명 |
| `DOCKER_PASSWORD` | Docker Hub 비밀번호 |
| `AWS_KEY` | AWS EC2 SSH 키 |
| `AWS_HOST_IP` | AWS EC2 호스트 IP |
