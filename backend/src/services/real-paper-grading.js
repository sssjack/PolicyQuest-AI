const fetch = require('node-fetch');
const config = require('../config');
const {
  RealPaper,
  PaperMaterial,
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

const ESSAY_RUBRICS = [
  { name: '审题立意', weight: 20, comment: '是否准确把握题干任务、作答对象、身份立场和中心主旨。' },
  { name: '要点提炼', weight: 25, comment: '是否覆盖材料核心信息，概括是否准确、全面、有层次。' },
  { name: '材料运用', weight: 20, comment: '是否能把材料信息转化为分析、论证和对策，而不是简单摘抄。' },
  { name: '结构逻辑', weight: 15, comment: '是否总分清晰、层次递进、段落安排符合阅卷习惯。' },
  { name: '对策可行', weight: 10, comment: '对策是否具备主体、动作、机制、保障和效果，能否落地执行。' },
  { name: '文字表达', weight: 10, comment: '语言是否规范、简洁、准确，有无口语化、空泛化和病句。' },
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

function weightedRubricTotal(dimensions, rubrics) {
  const totalWeight = rubrics.reduce((sum, item) => sum + item.weight, 0);
  return clampScore(dimensions.reduce((sum, item) => {
    const rubric = rubrics.find(row => row.name === item.name);
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

function trimText(value, max = 80) {
  const text = String(value || '').replace(/\s+/g, ' ').trim();
  if (!text) return '';
  return text.length > max ? `${text.slice(0, max)}...` : text;
}

function answerQuote(answer = '', max = 72) {
  const paragraphs = String(answer || '')
    .split(/\n+/)
    .map(item => item.trim())
    .filter(Boolean);
  return trimText(paragraphs.find(item => item.length >= 8) || paragraphs[0] || '', max);
}

function inferEssayQuestionType(question = {}) {
  const source = `${question.question_type || ''} ${question.title || ''} ${question.prompt || ''} ${(question.requirements || []).join(' ')}`;
  if (/讲话稿|发言稿|倡议书|公开信|通知|简报|短评|评析|提纲|调研报告|工作建议|推荐材料|宣传稿|公文|应用文|贯彻执行/.test(source)) {
    return '贯彻执行';
  }
  if (/文章|议论文|作文|自拟标题|策论文|写一篇|围绕.*主题/.test(source)) {
    return '文章写作';
  }
  if (/提出.*(对策|建议|措施)|对策|建议|解决|治理路径|工作举措/.test(source)) {
    return '提出对策';
  }
  if (/分析|理解|谈谈.*看法|谈谈.*认识|评价|启示|原因|影响|关系/.test(source)) {
    return '综合分析';
  }
  if (/概括|归纳|梳理|总结|材料要点|主要内容|主要问题|表现|特点|经验|做法/.test(source)) {
    return '归纳概括';
  }
  return '常规申论题';
}

function essayFormatInstruction(type) {
  const map = {
    归纳概括: '参考表达应采用“总括句 + 分条要点”格式，每一点先给凝练小标题，再接材料依据，避免大段抒情。',
    综合分析: '参考表达应采用“亮明观点 + 分层分析 + 简短结论”格式，既解释是什么，也说明为什么和怎么办。',
    提出对策: '参考表达应采用“问题导向 + 主体明确 + 措施可执行 + 保障闭环”格式，每条对策写清主体、动作、机制、效果。',
    贯彻执行: '参考表达必须匹配具体文种：有标题、称谓/开头、主体分段和结尾；推荐材料、讲话稿、倡议书、通知等格式不得混用。',
    文章写作: '参考表达应采用申论文章格式：标题鲜明，开头提出中心论点，中间设置分论点，结尾回扣主题并升华。',
    常规申论题: '参考表达应先判断题型，再按题干任务组织格式；不得套用固定模板。',
  };
  return map[type] || map.常规申论题;
}

function buildMaterialsContext(materials = []) {
  const list = Array.isArray(materials) ? materials : [];
  return list
    .sort((a, b) => Number(a.material_no || a.materialNo || 0) - Number(b.material_no || b.materialNo || 0))
    .map((material, index) => {
      const title = material.title || `材料${index + 1}`;
      const summary = material.summary ? `摘要：${material.summary}` : '';
      const content = String(material.content || '').slice(0, 2400);
      return `【${title}】\n${summary}\n${content}`.trim();
    })
    .join('\n\n');
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
  const quote = answerQuote(answer);
  const summary = `你的作答能围绕“${question.title || '题目'}”展开，具备基本分层意识，但分析深度、身份代入和可执行细节仍有提升空间。按公务员/事业编结构化面试真实评分维度综合评估为 ${score} 分，属于${level}档。`;

  return {
    score,
    level,
    summary,
    dimensions,
    advantages: [
      { title: '能够回应题干任务', detail: `作答没有明显偏题，能围绕题目中的主要矛盾展开。原文例子：${quote || '答案中已出现与题干相关的回应。'}` },
      { title: '有基本层次意识', detail: '答案中出现分点表达，考官能够较快识别你的作答框架；如果把每一点开头再压缩成动宾短语，会更像考场高分表达。' },
      { title: '具备解决问题意识', detail: '已经提出沟通、核实、整改等方向，说明你不是只停留在表态。' },
    ],
    deductions: [
      {
        title: '分析深度不足，容易停留在表态',
        originalProblem: quote ? `例如“${quote}”能看到态度，但对问题背后的原因、影响和治理本质展开不够。` : '答案中有态度和方向，但对问题背后的原因、影响和治理本质展开不够。',
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
        original: quote || '加强管理',
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
    pitfalls: [
      '容易只表态不分析，导致综合分析分偏低。',
      '容易只说“加强管理、提高意识”，但缺主体、流程和反馈。',
      '容易把面试答成申论文，缺少“我会怎么做”的岗位代入。',
    ],
  };
}

function buildEssaySampleAnswer(question = {}, localName = '当地') {
  const type = inferEssayQuestionType(question);
  if (question.sample_answer || question.sampleAnswer) return question.sample_answer || question.sampleAnswer;

  if (type === '贯彻执行') {
    return `## 关于${question.title || '相关工作'}的材料要点\n\n**一、基本判断**\n围绕题干任务，应先概括材料中的核心做法和价值取向，把“为什么值得推荐、推荐什么、如何落地”说清楚。\n\n**二、主要内容**\n一是聚焦群众需求，建立常态化诉求收集机制，把分散问题转化为治理清单。二是强化多元协同，推动街道、社区、网格、社会组织和居民代表共同参与。三是完善闭环反馈，对办理结果及时公开、复盘和优化。\n\n**三、工作启示**\n推广过程中要坚持因地制宜，既学习其群众路线和协同机制，也结合${localName}实际完善责任分工、资源保障和评估反馈。`;
  }

  if (type === '文章写作') {
    return `# 以实干之笔书写基层治理新答卷\n\n基层治理连着千家万户，是国家治理的末梢，也是服务群众的前沿。面对材料中的新情况新问题，必须坚持以人民为中心，把群众诉求转化为治理议题，把制度优势转化为治理效能。\n\n**第一，以需求导向找准治理坐标。**基层工作不能停留在“有什么供什么”，而要从群众急难愁盼出发，主动收集诉求、分类研判问题，让服务更加精准。\n\n**第二，以协同机制提升治理效能。**基层问题往往跨领域、跨部门，只有推动资源下沉、力量整合、责任闭环，才能避免多头管理和推诿扯皮。\n\n**第三，以长效制度巩固治理成果。**既要解决眼前一件事，也要复盘形成一类机制，通过清单管理、公开反馈、监督评估推动治理常态长效。\n\n民生无小事，枝叶总关情。把群众满意作为标尺，把制度建设作为保障，基层治理才能更有温度、更有力度。`;
  }

  if (type === '提出对策') {
    return `**一、压实主体责任。**由牵头部门建立问题台账，明确责任单位、完成时限和反馈要求，避免责任悬空。\n\n**二、优化办理流程。**围绕材料中的堵点，推行分类办理、限时办结和结果公开，让群众知道谁来办、怎么办、办到哪一步。\n\n**三、强化协同保障。**整合部门、社区、平台和社会力量，形成信息共享、资源共用、问题共治的工作格局。\n\n**四、完善监督评估。**建立回访复盘机制，把群众评价、办理质量和整改成效纳入常态化考核，推动问题由个案处理转向长效治理。`;
  }

  if (type === '综合分析') {
    return `**观点判断：**材料反映的问题表面上是具体事务处理，实质上考验基层治理能力、公共服务水平和群众工作方法。\n\n**原因分析：**一方面，群众需求更加多元，传统粗放式服务难以精准回应；另一方面，部门协同、流程衔接和反馈机制还不够完善，容易让小问题拖成大矛盾。\n\n**治理启示：**要坚持问题导向和结果导向，既把群众诉求办实，也把共性问题纳入制度完善，通过资源整合、流程再造、数字赋能和监督问效提升治理效能。\n\n**结论升华：**基层治理的关键，是把群众身边事办成暖心事，把一次性解决变成常态化机制。`;
  }

  return `**总括：**材料主要反映了相关主体在基层治理、公共服务或政策落实中的问题与做法。\n\n**一、问题表现。**围绕材料中的具体场景，提炼群众诉求、流程堵点、责任衔接和服务短板。\n\n**二、原因机制。**从思想认识、制度流程、协同联动、监督反馈等角度分析深层原因。\n\n**三、优化方向。**坚持人民立场，完善清单化办理、闭环式反馈和常态化评估，把材料中的经验转化为可复制、可推广的治理路径。`;
}

function buildEssayDimensions(answer = '', question = {}) {
  const text = String(answer).trim();
  const prompt = `${question.title || ''}${question.prompt || ''}${Array.isArray(question.requirements) ? question.requirements.join('') : ''}`;
  const targetLength = Math.max(600, Math.min(Number(question.word_limit || question.wordLimit) || 900, 1200));
  const lengthRatio = Math.min(text.length / targetLength, 1);
  const structureHits = hitCount(text, ['第一', '第二', '第三', '首先', '其次', '再次', '最后', '一方面', '另一方面', '一是', '二是', '三是', '总之', '因此', '综上']);
  const policyHits = hitCount(text, ['以人民为中心', '人民至上', '高质量发展', '基层治理', '数字政府', '法治政府', '群众获得感', '营商环境', '乡村振兴', '共同富裕', '新质生产力']);
  const actionHits = hitCount(text, ['机制', '制度', '清单', '台账', '平台', '监督', '培训', '落实', '闭环', '考核', '反馈', '协同', '问责', '评估']);
  const problemHits = hitCount(text, ['问题', '原因', '影响', '矛盾', '风险', '短板', '不足', '根源']);
  const materialKeywords = Array.from(new Set(prompt.match(/[\u4e00-\u9fa5]{2,6}/g) || []))
    .filter(word => !['什么', '如何', '根据', '材料', '要求', '作答', '问题', '以下'].includes(word))
    .slice(0, 12);
  const materialHits = materialKeywords.filter(word => text.includes(word)).length;
  const tooShortPenalty = text.length < 350 ? -12 : 0;

  return [
    { name: '审题立意', score: scoreFromSignals(38, [lengthRatio * 14, problemHits * 3, materialHits * 2, tooShortPenalty]), comment: '重点看是否扣住题干任务、身份立场和中心主旨。' },
    { name: '要点提炼', score: scoreFromSignals(35, [lengthRatio * 12, materialHits * 4, problemHits * 2, tooShortPenalty]), comment: '重点看材料核心信息是否提炼完整、准确、分层。' },
    { name: '材料运用', score: scoreFromSignals(34, [materialHits * 4, policyHits * 2, problemHits * 2, tooShortPenalty]), comment: '重点看材料是否转化为分析、论证和对策，而不是机械摘抄。' },
    { name: '结构逻辑', score: scoreFromSignals(40, [lengthRatio * 10, structureHits * 4, hitCount(text, ['总之', '因此', '综上']) * 2, tooShortPenalty]), comment: '重点看总分结构、分点层次和递进关系。' },
    { name: '对策可行', score: scoreFromSignals(36, [actionHits * 3, hitCount(text, ['主体', '流程', '保障', '监督', '评价']) * 3, policyHits * 2, tooShortPenalty]), comment: '重点看对策是否有主体、机制、步骤和保障。' },
    { name: '文字表达', score: scoreFromSignals(42, [lengthRatio * 10, policyHits * 2, structureHits * 2, tooShortPenalty]), comment: '重点看语言是否规范、简洁、准确，有无空话套话和病句。' },
  ];
}

function buildEssayFallbackReport({ answer, paper, question }) {
  const dimensions = buildEssayDimensions(answer, question);
  const score = weightedRubricTotal(dimensions, ESSAY_RUBRICS);
  const level = scoreLevel(score);
  const localName = detectLocalContext(paper, question);
  const questionType = inferEssayQuestionType(question);
  const quote = answerQuote(answer);

  return {
    reportType: 'essay',
    questionType,
    score,
    level,
    summary: `本题按${questionType}题型评分，得分 ${score} 分，属于${level}档。整体看，作答能够围绕“${question.title || '题目'}”展开，但仍需在材料要点覆盖、政策高度、结构递进和对策落地方面继续强化。`,
    dimensions,
    advantages: [
      { title: '能够回应题干任务', detail: `作答方向基本贴合题目，没有明显偏离主题。原文例子：${quote || '答案中已经出现对题干关键词的回应。'}` },
      { title: '具备基本分层意识', detail: '答案中能看到分点表达，阅卷者可以较快识别作答框架；如果把每一层压缩成“问题/原因/对策”式小标题，会更凝练。' },
      { title: '已有解决问题意识', detail: '能提出若干对策方向，为进一步展开提供了基础。' },
    ],
    deductions: [
      {
        title: '材料要点覆盖还不够完整',
        originalProblem: quote ? `例如“${quote}”有观点，但材料中的主体、做法、成效或问题链条没有被充分压缩提炼。` : '部分关键材料信息没有被充分概括，个别表达停留在概念层面。',
        whyWrong: '申论阅卷重视从给定资料中提炼要点，遗漏核心信息会直接影响要点分。',
        policyBasis: '应围绕题干任务，把材料中的主体、问题、原因、影响、做法和成效分层提炼。',
        rewrite: '建议先列材料要点清单，再按“问题表现-原因机制-治理路径-成效目标”组织答案。',
      },
      {
        title: '对策可执行性不足',
        originalProblem: '部分对策比较宏观，缺少责任主体、实施路径、保障机制和反馈闭环。',
        whyWrong: '真实阅卷中，空泛对策容易被认定为模板化表达，难以体现治理能力。',
        policyBasis: '可以使用清单化管理、闭环整改、跨部门协同、数字赋能、监督评估等治理工具。',
        rewrite: '把“加强管理”改成“由主管部门牵头建立问题台账，明确整改时限，定期公开反馈结果”。',
      },
      {
        title: '结构递进还可以更清晰',
        originalProblem: '分论点之间并列较多，递进关系、因果关系和总括升华不够突出。',
        whyWrong: '申论答案需要让阅卷者快速看到逻辑链条，而不仅是材料堆叠。',
        policyBasis: '可采用“是什么-为什么-怎么办”或“现状问题-原因分析-对策建议-价值升华”的结构。',
        rewrite: '每段开头先亮明中心句，再用材料事实支撑，最后落到治理启示或具体举措。',
      },
    ],
    highScoreThinking: [
      '先审清题型和作答对象，明确是概括、分析、对策、贯彻执行还是文章写作。',
      '再回到材料找关键词，把主体、问题、原因、做法、成效分别标注。',
      '答案结构优先服务阅卷效率，分点清楚、层次递进、关键词前置。',
      '对策要写出主体、动作、机制、保障和效果，避免空泛口号。',
    ],
    goldenSentences: [
      '把群众急难愁盼作为治理的起点，把群众满意作为检验工作的标尺。',
      '既要解决一件事，更要完善一类机制，推动治理从个案处理走向长效提升。',
      '以数字赋能提升治理效率，以制度闭环守住公平底线。',
      '让政策温度转化为民生质感，让治理效能沉淀为群众获得感。',
    ],
    sampleAnswer: buildEssaySampleAnswer(question, localName),
    localPolicyInsight: {
      title: `${localName}材料与政策解读`,
      region: localName,
      cases: [
        { title: `${localName}基层治理与民生服务`, content: '可从诉求收集、分类办理、限时反馈、结果公开、复盘问效等环节切入，体现治理闭环。', usage: '适合放在对策部分，用来说明答案不止停留在原则层面。', sourceUrl: '', verificationNote: '本地兜底报告不编造具体新闻链接，AI 批改时会优先给出可核验来源。' },
        { title: `${localName}政务服务优化`, content: '围绕一次性告知、帮办代办、线上线下协同和特殊群体兜底服务展开。', usage: '适合公共服务、基层治理、营商环境和民生保障类题目。', sourceUrl: '', verificationNote: '如需引用真实案例，应以政府官网、主流媒体或题目材料为准。' },
      ],
      usage: '政策解读要服务本题材料，不要机械套用地区经验。',
    },
    upgradedExpressions: [
      { original: quote || '加强管理', improved: '建立问题台账、责任清单和整改闭环，明确办理时限并跟踪问效。', reason: '从空泛口号升级为主体明确、路径清楚的可执行措施。' },
      { original: '提高服务意识', improved: '把群众满意度作为检验工作成效的重要标准，做到诉求有回应、办理有结果、反馈有闭环。', reason: '更贴近申论阅卷中的治理表达。' },
    ],
    missingKeyContent: [
      '补充材料关键词，避免只写观点不回扣资料。',
      '补充原因分析，至少写出制度、执行、协同或监督中的一个角度。',
      '对策要具体到主体、流程、时限、反馈和监督。',
    ],
    pitfalls: [
      `${questionType}题容易把“材料复述”当成“要点提炼”，导致答案不够凝练。`,
      '容易堆政策词但不回扣材料，阅卷时会被认为空泛。',
      '容易没有格式意识，尤其贯彻执行题、文章写作题必须匹配文种或文章结构。',
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

function normalizeEssayReport(value, payload) {
  const local = buildEssayFallbackReport(payload);
  if (!value || typeof value !== 'object') return local;

  const sourceDimensions = Array.isArray(value.dimensions) ? value.dimensions : [];
  const dimensions = ESSAY_RUBRICS.map(rubric => {
    const found = sourceDimensions.find(item => String(item?.name || '').includes(rubric.name) || rubric.name.includes(String(item?.name || '')));
    const fallback = local.dimensions.find(item => item.name === rubric.name);
    return {
      name: rubric.name,
      score: clampScore(found?.score ?? fallback?.score ?? 0),
      comment: String(found?.comment || fallback?.comment || rubric.comment),
    };
  });
  const score = weightedRubricTotal(dimensions, ESSAY_RUBRICS);

  return {
    ...local,
    questionType: String(value.questionType || local.questionType || inferEssayQuestionType(payload.question)),
    score,
    level: scoreLevel(score),
    summary: String(value.summary || local.summary),
    dimensions,
    advantages: ensureArray(value.advantages, local.advantages).slice(0, 5),
    deductions: ensureArray(value.deductions || value.disadvantages, local.deductions).slice(0, 6),
    highScoreThinking: ensureArray(value.highScoreThinking || value.suggestions, local.highScoreThinking).slice(0, 8),
    goldenSentences: ensureArray(value.goldenSentences, local.goldenSentences).slice(0, 8),
    sampleAnswer: String(value.sampleAnswer || value.sampleEssay || local.sampleAnswer),
    localPolicyInsight: value.localPolicyInsight && typeof value.localPolicyInsight === 'object' ? value.localPolicyInsight : local.localPolicyInsight,
    upgradedExpressions: ensureArray(value.upgradedExpressions, local.upgradedExpressions).slice(0, 8),
    missingKeyContent: ensureArray(value.missingKeyContent, local.missingKeyContent).slice(0, 8),
    pitfalls: ensureArray(value.pitfalls || value.attentionPoints, local.pitfalls).slice(0, 8),
  };
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
    pitfalls: ensureArray(value.pitfalls || value.attentionPoints, local.pitfalls).slice(0, 8),
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
  "advantages": [{"title":"优点标题","originalQuote":"引用用户原答案中的一句或一段","detail":"说明这句如何体现逻辑、岗位意识或处置能力","whyGood":"对应哪一项评分标准"}],
  "deductions": [{"title":"主要扣分原因标题","originalQuote":"引用用户原答案中的问题句","originalProblem":"指出原答案具体问题","whyWrong":"说明为什么丢分","policyBasis":"结合面试评分标准或政策背景解释","rewrite":"给出可直接替换的高分表达"}],
  "highScoreThinking": ["四、高分答题思路：逐条给出本题高分框架"],
  "goldenSentences": ["五、金句积累：适合本题的面试表达"],
  "sampleAnswer": "六、高分范文：完整、自然、可直接口述的示范答案",
  "localPolicyInsight": {"title":"${localName}案例和政策解读","region":"${localName}","cases":[{"title":"案例/政策标题","date":"发生时间，无法确认则为空","location":"地点，无法确认则为空","actors":"相关主体，无法确认则为空","content":"经过与影响","sourceUrl":"政府官网或主流媒体原文链接，无法确认则为空","verificationNote":"说明是否可核验以及如何使用","usage":"怎么嵌入答案"}],"usage":"总用法"},
  "upgradedExpressions": [{"original":"用户原答案中的普通表达","improved":"可直接升级的表达","reason":"为什么这样更高分"}],
  "missingKeyContent": ["九、这道题下次要补的关键内容"],
  "pitfalls": ["回答这类题容易出问题的点，以及本题应如何避免"]
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
7. 优点和缺点必须引用用户原答案中的具体句子，不允许只写泛泛评价。
8. upgradedExpressions 必须采用“原表达-升级后-为什么更好”的对比，至少 3 条；pitfalls 至少 3 条。
9. 案例链接不得编造；无法确认真实原文链接时 sourceUrl 留空，并在 verificationNote 写“需以官方公开材料核验”。

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

async function gradeEssayAnswer(payload) {
  const local = buildEssayFallbackReport(payload);
  if (!config.llm.apiUrl || !config.llm.apiKey) {
    return local;
  }

  const { answer, paper = {}, question = {} } = payload;
  const localName = detectLocalContext(paper, question);
  const questionType = inferEssayQuestionType(question);
  const formatGuide = essayFormatInstruction(questionType);
  const materialsContext = buildMaterialsContext(paper.materials || paper.PaperMaterials || []);
  const rubricLines = ESSAY_RUBRICS.map(item => `${item.name}${item.weight}分：${item.comment}`).join('\n');

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
            content: '你是 PolicyQuest AI Exam Coach 的资深公务员/事业编申论阅卷老师。你熟悉国考、省考申论真实阅卷标准，批改必须严格、具体、可改写。不要因为字数多、政策词多就给高分，要依据审题立意、要点提炼、材料运用、结构逻辑、对策可行、文字表达逐项评分。输出必须是合法 JSON；除 sampleAnswer 字段允许 Markdown 标题和分段外，其他字段不要输出 Markdown。',
          },
          {
            role: 'user',
            content: `请按真实申论阅卷标准批改下列作答，并输出 JSON：
{
  "score": 0-100,
  "level": "优秀/良好/中等/待提升",
  "questionType": "${questionType}",
  "summary": "一、结论评分：包含总分、档次、整体评价、最大提分方向",
  "dimensions": [{"name":"审题立意","score":0-100,"comment":"具体点评"}],
  "advantages": [{"title":"优点标题","originalQuote":"引用用户原答案中的一句或一段","detail":"说明这句如何体现要点、结构、材料转化或表达优势","whyGood":"对应哪一项申论评分标准"}],
  "deductions": [{"title":"主要扣分原因标题","originalQuote":"引用用户原答案中的问题句","originalProblem":"指出原答案具体问题","whyWrong":"说明为什么丢分","policyBasis":"结合申论阅卷标准解释扣分依据","rewrite":"给出可直接替换的高分表达"}],
  "highScoreThinking": ["四、高分答题思路：逐条给出本题高分框架"],
  "goldenSentences": ["五、金句积累：适合本题的申论表达"],
  "sampleAnswer": "六、高分范文：用 Markdown 标题和分段输出，完整、规范、贴合材料的示范答案",
  "localPolicyInsight": {"title":"${localName}材料与政策解读","region":"${localName}","cases":[{"title":"案例/政策标题","date":"发生时间，无法确认则为空","location":"地点，无法确认则为空","actors":"相关主体，无法确认则为空","content":"经过与影响","sourceUrl":"政府官网或主流媒体原文链接，无法确认则为空","verificationNote":"说明是否可核验以及如何使用","usage":"怎么嵌入答案"}],"usage":"总用法"},
  "upgradedExpressions": [{"original":"用户原答案中的普通表达","improved":"可直接升级的表达","reason":"为什么这样更高分"}],
  "missingKeyContent": ["九、这道题下次要补的关键内容"],
  "pitfalls": ["回答这类题容易出问题的点，以及本题应如何避免"]
}

评分维度和权重：
${rubricLines}

题型判断：${questionType}
参考表达格式要求：${formatGuide}

严格要求：
1. dimensions 必须完整输出 6 个指定维度，名称不能替换，分数必须 0-100。
2. 总分必须依据维度权重综合；普通空泛答案不得超过 65 分，跑题不得超过 45 分。
3. 批改报告要对应长报告结构：一、结论评分；二、优点；三、主要扣分原因；四、高分答题思路；五、金句积累；六、高分范文；七、${localName}材料与政策解读；八、你原答案可以直接升级的表达；九、这道题下次要补的关键内容。
4. 每个扣分点都要写清楚原答案哪里有问题、为什么丢分、怎么改。
5. 范文必须贴合材料和题干，不要写成泛泛政策评论；如果是贯彻执行、公文、推荐材料、讲话稿、文章写作等题型，格式必须明显不同。
6. 优点和缺点必须引用用户原答案中的具体句子，说明“这句为什么好/为什么丢分/怎么改得更凝练”。
7. upgradedExpressions 必须采用“原表达-升级后-为什么更好”的对比，至少 3 条；pitfalls 至少 3 条。
8. 金句只在本题适合观点分析、文章写作、综合分析时给出；如果本题完全是抄材料的归纳概括题，可以少给或不给，避免硬凑。
9. 案例链接不得编造；无法确认真实原文链接时 sourceUrl 留空，并在 verificationNote 写“需以官方公开材料核验”。
试卷：${paper.title || ''}
地区/系统：${paper.region || ''} ${paper.system_label || ''}
年份：${paper.year || ''}
题目序号：${question.question_no || ''}
题目标题：${question.title || ''}
题干：${question.prompt || ''}
要求：${Array.isArray(question.requirements) ? question.requirements.join('；') : ''}
给定材料：
${materialsContext || '本题未提供可用材料正文，请严格依据题干和用户作答批改。'}
用户作答：${answer}`,
          },
        ],
      }),
      timeout: 70000,
    });

    if (!response.ok) {
      throw new Error(`AI 服务返回 HTTP ${response.status}`);
    }

    const data = await response.json();
    return normalizeEssayReport(extractJson(data.choices?.[0]?.message?.content), payload);
  } catch (error) {
    return {
      ...local,
      summary: `${local.summary}（AI 服务暂不可用，本次先按本地严格申论评分规则生成报告。）`,
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
  const paperRow = attempt.RealPaper || {};
  const materials = await PaperMaterial.findAll({
    where: { paper_id: attempt.paper_id },
    order: [['material_no', 'ASC']],
  });
  const paper = {
    ...(paperRow.toJSON ? paperRow.toJSON() : paperRow),
    materials: materials.map(material => material.toJSON()),
  };

  for (const answerRow of answers) {
    if (answerRow.status === 'graded') continue;

    try {
      await answerRow.update({ status: 'grading', error_message: null });
      const question = await PaperQuestion.findByPk(answerRow.question_id);
      const gradeAnswer = attempt.practice_type === 'essay' ? gradeEssayAnswer : gradeInterviewAnswer;
      const report = await gradeAnswer({
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
  gradeEssayAnswer,
  gradeInterviewAnswer,
  toEvaluation,
};
