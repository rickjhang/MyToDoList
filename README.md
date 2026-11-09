# MyToDoList - 多人協作待辦清單網頁應用程式

[![Live Demo](https://img.shields.io/badge/Demo-Live%20on%20GitHub%20Pages-success?style=for-the-badge&logo=github)](https://rickjhang.github.io/MyToDoList/)
[![Firebase](https://img.shields.io/badge/Firebase-my--to--do--list--eca14-FFCA28?style=for-the-badge&logo=firebase&logoColor=black)](https://console.firebase.google.com/project/my-to-do-list-eca14/overview)

專為團隊與多人協作設計的現代化待辦清單網頁應用程式，已配置支援現有 Firebase 專案 **`my-to-do-list-eca14`**，具備 **Google 帳號登入**、**Firestore 毫秒級即時同步**、**多專案清單管理**、**邀請代碼分享**、**成員任務指派**、**優先權與截止日管理** 等豐富功能。

---

## 🌐 線上正式版本 (Live Site)

👉 **立即在線體驗：[https://rickjhang.github.io/MyToDoList/](https://rickjhang.github.io/MyToDoList/)**

---

## 🌟 核心功能特色

1. **Google 帳號快速登入 (Firebase Authentication)**
   - 使用 Google 官方 OAuth 彈窗一鍵登入。
   - 自動同步個人頭像、顯示名稱與 Email。
2. **多人即時協作 (Cloud Firestore)**
   - 任一協作者新增、勾選完成、編輯或刪除任務，所有成員畫面**毫秒級自動即時更新**（免重新整理網頁）。
   - 內建完成微音效與進度條動態回饋。
3. **靈活的團隊清單管理**
   - 支援建立多個獨立清單（如「產品發布」、「家庭採買」、「團隊衝刺」）。
   - 可自定義代表顏色與備註。
4. **便捷的邀請與加入機制**
   - **代碼邀請**：清單擁有者可一鍵複製專屬清單 ID / 代碼，夥伴輸入代碼立即加入。
   - **Email 邀請**：直接輸入成員 Google Email 加入協作成員名單。
   - 成員頭像堆疊顯示，隨時掌握清單協作團隊名單。
5. **細緻的任務屬性與篩選**
   - **優先級標籤**：高優先 🔥、中優先、低優先。
   - **指派成員**：直接從清單成員名單下拉指派負責人。
   - **截止日期**：逾期自動醒目提示。
   - **多維度篩選**：全部、未完成、已完成、指派給我，外加關鍵字即時搜尋。

---

## 🚀 快速啟動

專案已存放在：
```bash
/Users/rickjhang/.gemini/antigravity/scratch/MyToDoList
```

### 方法 1: 使用內建 Python 伺服器啟動（推薦）
在終端機進入該目錄並執行：
```bash
cd /Users/rickjhang/.gemini/antigravity/scratch/MyToDoList
python3 serve.py
```
> 執行後將自動開啟瀏覽器前往 `http://localhost:3000`。

### 方法 2: 使用 Python 標準 http.server
```bash
cd /Users/rickjhang/.gemini/antigravity/scratch/MyToDoList
python3 -m http.server 3000
```
開啟瀏覽器前往 [http://localhost:3000](http://localhost:3000)。

---

## ⚙️ Firebase 專案設定指引 (`my-to-do-list-eca14`)

若您尚未在 Firebase Console 啟用相關服務，請依照以下步驟啟用（僅需約 2 分鐘）：

### 1. 啟用 Google 登入
1. 前往 [Firebase Console - Authentication 登入方法](https://console.firebase.google.com/project/my-to-do-list-eca14/authentication/providers)。
2. 點擊 **「新增提供者」** ➔ 選擇 **「Google」**。
3. 勾選 **「啟用」**，設定「專案支援電子郵件」，並點擊「儲存」。
4. 切換至 **「設定 (Settings)」** 標籤 ➔ **「已授權的網域 (Authorized domains)」**，確認已包含 `localhost`（預設已有）。

### 2. 啟用 Cloud Firestore 資料庫
1. 前往 [Firebase Console - Firestore Database](https://console.firebase.google.com/project/my-to-do-list-eca14/firestore)。
2. 點擊 **「建立資料庫」**。
3. 位置可選 `asia-east1` (台灣) 或預設位置。
4. 安全性規則可先選「以測試模式啟動」，或前往「規則」頁籤貼上本專案隨附的 `firestore.rules` 內容並發布。

### 3. 取得 Web API Key 並填入
1. 前往 [Firebase Console 專案設定](https://console.firebase.google.com/project/my-to-do-list-eca14/settings/general)。
2. 在「您的應用程式」區塊中，若尚未建立網頁應用程式，點擊 **網頁圖示 `</>`** 新增（名稱可填 `MyToDoList`）。
3. 複製設定中的 `apiKey`。
4. **填入方式（二選一）：**
   - **方式 A（免改程式碼）**：啟動網頁後，點擊右上角「⚙️ 設定」按鈕或頂部橫幅，貼上您的 `apiKey` 並儲存。
   - **方式 B（檔案設定）**：直接編輯 `firebase-config.js`，將 `AIzaSy_YOUR_API_KEY_HERE` 替換成您的真實 API Key。

---

## 📁 檔案結構說明

```
MyToDoList/
├── index.html           # 應用程式主頁面 (含響應式導覽列、看板儀表板、彈窗與過濾器)
├── style.css            # 自訂樣式 (字體、玻璃擬態質感、動畫、自訂滾動條)
├── app.js               # 前端核心邏輯 (Auth、Firestore 即時監聽、CRUD、邀請加入)
├── firebase-config.js   # Firebase SDK 模組初始化與專案設定 (my-to-do-list-eca14)
├── firestore.rules      # 建議的 Firestore 安全性規則範例
├── serve.py             # 本地預覽伺服器腳本 (支援自動開瀏覽器)
├── package.json         # NPM 專案配置描述檔
└── README.md            # 專案詳細說明文件
```
