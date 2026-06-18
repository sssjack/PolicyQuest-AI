const express = require('express');
const fetch = require('node-fetch');
const config = require('../config');

const router = express.Router();

const RUBRICS = {
  essay: [
    { name: '审题立意', weight: 20, comment: '是否准确把握题干任务、作答对象、身份立场和中心主旨。' },
    { name: '要点提炼', weight: 25, comment: '是否覆盖材料核心信息，概括是否准确、全面、有层次。' },
    { name: '材料运用', weight: 20, comment: '是否能把材料信息转化为分析、论证和对策，而不是简单摘抄。' },
    { name: '结构逻辑', weight: 15, comment: '是否总分清晰、层次递进、段落安排符合阅卷习惯。' },
    { name: '对策可行', weight: 10, comment: '对策是否具备主体、动作、机制、保障和效果，能否落地执行。' },
    { name: '文字表达', weight: 10, comment: '语言是否规范、简洁、准确，有无口语化、空泛化和病句。' },
  ],
  interview: [
    { name: '审题理解', weight: 15, comment: '是否准确识别问题情境、身份定位、矛盾焦点和作答任务。' },
    { name: '综合分析', weight: 20, comment: '是否能辩证分析原因、影响、本质和价值取向。' },
    { name: '逻辑表达', weight: 20, comment: '是否层次清楚、表达流畅、过渡自然、重点突出。' },
    { name: '岗位匹配', weight: 15, comment: '是否体现公职人员意识、群众立场、规矩意识和担当精神。' },
    { name: '应变处置', weight: 15, comment: '是否能稳现场、抓重点、分步骤解决，并形成长效机制。' },
    { name: '语言规范', weight: 15, comment: '是否语言准确、简洁、自然，少空话套话，适合面试现场口述。' },
  ],
};

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

function weightedTotal(dimensions, type) {
  const rubrics = RUBRICS[type] || RUBRICS.essay;
  const totalWeight = rubrics.reduce((sum, item) => sum + item.weight, 0);
  return clampScore(dimensions.reduce((sum, item) => {
    const rubric = rubrics.find(row => row.name === item.name);
    return sum + (item.score || 0) * (rubric?.weight || 0);
  }, 0) / totalWeight);
}

