const fetch = require('node-fetch');
const config = require('../config');
const {
  RealPaper,
  PaperQuestion,
  RealPaperAttempt,
  RealPaperAttemptAnswer,
} = require('../models');

const INTERVIEW_RUBRICS = [
  { name: '审题理解', weight: 15, comment: '是否准确识别题型、身份、任务、矛盾焦点和价值取向。' },
  { name: '综合分析', weight: 20, comment: '是否能结合原因、影响、本质、政策背景进行辩证分析。' },
  { name: '逻辑表达', weight: 20, comment: '是否层次清楚、总分有序、过渡自然，口语表达可直接用于考场。' },
  { name: '岗位匹配', weight: 15, comment: '是否体现公职人员意识、群众立场、规矩意识、责任担当和服务意识。' },
  { name: '应变处置', weight: 15, comment: '是否能稳现场、明责任、抓步骤、可执行，并兼顾长效治理。' },
  { name: '语言规范', weight: 15, comment: '是否语言准确、简洁、自然，少空话套话，适合面试现场口述。' },
];

function clampScore(value, min = 0, max = 100) {
  const parsed = Math.round(Number(value));
  if (!Number.isFinite(parsed)) return min;
  return Math.max(min, Math.min(max, parsed));
}

function hitCount(text, words) {
  return words.filter(word => text.includes(word)).length;
}

function scoreFromSignals(base, signals, min = 25, max = 92) {
  return clampScore(base + signals.reduce((sum, value) => sum + value, 0), min, max);
}

function weightedTotal(dimensions) {
  const totalWeight = INTERVIEW_RUBRICS.reduce((sum, item) => sum + item.weight, 0);
  return clampScore(dimensions.reduce((sum, item) => {
    const rubric = INTERVIEW_RUBRICS.find(row => row.name === item.name);
    return sum + (Number(item.score) || 0) * (rubric?.weight || 0);
  }, 0) / totalWeight);
}

function scoreLevel(score) {
  if (score >= 88) return '优秀';
  if (score >= 78) return '良好';
  if (score >= 65) return '中等';
  return '待提升';
}

function buildLocalDimensions(answer = '', question = {}) {
  const text = String(answer).trim();
  const prompt = `${question.title || ''}${question.prompt || ''}${Array.isArray(question.requirements) ? question.requirements.join('') : ''}`;
  const targetLength = 450;
  const lengthRatio = Math.min(text.length / targetLength, 1);
  const structureHits = hitCount(text, ['第一', '第二', '第三', '首先', '其次', '再次', '最后', '一方面', '另一方面', '总之', '因此', '一是', '二是', '三是']);
  const policyHits = hitCount(text, ['以人民为中心', '人民至上', '高质量发展', '基层治理', '数字政府', '法治政府', '群众获得感', '营商环境', '乡村振兴', '共同富裕', '新质生产力']);
  const actionHits = hitCount(text, ['机制', '制度', '清单', '台账', '平台', '监督', '培训', '落实', '闭环', '考核', '反馈', '协同', '问责', '评估']);
  const publicRoleHits = hitCount(text, ['群众', '人民', '服务', '责任', '担当', '依法', '纪律', '组织', '沟通', '协调', '汇报']);
  const problemHits = hitCount(text, ['问题', '原因', '影响', '矛盾', '风险', '短板', '不足', '根源']);
  const materialKeywords = Array.from(new Set(String(prompt).match(/[\u4e00-\u9fa5]{2,6}/g) || []))
    .filter(word => !['什么', '如何', '根据', '材料', '要求', '作答', '问题', '以下'].includes(word))
    .slice(0, 12);
  const materialHits = materialKeywords.filter(word => text.includes(word)).length;
  const tooShortPenalty = text.length < 180 ? -12 : 0;

  return [
    {
      name: '审题理解',
      score: scoreFromSignals(38, [lengthRatio * 16, structureHits * 2, problemHits * 4, materialHits * 2, tooShortPenalty]),
      comment: '重点看是否抓住情境、身份、矛盾焦点和作答任务。',
    },
    {
      name: '综合分析',
      score: scoreFromSignals(36, [lengthRatio * 12, problemHits * 4, policyHits * 3, structureHits * 2, tooShortPenalty]),
      comment: '重点看分析是否辩证，是否能解释原因、影响和治理本质。',
    },
    {
      name: '逻辑表达',
      score: scoreFromSignals(40, [lengthRatio * 12, structureHits * 4, hitCount(text, ['首先', '其次', '最后', '同时']) * 2, tooShortPenalty]),
      comment: '重点看层次、过渡、重点和考场口语表达流畅度。',
    },
    {
      name: '岗位匹配',
      score: scoreFromSignals(37, [publicRoleHits * 3, policyHits * 3, hitCount(text, ['我会', '作为', '岗位', '职责']) * 3, tooShortPenalty]),
      comment: '重点看公职身份意识、群众立场、规矩意识和担当精神。',
    },
    {
      name: '应变处置',
      score: scoreFromSignals(36, [actionHits * 3, hitCount(text, ['现场', '安抚', '核实', '汇报', '跟进', '复盘']) * 4, structureHits * 2, tooShortPenalty]),
      comment: '重点看步骤是否可执行，能否兼顾现场处置和长效机制。',
    },
    {
      name: '语言规范',
      score: scoreFromSignals(42, [lengthRatio * 10, policyHits * 2, structureHits * 2, hitCount(text, ['空话', '套话', '差不多', '应该吧']) * -4, tooShortPenalty]),
      comment: '重点看语言是否准确、简洁、自然，是否少空话套话并适合现场口述。',
    },
  ];
}

