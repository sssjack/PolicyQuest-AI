const express = require('express');
const fetch = require('node-fetch');
const config = require('../config');

const router = express.Router();

function clampScore(value, min = 45, max = 95) {
  return Math.max(min, Math.min(max, Math.round(Number(value) || min)));
}

function inferScore(answer = '', type = 'essay') {
  const text = String(answer).trim();
  const lengthScore = type === 'interview'
    ? Math.min(text.length / 360, 1) * 18
    : Math.min(text.length / 900, 1) * 18;
  const structureHits = ['第一', '第二', '第三', '首先', '其次', '再次', '最后', '一方面', '另一方面', '总之', '因此']
    .filter(word => text.includes(word)).length;
  const policyHits = ['以人民为中心', '基层治理', '高质量发展', '数字政府', '协同治理', '法治', '民生', '服务', '减负']
    .filter(word => text.includes(word)).length;
  const actionHits = ['机制', '制度', '清单', '平台', '监督', '培训', '落实', '闭环', '考核', '反馈', '优化']
    .filter(word => text.includes(word)).length;

  return clampScore(52 + lengthScore + structureHits * 3 + policyHits * 2 + actionHits * 2);
}

function fallbackEvaluation(payload) {
  const { answer = '', question = {}, type = 'essay' } = payload;
  const score = inferScore(answer, type);
  const isInterview = type === 'interview';
  const dimensions = isInterview
    ? [
        { name: '审题准确', score: clampScore(score + 5), comment: '能够回应题目中的核心矛盾，基本没有偏题。' },
        { name: '逻辑层次', score: clampScore(score), comment: '处理顺序比较清楚，但部分衔接可以更自然。' },
        { name: '机关表达', score: clampScore(score - 4), comment: '表达稳妥，可继续补充规范化工作语言。' },
        { name: '处置可行', score: clampScore(score + 2), comment: '现场处理较完整，后续机制还可以更具体。' },
        { name: '临场感染力', score: clampScore(score - 2), comment: '语气平实，结尾可增强担当感和服务意识。' },
      ]
    : [
        { name: '审题准确', score: clampScore(score + 4), comment: '能抓住题目要求，回应材料主旨。' },
        { name: '结构完整', score: clampScore(score + 1), comment: '整体有总分结构，分论点较清楚。' },
        { name: '论证深度', score: clampScore(score - 5), comment: '原因和对策都有涉及，但部分论证还不够展开。' },
        { name: '政策表达', score: clampScore(score - 4), comment: '政策词汇有体现，可增加更准确的官方表述。' },
        { name: '语言规范', score: clampScore(score + 2), comment: '文字通顺，少量句子可进一步压缩。' },
      ];

  return {
    score,
    level: score >= 88 ? '优秀' : score >= 78 ? '良好' : score >= 65 ? '中等' : '待提升',
    summary: `本次作答围绕“${question.title || '题目'}”展开，整体方向正确，具备基本结构意识。主要提升空间在于论证细化、政策表达准确度和对策可操作性。`,
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
    const typeLabel = type === 'interview' ? '结构化面试' : '申论';
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
            content: '你是 PolicyQuest AI Exam Coach 的资深公考阅卷官，专门批改历年国考、地方省考、事业编的申论与结构化面试作答。你的反馈要像真实教研老师：评分严格、诊断具体、优点要讲清具体好在哪里，缺点要讲清具体不好在哪里，建议必须可改写，并结合近年政府工作报告中关于高质量发展、民生保障、数字政府、基层治理、乡村振兴等表述方向生成示范答案。请严格按 JSON 输出，不要输出 Markdown。',
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

要求：
1. 总评不能只写分数，必须指出整体水平与最关键的提分点。
2. 优点必须结合用户原文或作答结构说明具体好在哪里。
3. 缺点必须指出具体不好在哪里，避免空泛批评。
4. 建议必须能直接指导改写。
5. 范文必须自然融入政府工作报告相关政策方向，不要堆砌口号。

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
    const parsed = extractJson(data.choices?.[0]?.message?.content);
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
