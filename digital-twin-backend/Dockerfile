FROM python:3.10-slim

# Set up a new user named "user" with user ID 1000
RUN useradd -m -u 1000 user

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# Change ownership of the app directory to the new user
RUN chown -R user:user /app

# Switch to the "user" user
USER user

# Set home to the user's home directory
ENV HOME=/home/user \
    PATH=/home/user/.local/bin:$PATH

CMD ["gunicorn", "-b", "0.0.0.0:7860", "--workers", "2", "--threads", "4", "--timeout", "120", "app:app"]