function extractJson(text) {
  const match = String(text || '').match(/\{[\s\S]*\}/);
  if (!match) return null;
  return JSON.parse(match[0]);
}

function ensureArray(value, fallback = []) {
  return Array.isArray(value) && value.length ? value : fallback;
}

function detectLocalContext(paper = {}, question = {}) {
  const source = `${paper.region || ''} ${paper.title || ''} ${paper.category || ''} ${question.title || ''} ${question.prompt || ''}`;
  const cityMatch = source.match(/([\u4e00-\u9fa5]{2,8}(?:市|区|县|州|盟))/);
  if (cityMatch?.[1]) return cityMatch[1];

  const region = String(paper.region || '').trim();
  if (region && !['全国', '国考', '推荐'].includes(region)) return region;

  const provinceMatch = source.match(/(北京|天津|上海|重庆|河北|山西|辽宁|吉林|黑龙江|江苏|浙江|安徽|福建|江西|山东|河南|湖北|湖南|广东|海南|四川|贵州|云南|陕西|甘肃|青海|内蒙古|广西|西藏|宁夏|新疆)/);
  if (provinceMatch?.[1]) return provinceMatch[1];

  return paper.system_label || '当地';
}

function buildSampleAnswer(question = {}, localName = '当地') {
  const title = question.title || '这道面试题';
  return `各位考官，针对${title}，我会坚持问题导向和群众立场，先把情况稳住，再把责任查清，最后把机制建起来。第一，快速回应诉求，做好解释沟通，避免情绪扩大；对涉及群众切身利益的事项，要安排专人跟进，做到有记录、有反馈。第二，全面核实原因，区分是政策宣传不到位、流程衔接不顺，还是执行标准不统一，能立即整改的现场处理，不能立即解决的形成清单限时推进。第三，强化协同联动，推动相关部门、属地社区和服务窗口共同发力，完善公开公示、投诉反馈和复盘问效机制。第四，举一反三，把个案转化为提升治理能力的契机，在${localName}实际工作中持续提升服务效率和群众获得感。`;
}