function buildLocalDimensions(answer = '', question = {}, type = 'essay') {
  const text = String(answer).trim();
  const prompt = `${question.title || ''}${question.prompt || ''}${Array.isArray(question.requirements) ? question.requirements.join('') : ''}`;
  const isInterview = type === 'interview';
  const targetLength = isInterview ? 450 : Math.max(600, Math.min(Number(question.wordLimit) || 900, 1200));
  const lengthRatio = Math.min(text.length / targetLength, 1);
  const structureHits = hitCount(text, ['第一', '第二', '第三', '首先', '其次', '再次', '最后', '一方面', '另一方面', '总之', '因此', '一是', '二是', '三是']);
  const policyHits = hitCount(text, ['以人民为中心', '人民至上', '高质量发展', '基层治理', '数字政府', '法治政府', '群众获得感', '营商环境', '乡村振兴', '共同富裕', '新质生产力']);
  const actionHits = hitCount(text, ['机制', '制度', '清单', '台账', '平台', '监督', '培训', '落实', '闭环', '考核', '反馈', '协同', '问责', '评估']);
  const publicRoleHits = hitCount(text, ['群众', '人民', '服务', '责任', '担当', '依法', '纪律', '组织', '沟通', '协调', '汇报']);
  const problemHits = hitCount(text, ['问题', '原因', '影响', '矛盾', '风险', '短板', '不足', '根源']);
  const materialKeywords = Array.from(new Set(String(prompt).match(/[\u4e00-\u9fa5]{2,6}/g) || []))
    .filter(word => !['什么', '如何', '根据', '材料', '要求', '作答', '问题'].includes(word))
    .slice(0, 12);
  const materialHits = materialKeywords.filter(word => text.includes(word)).length;
  const tooShortPenalty = text.length < (isInterview ? 180 : 350) ? -12 : 0;

  if (isInterview) {
    return [
      {
        name: '审题理解',
        score: scoreFromSignals(38, [lengthRatio * 16, structureHits * 2, problemHits * 4, tooShortPenalty]),
        comment: '重点看是否抓住情境、身份和矛盾焦点。',
      },
      {
        name: '综合分析',
        score: scoreFromSignals(36, [lengthRatio * 12, problemHits * 4, policyHits * 3, structureHits * 2, tooShortPenalty]),
        comment: '重点看分析是否辩证、是否能解释原因和影响。',
      },
      {
        name: '逻辑表达',
        score: scoreFromSignals(40, [lengthRatio * 12, structureHits * 4, hitCount(text, ['首先', '其次', '最后', '同时']) * 2, tooShortPenalty]),
        comment: '重点看层次、过渡、重点和现场表达流畅度。',
      },
      {
        name: '岗位匹配',
        score: scoreFromSignals(37, [publicRoleHits * 3, policyHits * 3, hitCount(text, ['我会', '作为', '岗位', '职责']) * 3, tooShortPenalty]),
        comment: '重点看公职身份意识、群众立场和规矩意识。',
      },
      {
        name: '应变处置',
        score: scoreFromSignals(36, [actionHits * 3, hitCount(text, ['现场', '安抚', '核实', '汇报', '跟进', '复盘']) * 4, structureHits * 2, tooShortPenalty]),
        comment: '重点看步骤是否可执行、能否兼顾眼前处置和长效机制。',
      },
      {
        name: '语言规范',
        score: scoreFromSignals(42, [lengthRatio * 10, policyHits * 2, structureHits * 2, hitCount(text, ['空话', '套话', '差不多', '应该吧']) * -4, tooShortPenalty]),
        comment: '重点看语言是否准确、简洁、自然，是否少空话套话并适合现场口述。',
      },
    ];
  }

  return [
    {
      name: '审题立意',
      score: scoreFromSignals(38, [lengthRatio * 14, problemHits * 3, materialHits * 2, tooShortPenalty]),
      comment: '重点看是否扣住题干任务和中心主旨。',
    },
    {
      name: '要点提炼',
      score: scoreFromSignals(35, [lengthRatio * 12, materialHits * 4, problemHits * 2, tooShortPenalty]),
      comment: '重点看材料核心信息是否提炼完整、准确、有层次。',
    },
    {
      name: '材料运用',
      score: scoreFromSignals(34, [materialHits * 4, policyHits * 2, problemHits * 2, tooShortPenalty]),
      comment: '重点看材料是否转化为分析和论证，而非机械摘抄。',
    },
    {
      name: '结构逻辑',
      score: scoreFromSignals(40, [lengthRatio * 10, structureHits * 4, hitCount(text, ['总之', '因此', '综上']) * 2, tooShortPenalty]),
      comment: '重点看总分结构、分点层次和递进关系。',
    },
    {
      name: '对策可行',
      score: scoreFromSignals(36, [actionHits * 3, hitCount(text, ['主体', '流程', '保障', '监督', '评价']) * 3, policyHits * 2, tooShortPenalty]),
      comment: '重点看对策是否有主体、机制、步骤和保障。',
    },
    {
      name: '文字表达',
      score: scoreFromSignals(42, [lengthRatio * 10, policyHits * 2, structureHits * 2, tooShortPenalty]),
      comment: '重点看语言是否规范、简洁、准确，有无空话套话。',
    },
  ];
}

