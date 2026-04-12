# Render / Heroku-style process file (repo root = working directory).
# Uses Gunicorn with Uvicorn workers so the ASGI app is production-grade on a single dyno.
web: gunicorn backend.api.main:app -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:$PORT --workers 1 --timeout 120
