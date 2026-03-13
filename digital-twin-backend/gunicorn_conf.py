import os

# Render.com gives 512MB RAM for the free tier.
# We must limit workers to avoid OOM kills.
# 1 worker + multiple threads is best for memory-constrained Python apps with I/O (like DB/LLM calls).

port = os.environ.get("PORT", "10000")
bind = f"0.0.0.0:{port}"

workers = 1
threads = 4
timeout = 120  # LLM calls can be slow
keepalive = 5

# Logging
accesslog = "-"
errorlog = "-"
loglevel = "info"