function fallbackEvaluation(payload) {
  const { answer = '', question = {}, type = 'essay' } = payload;
  const isInterview = type === 'interview';
  const dimensions = buildLocalDimensions(answer, question, type);
  const score = weightedTotal(dimensions, isInterview ? 'interview' : 'essay');

  return {
    score,
    level: score >= 88 ? '优秀' : score >= 78 ? '良好' : score >= 65 ? '中等' : '待提升',
    summary: `本次作答围绕“${question.title || '题目'}”展开，按${isInterview ? '结构化面试' : '申论'}真实阅卷维度综合评估为 ${score} 分。主要提分点在于${isInterview ? '身份定位、分析深度、处置步骤和现场表达' : '要点覆盖、材料转化、结构递进和对策落地'}。`,
    dimensions,
    advantages: [
      '能够围绕题目核心问题作答，没有明显跑题。',
      '内容中有分层意识，阅卷者可以较快把握答题脉络。',
      '能够提出若干对策，体现了解决问题的意识。',
    ],
    disadvantages: [
      '部分观点停留在概括层面，缺少更具体的执行主体、操作步骤和评价标准。',
      '材料关键词与政策表达结合还不够充分，答案的考试辨识度可以继续提升。',
      isInterview ? '现场感和身份代入还可以加强。' : '分论点之间的递进关系不够明显，结尾升华略弱。',
    ],
    suggestions: [
      '开头先用一句话明确判断，再用三到四个并列分论点展开。',
      '每条对策尽量写成“主体 + 动作 + 机制 + 效果”的完整句式。',
      '加入一到两个高频政策表达，例如“以人民为中心”“基层减负”“闭环治理”“协同联动”。',
      '结尾回扣治理效能、群众获得感或干部担当，形成完整收束。',
    ],
    qualityMaterials: [
      {
        title: '以人民为中心',
        content: '把群众满意度作为检验工作成效的重要标准，让治理成果更多更公平惠及人民群众。',
        usage: '适合用于申论结尾、面试表态和政务服务类题目。',
      },
      {
        title: '闭环治理',
        content: '建立问题收集、分类交办、限时整改、结果反馈、跟踪问效的闭环机制。',
        usage: '适合用于基层治理、窗口服务、应急处置类题目。',
      },
      {
        title: '数字赋能不是数字负担',
        content: '推动数据多跑路、群众少跑腿，同时防止重复填报、多头留痕增加基层负担。',
        usage: '适合用于数字政府、基层减负、营商环境类题目。',
      },
    ],
    governmentReportLinks: [
      {
        title: '推动高质量发展',
        content: '可把题目中的公共服务、产业升级、基层治理等内容，落到“推动高质量发展”的现实路径上。',
        usage: '适合放在开头立意或分论点总领句，提升政策站位。',
      },
      {
        title: '保障和改善民生',
        content: '把教育、医疗、养老、文化、政务服务等具体工作，写成增进民生福祉、提升群众获得感的抓手。',
        usage: '适合用于公共文化、窗口服务、乡村振兴、基层治理类题目。',
      },
      {
        title: '数字政府与治理效能',
        content: '强调数据共享、流程再造、线上线下协同，同时防止重复填报、多头留痕增加基层负担。',
        usage: '适合用于数字经济、数字政府、基层减负、营商环境类题目。',
      },
    ],
    sampleEssay: isInterview
      ? '各位考官，面对群众反映窗口办事慢的问题，我会坚持先稳现场、再查原因、后建机制。首先，及时回应群众诉求，安排专人做好解释引导，对老年人、残障人士等特殊群体优先提供帮办服务，避免矛盾升级。其次，迅速排查原因，查看当天业务量、人员排班、系统运行和材料流转情况，能现场解决的立即增开窗口、协调人员支援；涉及流程不清、一次性告知不到位的，形成问题清单限时整改。最后，建立长效机制，通过预约分流、岗位培训、服务评价和数据监测，持续压缩群众等待时间。窗口服务连着民心，只有把小事办实、把难事办妥，才能不断提升群众获得感。'
      : '数字政府建设既要追求治理效率，也要守住公共服务的公平底线。首先，要处理好技术赋能与群众体验的关系。平台建设不能停留在系统上线和数据汇聚，而要以群众办事是否更便捷、基层响应是否更高效作为评价标准。其次，要处理好数据共享与安全边界的关系。通过统一数据目录、授权清单和审计追踪机制，推动跨部门协同，同时保护个人信息和公共数据安全。再次，要处理好线上服务与线下兜底的关系。面对老年人、残障人士等群体，应保留必要窗口和帮办代办服务，避免数字鸿沟影响公共服务公平。总之，数字政府不是简单的技术工程，而是治理方式的系统重塑。只有让数据多跑路、群众少跑腿、基层少负担，才能真正把技术优势转化为治理效能和民生温度。',
  };
}

function extractJson(text) {
  const match = String(text || '').match(/\{[\s\S]*\}/);
  if (!match) return null;
  return JSON.parse(match[0]);
}

function normalizeAiEvaluation(value, payload) {
  const local = fallbackEvaluation(payload);
  if (!value || typeof value !== 'object') return local;
  const type = payload.type === 'interview' ? 'interview' : 'essay';
  const rubrics = RUBRICS[type];
  const sourceDimensions = Array.isArray(value.dimensions) ? value.dimensions : [];
  const dimensions = rubrics.map(rubric => {
    const found = sourceDimensions.find(item => String(item?.name || '').includes(rubric.name) || rubric.name.includes(String(item?.name || '')));
    return {
      name: rubric.name,
      score: clampScore(found?.score ?? local.dimensions.find(item => item.name === rubric.name)?.score ?? 0, 0, 100),
      comment: String(found?.comment || rubric.comment),
    };
  });
  const score = weightedTotal(dimensions, type);
  return {
    score,
    level: score >= 88 ? '优秀' : score >= 78 ? '良好' : score >= 65 ? '中等' : '待提升',
    summary: String(value.summary || local.summary),
    dimensions,
    advantages: Array.isArray(value.advantages) ? value.advantages.map(String).slice(0, 5) : local.advantages,
    disadvantages: Array.isArray(value.disadvantages) ? value.disadvantages.map(String).slice(0, 5) : local.disadvantages,
    suggestions: Array.isArray(value.suggestions) ? value.suggestions.map(String).slice(0, 6) : local.suggestions,
    qualityMaterials: Array.isArray(value.qualityMaterials) ? value.qualityMaterials.slice(0, 4) : local.qualityMaterials,
    governmentReportLinks: Array.isArray(value.governmentReportLinks) ? value.governmentReportLinks.slice(0, 4) : local.governmentReportLinks,
    sampleEssay: String(value.sampleEssay || local.sampleEssay),
  };
}

