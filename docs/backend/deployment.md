# Deployment

현재 배포 전략은 다음 기준이다.

- 프론트엔드: Vercel
- 백엔드: GitHub Actions -> Docker Hub -> EC2

## Frontend

Vercel 프로젝트 설정:

- Framework Preset: `Next.js`
- Root Directory: `apps/frontend`
- Node.js Version: `24.x`
- Install Command: `npm install`
- Build Command: `npm run build`
- Output Directory: 비워둠

필수 Vercel 환경변수:

```env
NEXT_PUBLIC_API_URL=https://your-backend-domain.example.com
```

권장 사항:

- 백엔드는 HTTPS 도메인 뒤에 두는 편이 세션 쿠키 운영에 안전하다.
- Vercel 프로젝트는 monorepo 루트가 아니라 `apps/frontend`를 루트로 잡는다.

## Backend

현재 백엔드 배포는 [`.github/workflows/main.yml`](../../.github/workflows/main.yml)과 [`Dockerfile`](../../Dockerfile)을 기준으로 한다.

흐름:

1. `main` 브랜치 push
2. GitHub Actions가 `npm ci`, `lint`, `typecheck`, `build:backend` 실행
3. Docker 이미지 빌드 후 Docker Hub push
4. EC2에 SSH 접속
5. 기존 컨테이너 교체 후 새 이미지 실행

### GitHub Secrets

필수 GitHub Actions secrets:

```text
DOCKER_USERNAME
DOCKER_PASSWORD
EC2_HOST
EC2_USER
EC2_SSH_KEY
SESSION_SECRET
SESSION_TABLE_NAME
DATABASE_URL
OPENAI_API_KEY
OPENAI_BASE_URL
LLM_MODEL
EMBEDDING_MODEL
EMBEDDING_DIM
RAG_TOP_K
RAG_MIN_SCORE
LLM_PROMPT_COST_PER_1K
LLM_COMPLETION_COST_PER_1K
```

최소 예시:

```env
SESSION_TABLE_NAME=user_sessions
OPENAI_BASE_URL=
LLM_MODEL=gpt-5.1
EMBEDDING_MODEL=text-embedding-3-small
EMBEDDING_DIM=1536
RAG_TOP_K=5
RAG_MIN_SCORE=0.4
LLM_PROMPT_COST_PER_1K=0
LLM_COMPLETION_COST_PER_1K=0
```

## 운영 체크리스트

- EC2에 Docker가 설치돼 있어야 한다.
- `4000` 포트가 외부 또는 리버스 프록시 기준으로 열려 있어야 한다.
- PostgreSQL에 세션 테이블을 만들 권한이 있어야 한다.
- 프론트의 `NEXT_PUBLIC_API_URL`은 실제 백엔드 공개 URL과 일치해야 한다.
- 배포 후 `GET /healthz`로 백엔드 헬스체크를 확인한다.
