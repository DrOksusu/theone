# 기본 Node 이미지 선택
FROM node:18-alpine

# 작업 디렉토리 설정
WORKDIR /app

# package.json 및 lock 파일 복사 후 의존성 설치
COPY package.json package-lock.json ./
RUN npm install

# 앱 코드 복사
COPY . .


# Prisma 설정 (마이그레이션 적용)
RUN npx prisma generate

# 포트 설정
EXPOSE 3000

# 실행 명령어
CMD ["npm", "run", "start"]
