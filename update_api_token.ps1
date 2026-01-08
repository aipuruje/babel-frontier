Write-Host "Updating Cloudflare API Token in GitHub Secrets" -ForegroundColor Green

$owner = "aipuruje"
$repo = "babel-frontier"
$token = "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"
$secretName = "CLOUDFLARE_API_TOKEN"
$secretValue = "ZGEuhD8FsWu6KoRFNSBZpBra2IMQZeoL2xz_2VHH"

$pythonScript = @"
import requests
import json
import base64
from nacl import encoding, public

OWNER = "$owner"
REPO = "$repo"
TOKEN = "$token"
SECRET_NAME = "$secretName"
SECRET_VALUE = "$secretValue"

# Get the public key
url = f"https://api.github.com/repos/{OWNER}/{REPO}/actions/secrets/public-key"
headers = {
    "Authorization": f"token {TOKEN}",
    "Accept": "application/vnd.github.v3+json"
}

response = requests.get(url, headers=headers)
if response.status_code != 200:
    print(f"Error getting public key: {response.text}")
    exit(1)

public_key_data = response.json()
public_key = public.PublicKey(public_key_data["key"].encode("utf-8"), encoding.Base64Encoder())

# Encrypt the secret
sealed_box = public.SealedBox(public_key)
encrypted = sealed_box.encrypt(SECRET_VALUE.encode("utf-8"))
encrypted_value = base64.b64encode(encrypted).decode("utf-8")

# Create or update the secret
create_url = f"https://api.github.com/repos/{OWNER}/{REPO}/actions/secrets/{SECRET_NAME}"
create_headers = {
    "Authorization": f"token {TOKEN}",
    "Accept": "application/vnd.github.v3+json",
    "Content-Type": "application/json"
}
create_data = {
    "encrypted_value": encrypted_value,
    "key_id": public_key_data["key_id"]
}

create_response = requests.put(create_url, headers=create_headers, json=create_data)
if create_response.status_code in [201, 204]:
    print(f"✓ Secret {SECRET_NAME} successfully updated!")
else:
    print(f"Error updating secret: {create_response.status_code} - {create_response.text}")
    exit(1)
"@

Set-Content -Path "temp_update_api_token.py" -Value $pythonScript

Write-Host "Running script to update API Token..." -ForegroundColor Yellow
python temp_update_api_token.py

if ($LASTEXITCODE -eq 0) {
    Write-Host "✓ Cloudflare API Token updated successfully!" -ForegroundColor Green
    Remove-Item "temp_update_api_token.py" -Force
}
else {
    Write-Host "✗ Failed to update secret" -ForegroundColor Red
    exit 1
}
