# PolicyQuest AI — 策论智题

> 热点驱动型智能题库与训练系统，面向公考、事业编、税务等考试。

## 项目概述

PolicyQuest AI 是一款基于 AI 的智能刷题与备考平台，面向国考、省考、事业编、税务系统、选调生等公职考试考生。不同于传统静态题库，PolicyQuest AI 能够自动采集最新的政策文件、主流媒体文章和政府公告，通过 DeepSeek 大模型实时生成贴近考试方向的练习题。

**在线地址**：http://www.clockwise.asia/PolicyQuest

## 核心功能

### 用户端
- **智能练习** — 可配置题型、难度、热点范围、题目数量，自动判分并提供详细解析
- **计时训练** — 单题计时与整卷计时，模拟真实考场压力
- **错题本** — 自动收录错题，追踪错误规律，支持针对性重练
- **个人报告** — 正确率趋势、薄弱题型分析、热点掌握度，数据驱动高效备考
- **热点专题** — 围绕当年政策热点组织的专题训练

### 管理端
- **内容采集** — 自动定时采集人民日报、新华网、中国政府网等 RSS 和网页内容，每 4 小时一次
- **AI 出题** — DeepSeek 驱动的全自动出题管道：文章分析 → 标签提取 → 题目生成 → 质量检查
- **题目审核** — AI 生成的题目需经管理员审核后方可上线
- **用户管理** — 查看用户活动，管理账号状态
- **数据看板** — 实时统计：用户数、题目数、练习次数、正确率等

## 技术栈

| 层级 | 技术 |
|------|------|
| 前端 | Vue 3 + TypeScript + Vite + Element Plus + ECharts |
| 后端 API | Node.js + Express + Sequelize ORM |
| 数据库 | MySQL 8.0 |
| AI 服务 | DeepSeek API（chat 模型）|
| 内容采集 | RSS Parser + Cheerio + node-cron（每 4 小时） |
| 认证 | JWT + bcrypt |
| 部署 | Nginx 反向代理 + PM2 进程管理 |
| 服务器 | 阿里云 ECS（CentOS） |

## 系统架构

```
                    +---------------------------+
                    |       Nginx (端口 80)      |
                    |    /PolicyQuest/*          |
                    +----------+----------------+
                               |
              +----------------+----------------+
              v                v                v
    +--------------+  +--------------+  +--------------+
    |  Vue 3 SPA   |  | Express API  |  |   DeepSeek   |
    | （静态文件）   |  | （端口 3000） |  | （外部 API）  |
    +--------------+  +------+-------+  +--------------+
                             |
                      +------+-------+
                      |   MySQL 8.0  |
                      | (policyquest)|
                      +--------------+
```

### 数据流：文章 → 题目

```
定时采集（每 4 小时）
  |
  +-- RSS 源（人民日报、新华网、求是网）
  +-- 网页抓取（中国政府网政策页面）
  |
  v
文章入库（MySQL，状态：待处理）
  |
  v
AI 处理（DeepSeek API）
  +-- 内容分析与标签提取
  +-- 题目生成（每篇 3 道）
  +-- 答案与解析生成
  |
  v
待审核队列
  |
  v （管理员审核通过）
正式题库
```

## 数据库设计

### 核心数据表

| 表名 | 用途 |
|------|------|
| `users` | 用户账号、角色、考试目标 |
| `article_sources` | 采集源配置 |
| `articles` | 采集并处理的文章 |
| `questions` | 题库（AI 生成 + 人工录入） |
| `practice_sessions` | 用户练习记录 |
| `user_answers` | 逐题答题记录 |
| `wrong_questions` | 错题追踪 |
| `favorites` | 收藏题目 |
| `ai_tasks` | AI 生成任务日志 |

### 题型分类

**言语理解**：主旨概括、意图判断、细节理解、逻辑填空

**政治理论**：单选题、判断题、时政热点题、政策理解题

**面试题**：综合分析、政策落实、基层治理

## 快速开始

### 环境要求
- Node.js >= 16
- MySQL >= 8.0

### 本地开发

```bash
# 后端
cd backend
cp .env.example .env  # 编辑数据库和 DeepSeek API 配置
npm install
npm run dev

# 前端
cd frontend
npm install
npm run dev
```

### 环境变量

```env
PORT=3000
JWT_SECRET=你的密钥
DB_HOST=localhost
DB_PORT=3306
DB_NAME=policyquest
DB_USER=root
DB_PASSWORD=你的密码
DEEPSEEK_API_URL=https://api.deepseek.com/chat/completions
DEEPSEEK_API_KEY=sk-xxxxx
DEEPSEEK_MODEL=deepseek-chat
```

### 默认账号

| 角色 | 用户名 | 密码 |
|------|--------|------|
| 管理员 | `admin` | `Admin@2024` |
| 普通用户 | `user01` | `User@2024` |

## 内容采集源

| 来源 | 类型 | 频率 |
|------|------|------|
| 人民日报 | RSS | 每 4 小时 |
| 新华网 | RSS | 每 4 小时 |
| 求是网 | RSS | 每 4 小时 |
| 中国政府网 | 网页抓取 | 每 4 小时 |
| 光明日报 | RSS | 每 4 小时 |

## 项目结构

```
PolicyQuest/
+-- frontend/               # Vue 3 + TypeScript 前端
|   +-- src/
|       +-- api/            # Axios API 客户端
|       +-- assets/         # SVG 图标、样式
|       +-- components/     # 公共组件
|       +-- router/         # Vue Router 路由
|       +-- store/          # Pinia 状态管理
|       +-- views/          # 页面组件
|           +-- home/       # 首页
|           +-- auth/       # 登录注册
|           +-- practice/   # 刷题系统
|           +-- wrongbook/  # 错题本
|           +-- report/     # 个人报告
|           +-- admin/      # 管理后台
+-- backend/                # Express API 后端
|   +-- src/
|       +-- config/         # 数据库和应用配置
|       +-- middleware/     # JWT 认证中间件
|       +-- models/         # Sequelize 数据模型
|       +-- routes/         # API 路由处理
|       +-- seeds/          # 初始数据种子
|       +-- services/       # 采集器、AI处理器、调度器
+-- docs/                   # 项目文档
    +-- architecture.md     # 架构文档
    +-- design.md           # 产品设计文档
```

## 版本规划

- [x] V1.0 — 核心刷题系统 + AI 自动出题 + 管理后台 + 内容采集
- [ ] V1.5 — 面试训练与 AI 评分
- [ ] V2.0 — 语音作答、能力雷达图、周报/月报
- [ ] V3.0 — 会员体系、支付系统、机构版

## 许可证

版权所有，保留一切权利。
