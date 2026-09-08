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

## 2026-09-07 历史报告与批改失败修复

- 历史页来源提示改为横跨双栏，答案和批改报告从同一行开始，消除来源提示挤占网格位置导致的大块空白。
- 前端构建设置 `cssTarget: chrome90`，保留旧版 Chromium 可识别的媒体查询，避免开发环境正常、生产构建的手机布局却溢出。
- 采点分析支持通过真实考生句编号还原引文；虚构编号、无法定位的原文仍拒绝。
- 三版范文独立校验，仅修订不合格版本。修订使用实际字数、目标字数和上下限，专门压缩或补足正文，并更新对应拆解。单个范文失败不再反复触发整个诊断阶段。
- 页面优先显示当前题的具体错误，而非只显示整卷“部分或全部题目批改失败”。

本次没有数据库结构变更或新增依赖。应用回滚备份：`/opt/policyquest/backups/20260907-report-fix/application.tar.gz`。修复暂存目录：`/opt/policyquest/releases/20260907-report-fix`。失败练习恢复前另存受保护的记录备份，仅重新处理失败题，不覆盖已成功题目的报告。

本地11项后端测试、前端构建通过。浏览器检查使用线上静态资源及模拟接口，旧版报告、新版报告、失败状态分别在1920、1024、390像素宽度下验证，共9组通过；检查包含双栏对齐、无横向溢出，以及答案、题干、材料切换。此检查不等同于真实账号的完整提交链路验收。

生产恢复结果：练习6、7中原先失败的6道题全部批改成功，两次练习均为4/4完成。已校验原始作答及此前成功报告未被修改、分项合计等于总分、三版参考答案符合字数范围。恢复后数据库没有待批改或失败题记录。前后端修复已发布，仅重启 `policyquest` 服务。

## 2026-09-07 首页视觉改版

- 移除首页顶部整排导航 Banner，将登录、申论、面试、学习报告和练习历史入口融入页面内容。
- 使用冷白、电光蓝与少量荧光绿，增加玻璃轨道主视觉，减少文本卡片堆叠；主视觉为约99 KiB的WebP静态资源。
- 小题／作文评分预览和“材料采点—逐句改写—答案拆解”支持交互切换；所有示例明确标注为教学展示，不代表真实用户成绩。
- 游客进入练习时保留目标地址，登录后返回所选训练入口。

本次仅发布前端，无数据库变更、无后端重启。发布目录：`/opt/policyquest/releases/20260907-home-redesign`。发布前完整前端备份：`/opt/policyquest/backups/20260907-home-redesign/frontend.tar.gz`（目录700，文件600）。上传新资源后替换入口HTML，保留旧哈希资源，避免已打开页面找不到旧资源。

前端类型检查与生产构建通过。线上首页和主视觉资源均返回200；浏览器在360、390、768、1024、1440、1920像素宽度完成6组检查，验证无横向溢出、图片加载、评分示例切换、三步批改演示、页内跳转和游客面试入口跳转；已检查桌面与手机截图。此次验收不涉及重新提交真实批改任务。


## 2026-09-07 申论整卷能力诊断

新增每套申论的结构化聚合、AI总结、十维能力画像、共性错误证据、最多三项提分优先级、可保存目标分、七天训练计划和最近十套档案。提交后自动进入整卷报告；历史页和学习报告页提供入口。详细数据口径见 [整卷诊断说明](docs/ESSAY_PAPER_REPORT.md)。

发布目录：`/opt/policyquest/releases/20260907-paper-diagnosis`。发布前备份：`/opt/policyquest/backups/20260907-paper-diagnosis/application.tar.gz`、`database.sql`及`nginx.conf`，目录700、文件600；应用备份包含环境配置，不得公开下载。

迁移新增五个字段，不修改题库或单题作答。上传构建产物后，先切换到生产后端目录（以便加载环境变量），执行 `node /opt/policyquest/releases/20260907-paper-diagnosis/backend/src/seeds/migrate-paper-report.js`，再复制后端源码及前端资源，仅重启PM2的`policyquest`。新报告状态独立于单题状态；服务重启后中断总结可单独重试。回滚可恢复本次应用备份，新增列保留，不必恢复数据库覆盖新作答。

本地24项后端检查通过，覆盖单题回归、分值合计、实际题数、无样本状态、旧版隔离、重复任务领取、重批失效保护、用户隔离及目标分校验。真实模型以2题/60分的合成练习验证，返回8个已考查能力、3项优先级及7天计划；未考查能力保持空值。浏览器在1440、768、390、360像素宽度验证完整页面、目标保存、具体题目跳转及总结失败后重试。

线上验收：练习6、7的四题整卷报告已补生成，分别为82.4/100、75.5/100，均含7天训练计划；单题记录整体哈希前后一致。3套旧版申论记录未作分值换算，不参与能力诊断。健康接口200，未登录访问整卷报告401，登录后真实报告读取200。四种宽度的线上构建交互检查通过，并使用真实报告快照核验桌面和手机渲染。后台核验摘要保存在发布目录的受保护文件`verification.json`中。

