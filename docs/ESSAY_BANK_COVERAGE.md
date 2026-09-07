# 2022—2026 申论题库来源与覆盖情况

核验日期：2026-09-07。近五年按考试年度2022—2026统计。
本批次 258 套题组、1022 道主观题。国考每年副省级、地市级、行政执法各一套；各省保留来源的实际卷别，不人为给每省补造国考分类。

0 表示尚缺可核验来源，不表示没有考试。本批题库仍未达到所有省份、所有年份、所有卷别的完整覆盖。部分广东公安、行政执法来源仅含主观题（60或65分），已加“仅收录主观题”标签，不标为100分整卷。
公开整理版可能存在回忆和转录差异；分值按题干括号中的分值提取，不能把“15分钟”错当“15分”。只规定最低字数的题不虚构最高字数。每题保留来源链接，完整清单及缓存SHA-256见 `backend/src/seeds/essay-sources-2022-2026.json`。

| 地区 | 2022 | 2023 | 2024 | 2025 | 2026 |
| --- | --- | --- | --- | --- | --- |
| 全国 | 3 | 3 | 3 | 3 | 3 |
| 北京 | 1 | 1 | 0 | 1 | 0 |
| 上海 | 1 | 1 | 2 | 2 | 1 |
| 天津 | 2 | 2 | 1 | 2 | 1 |
| 重庆 | 2 | 2 | 3 | 3 | 0 |
| 河北 | 2 | 3 | 3 | 3 | 0 |
| 山西 | 2 | 2 | 2 | 2 | 0 |
| 辽宁 | 2 | 2 | 2 | 2 | 0 |
| 吉林 | 1 | 2 | 0 | 0 | 0 |
| 黑龙江 | 3 | 2 | 3 | 2 | 0 |
| 江苏 | 3 | 3 | 3 | 3 | 0 |
| 浙江 | 0 | 3 | 3 | 3 | 3 |
| 安徽 | 3 | 4 | 3 | 3 | 3 |
| 福建 | 3 | 3 | 3 | 2 | 0 |
| 江西 | 2 | 1 | 3 | 3 | 0 |
| 山东 | 2 | 2 | 2 | 1 | 0 |
| 河南 | 2 | 2 | 2 | 2 | 1 |
| 湖北 | 1 | 2 | 1 | 2 | 0 |
| 湖南 | 2 | 2 | 1 | 3 | 0 |
| 广东 | 2 | 4 | 5 | 6 | 4 |
| 海南 | 2 | 2 | 1 | 1 | 0 |
| 四川 | 4 | 2 | 2 | 3 | 0 |
| 贵州 | 1 | 2 | 2 | 1 | 0 |
| 云南 | 0 | 2 | 2 | 1 | 0 |
| 陕西 | 3 | 1 | 2 | 1 | 0 |
| 甘肃 | 1 | 1 | 1 | 0 | 0 |
| 青海 | 1 | 1 | 0 | 2 | 0 |
| 内蒙古 | 2 | 1 | 2 | 0 | 0 |
| 广西 | 1 | 3 | 2 | 1 | 0 |
| 西藏 | 0 | 0 | 0 | 0 | 0 |
| 宁夏 | 3 | 2 | 1 | 0 | 0 |
| 新疆 | 1 | 0 | 1 | 2 | 0 |

## 导入与后续补充

```bash
cd backend
node src/seeds/import-essay-bank.js /path/to/essay-sources --dry-run
node src/seeds/import-essay-bank.js /path/to/essay-sources
```

导入前执行部署文档中的数据库备份。脚本先核对所有缓存摘要、材料分段、题目数量与逐题分值，全部通过后才入库；按原题编号复用已有主键，批量更新材料与题目，不删除历史作答。新增来源先核验考试年度、卷别、完整题干、给定材料和分值，再补充清单。

## 来源目录

