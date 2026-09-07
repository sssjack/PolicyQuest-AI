# PolicyQuest 部署文档

## 生产环境

| 项目 | 配置 |
| --- | --- |
| 服务器 | `8.141.121.133` |
| SSH 用户 / 端口 | `root` / `22` |
| 域名 | `www.clockwise.asia` |
| 系统入口 | <http://www.clockwise.asia/PolicyQuest> |
| 前端目录 | `/opt/policyquest/frontend/` |
| 后端目录 | `/opt/policyquest/backend/` |
| 后端监听 | `3000` |
| PM2 进程名 | `policyquest` |
| 后端入口 | `/opt/policyquest/backend/src/app.js` |
| 生产环境变量 | `/opt/policyquest/backend/.env`，权限 `600` |
| Nginx 配置 | `/etc/nginx/conf.d/pixelforge.conf`，与其他应用共用 |
| 发布暂存目录 | `/opt/policyquest/releases/` |
| 备份目录 | `/opt/policyquest/backups/` |

服务器密码、数据库密码、JWT Secret、模型 API Key 和 OSS 密钥不写入本文档或 Git。SSH 登录时交互输入管理员提供的密码：

```bash
ssh root@8.141.121.133
```

2026-09-07 检查时，服务器为 CentOS 7 系列环境，现有后端使用 `/root/.nvm/versions/node/v16.20.2/bin/node`。本次沿用现有后端运行环境及依赖；前端在本机完成构建后上传 `frontend/dist`，不在服务器上运行 Vite。未来升级 Node 时应单独验证系统兼容性及依赖，避免直接替换共用运行环境。

## URL 与代理规则

- `/PolicyQuest` 返回 301，跳转到 `/PolicyQuest/`。
- `/PolicyQuest/` 提供前端静态页面。
- `/PolicyQuest/api/` 代理到 `http://127.0.0.1:3000/api/`。
- `/PolicyQuest/api/health` 用于健康检查。
- 前端使用 Hash 路由，如 `/PolicyQuest/#/coach`、`/PolicyQuest/#/papers`、`/PolicyQuest/#/history`。

当前 Nginx 的相关配置如下。修改时只调整 PolicyQuest 对应的 location，保留同一域名下其他应用的规则。

```nginx
location = /PolicyQuest {
    return 301 /PolicyQuest/;
}

location ^~ /PolicyQuest/api/ {
    proxy_pass http://127.0.0.1:3000/api/;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_read_timeout 300s;
    proxy_connect_timeout 60s;
}

location ^~ /PolicyQuest/ {
    alias /opt/policyquest/frontend/;
    add_header Cache-Control "no-store, no-cache, must-revalidate, proxy-revalidate" always;
    add_header Pragma "no-cache" always;
    add_header Expires "0" always;
    try_files $uri $uri/ /PolicyQuest/index.html;
}
```

只有修改 Nginx 配置时才执行：

```bash
nginx -t && systemctl reload nginx
```

## 模型配置

申论批改、面试批改、文章处理和 AI 出题共用以下配置，接入方式与本机 PixelForge 文本模型一致：

```dotenv
LLM_PROVIDER=apiyi
APIYI_BASE_URL=https://api.apiyi.com/v1
APIYI_API_URL=https://api.apiyi.com/v1/chat/completions
APIYI_MODEL=gpt-5.6-luna
APIYI_API_KEY=<具有 Luna 可用通道的密钥>
```

请求使用 Bearer 鉴权，生成预算参数为 `max_completion_tokens`，不传 `temperature`。批改接口保留 JSON 输出要求。

本次原 PolicyQuest 密钥请求 Luna 返回 503，原因是其计费分组没有可用通道；改为使用 PixelForge 的文本模型密钥。仅同步以上五项设置，保留服务器原有数据库、JWT、OSS 等环境变量。不要用本机 `.env` 整体覆盖生产 `.env`。

新版申论批改（`essay-v2`）在模型失败、引文失真或报告不完整时显示失败并支持重试，不使用本地模板分数替代。面试仍沿用原有降级逻辑。健康检查不代表模型可用，需要检查真实调用结果。

## 更新步骤

