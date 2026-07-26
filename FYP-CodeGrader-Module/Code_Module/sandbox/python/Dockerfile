# Base image
FROM python:3.11-slim

# Non-root user banao (security)
RUN useradd -m -u 1000 sandbox_user

# Working directory
WORKDIR /sandbox

# Default user set karo
USER sandbox_user