## 2026-09-07 后台管理系统一期

- 新增经营概览、用户 360、真题与材料、AI 任务与成本、批改质检、运营留存、权限与审计入口；保留题库、文章和采集能力。
- 新增后台接口 `/api/admin/dashboard`、`/api/admin/users/:id/summary`、`/api/admin/papers`、`/api/admin/attempts` 和 `/api/admin/quality`，使用现有学习、真题和 AI 任务数据。
- 支付、订单、会员、充值包、积分账本和优惠券按需求暂不接入真实写入，页面标记为 2.0 待接入，具体模型和验收边界见根目录 `后台管理系统2.0迭代说明.md`。
- 发布目录：`/opt/policyquest/releases/20260907-admin-console`；发布前备份：`/opt/policyquest/backups/20260907-before-admin-console/`。
- 前端构建、后端语法检查通过；线上 `/PolicyQuest/admin`、健康接口、管理员登录以及新增管理 API 均返回 200。浏览器自动化连接超时，未将浏览器截图检查记为通过。

## 2026-09-07 后台干净入口修复

- 修复 Hash 路由导致直接访问 `/PolicyQuest/admin` 回落到用户首页的问题。
- `/PolicyQuest/#/` 和 `/PolicyQuest/` 保持用户首页；`/PolicyQuest/admin`、`/PolicyQuest/admin/` 以及带 `#/` 的后台入口会切换到后台路由。
- 仅发布前端入口修复，发布目录：`/opt/policyquest/releases/20260907-admin-entry-fix`；发布前备份：`/opt/policyquest/backups/20260907-before-admin-entry-fix/frontend.tar.gz`。
- 前端构建通过，四个页面入口和健康接口 HTTP 返回 200；浏览器调试连接未能附着，未将浏览器截图检查记为通过。

## 2026-09-08 批改稳定性与后台运营补全

- 本次批改失败定位为模型返回的结构化报告缺少 `summary` 总评字段；其他三题已经成功，并非网络或模型鉴权故障。服务端现在会基于模型已经给出的分项分数、理由和要点覆盖生成可追溯总评，其他评分字段仍执行严格完整性校验，不使用模板分数。
- 新增逐次 AI 请求审计，保存请求地址、模型、请求参数、原始返回、HTTP 状态、耗时、业务用途以及关联用户和作答；后台仅管理员可查看。
- 新增反馈、公告、公告已读表和对应用户端、管理端接口；新增后台做题记录详情、真题/材料/单题维护接口。后台导航移除题库管理和时政采集入口。
- 发布目录：`/opt/policyquest/releases/20260908-admin-audit-notifications`；发布前备份：`/opt/policyquest/backups/20260908-before-admin-audit-notifications/`，包含应用、数据库和共用 Nginx 配置，权限已收紧。
- 第 8 次申论练习仅重新处理原失败的第 1 题，恢复为 4/4 批改成功，整卷诊断为 `ready`；另外三题报告哈希与重批前一致。此次重批产生的三次模型请求均已成功写入审计日志。
- 前端类型检查和生产构建、39 个后端 JavaScript 文件语法检查、差异检查、关键页面浏览器视觉检查均通过。线上健康接口、首页入口和构建资源均返回 200，新增六组用户端/管理端读取接口使用真实鉴权验证返回 200。

## 2026-09-08 积分与手写作答

- 发布目录：`/opt/policyquest/releases/20260908-credits-handwriting`；发布前应用、数据库及Nginx备份：`/opt/policyquest/backups/20260908-before-credits-handwriting/`，目录700、文件600。
- 新增用户积分余额与变动账本；已执行幂等迁移 `migrate-credits.js`。新注册赠100积分，每次整卷提交扣10积分；余额、账本及作答同事务写入，重复请求只扣一次，失败原记录重试不重复扣分。
- 学习中心账户与铃铛靠右，展示余额；后台“用户与权益”可增减积分并记录原因、操作人，“积分账本”入口跳转至用户账本。旧即时评分接口仅保留管理员内部调试权限。
- 独立容器 `policyquest-ocr` 通过 `127.0.0.1:8091` 提供 PaddleOCR / PP-OCRv5 识别（mobile_det检测 + server_rec识别），限制2 CPU / 3GB内存，启用重启恢复。依赖版本为PaddleOCR 3.3.3、PaddlePaddle 3.2.2；检测与识别模型缓存于 `/opt/policyquest/ocr-models`。
- OCR初始化和预测使用同一个专用线程，CPU推理线程数1、`OMP_NUM_THREADS=1`、`MALLOC_ARENA_MAX=2`，控制连续请求时的原生内存峰值，并以轻量检测模型降低大图的峰值内存；字迹模糊和潦草仍需校对。
- 生产环境新增OCR内网地址与共享密钥；OCR环境文件 `/opt/policyquest/ocr.env` 为600权限。仅PolicyQuest API代理新增 `client_max_body_size 10m`，Nginx检查通过；后端仍限制单图8MB。
- 44项独立MySQL测试、前端类型检查与构建通过。生产构建在1440、768、390、360像素宽度完成账户位置、积分显示、识别校对、段落移动与后台调分交互检查。
- 线上真实登录、照片识别、编辑并填入答案、OCR不扣积分、普通用户不能调整积分、2MB上传到达应用校验均已验证。额外使用2559×1347大图与中文手写样例连续验证：大图约14秒识别58行，手写样例约7秒识别13行，服务未重启。两名新用户均通过正式注册接口创建，登录后各100积分/10套额度；密码不写入文档或Git。
- 发布只重启PolicyQuest PM2进程与其独立OCR容器。回滚恢复应用及代理配置即可，保留余额列和账本，避免覆盖上线后数据。完整使用、接口与部署说明见 `docs/CREDITS_HANDWRITING.md`。

