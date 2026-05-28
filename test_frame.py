import requests
resp = requests.get('http://localhost:5000/api/frame')
print(f'Status: {resp.status_code}')
print(f'Size: {len(resp.content)} bytes')
print(f'Valid JPEG: {resp.content[:3] == b"\xFF\xD8\xFF"}')