function buildFallbackReport({ answer, paper, question }) {
  const dimensions = buildLocalDimensions(answer, question);
  const score = weightedTotal(dimensions);
  const level = scoreLevel(score);
  const localName = detectLocalContext(paper, question);
  const summary = `你的作答能围绕“${question.title || '题目'}”展开，具备基本分层意识，但分析深度、身份代入和可执行细节仍有提升空间。按公务员/事业编结构化面试真实评分维度综合评估为 ${score} 分，属于${level}档。`;

  return {
    score,
    level,
    summary,
    dimensions,
    advantages: [
      { title: '能够回应题干任务', detail: '作答没有明显偏题，能围绕题目中的主要矛盾展开。' },
      { title: '有基本层次意识', detail: '答案中出现分点表达，考官能够较快识别你的作答框架。' },
      { title: '具备解决问题意识', detail: '已经提出沟通、核实、整改等方向，说明你不是只停留在表态。' },
    ],
    deductions: [
      {
        title: '分析深度不足，容易停留在表态',
        originalProblem: '答案中有态度和方向，但对问题背后的原因、影响和治理本质展开不够。',
        whyWrong: '真实面试评分会看你是否能从群众利益、政府公信力、基层治理效能等角度解释问题。',
        policyBasis: '可结合“以人民为中心”“基层治理现代化”“法治政府建设”等政策表达。',
        rewrite: '建议先判断问题性质，再从群众体验、制度流程、干部作风和长效治理四个层面展开。',
      },
      {
        title: '处置步骤还不够具体',
        originalProblem: '对策偏概括，缺少主体、时间、流程、反馈和监督。',
        whyWrong: '考官更认可能在岗位上直接执行的方案，而不是笼统说“加强管理、提升服务”。',
        policyBasis: '可使用“清单化管理、闭环整改、限时反馈、跟踪问效”等治理工具。',
        rewrite: '每条对策改成“我会协调谁、先做什么、多久反馈、如何复盘”的句式。',
      },
      {
        title: '岗位匹配和现场交流感不足',
        originalProblem: '作答里“我作为工作人员会怎么做”的身份感还不够强。',
        whyWrong: '结构化面试不是写文章，考官会看你是否像一名准公职人员在现场解决问题。',
        policyBasis: '可体现群众立场、规矩意识、担当精神和依法行政。',
        rewrite: '多使用“我会第一时间回应群众诉求”“及时向领导汇报并提出处理建议”等表达。',
      },
    ],
    highScoreThinking: [
      '第一，表明判断：先用一句话指出问题性质和处理原则。',
      '第二，分析原因：从群众需求、流程机制、责任协同、干部作风中选两到三个角度。',
      '第三，给出处置：按“现场稳控-核实分类-协调解决-反馈复盘”展开。',
      '第四，升华落点：回到服务群众、依法行政、基层治理效能。',
    ],
    goldenSentences: [
      '群众利益无小事，基层治理见真章。',
      '解决问题不能止于一次回应，更要形成闭环整改和长效机制。',
      '把个案办扎实，把共性问题改彻底，才能提升群众获得感和政府公信力。',
      '既要有马上就办的效率，也要有依法依规的底线。',
    ],
    sampleAnswer: question.sampleAnswer || buildSampleAnswer(question, localName),
    localPolicyInsight: {
      title: `${localName}案例和政策解读`,
      region: localName,
      cases: [
        {
          title: `${localName}基层治理中的诉求办理闭环`,
          content: '可从群众诉求收集、分类交办、限时办理、结果反馈、复盘问效五个环节切入，体现治理能力。',
          usage: '适合放在对策部分，说明你不仅会处理眼前问题，还能推动制度完善。',
        },
        {
          title: `${localName}政务服务优化`,
          content: '围绕一次性告知、帮办代办、线上线下协同、特殊群体服务兜底展开。',
          usage: '适合窗口服务、基层矛盾、群众投诉类面试题。',
        },
      ],
      usage: `作答时不要机械说“${localName}经验”，要把本题矛盾和当地治理场景结合，体现因地制宜。`,
    },
    upgradedExpressions: [
      {
        original: '加强管理',
        improved: '建立问题清单、责任清单和整改台账，明确办理时限并跟踪问效。',
        reason: '从空泛口号升级为可执行措施。',
      },
      {
        original: '提高服务意识',
        improved: '把群众满意度作为检验工作成效的重要标准，做到诉求有回应、办理有结果、反馈有闭环。',
        reason: '更贴近公职岗位和群众立场。',
      },
      {
        original: '及时沟通',
        improved: '先稳定群众情绪，再解释政策依据和办理流程，对合理诉求马上办，对复杂问题限时反馈。',
        reason: '体现现场处置顺序和依法行政意识。',
      },
    ],
    missingKeyContent: [
      '下一次要补充对问题性质的判断，不要一上来直接罗列对策。',
      '需要补充“为什么会发生”的原因分析，至少写出制度、执行、沟通三个角度之一。',
      '对策要具体到主体、流程、时限、反馈和监督，避免只写原则。',
      `可结合${localName}的基层治理或政务服务场景，提高答案的真实感。`,
    ],
  };
}

