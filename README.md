# PolicyQuest

PolicyQuest 是面向公职考试考生的 AI Exam Coach。用户可以选择历年国考、地方省考、事业编的申论或结构化面试题，输入自己的作答后，由 AI 生成评分、分项诊断、提分建议、优质素材和示范答案。

**在线地址**：http://www.clockwise.asia/PolicyQuest

## 核心功能

- **真题选择**：按历年国考、地方省考、事业编筛选训练题。
- **题型切换**：支持申论作文和结构化面试两种作答模式。
- **AI 评分**：围绕审题、结构、论证、政策表达、语言规范等维度给出总分与分项评分。
- **提分指导**：输出优点、缺点、可执行修改建议和可复用素材。
- **示范答案**：生成可直接学习和改写的申论范文或面试示范答法。

## 技术栈

| 层级 | 技术 |
| --- | --- |
| 前端 | Vue 3 + TypeScript + Vite + Element Plus |
| 后端 | Node.js + Express + Sequelize |
| 数据库 | MySQL 8.0 |
| AI 模型 | `gpt-5.4-thinking-all` |
| 部署 | Nginx + PM2 |

## 本地开发

```bash
cd backend
cp .env.example .env
npm install
npm run dev

cd ../frontend
npm install
npm run dev
```

## 环境变量

```env
PORT=3000
JWT_SECRET=your-jwt-secret
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
```

## 主要目录

```text
PolicyQuest/
  frontend/          Vue 前端应用
  backend/           Express API 服务
  docs/              产品和架构文档
```

## 线上路径

- 前端：`/PolicyQuest/`
- API：`/PolicyQuest/api/`
- 健康检查：`/PolicyQuest/api/health`
