# PolicyQuest AI — 系统架构文档

## 1. 架构总览

PolicyQuest AI 采用三层架构，前端展示层（Vue 3 SPA）、业务逻辑层（Express API）、数据与 AI 处理层（MySQL + DeepSeek）之间清晰分离。

## 2. 组件架构

### 2.1 前端（Vue 3 SPA）

- **路由**：Vue Router Hash 模式。公开路由（/、/login、/register）、用户路由（/app/*，需 JWT）、管理路由（/admin/*，需管理员角色）
- **状态管理**：Pinia UserStore 管理认证状态和用户信息
- **API 客户端**：Axios，baseURL 为 `/PolicyQuest/api`，自动注入 JWT，401 自动跳转登录页
- **UI 框架**：Element Plus（管理端）、自定义 CSS（用户端）、ECharts（图表）、SVG 图标系统

### 2.2 后端 API（Express.js，端口 3000）

- **中间件栈**：Helmet（安全头）、CORS、Morgan（日志）、速率限制（500 次/15 分钟）、JSON 解析（10MB 限制）
- **路由模块**：
  - `/api/auth/*` — 注册、登录、个人资料
  - `/api/questions/*` — 题目 CRUD、随机抽题
  - `/api/practice/*` — 练习会话、答题、交卷
  - `/api/wrongbook/*` — 错题本、收藏
  - `/api/stats/*` — 用户统计
  - `/api/admin/*` — 管理面板、用户管理、AI 出题、采集控制
- **服务层**：
  - 采集器（RSS + 网页抓取）
  - 处理器（DeepSeek 文章分析 + 题目生成）
  - 调度器（node-cron，4 小时间隔）
- **ORM**：Sequelize + MySQL 连接池（最小 5，最大 20），支持事务，启动时自动同步表结构

### 2.3 数据层（MySQL 8.0）

核心表：users、article_sources、articles、questions、practice_sessions、user_answers、wrong_questions、favorites、ai_tasks

## 3. 数据流

### 3.1 文章采集管道

1. node-cron 每 4 小时整点触发
2. RSS 解析器（rss-parser）获取人民日报、新华网、求是网等 RSS 源
3. 网页抓取器（cheerio + node-fetch）抓取中国政府网政策页面
4. SHA-256 内容哈希去重
5. 新文章存入数据库，状态标记为「待处理」

### 3.2 AI 处理管道

1. node-cron 每 4 小时半点触发
2. 选取最多 3 篇待处理文章
3. 调用 DeepSeek API：分析文章内容，提取标签、摘要、分类、地区
4. 更新文章状态为「已处理」
5. 调用 DeepSeek API：每篇生成 3 道题目（题干、选项、答案、解析）
6. 题目入库，状态为「待审核」
7. 管理员审核后转为「已通过」

### 3.3 用户练习流程

1. 用户配置练习参数（题型、数量、难度）
2. `POST /api/practice/start` 创建练习会话，随机抽取已审核题目
3. 逐题答题：`POST /api/practice/:id/answer` 记录答案，自动判分，错题自动加入错题本
4. `POST /api/practice/:id/submit` 结束会话，计算总正确率，更新用户累计统计

## 4. 认证与授权

JWT 令牌流程：
1. `POST /api/auth/login` 返回 JWT（7 天有效期）
2. 前端存储到 localStorage
3. Axios 拦截器自动添加 Authorization 头
4. 后端中间件验证 JWT
5. 管理路由额外验证角色为 admin 或 super_admin

## 5. 并发与性能

- **连接池**：MySQL 连接池 5-20 个连接
- **速率限制**：每 IP 每 15 分钟 500 次请求
- **采集互斥锁**：单实例锁防止重复采集
- **批量处理**：AI 每次处理 3 篇文章，控制 API 成本
- **异步触发**：采集/处理接口立即返回，后台异步执行

## 6. 部署架构

```
阿里云 ECS（CentOS）
  |
  +-- Nginx（端口 80）
  |     +-- /PolicyQuest/ → /opt/policyquest/frontend/（静态文件）
  |     +-- /PolicyQuest/api/ → 代理至 localhost:3000/api/
  |
  +-- PM2
  |     +-- policyquest-api（Node.js，端口 3000）
  |
  +-- MySQL 8.0
  |     +-- 数据库：policyquest
  |
  +-- 外部服务
        +-- DeepSeek API（https://api.deepseek.com）
```

## 7. 安全措施

- 密码使用 bcrypt 加密（12 轮）
- JWT 令牌可配置过期时间
- Helmet 安全响应头
- API 速率限制
- 管理路由角色验证
- 所有端点输入校验
- 内容哈希去重防止文章重复
- 爬虫使用标识性 User-Agent