function normalizeDimensions(sourceDimensions, localDimensions) {
  return INTERVIEW_RUBRICS.map(rubric => {
    const found = (Array.isArray(sourceDimensions) ? sourceDimensions : [])
      .find(item => String(item?.name || '').includes(rubric.name) || rubric.name.includes(String(item?.name || '')));
    const local = localDimensions.find(item => item.name === rubric.name);
    return {
      name: rubric.name,
      score: clampScore(found?.score ?? local?.score ?? 0),
      comment: String(found?.comment || local?.comment || rubric.comment),
    };
  });
}

function normalizeReport(value, payload) {
  const local = buildFallbackReport(payload);
  if (!value || typeof value !== 'object') return local;

  const dimensions = normalizeDimensions(value.dimensions, local.dimensions);
  const score = weightedTotal(dimensions);
  const localName = detectLocalContext(payload.paper, payload.question);
  const localPolicyInsight = value.localPolicyInsight && typeof value.localPolicyInsight === 'object'
    ? value.localPolicyInsight
    : local.localPolicyInsight;

  return {
    score,
    level: scoreLevel(score),
    summary: String(value.summary || local.summary),
    dimensions,
    advantages: ensureArray(value.advantages, local.advantages).slice(0, 5),
    deductions: ensureArray(value.deductions, local.deductions).slice(0, 6),
    highScoreThinking: ensureArray(value.highScoreThinking, local.highScoreThinking).slice(0, 8),
    goldenSentences: ensureArray(value.goldenSentences, local.goldenSentences).slice(0, 8),
    sampleAnswer: String(value.sampleAnswer || local.sampleAnswer),
    localPolicyInsight: {
      title: String(localPolicyInsight.title || `${localName}案例和政策解读`),
      region: String(localPolicyInsight.region || localName),
      cases: ensureArray(localPolicyInsight.cases, local.localPolicyInsight.cases).slice(0, 4),
      usage: String(localPolicyInsight.usage || local.localPolicyInsight.usage),
    },
    upgradedExpressions: ensureArray(value.upgradedExpressions, local.upgradedExpressions).slice(0, 8),
    missingKeyContent: ensureArray(value.missingKeyContent, local.missingKeyContent).slice(0, 8),
  };
}