- [2026上海公务员申论真题及答案解析](https://www.aipta.com/article/10639.html)：4题，分值 15 / 15 / 20 / 50。
- [2026浙江省考申论真题及答案解析（C类）](https://www.aipta.com/article/10638.html)：3题，分值 20 / 30 / 50。
- [2026河南省考申论真题及答案解析（县级卷）](https://www.aipta.com/article/10637.html)：4题，分值 20 / 20 / 25 / 35。
- [2025湖南省考申论真题及答案解析（省市卷）](https://www.aipta.com/article/10631.html)：4题，分值 15 / 20 / 25 / 40。
- [2025湖南省考申论真题及答案解析（县乡卷）](https://www.aipta.com/article/10630.html)：4题，分值 15 / 20 / 25 / 40。
- [2025江西省考申论真题及答案解析（县乡卷）](https://www.aipta.com/article/10487.html)：4题，分值 15 / 20 / 25 / 40。
- [2025江西省考申论真题及答案解析（行政执法卷）](https://www.aipta.com/article/10629.html)：4题，分值 15 / 20 / 25 / 40。
- [2026广东省考申论真题及答案解析（省市卷）](https://www.aipta.com/article/10613.html)：3题，分值 20 / 30 / 50。
- [2026浙江省考申论真题及答案解析（A类）](https://www.aipta.com/article/10621.html)：3题，分值 20 / 30 / 50。
- [2026浙江省考申论真题及答案解析（B类）](https://www.aipta.com/article/10622.html)：3题，分值 20 / 30 / 50。
- [2026天津公务员申论真题及答案解析（行政执法卷）](https://www.aipta.com/article/10623.html)：4题，分值 15 / 20 / 25 / 40。
- [2025重庆公务员申论真题及答案解析（三卷）](https://www.aipta.com/article/10626.html)：4题，分值 15 / 20 / 25 / 40。
- [2025新疆公务员申论真题及答案解析（县乡卷）](https://www.aipta.com/article/10627.html)：4题，分值 15 / 20 / 25 / 40。
- [2025青海省考申论真题及答案解析（县乡卷）](https://www.aipta.com/article/10628.html)：4题，分值 20 / 30 / 30 / 40。
- [2026广东省考申论真题及答案解析（公安卷）](https://www.aipta.com/article/10614.html)：3题，分值 20 / 20 / 20（仅主观题）。
- [2025湖北省考申论真题及答案解析（县乡卷）](https://www.aipta.com/article/10620.html)：4题，分值 15 / 20 / 25 / 40。
- [2025河南省考申论真题及答案解析（县级卷）](https://www.aipta.com/article/10619.html)：5题，分值 15 / 25 / 20 / 20 / 20。
- [2025河北省考申论真题及答案解析（C卷）](https://www.aipta.com/article/10618.html)：4题，分值 20 / 20 / 20 / 40。
- [2025河北省考申论真题及答案解析（B卷）](https://www.aipta.com/article/10617.html)：4题，分值 20 / 20 / 20 / 40。
- [2025上海公务员申论真题及答案解析（A卷）](https://www.aipta.com/article/10616.html)：4题，分值 20 / 15 / 15 / 50。
- [2023山东省考申论真题及答案解析（B类）](https://www.aipta.com/article/10615.html)：3题，分值 20 / 30 / 50。
- [2026广东省考申论真题及答案解析（行政执法卷）](https://www.aipta.com/article/10612.html)：3题，分值 15 / 20 / 30（仅主观题）。
- [2026广东省考申论真题及答案解析（县镇卷）](https://www.aipta.com/article/10611.html)：3题，分值 20 / 30 / 50。
- [2025江西省考申论真题及答案解析（省市卷）](https://www.aipta.com/article/10283.html)：4题，分值 15 / 20 / 25 / 40。
- [2024江西省考申论真题及答案解析（省市卷）](https://www.aipta.com/article/9940.html)：4题，分值 15 / 20 / 25 / 40。
- [2024江西省考申论真题及答案解析（县乡卷）](https://www.aipta.com/article/9939.html)：4题，分值 20 / 20 / 25 / 35。
- [2024江西省考申论真题及答案解析（行政执法卷）](https://www.aipta.com/article/9595.html)：4题，分值 15 / 20 / 25 / 40。
- [2023江西省考申论真题及答案解析（省市卷）](https://www.aipta.com/article/9112.html)：4题，分值 15 / 20 / 25 / 40。
- [2022江西省考申论真题及答案解析（县乡卷）](https://www.aipta.com/article/5391.html)：4题，分值 25 / 15 / 25 / 35。
- [2022江西省考申论真题及答案解析（行政执法卷）](https://www.aipta.com/article/5390.html)：4题，分值 15 / 20 / 25 / 40。
- [2025安徽省考申论真题及答案解析（B卷）](https://www.aipta.com/article/10456.html)：4题，分值 15 / 20 / 25 / 40。
- [2025安徽省考申论真题及答案解析（C卷）](https://www.aipta.com/article/10190.html)：4题，分值 15 / 20 / 25 / 40。
- [2025安徽省考申论真题及答案解析（A卷）](https://www.aipta.com/article/10189.html)：4题，分值 15 / 20 / 25 / 40。
- [2024安徽省考申论真题及答案解析（A卷）](https://www.aipta.com/article/9580.html)：4题，分值 15 / 20 / 25 / 40。
- [2024安徽省考申论真题及答案解析（B卷）](https://www.aipta.com/article/9579.html)：4题，分值 15 / 20 / 25 / 40。
- [2024安徽省考申论真题及答案解析（C卷）](https://www.aipta.com/article/9578.html)：4题，分值 15 / 20 / 25 / 40。
- [2023安徽省考申论真题及答案解析（乡镇机关）](https://www.aipta.com/article/9000.html)：4题，分值 15 / 20 / 30 / 35。
- [2023安徽省考申论真题及答案解析（B卷）](https://www.aipta.com/article/7462.html)：4题，分值 15 / 25 / 25 / 35。
- [2023安徽省考申论真题及答案解析（C卷）](https://www.aipta.com/article/6695.html)：4题，分值 20 / 20 / 25 / 35。
- [2023安徽省考申论真题及答案解析（A卷）](https://www.aipta.com/article/6694.html)：4题，分值 15 / 20 / 25 / 40。
- [2025北京公务员申论真题及答案解析](https://www.aipta.com/article/10457.html)：4题，分值 20 / 15 / 25 / 40。
- [2025重庆公务员申论真题及答案解析（一卷）](https://www.aipta.com/article/10282.html)：4题，分值 15 / 20 / 25 / 40。
- [2025重庆公务员申论真题及答案解析（二卷）](https://www.aipta.com/article/10243.html)：4题，分值 15 / 20 / 25 / 40。
- [2024重庆公务员申论真题及答案解析（三卷）](https://www.aipta.com/article/10242.html)：4题，分值 15 / 20 / 25 / 40。
- [2024重庆公务员申论真题及答案解析（二卷）](https://www.aipta.com/article/9942.html)：4题，分值 15 / 20 / 25 / 40。
- [2024重庆公务员申论真题及答案解析（一卷）](https://www.aipta.com/article/9941.html)：4题，分值 15 / 20 / 25 / 40。
- [2023重庆公务员申论真题及答案解析（三卷）](https://www.aipta.com/article/8910.html)：4题，分值 15 / 20 / 25 / 40。
- [2023重庆公务员申论真题及答案解析（二卷）](https://www.aipta.com/article/8039.html)：4题，分值 15 / 20 / 25 / 40。
- [2022重庆公务员申论真题及答案解析（二卷）](https://www.aipta.com/article/5394.html)：4题，分值 15 / 25 / 25 / 35。
- [2025福建省考申论真题及答案解析（省市卷）](https://www.aipta.com/article/10288.html)：4题，分值 15 / 20 / 25 / 40。
- [2025福建省考申论真题及答案解析（通用卷）](https://www.aipta.com/article/10187.html)：4题，分值 15 / 20 / 25 / 40。
- [2024福建省考申论真题及答案解析（省市卷）](https://www.aipta.com/article/9936.html)：4题，分值 10 / 20 / 30 / 40。
- [2024福建省考申论真题及答案解析（行政执法卷）](https://www.aipta.com/article/9867.html)：4题，分值 15 / 15 / 25 / 45。
- [2024福建省考申论真题及答案解析（县乡卷）](https://www.aipta.com/article/9575.html)：4题，分值 15 / 20 / 25 / 40。
- [2023福建省考申论真题及答案解析（省市卷）](https://www.aipta.com/article/7465.html)：4题，分值 15 / 15 / 25 / 45。
- [2023福建省考申论真题及答案解析（县乡卷）](https://www.aipta.com/article/7464.html)：4题，分值 15 / 20 / 25 / 40。
- [2023福建省考申论真题及答案解析（行政执法卷）](https://www.aipta.com/article/7463.html)：4题，分值 15 / 15 / 30 / 40。
- [2025广东省考申论真题及答案解析（行政执法卷）](https://www.aipta.com/article/10287.html)：3题，分值 15 / 20 / 30（仅主观题）。
- [2025深圳市公务员申论真题及答案解析（一卷）](https://www.aipta.com/article/10281.html)：3题，分值 20 / 30 / 50。
- [2025深圳市公务员申论真题及答案解析（二卷）](https://www.aipta.com/article/10280.html)：3题，分值 20 / 30 / 50。
- [2025广东省考申论真题及答案解析（县镇）](https://www.aipta.com/article/10172.html)：3题，分值 20 / 30 / 50。
- [2025广东省考申论真题及答案解析（公安）](https://www.aipta.com/article/10171.html)：3题，分值 20 / 20 / 20（仅主观题）。
- [2025广东省考申论真题及答案解析（省市）](https://www.aipta.com/article/10170.html)：3题，分值 20 / 30 / 50。
- [2024深圳市公务员申论真题及答案解析（二卷）](https://www.aipta.com/article/9610.html)：3题，分值 20 / 30 / 50。
- [2024广东省考申论真题及答案解析（行政执法卷）](https://www.aipta.com/article/9573.html)：3题，分值 15 / 25 / 25（仅主观题）。
- [2024广东省考申论真题及答案解析（公安岗）](https://www.aipta.com/article/9572.html)：3题，分值 15 / 20 / 25（仅主观题）。
- [2024广东省考申论真题及答案解析（县镇卷）](https://www.aipta.com/article/9571.html)：3题，分值 20 / 30 / 50。
- [2024广东省考申论真题及答案解析（省市卷）](https://www.aipta.com/article/9570.html)：3题，分值 20 / 30 / 50。
- [2023深圳市公务员申论真题及答案解析（二卷）](https://www.aipta.com/article/6709.html)：3题，分值 20 / 30 / 50。
- [2023深圳市公务员申论真题及答案解析（一卷）](https://www.aipta.com/article/6708.html)：3题，分值 20 / 30 / 50。
- [2023广东省考申论真题及答案解析（乡镇卷）](https://www.aipta.com/article/6696.html)：5题，分值 15 / 15 / 20 / 20 / 30。
- [2025广西公务员申论真题及答案解析（B卷）](https://www.aipta.com/article/10188.html)：4题，分值 20 / 15 / 25 / 40。
- [2024广西公务员申论真题及答案解析（A卷）](https://www.aipta.com/article/9868.html)：4题，分值 15 / 20 / 25 / 40。
- [2024广西公务员申论真题及答案解析（C卷）](https://www.aipta.com/article/9576.html)：4题，分值 15 / 20 / 30 / 35。
- [2023广西公务员申论真题及答案解析（B卷）](https://www.aipta.com/article/8038.html)：4题，分值 20 / 20 / 20 / 40。
- [2023广西公务员申论真题及答案解析（C卷）](https://www.aipta.com/article/7478.html)：4题，分值 15 / 20 / 25 / 40。
- [2023广西公务员申论真题及答案解析（A卷）](https://www.aipta.com/article/7467.html)：4题，分值 15 / 20 / 25 / 40。
- [2025贵州省考申论真题及答案解析（B卷）](https://www.aipta.com/article/10140.html)：4题，分值 20 / 30 / 40 / 60。
- [2024贵州省考申论真题及答案解析（A卷）](https://www.aipta.com/article/9937.html)：4题，分值 20 / 30 / 40 / 60。
- [2024贵州省考申论真题及答案解析（B卷）](https://www.aipta.com/article/9607.html)：4题，分值 20 / 30 / 40 / 60。
- [2023贵州省考申论真题及答案解析（B卷）](https://www.aipta.com/article/5683.html)：4题，分值 30 / 30 / 40 / 50。
- [2023贵州省考申论真题及答案解析（A卷）](https://www.aipta.com/article/5396.html)：4题，分值 20 / 30 / 40 / 60。
- [2022贵州省考申论真题及答案解析（B卷）](https://www.aipta.com/article/3660.html)：4题，分值 30 / 30 / 40 / 50。
- [2024甘肃省考申论真题及答案解析（县乡卷）](https://www.aipta.com/article/9608.html)：4题，分值 15 / 20 / 25 / 40。
- [2023甘肃省考申论真题及答案解析（县乡卷）](https://www.aipta.com/article/7466.html)：4题，分值 10 / 25 / 25 / 40。
- [2022甘肃省考申论真题及答案解析（县乡卷）](https://www.aipta.com/article/5386.html)：4题，分值 15 / 30 / 15 / 40。
- [2025黑龙江省考申论真题及答案解析（县乡卷）](https://www.aipta.com/article/10403.html)：4题，分值 15 / 20 / 25 / 40。
- [2025黑龙江省考申论真题及答案解析（省市卷）](https://www.aipta.com/article/10402.html)：4题，分值 15 / 20 / 25 / 40。
- [2024黑龙江省考申论真题及答案解析（省市卷）](https://www.aipta.com/article/10290.html)：4题，分值 15 / 20 / 25 / 40。
- [2024黑龙江省考申论真题及答案解析（县乡卷）](https://www.aipta.com/article/9870.html)：4题，分值 15 / 20 / 25 / 40。
- [2024黑龙江省考申论真题及答案解析（行政执法卷）](https://www.aipta.com/article/9869.html)：4题，分值 15 / 20 / 25 / 40。
- [2023黑龙江省考申论真题及答案解析（县乡卷）](https://www.aipta.com/article/9002.html)：4题，分值 15 / 20 / 25 / 40。
- [2023黑龙江省考申论真题及答案解析（行政执法卷）](https://www.aipta.com/article/9001.html)：4题，分值 15 / 20 / 25 / 40。
- [2022黑龙江省考申论真题及答案解析（行政执法卷）](https://www.aipta.com/article/5388.html)：4题，分值 15 / 20 / 25 / 40。
- [2025河南省考申论真题及答案解析（市级卷）](https://www.aipta.com/article/10237.html)：4题，分值 20 / 20 / 20 / 40。
- [2024河南省考申论真题及答案解析（市级卷）](https://www.aipta.com/article/9594.html)：4题，分值 20 / 20 / 20 / 40。
- [2024河南省考申论真题及答案解析（县级卷）](https://www.aipta.com/article/9593.html)：4题，分值 20 / 20 / 20 / 40。
- [2022河南省考申论真题及答案解析（乡镇卷）](https://www.aipta.com/article/8907.html)：4题，分值 20 / 20 / 20 / 40。
- [2023河南省考申论真题及答案解析（市级卷）](https://www.aipta.com/article/6699.html)：4题，分值 20 / 20 / 20 / 40。
- [2023河南省考申论真题及答案解析（县级卷）](https://www.aipta.com/article/6698.html)：5题，分值 20 / 20 / 20 / 20 / 20。
- [2025河北省考申论真题及答案解析（A卷）](https://www.aipta.com/article/10236.html)：4题，分值 20 / 20 / 20 / 40。
- [2024河北省考申论真题及答案解析（C卷）](https://www.aipta.com/article/9938.html)：4题，分值 20 / 20 / 20 / 40。
- [2024河北省考申论真题及答案解析（A卷）](https://www.aipta.com/article/9591.html)：4题，分值 20 / 20 / 20 / 40。
- [2024河北省考申论真题及答案解析（B卷）](https://www.aipta.com/article/9590.html)：4题，分值 25 / 15 / 20 / 40。
- [2023河北省考申论真题及答案解析（C卷）](https://www.aipta.com/article/10295.html)：4题，分值 25 / 15 / 20 / 40。
- [2023河北省考申论真题及答案解析（B卷）](https://www.aipta.com/article/10294.html)：4题，分值 25 / 20 / 15 / 40。
- [2025湖北省考申论真题及答案解析（省市卷）](https://www.aipta.com/article/10285.html)：4题，分值 15 / 20 / 25 / 40。
- [2024湖北省考申论真题及答案解析（县乡卷）](https://www.aipta.com/article/9597.html)：4题，分值 20 / 20 / 20 / 40。
- [2023湖北省考申论真题及答案解析（省市卷）](https://www.aipta.com/article/10293.html)：4题，分值 15 / 20 / 25 / 40。
- [2023湖北省考申论真题及答案解析（县乡卷）](https://www.aipta.com/article/6700.html)：4题，分值 15 / 20 / 25 / 40。
- [2025湖南省考申论真题及答案解析（行政执法卷）](https://www.aipta.com/article/10284.html)：4题，分值 15 / 20 / 25 / 40。
- [2024湖南省考申论真题及答案解析（省市卷）](https://www.aipta.com/article/9596.html)：4题，分值 10 / 20 / 30 / 40。
- [2023湖南省考申论真题及答案解析（县乡卷）](https://www.aipta.com/article/10292.html)：4题，分值 15 / 20 / 25 / 40。
- [2022湖南省考申论真题及答案解析（行政执法卷）](https://www.aipta.com/article/8719.html)：4题，分值 15 / 20 / 25 / 40。
- [2023湖南省考申论真题及答案解析（省市卷）](https://www.aipta.com/article/7481.html)：4题，分值 10 / 25 / 25 / 40。
- [2025海南省考申论真题及答案解析（B卷）](https://www.aipta.com/article/10286.html)：4题，分值 15 / 20 / 25 / 40。
- [2024海南省考申论真题及答案解析（A卷）](https://www.aipta.com/article/9592.html)：4题，分值 10 / 20 / 30 / 40。
- [2023海南省考申论真题及答案解析（A卷）](https://www.aipta.com/article/7480.html)：3题，分值 20 / 30 / 50。
- [2023海南省考申论真题及答案解析（C卷）](https://www.aipta.com/article/7479.html)：4题，分值 20 / 20 / 25 / 35。
- [2022海南省考申论真题及答案解析（C卷）](https://www.aipta.com/article/6420.html)：4题，分值 20 / 20 / 25 / 35。
- [2022海南省考申论真题及答案解析（B卷）](https://www.aipta.com/article/5387.html)：4题，分值 20 / 20 / 30 / 30。
- [2025江苏省考申论真题及答案解析（C类）](https://www.aipta.com/article/10169.html)：4题，分值 20 / 20 / 20 / 40。
- [2025江苏省考申论真题及答案解析（B类）](https://www.aipta.com/article/10168.html)：4题，分值 20 / 15 / 25 / 40。
- [2025江苏省考申论真题及答案解析（A类）](https://www.aipta.com/article/10005.html)：4题，分值 20 / 20 / 20 / 40。
- [2024江苏省考申论真题及答案解析（A类）](https://www.aipta.com/article/9569.html)：4题，分值 20 / 20 / 20 / 40。
- [2024江苏省考申论真题及答案解析（B类）](https://www.aipta.com/article/9568.html)：4题，分值 15 / 20 / 25 / 40。
- [2024江苏省考申论真题及答案解析（C类）](https://www.aipta.com/article/9567.html)：4题，分值 20 / 15 / 25 / 40。
- [2023江苏省考申论真题及答案解析（C类）](https://www.aipta.com/article/8721.html)：4题，分值 20 / 20 / 20 / 40。
- [2023江苏省考申论真题及答案解析（B类）](https://www.aipta.com/article/6423.html)：4题，分值 20 / 15 / 25 / 40。
- [2023江苏省考申论真题及答案解析（A类）](https://www.aipta.com/article/6422.html)：4题，分值 20 / 20 / 20 / 40。
- [2023吉林省考申论真题及答案解析（乙卷）](https://www.aipta.com/article/6702.html)：4题，分值 15 / 20 / 25 / 40。
- [2023吉林省考申论真题及答案解析（丙卷）](https://www.aipta.com/article/6701.html)：4题，分值 20 / 25 / 25 / 30。
- [2025辽宁省考申论真题及答案解析（B卷）](https://www.aipta.com/article/10193.html)：4题，分值 15 / 20 / 25 / 40。
- [2025辽宁省考申论真题及答案解析（A卷）](https://www.aipta.com/article/10192.html)：4题，分值 15 / 20 / 25 / 40。
- [2024辽宁省考申论真题及答案解析（A卷）](https://www.aipta.com/article/9584.html)：4题，分值 15 / 20 / 25 / 40。
- [2024辽宁省考申论真题及答案解析（B卷）](https://www.aipta.com/article/9583.html)：4题，分值 15 / 20 / 25 / 40。
- [2022辽宁省考申论真题及答案解析（A卷）](https://www.aipta.com/article/8033.html)：4题，分值 15 / 20 / 25 / 40。
- [2023辽宁省考申论真题及答案解析（B卷）](https://www.aipta.com/article/6428.html)：4题，分值 15 / 20 / 25 / 40。
- [2023辽宁省考申论真题及答案解析（A卷）](https://www.aipta.com/article/6427.html)：4题，分值 15 / 20 / 25 / 40。
- [2024内蒙古公务员申论真题及答案解析（盟市卷）](https://www.aipta.com/article/10241.html)：4题，分值 20 / 15 / 25 / 40。
- [2024内蒙古公务员申论真题及答案解析（旗县卷）](https://www.aipta.com/article/10240.html)：4题，分值 25 / 15 / 25 / 35。
- [2023内蒙古公务员申论真题及答案解析（旗县卷）](https://www.aipta.com/article/6703.html)：4题，分值 20 / 15 / 25 / 40。
- [2022内蒙古公务员申论真题及答案解析（旗县卷）](https://www.aipta.com/article/5392.html)：4题，分值 28 / 22 / 18 / 32。
- [2023宁夏公务员申论真题及答案解析（C卷）](https://www.aipta.com/article/10250.html)：4题，分值 25 / 30 / 35 / 60。
- [2023宁夏公务员申论真题及答案解析（A卷）](https://www.aipta.com/article/10249.html)：4题，分值 25 / 35 / 30 / 60。
- [2024宁夏公务员申论真题及答案解析（C卷）](https://www.aipta.com/article/9609.html)：4题，分值 25 / 30 / 35 / 60。
- [2022宁夏公务员申论真题及答案解析（C卷）](https://www.aipta.com/article/8720.html)：4题，分值 30 / 30 / 40 / 50。
- [2022宁夏公务员申论真题及答案解析（A卷）](https://www.aipta.com/article/8034.html)：4题，分值 20 / 30 / 40 / 60。
- [2022宁夏公务员申论真题及答案解析（B卷）](https://www.aipta.com/article/5393.html)：4题，分值 25 / 30 / 35 / 60。
- [2025青海省考申论真题及答案解析（行政执法卷）](https://www.aipta.com/article/10251.html)：4题，分值 20 / 25 / 25 / 50。
- [2023青海省考申论真题及答案解析（行政执法卷）](https://www.aipta.com/article/7482.html)：4题，分值 15 / 20 / 25 / 40。
- [2025山东省考申论真题及答案解析（C类）](https://www.aipta.com/article/10401.html)：4题，分值 15 / 20 / 25 / 40。
- [2024山东省考申论真题及答案解析（A类）](https://www.aipta.com/article/10167.html)：4题，分值 15 / 20 / 25 / 40。
- [2023山东省考申论真题及答案解析（A类）](https://www.aipta.com/article/10166.html)：3题，分值 20 / 30 / 50。
- [2024山东省考申论真题及答案解析（B卷）](https://www.aipta.com/article/9934.html)：4题，分值 15 / 20 / 25 / 40。
- [2025上海公务员申论真题及答案解析（B卷）](https://www.aipta.com/article/10191.html)：4题，分值 15 / 15 / 20 / 50。
- [2024上海公务员申论真题及答案解析（A卷）](https://www.aipta.com/article/9582.html)：4题，分值 15 / 15 / 20 / 50。
- [2024上海公务员申论真题及答案解析（B卷）](https://www.aipta.com/article/9581.html)：4题，分值 15 / 20 / 15 / 50。
- [2023上海公务员申论真题及答案解析（A卷）](https://www.aipta.com/article/6421.html)：4题，分值 15 / 20 / 15 / 50。
- [2025陕西省考申论真题及答案解析（A卷）](https://www.aipta.com/article/10245.html)：6题，分值 10 / 15 / 20 / 25 / 30 / 50。
- [2024陕西省考申论真题及答案解析（C卷）](https://www.aipta.com/article/10289.html)：5题，分值 15 / 25 / 25 / 35 / 50。
- [2024陕西省考申论真题及答案解析（B卷）](https://www.aipta.com/article/10244.html)：5题，分值 15 / 20 / 30 / 35 / 50。
- [2022陕西省考申论真题及答案解析（C卷）](https://www.aipta.com/article/8036.html)：5题，分值 15 / 20 / 30 / 35 / 50。
- [2022陕西省考申论真题及答案解析（A卷）](https://www.aipta.com/article/8035.html)：6题，分值 10 / 15 / 25 / 20 / 30 / 50。
- [2025山西省考申论真题及答案解析（县乡卷）](https://www.aipta.com/article/10239.html)：4题，分值 15 / 20 / 25 / 40。
- [2025山西省考申论真题及答案解析（省市卷）](https://www.aipta.com/article/10238.html)：4题，分值 15 / 20 / 25 / 40。
- [2024山西省考申论真题及答案解析（省市卷）](https://www.aipta.com/article/9606.html)：4题，分值 20 / 15 / 25 / 40。
- [2024山西省考申论真题及答案解析（县乡卷）](https://www.aipta.com/article/9605.html)：4题，分值 15 / 20 / 25 / 40。
- [2023山西省考申论真题及答案解析（县乡卷）](https://www.aipta.com/article/6705.html)：4题，分值 15 / 20 / 30 / 35。
- [2023山西省考申论真题及答案解析（省市卷）](https://www.aipta.com/article/6704.html)：4题，分值 15 / 20 / 25 / 40。
- [2025四川省考申论真题及答案解析（行政执法卷）](https://www.aipta.com/article/10174.html)：4题，分值 15 / 20 / 25 / 40。
- [2025四川省考申论真题及答案解析（省市卷）](https://www.aipta.com/article/10173.html)：4题，分值 15 / 20 / 25 / 40。
- [2025四川省考申论真题及答案解析（县乡卷）](https://www.aipta.com/article/10006.html)：4题，分值 15 / 20 / 25 / 40。
- [2024四川省考申论真题及答案解析（行政执法卷）](https://www.aipta.com/article/9866.html)：4题，分值 15 / 20 / 25 / 40。
- [2024四川省考申论真题及答案解析（县乡卷）](https://www.aipta.com/article/9574.html)：4题，分值 15 / 20 / 25 / 40。
- [2022下半年四川省考申论真题及答案解析（行政执法卷）](https://www.aipta.com/article/7461.html)：4题，分值 15 / 20 / 25 / 40。
- [2023四川省考申论真题及答案解析（省市卷）](https://www.aipta.com/article/6707.html)：4题，分值 15 / 20 / 25 / 40。
- [2025天津公务员申论真题及答案解析（街镇卷）](https://www.aipta.com/article/10235.html)：4题，分值 15 / 20 / 25 / 40。
- [2025天津公务员申论真题及答案解析（市区卷）](https://www.aipta.com/article/10234.html)：4题，分值 15 / 20 / 25 / 40。
- [2024天津公务员申论真题及答案解析（市区卷）](https://www.aipta.com/article/9871.html)：4题，分值 15 / 20 / 25 / 40。
- [2023天津公务员申论真题及答案解析（行政执法卷）](https://www.aipta.com/article/8908.html)：4题，分值 15 / 20 / 25 / 40。
- [2022天津公务员申论真题及答案解析（区级卷）](https://www.aipta.com/article/8037.html)：3题，分值 20 / 30 / 50。
- [2023天津公务员申论真题及答案解析（乡镇卷）](https://www.aipta.com/article/7483.html)：4题，分值 15 / 20 / 25 / 40。
- [2025新疆公务员申论真题及答案解析（行政执法卷）](https://www.aipta.com/article/10248.html)：4题，分值 10 / 25 / 25 / 40。
- [2024新疆公务员申论真题及答案解析（县乡卷）](https://www.aipta.com/article/9872.html)：4题，分值 15 / 25 / 20 / 40。
- [2022新疆公务员申论真题及答案解析（县乡卷）](https://www.aipta.com/article/8032.html)：4题，分值 15 / 20 / 25 / 40。
- [2025云南省考申论真题及答案解析（县乡卷）](https://www.aipta.com/article/10247.html)：4题，分值 15 / 20 / 25 / 40。
- [2024云南省考申论真题及答案解析（县乡卷）](https://www.aipta.com/article/10246.html)：4题，分值 15 / 20 / 25 / 40。
- [2024云南省考申论真题及答案解析（州市卷）](https://www.aipta.com/article/9412.html)：4题，分值 15 / 20 / 25 / 40。
- [2023云南省考申论真题及答案解析（州市卷）](https://www.aipta.com/article/10291.html)：4题，分值 15 / 20 / 25 / 40。
- [2023云南省考申论真题及答案解析（县乡卷）](https://www.aipta.com/article/8909.html)：4题，分值 15 / 20 / 30 / 35。
- [2025浙江省考申论真题及答案解析（C类）](https://www.aipta.com/article/10165.html)：3题，分值 20 / 30 / 50。
- [2025浙江省考申论真题及答案解析（B类）](https://www.aipta.com/article/10164.html)：3题，分值 20 / 30 / 50。
- [2025浙江省考申论真题及答案解析（A类）](https://www.aipta.com/article/10007.html)：3题，分值 20 / 30 / 50。
- [2024浙江省考申论真题及答案解析（A类）](https://www.aipta.com/article/9566.html)：3题，分值 20 / 30 / 50。
- [2024浙江省考申论真题及答案解析（B类）](https://www.aipta.com/article/9565.html)：3题，分值 20 / 30 / 50。
- [2024浙江省考申论真题及答案解析（C类）](https://www.aipta.com/article/9564.html)：3题，分值 20 / 30 / 50。
- [2023浙江省考申论真题及答案解析（C类）](https://www.aipta.com/article/6426.html)：3题，分值 20 / 30 / 50。
- [2023浙江省考申论真题及答案解析（B类）](https://www.aipta.com/article/6425.html)：3题，分值 20 / 30 / 50。
- [2023浙江省考申论真题及答案解析（A类）](https://www.aipta.com/article/6424.html)：3题，分值 20 / 30 / 50。
- [2026国考申论真题及答案解析（地市卷）](https://www.aipta.com/article/10624.html)：5题，分值 10 / 15 / 20 / 20 / 35。
- [2026国考申论真题及答案解析（副省卷）](https://www.aipta.com/article/10625.html)：5题，分值 10 / 15 / 20 / 20 / 35。
- [2026国考申论真题及答案解析（行政执法卷）](https://www.aipta.com/article/10455.html)：5题，分值 15 / 10 / 20 / 20 / 35。
- [2025国考申论真题及答案解析（副省卷）](https://www.aipta.com/article/10150.html)：5题，分值 15 / 10 / 20 / 20 / 35。
- [2025国考申论真题及答案解析（地市卷）](https://www.aipta.com/article/10149.html)：5题，分值 10 / 15 / 20 / 20 / 35。
- [2025国考申论真题及答案解析（行政执法卷）](https://www.aipta.com/article/9943.html)：5题，分值 10 / 15 / 20 / 20 / 35。
- [2024国考申论真题及答案解析（行政执法卷）](https://www.aipta.com/article/9220.html)：5题，分值 10 / 15 / 20 / 20 / 35。
- [2024国考申论真题及答案解析（地市卷）](https://www.aipta.com/article/9221.html)：5题，分值 10 / 15 / 20 / 20 / 35。
- [2024国考申论真题及答案解析（副省卷）](https://www.aipta.com/article/9222.html)：5题，分值 10 / 20 / 15 / 20 / 35。
- [2023国考申论真题及答案解析（副省级）](https://www.aipta.com/article/6419.html)：5题，分值 10 / 15 / 20 / 20 / 35。
- [2023国考申论真题及答案解析（地市级）](https://www.aipta.com/article/5682.html)：5题，分值 10 / 15 / 20 / 20 / 35。
- [2023国考申论真题及答案解析（行政执法卷）](https://www.aipta.com/article/4397.html)：5题，分值 10 / 20 / 20 / 15 / 35。
- [2022国考申论真题及答案解析（地市级)](https://www.aipta.com/article/259.html)：5题，分值 15 / 20 / 15 / 15 / 35。
- [2022国考申论真题及答案解析（副省级)](https://www.aipta.com/article/258.html)：5题，分值 10 / 15 / 20 / 20 / 35。
- [2022国考申论真题答案及解析（行政执法卷)](https://www.aipta.com/article/257.html)：5题，分值 15 / 15 / 20 / 20 / 30。
- [2026安徽省考申论真题及答案解析（B卷）](https://www.aipta.com/article/10643.html)：4题，分值 15 / 20 / 25 / 40。
- [2026安徽省考申论真题及答案解析（C卷）](https://www.aipta.com/article/10642.html)：4题，分值 15 / 20 / 25 / 40。
- [2026安徽省考申论真题及答案解析（A卷）](https://www.aipta.com/article/10641.html)：4题，分值 15 / 20 / 25 / 40。
- [2022安徽省考申论真题及答案解析（C卷）](https://www.aipta.com/article/3661.html)：4题，分值 20 / 20 / 25 / 35。
- [2022安徽省考申论真题及答案解析（B卷）](https://www.aipta.com/article/1268.html)：4题，分值 20 / 25 / 25 / 30。
- [2022安徽省考申论真题及答案解析（A卷）](https://www.aipta.com/article/1267.html)：4题，分值 15 / 20 / 25 / 40。
- [2023北京公务员申论真题及答案解析](https://www.aipta.com/article/6693.html)：4题，分值 20 / 15 / 25 / 40。
- [2022北京公务员申论真题及答案解析](https://www.aipta.com/article/1276.html)：4题，分值 20 / 15 / 25 / 40。
- [2022重庆公务员申论真题及答案解析（一卷）](https://www.aipta.com/article/1284.html)：4题，分值 15 / 20 / 25 / 40。
- [2022福建省考申论真题及答案解析（行政执法卷）](https://www.aipta.com/article/10399.html)：4题，分值 20 / 20 / 25 / 35。
- [2022福建省考申论真题及答案解析（县乡卷）](https://www.aipta.com/article/5385.html)：4题，分值 20 / 20 / 25 / 35。
- [2022福建省考申论真题及答案解析（省市卷）](https://www.aipta.com/article/5384.html)：3题，分值 20 / 30 / 50。
- [2023广东省考申论真题及答案解析（县级卷）](https://www.aipta.com/article/5395.html)：3题，分值 20 / 30 / 50。
- [2022广东省考申论真题及答案解析（县级卷）](https://www.aipta.com/article/1301.html)：3题，分值 20 / 30 / 50。
- [2022广东省考申论真题及答案解析（乡镇卷）](https://www.aipta.com/article/1300.html)：5题，分值 15 / 15 / 20 / 20 / 30。
- [2022广西公务员申论真题及答案解析（A类）](https://www.aipta.com/article/3656.html)：4题，分值 15 / 20 / 25 / 40。
- [2023河北省考申论真题及答案解析（A卷）](https://www.aipta.com/article/6697.html)：4题，分值 20 / 20 / 20 / 40。
- [2022河北省考申论真题及答案解析（乡镇卷）](https://www.aipta.com/article/10400.html)：4题，分值 20 / 20 / 20 / 40。
- [2022河北省考申论真题及答案解析（县级卷）](https://www.aipta.com/article/3659.html)：4题，分值 25 / 20 / 15 / 40。
- [2022河南省考申论真题及答案解析（县级卷）](https://www.aipta.com/article/3658.html)：4题，分值 20 / 20 / 20 / 40。
- [2022黑龙江省考申论真题及答案解析（省直卷）](https://www.aipta.com/article/4398.html)：4题，分值 15 / 20 / 25 / 40。
- [2022黑龙江省考申论真题及答案解析（县乡卷）](https://www.aipta.com/article/1345.html)：4题，分值 15 / 20 / 25 / 40。
- [2022湖南省考申论真题及答案解析（县乡卷）](https://www.aipta.com/article/4399.html)：4题，分值 15 / 20 / 25 / 40。
- [2022湖北省考申论真题及答案解析（市县卷）](https://www.aipta.com/article/5389.html)：4题，分值 15 / 20 / 25 / 40。
- [2022吉林省考申论真题及答案解析（丙卷）](https://www.aipta.com/article/4400.html)：4题，分值 20 / 20 / 25 / 35。
- [2022江苏省考申论真题及答案解析（C类）](https://www.aipta.com/article/1195.html)：4题，分值 15 / 20 / 25 / 40。
- [2022江苏省考申论真题及答案解析（B类）](https://www.aipta.com/article/1194.html)：5题，分值 10 / 15 / 20 / 15 / 40。
- [2022江苏省考申论真题及答案解析（A类）](https://www.aipta.com/article/1193.html)：4题，分值 20 / 20 / 20 / 40。
- [2022辽宁省考申论真题及答案解析（B卷）](https://www.aipta.com/article/1409.html)：4题，分值 15 / 20 / 25 / 40。
- [2022内蒙古公务员申论真题及答案解析（盟市以上卷）](https://www.aipta.com/article/4401.html)：4题，分值 20 / 25 / 15 / 40。
- [2022青海省考申论真题及答案解析（县乡卷）](https://www.aipta.com/article/1433.html)：4题，分值 15 / 20 / 25 / 40。
- [2023陕西省考申论真题及答案解析（B卷）](https://www.aipta.com/article/5397.html)：5题，分值 15 / 20 / 30 / 35 / 50。
- [2022陕西省考申论真题及答案解析（B卷）](https://www.aipta.com/article/1451.html)：5题，分值 15 / 20 / 30 / 35 / 50。
- [2023四川省考申论真题及答案解析（县乡卷）](https://www.aipta.com/article/6706.html)：4题，分值 15 / 20 / 25 / 40。
- [2022四川省考申论真题及答案解析（行政执法卷）](https://www.aipta.com/article/1015.html)：4题，分值 20 / 20 / 25 / 35。
- [2022四川省考申论真题及答案解析（省市卷）](https://www.aipta.com/article/1014.html)：4题，分值 15 / 15 / 30 / 40。
- [2022四川省考申论真题及答案解析（县乡卷）](https://www.aipta.com/article/1013.html)：4题，分值 10 / 25 / 25 / 40。
- [2022山东省考申论真题及答案解析（A类）](https://www.aipta.com/article/1443.html)：3题，分值 20 / 30 / 50。
- [2022山东省考申论真题及答案解析（B类）](https://www.aipta.com/article/1442.html)：3题，分值 20 / 30 / 50。
- [2022上海公务员申论真题及答案解析（B卷）](https://www.aipta.com/article/3663.html)：4题，分值 20 / 20 / 20 / 40。
- [2022山西省考申论真题及答案解析（省市卷）](https://www.aipta.com/article/3657.html)：4题，分值 15 / 20 / 25 / 40。
- [2022山西省考申论真题及答案解析（县乡卷）](https://www.aipta.com/article/3464.html)：4题，分值 20 / 20 / 25 / 35。
- [2022天津公务员申论真题及答案解析（市级卷）](https://www.aipta.com/article/1471.html)：3题，分值 20 / 30 / 50。
