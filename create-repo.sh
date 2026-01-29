#!/bin/bash
# Create GitHub repository using API

GITHUB_USER="aipuruje"
GITHUB_PASS="Waoxusfr1977"
REPO_NAME="ielts-reading-mastery"

# Create repository via API
curl -u "$GITHUB_USER:$GITHUB_PASS" https://api.github.com/user/repos -d "{\"name\":\"$REPO_NAME\",\"private\":false,\"description\":\"IELTS Academic Reading Mastery - Telegram Mini App\"}"

echo "Repository created!"
