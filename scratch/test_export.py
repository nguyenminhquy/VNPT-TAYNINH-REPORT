import urllib.request
import urllib.parse
import json

url = 'http://localhost:3000/api/export-word-html'
data = json.dumps({
    "html": "<h1>Test Export</h1><p>This is a test paragraph.</p>",
    "title": "Test_Document"
}).encode('utf-8')

req = urllib.request.Request(url, data=data, headers={'Content-Type': 'application/json'}, method='POST')

try:
    with urllib.request.urlopen(req) as response:
        with open('test_export.docx', 'wb') as f:
            f.write(response.read())
        print("Success! Created test_export.docx")
except Exception as e:
    print(f"Error: {e}")
    if hasattr(e, 'read'):
        print(e.read().decode('utf-8'))