function toEvaluation(report) {
  const policyCases = (report.localPolicyInsight.cases || []).map((item, index) => {
    if (typeof item === 'string') {
      return {
        title: `案例政策${index + 1}`,
        content: item,
        usage: '可结合本题作答场景使用。',
      };
    }
    return item;
  });

  return {
    score: report.score,
    level: report.level,
    summary: report.summary,
    dimensions: report.dimensions,
    advantages: report.advantages.map(item => typeof item === 'string' ? item : `${item.title || '优点'}：${item.detail || ''}`),
    disadvantages: report.deductions.map(item => typeof item === 'string' ? item : `${item.title || '扣分点'}：${item.originalProblem || item.whyWrong || ''}`),
    suggestions: report.highScoreThinking,
    qualityMaterials: report.goldenSentences.map((content, index) => ({
      title: `金句${index + 1}`,
      content,
      usage: '可用于面试开头、转折或结尾升华。',
    })),
    governmentReportLinks: policyCases.map(item => ({
      title: item.title,
      content: item.content,
      usage: item.usage,
    })),
    sampleEssay: report.sampleAnswer,
  };
}

async function gradeInterviewAnswer(payload) {
  const local = buildFallbackReport(payload);
  if (!config.llm.apiUrl || !config.llm.apiKey) {
    return local;
  }

  const { answer, paper = {}, question = {} } = payload;
  const localName = detectLocalContext(paper, question);
  const rubricLines = INTERVIEW_RUBRICS.map(item => `${item.name}${item.weight}分：${item.comment}`).join('\n');

  try {
    const response = await fetch(config.llm.apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${config.llm.apiKey}`,
      },
      body: JSON.stringify({
        model: config.llm.model,
        temperature: 0.28,
        max_tokens: 9000,
        response_format: { type: 'json_object' },
        messages: [
          {
            role: 'system',
            content: '你是 PolicyQuest AI Exam Coach 的资深公务员/事业编结构化面试考官。你熟悉真实面试评分标准，批改必须严格、具体、可改写。不要因为答案字数多、口号多就给高分；要依据审题、分析、逻辑、岗位匹配、应变处置、语言规范逐项评分。不要评价考生肢体动作、仪态举止、眼神表情，因为系统只能看到文字作答。必须输出合法 JSON，不要 Markdown，不要额外解释。',
          },
          {
            role: 'user',
            content: `请按照真实公务员/事业编结构化面试标准，批改下面这道面试题作答。

输出 JSON 格式必须为：
{
  "score": 0-100,
  "level": "优秀/良好/中等/待提升",
  "summary": "一、结论评分对应内容：包含总分、档次、整体评价、最大提分方向",
  "dimensions": [{"name":"审题理解","score":0-100,"comment":"具体点评"}],
  "advantages": [{"title":"优点标题","detail":"结合用户原答案说明具体好在哪里"}],
  "deductions": [{"title":"主要扣分原因标题","originalProblem":"指出原答案具体问题","whyWrong":"说明为什么丢分","policyBasis":"结合面试评分标准或政策背景解释","rewrite":"给出可直接替换的高分表达"}],
  "highScoreThinking": ["四、高分答题思路：逐条给出本题高分框架"],
  "goldenSentences": ["五、金句积累：适合本题的面试表达"],
  "sampleAnswer": "六、高分范文：完整、自然、可直接口述的示范答案",
  "localPolicyInsight": {"title":"${localName}案例和政策解读","region":"${localName}","cases":[{"title":"案例/政策标题","content":"与本题相关的案例或政策解读","usage":"怎么嵌入答案"}],"usage":"总用法"},
  "upgradedExpressions": [{"original":"用户原答案中的普通表达","improved":"可直接升级的表达","reason":"为什么这样更高分"}],
  "missingKeyContent": ["九、这道题下次要补的关键内容"]
}

评分维度和权重：
${rubricLines}

严格要求：
1. dimensions 必须完整输出 6 个指定维度，名称不能替换，分数必须 0-100。
2. 总分必须依据维度权重综合；普通空泛答案不得超过 65 分，跑题不得超过 45 分，高分答案必须同时有分析深度、岗位意识、可执行步骤和语言规范。
3. 批改报告要对应截图中的长报告结构：一、结论评分；二、优点；三、主要扣分原因；四、高分答题思路；五、金句积累；六、高分范文；七、${localName}案例和政策解读；八、你原答案可以直接升级的表达；九、这道题你下次要补的关键内容。
4. “${localName}案例和政策解读”必须围绕题目对应地区/城市/省份或系统背景，不要固定写山东。
5. 每一个扣分点都要写清楚：原答案哪里有问题、为什么丢分、怎么改。
6. 范文要像面试现场口述，不要写成申论文。

试卷：${paper.title || ''}
地区/系统：${paper.region || ''} ${paper.system_label || ''}
年份：${paper.year || ''}
题目序号：${question.question_no || ''}
题目标题：${question.title || ''}
题干：${question.prompt || ''}
要求：${Array.isArray(question.requirements) ? question.requirements.join('；') : ''}
用户作答：
${answer}`,
          },
        ],
      }),
      timeout: 70000,
    });

    if (!response.ok) {
      throw new Error(`AI 服务返回 HTTP ${response.status}`);
    }

    const data = await response.json();
    return normalizeReport(extractJson(data.choices?.[0]?.message?.content), payload);
  } catch (error) {
    return {
      ...local,
      summary: `${local.summary}（AI 服务暂不可用，本次先按本地严格评分规则生成报告。）`,
    };
  }
}

async function refreshAttemptStatus(attemptId) {
  const attempt = await RealPaperAttempt.findByPk(attemptId);
  if (!attempt) return;

  const answers = await RealPaperAttemptAnswer.findAll({ where: { attempt_id: attemptId } });
  const gradedAnswers = answers.filter(item => item.status === 'graded');
  const failedAnswers = answers.filter(item => item.status === 'failed');
  const averageScore = gradedAnswers.length
    ? Math.round((gradedAnswers.reduce((sum, item) => sum + Number(item.score || 0), 0) / gradedAnswers.length) * 10) / 10
    : 0;
  const nextStatus = gradedAnswers.length === answers.length
    ? 'graded'
    : failedAnswers.length && failedAnswers.length + gradedAnswers.length === answers.length
      ? 'failed'
      : 'grading';

  await attempt.update({
    status: nextStatus,
    graded_count: gradedAnswers.length,
    average_score: averageScore,
    completed_at: nextStatus === 'graded' ? new Date() : attempt.completed_at,
    error_message: nextStatus === 'failed' ? '部分或全部题目批改失败' : null,
  });
}

async function gradeAttempt(attemptId) {
  const attempt = await RealPaperAttempt.findByPk(attemptId, {
    include: [{ model: RealPaper }],
  });
  if (!attempt) return;

  const answers = await RealPaperAttemptAnswer.findAll({
    where: { attempt_id: attemptId },
    order: [['question_no', 'ASC']],
  });

  for (const answerRow of answers) {
    if (answerRow.status === 'graded') continue;

    try {
      await answerRow.update({ status: 'grading', error_message: null });
      const question = await PaperQuestion.findByPk(answerRow.question_id);
      const paper = attempt.RealPaper || {};
      const report = await gradeInterviewAnswer({
        answer: answerRow.user_answer,
        paper,
        question: {
          ...(question ? question.toJSON() : {}),
          question_no: answerRow.question_no,
          title: answerRow.question_title,
          prompt: answerRow.question_prompt,
        },
      });
      const evaluation = toEvaluation(report);

      await answerRow.update({
        status: 'graded',
        score: report.score,
        level: report.level,
        dimensions: report.dimensions,
        evaluation,
        report,
        error_message: null,
        graded_at: new Date(),
      });
    } catch (error) {
      await answerRow.update({
        status: 'failed',
        error_message: error.message,
      });
    }

    await refreshAttemptStatus(attemptId);
  }

  await refreshAttemptStatus(attemptId);
}

module.exports = {
  gradeAttempt,
  gradeInterviewAnswer,
  toEvaluation,
};
