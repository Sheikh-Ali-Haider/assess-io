@echo off
SET ROOT=%~dp0

echo Starting Redis...
start cmd /k "docker start redis"

echo Starting FastAPI...
start cmd /k "cd %ROOT%FYP-CodeGrader-Module\Code_Module && venv\Scripts\activate.bat && uvicorn main:app --reload --port 8000 --env-file .env"

echo Starting Celery...
start cmd /k "cd %ROOT%FYP-CodeGrader-Module\Code_Module && venv\Scripts\activate.bat && celery -A services.celery_worker worker --loglevel=info --pool=threads --concurrency=4"

echo Starting Frontend...
start cmd /k "cd %ROOT%fyp-frontend && npm run dev"

echo All services started!
pause