router.post('/evaluate', async (req, res) => {
  const { answer, question, type = 'essay' } = req.body || {};
  if (!answer || String(answer).trim().length < 20) {
    return res.status(400).json({ code: 400, message: '请至少输入 20 个字的作答内容' });
  }

  if (!config.llm.apiUrl || !config.llm.apiKey) {
    return res.json({ code: 200, data: fallbackEvaluation({ answer, question, type }) });
  }

  try {
    const examLabelMap = {
      national: '历年国考',
      province: '地方省考',
      institution: '事业编',
    };
    const examLabel = examLabelMap[question?.exam] || question?.exam || '公职考试';
    const typeLabel = type === 'interview' ? '结构化面试/事业编面试' : '申论';
    const rubricLines = (RUBRICS[type === 'interview' ? 'interview' : 'essay'] || RUBRICS.essay)
      .map(item => `${item.name}${item.weight}分：${item.comment}`)
      .join('\n');
    const response = await fetch(config.llm.apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${config.llm.apiKey}`,
      },
      body: JSON.stringify({
        model: config.llm.model,
        temperature: 0.35,
        max_tokens: 5000,
        response_format: { type: 'json_object' },
        messages: [
          {
            role: 'system',
            content: '你是 PolicyQuest AI Exam Coach 的资深公考阅卷官，熟悉国考、省考、事业单位申论和结构化面试真实评分标准。你必须像真实阅卷组一样严格：不因字数堆砌给高分，不因使用政策词就默认高分；必须根据题干任务、材料转化、逻辑层次、岗位意识、可执行性和表达规范进行量化评分。请严格按 JSON 输出，不要输出 Markdown。',
          },
          {
            role: 'user',
            content: `请批改以下${examLabel}${typeLabel}作答，并输出 JSON：
{
  "score": 0-100,
  "level": "优秀/良好/中等/待提升",
  "summary": "总评",
  "dimensions": [{"name":"维度","score":0-100,"comment":"点评"}],
  "advantages": ["优点1","优点2","优点3"],
  "disadvantages": ["缺点1","缺点2","缺点3"],
  "suggestions": ["建议1","建议2","建议3","建议4"],
  "qualityMaterials": [{"title":"素材标题","content":"优质素材","usage":"适用场景"}],
  "governmentReportLinks": [{"title":"政府工作报告要点","content":"如何结合本题","usage":"放在答案哪个位置"}],
  "sampleEssay": "完整示范范文或面试示范答案"
}

评分维度与权重：
${rubricLines}

严格要求：
1. dimensions 必须逐项输出上述维度名称，score 为 0-100，不能换维度、漏维度。
2. 总分必须依据各维度权重综合，不得随意给高分；普通空泛答案不得超过 65 分，明显跑题不得超过 45 分。
3. 总评必须指出整体档次、主要失分点和最关键提分方向。
4. 优点必须结合用户原文或作答结构说明具体好在哪里。
5. 缺点必须指出具体不好在哪里，避免空泛批评。
6. 建议必须能直接指导改写。
7. 范文必须自然融入政府工作报告相关政策方向，不要堆砌口号。

考试类型：${examLabel}
训练题型：${typeLabel}
题目：${question?.title || ''}
来源：${question?.source || ''}
题干：${question?.prompt || ''}
作答要求：${Array.isArray(question?.requirements) ? question.requirements.join('；') : ''}
标签：${Array.isArray(question?.tags) ? question.tags.join('、') : ''}
作答：${answer}`,
          },
        ],
      }),
      timeout: 70000,
    });

    if (!response.ok) {
      throw new Error(`AI 服务返回 HTTP ${response.status}`);
    }

    const data = await response.json();
    const parsed = normalizeAiEvaluation(extractJson(data.choices?.[0]?.message?.content), { answer, question, type });
    if (!parsed) throw new Error('AI 返回内容不是有效 JSON');
    return res.json({ code: 200, data: parsed });
  } catch (e) {
    return res.json({
      code: 200,
      message: 'AI 服务暂不可用，已使用本地评分规则生成报告',
      data: fallbackEvaluation({ answer, question, type }),
    });
  }
});

module.exports = router;
