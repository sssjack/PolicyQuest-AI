# 申论原文批注与统一批改结果

## 页面与兼容范围

批改结果页保持四个主模块：总分与维度、AI老师批卷、答案与拆解、下一步训练。
原先的踩点溯源、逐句批注、失分原因和局部结构诊断融合到原文批注中；无法可靠定位的内容进入老师补充。
结构关系、字数与信息密度、对策匹配、公文专项、大作文专项在老师补充下保留；所有评分点、材料依据、命中状态、分值、三版参考答案及逐段拆解在答案与拆解中保留。

本项目后端为 Node.js。原文定位在 `backend/src/services/essay-annotations.js` 完成，采用服务端确定性定位，不额外引入 Java 服务。

## 统一结果协议

现有 `reportVersion: essay-v2` 及原字段继续保留，以兼容得分率比较、学习画像和整卷分析。
新增 `gradingResultVersion: annotations-v1` 标识统一结果。不是四次独立评分：诊断模型一次返回维度、评分点命中、精选批注与老师补充，后端在同一份经过评分校验的数据上解析位置、生成关联和训练计划。
参考要点仍先于考生评分独立建立，三版教学答案仍复用原有生成及字数验收流程。

```json
{
  "reportVersion": "essay-v2",
  "gradingResultVersion": "annotations-v1",
  "originalAnswer": "未经重排或改写的学生答案",
  "scoreSummary": { "score": 14.7, "maxScore": 20, "level": "良好", "summary": "总体评价" },
  "dimensions": [{ "id": "completeness", "name": "要点踩中", "score": 7, "maxScore": 10, "reason": "具体依据", "annotationIds": ["A1"], "supplementIds": ["T1"] }],
  "annotations": [{
    "id": "A1", "dimensionId": "completeness", "rubricPointId": "P1",
    "errorType": "accuracy", "quote": "学生连续原文", "paragraphIndex": 0,
    "startOffset": 0, "endOffset": 6,
    "title": "具体问题", "comment": "教师评语及判断依据", "suggestion": "可直接使用的改写",
    "explanation": "改写理由", "isIssue": true,
    "scoreImpact": { "earned": 0.5, "maxScore": 1, "lost": 0.5, "basis": "rubric_point" },
    "evidence": { "materialId": "M1", "materialTitle": "材料1", "quote": "已通过原文验证的材料依据" }
  }],
  "teacherSupplement": { "items": [], "structure": {}, "wordAnalysis": {}, "solutionAnalysis": [], "implementationAnalysis": null, "articleAnalysis": null },
  "answerAnalysis": { "questionAnalysis": {}, "taskBreakdown": [], "rubricPoints": [], "materialBreakdown": [], "referenceAnswer": "", "referenceAnswers": [] },
  "trainingPlan": { "primaryWeakness": "", "reason": "", "dimensionScores": [], "errorTypeDistribution": {}, "missingPoints": [], "evidenceAnnotationIds": [], "evidenceSupplementIds": [], "rubricPointIds": [], "improvementMethod": "", "trainingMethods": [], "examples": [], "checklist": [] }
}
```

示例仅展示字段，分值关系以真实结果为准。`P1` 等评分点ID继续使用现有参考要点ID，不重新编号。
`A1` 等批注ID按原文顺序生成；`T1` 等补充ID在当前报告内唯一。关联均限定在同一报告内。

## 定位与展示规则

- AI只提交连续逐字的 `quote` 和从0开始的 `paragraphIndex`。非空物理行视作段落，空行不编号；输入提示中提供段落及编号。
- 服务端在指定段落内精确匹配，返回 UTF-16 半开区间 `[startOffset, endOffset)`，直接适配 JavaScript `slice`。原答案的缩进、换行、标点及表情字符不被压缩或改写。
- 没有段落编号时仅接受全文唯一的段内匹配。同段重复、错误段落、拼接引文、模糊匹配、全文/整体问题和完全遗漏均不生成锚点，转入老师补充。禁止取第一句或最近相似句作为兜底。
- UI再校验一次偏移与原文引用。多个批注重叠时按边界切片，不重排或重复学生文字，每个批注有独立注号。
- 精选标注总数随答案长度限制在5—12条以内，得分亮点最多2条；没有最低数量要求。不强制给每句标注。超出密度的问题保留在补充；其他已命中评分点继续在答案拆解完整展示。
- 评分点的原文可可靠定位但未精选为批注时，仍可从评分点定位原文，临时突出对应文字，不凭空生成评语。
- 桌面、平板和手机均在选中的原文标注下方展开评语，后续原文随内容自然下移；评语可关闭，不占用侧栏或悬浮遮挡答案。注号支持键盘操作，评分点、维度和训练证据均可跳转。

## 分值与训练

批注不重新评分。只有对应采点评分维度的批注或补充可以引用现有评分点分值；一个评分点仅在一处诊断说明分值，防止重复扣分。表达优化等无独立计分依据的批注只展示问题类型。作文维持七维评分，不捏造逐点评分。

训练计划由已规范化的维度得分、批注、老师补充和评分点命中共同生成。按错误类型统计问题，重复关联同一评分点的同类问题只计一次；亮点不计失分。出现次数优先、关联维度得分率作为并列排序依据，选择第一短板。
每份训练包含本题具体问题、原句/补写示例、关联证据ID、改进步骤、操作任务及自查清单。完全没写的内容通过 `evidenceSupplementIds` 追溯，不强造 `evidenceAnnotationIds`。
维度有失分但暂无原文定位时保留维度评价作为补充依据。没有确认的问题时显示巩固训练，不捏造短板。

`diagnoses` 和 `training` 兼容字段由统一诊断与训练计划同步提供，原有长期错误画像及整卷分析仍能读取。

## 历史记录

历史 `essay-v2` 报告在读取答题记录时使用保存的 `user_answer` 做确定性转换，不重新请求AI、不改历史得分、不回写原记录。
历史诊断缺乏精确原文或维度关联时采用保守映射，不保证能产生与新模型协议同样精细的短语标注。原文缺失时显示老师补充和原有答案拆解。

## 本地验证

测试均位于已被 `.gitignore` 忽略的 `tests/`，不暂存或提交。

- `node --test tests/essay-annotations.test.cjs tests/essay-rubric.test.js tests/essay-repair.test.js tests/essay-profile.test.js`
- `node tests/annotation-ui.mjs`：使用本地报告样本，验证1440、768、390宽度下的原文保真与交互。
- `cd frontend` 后执行 `npm run build`。

自动化样本用于验证协议与交互，不代表新增协议已完成真实模型质量评估。
