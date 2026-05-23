#!/bin/sh
# Selects which service to run based on SERVICE environment variable.
# Defaults to wa-worker.

SERVICE="${SERVICE:-wa-worker}"

case "$SERVICE" in
  wa-worker)
    echo "[entrypoint] Starting WhatsApp worker..."
    cd /app/apps/wa-worker
    exec node dist/index.js
    ;;
  bullmq)
    echo "[entrypoint] Starting BullMQ worker..."
    cd /app/apps/api
    exec node dist/worker.js
    ;;
  *)
    echo "[entrypoint] Unknown SERVICE=$SERVICE. Use 'wa-worker' or 'bullmq'."
    exit 1
    ;;
esac
