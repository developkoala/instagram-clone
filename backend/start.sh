#!/bin/bash
cd /var/www/muksta/backend/app
source ~/.bashrc
export PATH="/home/ec2-user/.local/bin:$PATH"
uvicorn main:app --host 127.0.0.1 --port 8000 --reload