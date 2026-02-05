# 1단계: Node.js 환경에서 정적 파일 빌드
FROM node:18 AS builder

# 작업 디렉토리 생성
WORKDIR /app

# 프로젝트 전체 복사
COPY . .

# 의존성 설치 및 빌드 수행
RUN npm install
RUN npm run build

# 디버깅용 빌드 결과 확인 (선택)
RUN echo "✅ Build 결과물:" && ls -al /app/dist

# 2단계: Nginx를 이용한 정적 파일 서비스
FROM nginx:stable-alpine

# 빌드된 파일을 Nginx 정적 경로로 복사
COPY --from=builder /app/dist /usr/share/nginx/html

# 사용자 정의 Nginx 설정 복사
COPY nginx.conf /etc/nginx/conf.d/default.conf

# HTTPS 인증서 마운트 디렉토리 (컨테이너 실행 시 외부 마운트 필요)
VOLUME ["/etc/letsencrypt"]

# 포트 개방
EXPOSE 80
EXPOSE 443

# Nginx 실행
CMD ["nginx", "-g", "daemon off;"]