1. 本机验证并构建：

   ```bash
   npm --prefix frontend run build
   node --check backend/src/config/index.js
   node --check backend/src/services/real-paper-grading.js
   node --check backend/src/services/processor.js
   node --check backend/src/routes/scoring.js
   node --check backend/src/routes/admin.js
   git diff --check
   ```

2. 确认线上没有正在批改的试卷。批改任务在 Node 进程内异步执行，重启可能中断任务；有任务时等待完成再更新。

3. 在 `/opt/policyquest/backups/<发布前备份名>/` 备份 `backend/src`、`backend/package.json`、`backend/package-lock.json`、`backend/.env` 和 `frontend`，另备份共用 Nginx 配置。备份含密钥，目录权限设为 `700`，文件权限设为 `600`。

4. 上传后端源码、依赖声明、配置示例和前端构建产物到独立发布暂存目录。不要上传本机 `node_modules`、测试目录、测试文件或包含凭据的开发脚本。

5. 在服务器上执行源码语法检查，再更新运行目录。前端先复制带哈希的静态资源，保留旧资源供已打开的页面使用，最后原子替换 `index.html`。

6. 按需更新生产 `.env`，执行 `chmod 600 /opt/policyquest/backend/.env`。依赖未变化时复用线上 `node_modules`；依赖发生变化时，先在暂存目录使用经过验证的兼容 Node 版本执行 `npm ci --omit=dev` 并验证，再切换。同步保存对应的 `package-lock.json`。

7. 只重启本项目进程：

   ```bash
   cd /opt/policyquest/backend
   pm2 restart policyquest --update-env
   pm2 save
   ```

8. 完成下面的验收，确认通过后记录版本、备份位置和结果。

## 验收与排查

```bash
# 在服务器上检查后端
curl -fsS http://127.0.0.1:3000/api/health

# 在本机或其他外部网络检查完整访问路径
curl -IL http://www.clockwise.asia/PolicyQuest
curl -fsS http://www.clockwise.asia/PolicyQuest/api/health

# 查看本项目进程和最近日志
pm2 status policyquest
pm2 logs policyquest --lines 50 --nostream
```

预期：无尾斜杠入口跳转到 `/PolicyQuest/` 后返回 200，首页引用的 JS/CSS 返回 200，健康接口返回 `status: "ok"`。浏览器应能打开首页和登录页；学习中心、真题库等受保护页面在未登录时跳转到登录页。

另外使用服务器实际环境变量调用模型 API，确认 HTTP 200、非空有效 JSON、返回的模型标识符合预期。探测使用合成文本，不提交真实用户作答，也不打印 API Key。

## 回滚

2026-09-07 本次部署前备份位置：

```text
/opt/policyquest/backups/20260907-before-luna/application.tar.gz
/opt/policyquest/backups/20260907-before-luna/nginx-pixelforge.conf
```

恢复代码、前端和环境变量后重启：

```bash
tar -xzf /opt/policyquest/backups/20260907-before-luna/application.tar.gz -C /opt/policyquest
chmod 600 /opt/policyquest/backend/.env
cd /opt/policyquest/backend
pm2 restart policyquest --update-env
pm2 save
curl -fsS http://127.0.0.1:3000/api/health
```

上述为仅模型迁移的回滚步骤。后续申论v2包含数据库增量迁移，见下方发布说明。恢复旧 `index.html` 后，多余的新哈希资源可保留。Nginx 本次沿用既有配置；以后若需要恢复共用配置，先确认不会覆盖其他应用的新改动，再检查和重载。

## 2026-09-07 模型迁移记录（早期版本）

- 已部署当前后端源码和本机构建的前端，PM2 `policyquest` 重启后状态为 `online`。
- 生产模型已切换为 `gpt-5.6-luna`；服务器直连模型 API 返回 HTTP 200、有效 JSON，返回标识为 `gpt-5.6-luna-2026-07-09`。
- 对运行中的 `/api/scoring/evaluate` 使用合成申论答案验收：HTTP 200，返回六个评分维度，未触发本地规则降级。
- 外部网络访问 `/PolicyQuest` 跳转到 `/PolicyQuest/` 后返回 200，首页引用的入口 JS/CSS 均返回 200，公网健康检查返回 `status: "ok"`。
- 本地前端构建、后端语法检查和 `git diff --check` 通过。浏览器自动化连接超时，本次未完成页面视觉及登录后完整练习流程验收。
- 数据库模型文件与部署前一致，依赖包版本未变化，保留既有 `node_modules`。没有修改共用 Nginx 配置或重启其他应用。


