#!/usr/bin/env python3
"""
MyToDoList 本地預覽伺服器
執行方式: python3 serve.py
"""
import http.server
import socketserver
import webbrowser
import os

PORT = 3000
DIRECTORY = os.path.dirname(os.path.abspath(__file__))

class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIRECTORY, **kwargs)

if __name__ == "__main__":
    with socketserver.TCPServer(("", PORT), Handler) as httpd:
        url = f"http://localhost:{PORT}"
        print(f"\n==========================================")
        print(f"🚀 MyToDoList 伺服器已啟動: {url}")
        print(f"📁 專案路徑: {DIRECTORY}")
        print(f"按 Ctrl+C 可停止伺服器")
        print(f"==========================================\n")
        try:
            webbrowser.open(url)
        except Exception:
            pass
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\n伺服器已停止。")