## 2026-09-08 OCR排队与等待提示

- 新增异步识别任务接口与单实例FIFO内存队列，1项执行、最多20人等待；每个账号最多一项未结束任务。前端每2秒查询自己的状态，显示前方等待人数、正在识别人数及动态预计等待分钟数，自动进入识别并回填可编辑文本。
- 支持取消排队和关闭窗口退出；90秒无查询的等待任务自动取消。运行中的原生推理继续执行但丢弃取消任务结果，不提前放开执行位。终态结果最多保存5分钟/100项，原图不落盘。重启丢失的任务明确提示重试。旧同步接口使用同一队列，兼容已打开页面。
- 发布目录 `/opt/policyquest/releases/20260908-ocr-queue`，应用备份 `/opt/policyquest/backups/20260908-before-ocr-queue/application.tar.gz`。只替换OCR路由、队列服务及前端构建，保留旧哈希资源；发布前确认没有批改、报告或AI请求正在执行，只重启PolicyQuest后端。没有数据库、Nginx或OCR容器变更。
- 本地7项队列测试和HTTP接口集成测试、前端类型检查及生产构建通过；1440和390像素宽度浏览器验证排队文案、自动进入识别、编辑填入、取消排队和无页面异常。测试文件保留在本地忽略目录。
- 线上通过公开API使用3个现有账号实测：第1项运行、第2项前方1人、第3项前方2人（当次预计29秒）；第3项取消成功，前2项真实照片依次识别成功，验证中文手写内容、账号隔离及积分未扣除。

## 2026-09-08 原文批注与下方评语上线

- 应用提交：`50b261425cd09ad9d0f6989f923c2dfad52435c9`，已推送 `origin/main`。同步此前已上线但未入库的应用依赖；本地测试、凭据及视频脚本未纳入提交。
- 发布目录：`/opt/policyquest/releases/20260908-annotations-130202`。备份：`/opt/policyquest/backups/20260908-annotations-130202/application.tar.gz`，含后端源码、依赖声明、生产环境配置及前端；同目录保存共用Nginx配置。目录700、备份文件600。
- 发布时间：北京时间2026-09-08 13:03。线上源码比对确认后端仅需更新原文批注服务、批改生成服务、评分规范化和历史记录读取四个文件。发布前确认没有批改、总结或AI请求执行；只重启 `policyquest`，没有数据库、环境变量、依赖、Nginx及OCR容器变更。
- 保留总分与维度、答案与拆解、下一步训练，将原有四类诊断整合到统一结果。点击注号，在对应标注下方展开可关闭的老师评语；桌面和手机布局一致。评分点、维度与训练证据支持关联跳转。
- 服务器Node 16语法检查通过，发布包71个文件及其线上目标文件的SHA-256校验一致。先复制静态资源并保留旧哈希文件，后端健康检查通过后原子替换入口HTML。发布脚本包含失败时恢复应用备份的处理。
- 使用生产模型及合成作答完成新协议验证：`gpt-5.6-luna` 返回2.8/10分、2处原文批注、6项老师补充、3版参考答案和4条训练关联证据；分项合计、原文偏移和证据ID校验通过。没有创建用户作答记录，合成报告保存在发布目录受保护的 `model-smoke-report.json`。
- 公网健康接口200，未登录读取历史记录401，临时鉴权后的历史记录读取200；确认历史得分保持、批注偏移匹配原答案，数据库内原报告哈希前后相同。PM2状态 `online`。
- 公网生产构建在1440、390像素宽度通过页面验证：评语位于选中标注下方、关闭与切换正常、四个主模块保留、无横向溢出或页面异常。页面交互使用拦截的合成API数据；真实历史API读取另行验证，不将两者冒充完整真实用户提交链路。
- 本地19项后端检查及前端类型检查、生产构建通过。发布摘要位于发布目录 `verification.json`。回滚可恢复本次应用备份并重启 `policyquest`；多余新静态资源可保留，无需回滚数据库。