## 2026-09-07 申论v2升级

此次修改数据库结构，须先备份再执行迁移。已备份到：

```text
/opt/policyquest/backups/20260907-before-essay-v2-150000/application.tar.gz
/opt/policyquest/backups/20260907-before-essay-v2-150000/database.sql
/opt/policyquest/backups/20260907-before-essay-v2-150000/nginx.conf
```

备份目录700、文件600。应用备份包含生产环境配置；禁止公开下载。发布包不含 `.env`、密钥、测试或本地用户数据。

新增 `essay_references` 参考要点缓存表；`real_paper_attempts` 增加 `total_score`、`max_score`；`real_paper_attempt_answers` 增加 `max_score`、`question_snapshot`。迁移幂等，旧百分制报告保留原样，不直接缩放冒充重新阅卷。

```bash
# 从本机上传发布包并解压到本次发布目录，再使用生产环境变量执行
cd /opt/policyquest/backend
node /opt/policyquest/releases/20260907-essay-v2/backend/src/seeds/migrate-essay-v2.js
node /opt/policyquest/releases/20260907-essay-v2/backend/src/seeds/import-essay-bank.js /opt/policyquest/releases/20260907-essay-v2/essay-sources --dry-run
node /opt/policyquest/releases/20260907-essay-v2/backend/src/seeds/import-essay-bank.js /opt/policyquest/releases/20260907-essay-v2/essay-sources
# 暂存目录的backend/node_modules软链接到生产backend/node_modules；无需安装新依赖
# 复制已经验证的backend/src及frontend构建结果后，仅重启本应用
pm2 restart policyquest --update-env
pm2 save
curl -fsS http://127.0.0.1:3000/api/health
```

本次题库清单258套题组、1022道主观题；包括2022—2026国考三类卷共15套。省份与年份仍存在缺口，不声称全覆盖，见 [来源与覆盖情况](docs/ESSAY_BANK_COVERAGE.md)。各题保留原始分值、材料、题干和来源链接，部分广东卷仅收录主观题并单独标注。

申论后台批改每批两题并发，前端自动刷新状态。失败可重试，不生成模板分数。当前只支持单实例运行；启动时会将中断任务设为可重试。接口 `/api/real-papers/coverage`、`/api/real-papers/essay-profile`、`/api/real-papers/attempts/:id/regrade` 以及 `/api/scoring/evaluate` 需要登录。

评分和页面模块说明见 [申论批改说明](docs/ESSAY_GRADING.md)。验收应包括原题满分、各维度合计、材料引文、逐句批注、三版参考答案字数，以及真实模型调用。只检查健康接口不代表这些功能通过。

回滚应用使用本节的application备份。新增数据库列可保留供新版恢复使用；恢复数据库备份前先停止写入并另备份最新数据，避免覆盖升级后的用户作答。不要直接执行删表或清空题库。


### 申论v2验收结果

- 已完成生产数据库迁移和258套、1022道主观题导入，逐题分值与来源清单一致；现有申论题库共259套（含先前其他年度题组）。
- 已验证题型和年份筛选、32个地区（全国加31省区市）覆盖列表、错误画像接口、旧练习记录读取和评分接口登录校验。
- 本机真实模型验证：20分小题六维评分；40分作文七维评分，完整范文870/911字，符合800—1000字要求。
- 服务器使用2026国考行政执法卷真实材料及合成答案验证：模型gpt-5.6-luna，20分题返回1分、6个维度、9个材料要点，三版参考答案332/364/358字；材料参考点缓存写入成功。未写入用户练习记录。
- 入口、健康接口、首页JS/CSS资源均返回200。本地8项功能测试及报告服务端渲染检查通过。
- 浏览器自动化连接超时，未声称完成浏览器截图或完整交互视觉验收。
