# PolicyQuest

PolicyQuest 是面向公务员、事业编、选调生等公职考试考生的 AI 学习与真题训练系统。项目围绕申论和结构化面试两类主场景，提供真题库、作答训练、AI 批改、学习报告、练习历史、错题、笔记、收藏和个人资料管理。

**在线地址**：http://www.clockwise.asia/PolicyQuest

## 核心功能

- **学习中心**：粉笔风格的训练首页，展示申论真题、面试真题、学习报告和最近练习记录。
- **真题库**：按题型、地区、考试类型和关键词筛选申论/面试真题，进入后保持真实做题流程。
- **AI 批改**：申论和面试分别按真实考试维度评分，异步生成逐题批改报告、总评、扣分原因、提分建议和示范表达。
- **学习档案**：练习历史、用户报告、我的错题、我的笔记、我的收藏集中在同一页面，通过顶部 Banner 式标签切换。
- **划词笔记**：做题页和历史报告页支持多次拖拽选中文字，保存为笔记；笔记页支持标题、字体、字号、加粗、下划线、删除线、文字颜色和高亮等编辑能力。
- **个人中心**：支持昵称、邮箱、备考方向、地区和头像维护；头像上传走阿里云 OSS，数据库保存公开图片 URL。
- **后台管理**：支持题库、文章源、AI 任务和用户状态等管理能力。

## 技术栈

| 层级 | 技术 |
| --- | --- |
| 前端 | Vue 3 + TypeScript + Vite + Pinia + Element Plus |
| 后端 | Node.js + Express + Sequelize |
| 数据库 | MySQL 8.0 |
| AI 模型 | OpenAI 兼容接口，默认 `gpt-5.4-thinking-all` |
| 对象存储 | 阿里云 OSS |
| 部署 | Nginx + PM2 |

## 本地开发

### 后端

```bash
cd backend
cp .env.example .env
npm install
node src/app.js
```

后端默认监听 `3000` 端口，健康检查为：

```text
http://127.0.0.1:3000/api/health
```

### 前端

```bash
cd frontend
npm install
npm run dev
```

前端开发服务器默认使用 Vite，开发环境 API 代理走 `/api`，生产环境 API 路径为 `/PolicyQuest/api`。

## 环境变量

后端环境变量位于 `backend/.env`，可从 `backend/.env.example` 复制。

```env
PORT=3000
NODE_ENV=development
JWT_SECRET=your-jwt-secret
JWT_EXPIRES_IN=7d

DB_HOST=localhost
DB_PORT=3306
DB_NAME=policyquest
DB_USER=root
DB_PASSWORD=your-db-password

LLM_PROVIDER=apiyi
APIYI_BASE_URL=https://api.apiyi.com/v1
APIYI_API_URL=https://api.apiyi.com/v1/chat/completions
APIYI_API_KEY=your-apiyi-api-key
APIYI_MODEL=gpt-5.4-thinking-all

ENABLE_CRAWLER_SCHEDULER=false

OSS_PROVIDER=aliyun
OSS_ACCESS_KEY=your-aliyun-access-key
OSS_SECRET_KEY=your-aliyun-secret-key
OSS_BUCKET=your-oss-bucket
OSS_REGION=oss-cn-beijing
OSS_ENDPOINT=https://oss-cn-beijing.aliyuncs.com
OSS_CDN_DOMAIN=
```

## 主要目录

```text
PolicyQuest/
  backend/           Express API、Sequelize 模型、AI 批改和导入脚本
  frontend/          Vue 前端应用
  docs/              产品、架构和设计文档
  tmp/               本地临时打包目录
```

## 常用命令

```bash
# 前端构建
npm --prefix frontend run build

# 后端语法检查示例
node --check backend/src/app.js

# 导入 2026 申论真题
npm --prefix backend run import:2026-essay-papers
npm --prefix backend run import:2026-provincial-essay-papers
```

## 线上路径

- 前端：`/PolicyQuest/`
- API：`/PolicyQuest/api/`
- 健康检查：`/PolicyQuest/api/health`
- 主入口：`/PolicyQuest/#/coach`
- 真题库：`/PolicyQuest/#/papers`
- 学习档案：`/PolicyQuest/#/history`

## 部署说明

生产环境由 Nginx 托管前端静态文件，并将 `/PolicyQuest/api/` 代理到 PM2 管理的 Node.js 后端服务。部署时需要同时更新：

- `backend/src`
- `backend/package.json`
- `backend/package-lock.json`
- `frontend/dist`

如果新增后端依赖，例如 OSS 上传使用的 `ali-oss`，线上部署后需要在后端目录执行 `npm install --omit=dev`，再重启 PM2 服务。
