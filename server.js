// ================================
// 📁 班表上傳系統 server.js（完整修正版）
// ================================
const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const cors = require('cors');
const schedule = require('node-schedule');

const app = express();
const port = 3000;

// ------------------------------
// 📌 Middleware
// ------------------------------
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(__dirname, { extensions: ['html'] }));

// ================================
// 📌 五大地區固定資料夾
// ================================
const regions = ['台中縣', '台中市', '南投縣', '彰化縣', '其他'];

// ================================
// 📌 建立本月資料夾
// ================================
function createCurrentMonthFolders() {
  const basePath = path.join(__dirname, '班表');
  const now = new Date();
  let year = now.getFullYear() - 1911;
  let month = now.getMonth() + 1;

  const yearFolder = path.join(basePath, `${year}年`);
  const monthFolder = path.join(yearFolder, `${month}月`);

  regions.forEach(region => {
    const dir = path.join(monthFolder, region);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      console.log('📁 建立（本月）:', dir);
    }
  });
}

// ================================
// 📌 自動建立下月資料夾
// ================================
function createNextMonthFolders() {
  const basePath = path.join(__dirname, '班表');
  const now = new Date();
  let year = now.getFullYear() - 1911;
  let month = now.getMonth() + 2; // 下個月

  if (month > 12) {
    month = 1;
    year += 1;
  }

  const yearFolder = path.join(basePath, `${year}年`);
  const monthFolder = path.join(yearFolder, `${month}月`);

  regions.forEach(region => {
    const dir = path.join(monthFolder, region);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      console.log('📁 建立（下月）:', dir);
    }
  });
}

// 系統啟動時立即補齊本月資料夾與下月資料夾
createCurrentMonthFolders();
createNextMonthFolders();

// 每天 00:00 若是 5 號 → 建立下月資料夾
schedule.scheduleJob('0 0 * * *', () => {
  const today = new Date();
  if (today.getDate() === 5) {
    createNextMonthFolders();
  }
});

// ================================
// 📤 Multer - 上傳檔案（保留中文檔名）
// ================================
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const folderPath = decodeURIComponent(req.body.path || '');
    const savePath = path.join(__dirname, folderPath);

    fs.mkdirSync(savePath, { recursive: true });
    cb(null, savePath);
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname); // 保留中文檔名
  }
});

const upload = multer({ storage: storage });

// ================================
// 📤 上傳 API：POST /api/upload
// ================================
app.post('/api/upload', upload.single('file'), (req, res) => {
  res.json({ success: true, message: '✅ 檔案上傳成功！' });
});

// ================================
// 📂 列出資料夾內容 API：GET /api/list
// ================================
app.get('/api/list', (req, res) => {
  const relPath = decodeURIComponent(req.query.path || '');
  const targetPath = path.join(__dirname, relPath);

  if (!fs.existsSync(targetPath)) {
    return res.json({ folders: [], files: [] });
  }

  const items = fs.readdirSync(targetPath, { withFileTypes: true });

  const folders = [];
  const files = [];

  items.forEach(item => {
    if (item.isDirectory()) folders.push(item.name);
    else files.push(item.name);
  });

  res.json({ folders, files });
});

// ================================
// 🚀 啟動伺服器
// ================================
app.listen(port, () => {
  console.log(`🚀 Server running at http://localhost:${port}`);
});
