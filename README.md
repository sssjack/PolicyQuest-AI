# PolicyQuest

PolicyQuest 是面向公务员、事业编、选调生等公职考试考生的 AI 学习与真题训练系统。项目围绕申论和结构化面试两类主场景，提供真题库、作答训练、AI 批改、学习报告、练习历史、错题、笔记、收藏和个人资料管理。

**在线体验：[PolicyQuest](http://www.clockwise.asia/PolicyQuest)**

[部署与回滚](DEPLOYMENT.md) · [申论评分规则](docs/ESSAY_GRADING.md) · [题库来源与覆盖情况](docs/ESSAY_BANK_COVERAGE.md)

## 核心功能

- **学习中心**：展示申论真题、面试真题、学习报告和最近练习记录。
- **真题库**：按年份、题型、地区、实际卷别和关键词筛选；每道申论题展示原始分值、材料和字数要求。
- **AI 批改**：申论按本题满分评分，异步生成材料采点溯源、逐句批注、具体改写、结构分析和三版参考答案；面试提供分项反馈和示范表达。
- **学习档案**：集中管理练习历史、报告、错题、笔记和收藏；新版申论报告支持个人错误画像、各题型得分率、能力趋势和针对性练习建议。
- **划词笔记**：做题页和历史报告页支持多次拖拽选中文字，保存为笔记；笔记页支持标题、字体、字号、加粗、下划线、删除线、文字颜色和高亮等编辑能力。
- **个人中心**：支持昵称、邮箱、备考方向、地区和头像维护；头像上传走阿里云 OSS，数据库保存公开图片 URL。
- **后台管理**：支持题库、文章源、AI 任务和用户状态等管理能力。

## 申论批改

系统先依据题干和给定材料建立参考要点，再评阅考生答案。通过材料段落编号和考生原文核验批注依据，说明“哪里不好、为什么失分、具体怎样修改”。

| 题目类型 | 评分维度及权重 |
| --- | --- |
| 小题 | 要点踩中50%、概括准确15%、内容全面10%、分类逻辑10%、规范简洁10%、格式字数身份5% |
| 大作文 | 立意25%、扣题15%、内容10%、论证20%、结构15%、语言10%、标题与形式5% |

20分题按0—20分评分，40分题按0—40分评分，分项得分之和等于总分；跨题统计使用得分率。大作文另行检查中心论点、分论点关系、材料使用、论证链及开头结尾。

一次报告包含：

1. 总分、分项评分、水平判断和参考估分范围。
2. 已踩中、部分踩中、遗漏和错误要点，以及材料原句与提炼过程。
3. 逐句批注、失分原因、具体替换文字和修改依据。
4. 结构与逻辑关系、格式身份、字数和信息密度分析。
5. 考场稳妥版、高分优化版、压缩练习版参考答案，以及组织思路、句段拆解和取舍原因。
6. 本题技巧、后续训练建议，以及相同参考标准下的历史同题得分率变化。

批改异步执行，页面自动刷新进度；失败可重试，不用模板分数冒充模型结果。旧版百分制报告保留原样，并提供重新批改入口。

上述权重属于教学量表，并非官方阅卷细则。参考估分范围未经真人阅卷校准，不是统计置信区间；没有同题真实样本时不生成排名。文本作答无法判断手写字迹，信息密度属于估算，大作文压缩版作为提纲练习使用。完整口径见[申论评分规则](docs/ESSAY_GRADING.md)。

## 题库覆盖

截至2026年9月7日，本次已导入 **2022—2026年258套题组、1022道主观题**，其中国考副省级、地市级、行政执法每年各一套，共15套。每题保留原始分值、材料、题干和来源链接。

**尚未达到所有省份近五年全覆盖**：目前涉及30个省区市，西藏及部分省份年份仍有缺口。覆盖表中的“0”表示尚未收录可核验来源，不表示当年没有考试。省考试卷沿用来源的实际分类；部分广东卷仅收录主观题，已单独标注。

题目来自公开整理版，可能存在回忆或转录差异。各省年度数量和完整来源见[题库覆盖文档](docs/ESSAY_BANK_COVERAGE.md)与[导入清单](backend/src/seeds/essay-sources-2022-2026.json)。

## 技术栈

| 层级 | 技术 |
| --- | --- |
| 前端 | Vue 3 + TypeScript + Vite + Pinia + Element Plus + ECharts |
| 后端 | Node.js + Express + Sequelize |
| 数据库 | MySQL 8.0 |
| AI 模型 | API易 OpenAI 兼容接口，默认 `gpt-5.6-luna` |
| 对象存储 | 阿里云 OSS |
| 部署 | Nginx + PM2 |

## 本地开发

准备 MySQL 8.0 和 Node.js。前端 Vite 8 的 Node.js 要求为 `^20.19.0 || >=22.12.0`。

先创建数据库，并确保后端配置的数据库用户具有建表权限：

```sql
CREATE DATABASE IF NOT EXISTS policyquest CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### 后端

```bash
cd backend
cp .env.example .env
npm ci
node src/app.js
```

启动前先填写 `.env` 中的数据库连接、JWT 签名密钥和模型密钥。PowerShell 复制环境文件可使用 `Copy-Item .env.example .env`。

首次启动会连接数据库、创建模型表并执行初始数据种子。已有旧版数据库须先备份并执行下方申论v2迁移，再启动新版服务；普通启动不会替代增量迁移。

后端默认监听 `3000` 端口，健康检查为：

```text
http://127.0.0.1:3000/api/health
```

### 前端

```bash
cd frontend
npm ci
npm run dev
```

在另一个终端启动前端，按终端显示的地址访问 `/PolicyQuest/` 路径。开发环境 API 代理走 `/api`，生产环境 API 路径为 `/PolicyQuest/api`。

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
APIYI_MODEL=gpt-5.6-luna

ENABLE_CRAWLER_SCHEDULER=false

OSS_PROVIDER=aliyun
OSS_ACCESS_KEY=your-aliyun-access-key
OSS_SECRET_KEY=your-aliyun-secret-key
OSS_BUCKET=your-oss-bucket
OSS_REGION=oss-cn-beijing
OSS_ENDPOINT=https://oss-cn-beijing.aliyuncs.com
OSS_CDN_DOMAIN=
```

AI 请求向 `https://api.apiyi.com/v1/chat/completions` 发送，使用 Bearer API Key 鉴权和 `max_completion_tokens` 控制生成预算，不传 `temperature`。申论批改、面试批改、文章处理及 AI 出题共用此模型配置，密钥不发送到浏览器。修改 `.env` 后需要重启后端服务。

`.env` 已被 Git 忽略，真实密码和 API Key 不得写入文档或提交。OSS 配置用于头像上传。

## 数据库升级与题库导入

以下命令在 `backend` 目录执行，并读取该目录的 `.env`：

```bash
# 已有数据库升级：先备份，再执行幂等迁移
node src/seeds/migrate-essay-v2.js

# 校验已准备好的来源缓存，不写入数据库
node src/seeds/import-essay-bank.js /absolute/path/to/essay-sources --dry-run

# 校验通过后导入
node src/seeds/import-essay-bank.js /absolute/path/to/essay-sources
```

导入程序按清单核验来源缓存的 SHA-256、题目数量、材料数量及原题分值。**仓库只保存来源清单，不包含HTML缓存或生产数据库**，克隆仓库不会自动得到完整258套题库。需要准备与清单匹配的缓存目录；线上已核验缓存的位置及迁移步骤见[部署文档](DEPLOYMENT.md)。网页变化导致校验失败时，应重新核验来源，不应跳过校验直接导入。

## 主要目录

```text
PolicyQuest/
  backend/           Express API、Sequelize 模型、AI 批改和导入脚本
  frontend/          Vue 前端应用
  docs/              评分规则、题库覆盖、产品和架构文档
  DEPLOYMENT.md      服务器配置、发布、验收与回滚记录
```

## 常用命令

```bash
# 前端类型检查和生产构建
npm --prefix frontend run build

# 后端语法检查示例
node --check backend/src/app.js

# 检查补丁格式
git diff --check
```

测试文件仅保留本地，不纳入 Git 或发布包；后端当前的 `npm test` 是占位脚本。本次申论v2已完成本地8项功能测试、报告服务端渲染检查和生产真实模型批改验证；浏览器自动化连接超时，尚未完成完整视觉交互验收。

## 线上路径

- 前端：`/PolicyQuest/`
- API：`/PolicyQuest/api/`
- 健康检查：`/PolicyQuest/api/health`
- 主入口：`/PolicyQuest/#/coach`
- 真题库：`/PolicyQuest/#/papers`
- 学习档案：`/PolicyQuest/#/history`

## 部署说明

服务器目录、Nginx 配置、模型配置、数据库备份、更新、验收和回滚步骤统一维护在根目录 [DEPLOYMENT.md](./DEPLOYMENT.md)。涉及数据库结构的升级须先备份，再迁移和发布。

生产环境由 Nginx 托管前端静态文件，并将 `/PolicyQuest/api/` 代理到 PM2 管理的 Node.js 后端服务。部署时需要同时更新：

- `backend/src`
- `backend/package.json`
- `backend/package-lock.json`
- `frontend/dist`

如果新增后端依赖，例如 OSS 上传使用的 `ali-oss`，线上部署后需要在后端目录执行 `npm install --omit=dev`，再重启 PM2 服务。

当前批改任务恢复机制按单实例设计，多实例部署前需改造为共享任务队列。
