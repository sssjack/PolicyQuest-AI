const bcrypt = require('bcryptjs');
const { User, Question, ArticleSource, Article } = require('../models');

const SEED_QUESTIONS = [
  {
    question_type: 'verbal_main_idea', exam_type: 'national',
    _article: '加快发展新质生产力 扎实推进高质量发展',
    stem: '新质生产力是由技术革命性突破、生产要素创新性配置、产业深度转型升级而催生的先进生产力。它以劳动者、劳动资料、劳动对象及其优化组合的跃升为基本内涵，以全要素生产率大幅提升为核心标志。新质生产力的特点是创新，关键在质优，本质是先进生产力。发展新质生产力，必须进一步全面深化改革，形成与之相适应的新型生产关系。要深化经济体制、科技体制等改革，着力打通束缚新质生产力发展的堵点卡点，建立高标准市场体系，创新生产要素配置方式，让各类先进优质生产要素向发展新质生产力顺畅流动。\n\n这段文字主要讲的是：',
    options: { A: '新质生产力的内涵与特征', B: '发展新质生产力需要深化改革形成新型生产关系', C: '全要素生产率是新质生产力的核心标志', D: '科技体制改革是发展新质生产力的关键' },
    answer: 'B', difficulty: 'medium',
    analysis: '【答案】B\n【考点】主旨概括\n【解析】文段前两句介绍了新质生产力的定义和内涵。"发展新质生产力，必须进一步全面深化改革"引出主旨——发展新质生产力需要改革。后文具体阐述如何改革。因此重点在后半段的对策句。\nA项只涉及前半段的背景铺垫，非重点。\nB项准确概括了文段主旨，正确。\nC项是文段细节，非主旨。\nD项"关键"表述过于绝对，文段说的是"深化经济体制、科技体制等改革"，科技体制只是其中之一。',
    knowledge_points: ['主旨概括', '对策句识别', '新质生产力']
  },
  {
    question_type: 'verbal_intent', exam_type: 'national',
    stem: '数字政府建设是推进国家治理体系和治理能力现代化的重要举措。然而，当前一些地方在推进数字政府建设过程中，存在重建设轻运营、重技术轻业务、重形式轻效果等问题。有的地方花大价钱建设了各种数字平台，但使用率不高，甚至沦为"僵尸系统"。有的地方过度追求技术先进性，忽视了基层干部和群众的实际使用需求。数字政府建设的出发点和落脚点应该是提升政务服务效能、增强群众获得感，而不是搞政绩工程、面子工程。\n\n这段文字意在说明：',
    options: { A: '数字政府建设是国家治理现代化的重要举措', B: '当前数字政府建设中存在诸多问题', C: '数字政府建设应注重实效，以群众需求为导向', D: '基层干部和群众是数字政府的主要用户' },
    answer: 'C', difficulty: 'medium',
    analysis: '【答案】C\n【考点】意图判断\n【解析】文段先肯定数字政府建设的意义，接着用"然而"转折指出问题，最后用"应该是……而不是……"提出对策。意图判断题应选择解决问题的对策。\nA项是背景内容，非意图。\nB项停留在问题层面，未上升到解决方案。\nC项准确把握了作者的写作意图，正确。\nD项是文段细节，非作者主要意图。',
    knowledge_points: ['意图判断', '转折后重点', '数字政府']
  },
  {
    question_type: 'politics_single', exam_type: 'national',
    stem: '2024年中央经济工作会议强调，要坚持稳中求进、以进促稳、先立后破。关于"先立后破"，下列理解正确的是：',
    options: { A: '先建立新的发展模式，再淘汰旧的发展方式', B: '先破除体制机制障碍，再建立新的制度框架', C: '先立法规制度，再破解发展难题', D: '先破旧立新，再稳步推进改革' },
    answer: 'A', difficulty: 'medium',
    analysis: '【答案】A\n【考点】中央经济工作会议精神\n【解析】"先立后破"的核心含义是在新的发展动能、产业体系、制度框架尚未建立健全之前，不急于拆除旧的体系，而是先把新的立起来，再逐步替代旧的。这体现了稳妥推进改革的思路。\nA项正确理解了"先立后破"的含义。\nB项将顺序颠倒了，是"先破后立"。\nC项对"立"和"破"的理解过于狭隘。\nD项逻辑混乱，与原意相悖。',
    knowledge_points: ['中央经济工作会议', '稳中求进', '先立后破']
  },
  {
    question_type: 'politics_single', exam_type: 'national',
    stem: '党的二十大报告指出，从现在起，中国共产党的中心任务就是团结带领全国各族人民全面建成社会主义现代化强国、实现第二个百年奋斗目标，以中国式现代化全面推进中华民族伟大复兴。中国式现代化的本质要求不包括：',
    options: { A: '坚持中国共产党领导', B: '实现全体人民共同富裕', C: '建设世界一流军队', D: '创造人类文明新形态' },
    answer: 'C', difficulty: 'medium',
    analysis: '【答案】C\n【考点】中国式现代化本质要求\n【解析】中国式现代化的本质要求是：坚持中国共产党领导，坚持中国特色社会主义，实现高质量发展，发展全过程人民民主，丰富人民精神世界，实现全体人民共同富裕，促进人与自然和谐共生，推动构建人类命运共同体，创造人类文明新形态。\n"建设世界一流军队"是国防和军队现代化的目标，不属于中国式现代化的本质要求。',
    knowledge_points: ['中国式现代化', '本质要求', '二十大报告']
  },
  {
    question_type: 'politics_current', exam_type: 'national',
    stem: '2024年《政府工作报告》提出，国内生产总值预期增长目标是：',
    options: { A: '5%左右', B: '5.5%左右', C: '6%左右', D: '4.5%左右' },
    answer: 'A', difficulty: 'easy',
    analysis: '【答案】A\n【考点】政府工作报告\n【解析】2024年《政府工作报告》提出，国内生产总值增长5%左右。这一目标综合考虑了国内外形势，既体现了积极进取，又留有余地。\nB项5.5%是2022年的目标。\nC项6%以上是2021年的目标。\nD项4.5%无此说法。',
    knowledge_points: ['政府工作报告', 'GDP目标', '经济发展']
  },
  {
    question_type: 'verbal_detail', exam_type: 'national',
    stem: '基层治理是国家治理的基石。近年来，各地积极探索基层治理创新，涌现出一批好经验好做法。浙江"枫桥经验"坚持矛盾不上交，就地解决；北京"接诉即办"以群众诉求驱动超大城市治理；上海推行"一网通办""一网统管"，用数字化手段提升治理效能。这些实践表明，基层治理必须坚持以人民为中心，运用现代化手段，把矛盾化解在基层、把问题解决在一线。\n\n根据这段文字，下列说法正确的是：',
    options: { A: '"枫桥经验"是浙江独创的数字化治理模式', B: '三地的基层治理创新做法完全相同', C: '基层治理创新的共同特征是以人民需求为导向', D: '超大城市的基层治理比中小城市更加先进' },
    answer: 'C', difficulty: 'easy',
    analysis: '【答案】C\n【考点】细节理解\n【解析】A项错误，"枫桥经验"的核心是矛盾不上交、就地解决，文段未提及它是"数字化治理模式"。\nB项错误，三地做法各有特色，并非"完全相同"。\nC项正确，文段最后总结"必须坚持以人民为中心"，三个案例都体现了以人民需求为导向。\nD项文段未提及城市治理水平的比较，属于无中生有。',
    knowledge_points: ['细节理解', '基层治理', '枫桥经验']
  },
  {
    question_type: 'politics_judge', exam_type: 'institution',
    stem: '全面依法治国的总目标是建设中国特色社会主义法治体系、建设社会主义法治国家。（  ）',
    options: { A: '正确', B: '错误' },
    answer: 'A', difficulty: 'easy',
    analysis: '【答案】正确\n【考点】全面依法治国\n【解析】党的十八届四中全会明确提出，全面推进依法治国的总目标是建设中国特色社会主义法治体系、建设社会主义法治国家。这一论断在党的十九大、二十大报告中均有重申。',
    knowledge_points: ['全面依法治国', '法治体系']
  },
  {
    question_type: 'verbal_fill', exam_type: 'national',
    stem: '优化营商环境是一项______的系统工程，既需要政府部门转变职能、简政放权，也需要市场主体积极参与、______。只有政府和市场形成合力，才能真正打造______、可预期的一流营商环境。\n\n依次填入画横线部分最恰当的一项是：',
    options: { A: '牵一发动全身  建言献策  市场化', B: '涉及面广  群策群力  法治化', C: '事关全局  共同努力  国际化', D: '复杂艰巨  献计献策  规范化' },
    answer: 'B', difficulty: 'hard',
    analysis: '【答案】B\n【考点】逻辑填空\n【解析】第一空，"系统工程"前需要一个形容范围广的词，"涉及面广"与"系统工程"搭配最恰当。\n第二空，与"积极参与"并列，且主语是"市场主体"，"群策群力"强调集体出力，符合语境。\n第三空，营商环境通常的表述是"市场化、法治化、国际化"，但此处是三个空的最后一个，与"可预期"并列，"法治化"最能体现可预期性。综合判断B项最佳。',
    knowledge_points: ['逻辑填空', '营商环境', '固定搭配']
  },
  {
    question_type: 'interview_analysis', exam_type: 'national',
    stem: '近年来，"银发经济"成为社会热议话题。随着我国老龄化程度不断加深，养老服务需求日益增长，但养老产业发展仍存在供给不足、质量参差不齐、专业人才短缺等问题。对此，你怎么看？',
    options: {},
    answer: '参考答案要点：\n1. 表态：银发经济既是应对人口老龄化的重要举措，也是经济发展的新增长点，值得高度重视。\n2. 分析意义：满足老年人多样化需求；培育新的消费增长点；促进产业结构优化升级。\n3. 分析问题：养老服务供给总量不足；服务质量标准化程度低；专业护理人才缺口大；老年用品市场创新不足。\n4. 提出对策：完善政策支持体系，加大财政投入和税收优惠；建立健全养老服务标准体系；加强专业人才培养，提升从业人员待遇；鼓励科技创新，发展智慧养老；引导社会资本参与养老产业。',
    difficulty: 'medium',
    analysis: '本题考查综合分析能力。要求考生对"银发经济"这一社会热点进行全面分析。作答时应先表明态度，再从意义和问题两方面分析，最后提出有针对性的对策建议。注意结合实际数据和案例，避免空泛论述。',
    knowledge_points: ['综合分析', '银发经济', '人口老龄化', '养老服务']
  },
  {
    question_type: 'interview_policy', exam_type: 'national',
    stem: '某市推行"办不成事"反映窗口，专门受理群众在政务服务过程中遇到的各类难题。有人认为这是便民利民的好举措，也有人认为这说明常规窗口服务存在问题。请谈谈你的看法。',
    options: {},
    answer: '参考答案要点：\n1. 总体评价："办不成事"窗口体现了政府以人民为中心的服务理念，值得肯定，但也应看到其反映出的深层问题。\n2. 积极意义：为群众提供兜底服务保障；倒逼常规窗口提升服务质量；收集共性问题推动制度完善；体现政府直面问题的担当。\n3. 反映的问题：部分窗口存在推诿扯皮现象；跨部门协调机制不够畅通；政务服务标准化程度有待提高；基层工作人员业务能力参差不齐。\n4. 完善建议：建立常态化问题反馈和整改机制；加强窗口工作人员培训和考核；推进政务服务标准化规范化；优化跨部门协调联动机制；推动从"办不成"到"都能办"转变。',
    difficulty: 'medium',
    analysis: '本题为政策理解类面试题，要求辩证分析"办不成事"窗口的做法。既要肯定其积极意义，也要指出其背后反映的问题，最终提出建设性建议。作答时应体现政务服务改革的理解和基层治理的视角。',
    knowledge_points: ['政策理解', '政务服务', '基层治理', '放管服改革']
  },
  {
    question_type: 'politics_single', exam_type: 'tax',
    stem: '全面推进依法治税是税务系统落实全面依法治国方略的重要实践。下列关于依法治税的表述，不正确的是：',
    options: { A: '依法治税要求税务机关严格按照法定程序征收税款', B: '税收法定原则是依法治税的核心', C: '依法治税意味着只要合法就可以不考虑合理性', D: '依法治税既包括依法征税也包括依法保护纳税人权益' },
    answer: 'C', difficulty: 'medium',
    analysis: '【答案】C\n【考点】依法治税\n【解析】依法治税不仅要求合法性，还要求合理性。税务执法既要依法依规，也要兼顾公平合理，保护纳税人的合法权益。\nA项正确，法定程序是依法治税的基本要求。\nB项正确，税收法定原则确实是依法治税的核心。\nC项错误，依法治税要求合法性与合理性兼顾。\nD项正确，依法治税是双向的，既约束征税行为，也保护纳税人。',
    knowledge_points: ['依法治税', '税收法定', '纳税人权益']
  },
  {
    question_type: 'verbal_main_idea', exam_type: 'national',
    stem: '乡村振兴不能只盯着经济发展，还必须强化农村基层党组织建设，重视农民思想道德教育，重视法治建设，健全乡村治理体系，深化村民自治实践，有效发挥村规民约、家教家风作用，培育文明乡风、良好家风、淳朴民风。要加强农村生态文明建设，保持战略定力，以钉钉子精神推进农业面源污染防治，加强土壤污染、地下水超采、水土流失等治理和修复。\n\n这段文字主要说明乡村振兴需要：',
    options: { A: '大力发展农村经济建设', B: '全面推进乡村治理现代化', C: '统筹推进文化建设、治理完善和生态保护', D: '重点加强农村生态环境治理' },
    answer: 'C', difficulty: 'medium',
    analysis: '【答案】C\n【考点】主旨概括\n【解析】文段首句"不能只盯着经济发展"否定了单一经济导向。随后分别从乡村治理（党组织、法治、自治）、文化建设（思想道德、乡风家风）、生态保护三个层面展开论述。\nA项与文段首句观点相悖。\nB项概括不全面，遗漏了文化和生态维度。\nC项全面概括了文段的三个层面，最为准确。\nD项只是文段后半部分内容，以偏概全。',
    knowledge_points: ['主旨概括', '乡村振兴', '全面理解']
  },
  {
    question_type: 'politics_policy', exam_type: 'national',
    _article: '加快发展新质生产力 扎实推进高质量发展',
    stem: '关于发展新质生产力，下列表述不正确的是：',
    options: { A: '新质生产力以全要素生产率大幅提升为核心标志', B: '发展新质生产力的关键在于科技创新', C: '新质生产力就是用新技术全面替代传统产业', D: '发展新质生产力需要形成与之相适应的新型生产关系' },
    answer: 'C', difficulty: 'medium',
    analysis: '【答案】C\n【考点】新质生产力内涵\n【解析】新质生产力并非简单地用新技术替代传统产业，而是通过技术革命性突破、生产要素创新性配置、产业深度转型升级来催生先进生产力。C项表述过于绝对和片面。\nA项正确。B项正确。D项正确。',
    knowledge_points: ['新质生产力', '产业转型', '科技创新']
  },
  {
    question_type: 'politics_current', exam_type: 'national',
    stem: '2024年，我国提出要加快建设以（  ）为核心的新型能源体系。',
    options: { A: '煤炭清洁利用', B: '新能源', C: '天然气', D: '核能' },
    answer: 'B', difficulty: 'easy',
    analysis: '【答案】B\n【考点】新型能源体系\n【解析】我国明确提出加快构建以新能源为核心的新型能源体系，推动能源绿色低碳转型。',
    knowledge_points: ['新型能源体系', '双碳目标', '能源转型']
  },
  {
    question_type: 'politics_single', exam_type: 'institution',
    stem: '事业单位工作人员年度考核的结果分为（  ）个等次。',
    options: { A: '优秀、合格、基本合格、不合格四个等次', B: '优秀、良好、合格、不合格四个等次', C: '优秀、合格、不合格三个等次', D: '优秀、良好、合格、基本合格、不合格五个等次' },
    answer: 'A', difficulty: 'easy',
    analysis: '【答案】A\n【考点】事业单位人事管理\n【解析】根据《事业单位人事管理条例》，事业单位工作人员年度考核结果分为优秀、合格、基本合格和不合格四个等次。',
    knowledge_points: ['事业单位管理', '年度考核', '人事制度']
  },
  {
    question_type: 'verbal_main_idea', exam_type: 'provincial',
    _article: '数字政府建设的实践与思考',
    stem: '在推进"互联网+政务服务"的过程中，一些地方创新推出了"最多跑一次""不见面审批""一件事一次办"等改革举措，有效提升了政务服务效率。但与此同时，部分偏远地区群众因不熟悉网上操作而面临"数字鸿沟"问题，老年人、残障人士等特殊群体的办事需求未得到充分保障。这提醒我们，数字化转型不能"一刀切"，必须在推进数字化的同时保留必要的线下服务渠道，确保政务服务的普惠性和包容性。\n\n这段文字主要想表达的是：',
    options: { A: '各地"互联网+政务服务"改革成效显著', B: '数字化转型要兼顾效率与公平，确保服务的普惠包容', C: '老年人是数字政务服务中最需要关注的群体', D: '偏远地区应当优先发展线下政务服务' },
    answer: 'B', difficulty: 'medium',
    analysis: '【答案】B\n【考点】主旨概括\n【解析】文段采用转折结构，先肯定成效，后用"但"转折指出数字鸿沟问题，最后"这提醒我们"引出核心观点。主旨在转折后。B项准确概括全文主旨。',
    knowledge_points: ['主旨概括', '数字鸿沟', '政务服务', '普惠性']
  },
  {
    question_type: 'politics_single', exam_type: 'tax',
    stem: '我国个人所得税法规定，居民个人取得综合所得，以每一纳税年度的收入额减除费用（  ）万元以及专项扣除、专项附加扣除后的余额，为应纳税所得额。',
    options: { A: '5', B: '6', C: '3.6', D: '4.8' },
    answer: 'B', difficulty: 'easy',
    analysis: '【答案】B\n【考点】个人所得税法\n【解析】根据修订后的《个人所得税法》，居民个人综合所得的基本减除费用标准为每年6万元（每月5000元）。',
    knowledge_points: ['个人所得税', '基本减除费用', '税法']
  },
  {
    question_type: 'interview_grassroots', exam_type: 'selection',
    stem: '你被选派到一个经济落后的山村担任驻村第一书记。到任后发现，村里年轻人大多外出务工，留守的多为老人和儿童，村集体经济几乎为零。请问你将如何开展工作？',
    options: {},
    answer: '参考答案要点：\n1. 深入调研摸底：逐户走访了解民情。\n2. 建强基层组织：整顿村两委班子，发展年轻党员。\n3. 发展集体经济：因地制宜选择产业方向。\n4. 改善基础设施：争取上级资金支持。\n5. 关爱特殊群体：建立留守老人儿童关爱机制。\n6. 激发内生动力：树立致富典型，组织技能培训。',
    difficulty: 'hard',
    analysis: '本题考查基层工作能力。需要展现系统思维，从组织建设、产业发展、民生改善等多维度规划工作。',
    knowledge_points: ['驻村工作', '乡村振兴', '基层治理']
  },
  {
    question_type: 'politics_judge', exam_type: 'institution',
    stem: '公民认为行政机关的行政行为侵犯其合法权益的，可以直接向人民法院提起行政诉讼，无需先经行政复议。（  ）',
    options: { A: '正确', B: '错误' },
    answer: 'A', difficulty: 'medium',
    analysis: '【答案】正确\n【考点】行政诉讼法\n【解析】除法律法规另有规定外，公民可以自主选择申请行政复议或直接提起行政诉讼。一般情况下，行政复议不是前置条件。',
    knowledge_points: ['行政诉讼', '行政复议', '法律程序']
  },
  {
    question_type: 'verbal_intent', exam_type: 'provincial',
    _article: '优化营商环境的若干措施',
    stem: '近年来，多地出台了优化营商环境的实施方案。然而，部分企业反映，一些地方存在"新官不理旧账"、政策朝令夕改的现象。更有甚者，个别地方在招商引资时承诺优惠政策，企业落地后却不予兑现。对此，专家建议建立政务诚信监测体系，将政府守信践诺情况纳入绩效考核。\n\n这段文字意在强调：',
    options: { A: '各地优化营商环境的成效参差不齐', B: '企业对营商环境的满意度有待提升', C: '优化营商环境的关键在于政府诚信与制度保障', D: '招商引资中的虚假承诺应当追究法律责任' },
    answer: 'C', difficulty: 'hard',
    analysis: '【答案】C\n【考点】意图判断\n【解析】文段用"然而"转折指出问题，最后通过专家建议引出对策。意图判断题选对策性表述。C项准确把握核心意图。',
    knowledge_points: ['意图判断', '营商环境', '政务诚信']
  },
  {
    question_type: 'politics_current', exam_type: 'national',
    stem: '2024年4月，习近平总书记在重庆考察时强调，要以科技创新引领产业创新，积极培育新兴产业和未来产业。以下哪项不属于我国重点发展的战略性新兴产业？',
    options: { A: '新一代信息技术', B: '高端装备制造', C: '传统纺织加工', D: '新能源汽车' },
    answer: 'C', difficulty: 'easy',
    analysis: '【答案】C\n【考点】战略性新兴产业\n【解析】我国重点发展的战略性新兴产业包括新一代信息技术、高端装备制造、新能源汽车、新材料、生物技术等。传统纺织加工属于传统产业，不属于战略性新兴产业。',
    knowledge_points: ['战略性新兴产业', '科技创新', '产业政策']
  },
  {
    question_type: 'politics_single', exam_type: 'national',
    _article: '中央经济工作会议精神解读',
    stem: '中央经济工作会议提出的"有效需求不足"这一问题，最直接的应对措施是：',
    options: { A: '加大基础设施建设投资', B: '扩大内需，促进消费', C: '提高出口退税率', D: '收紧货币政策' },
    answer: 'B', difficulty: 'medium',
    analysis: '【答案】B\n【考点】宏观经济政策\n【解析】"有效需求不足"意味着内需不振，最直接的应对措施是扩大内需、促进消费。A项是手段之一但不是最直接的。C项针对外需。D项会进一步抑制需求。',
    knowledge_points: ['中央经济工作会议', '扩大内需', '宏观经济']
  },
];

async function seedData() {
  try {
    const adminExists = await User.findOne({ where: { username: 'admin' } });
    if (!adminExists) {
      const adminPw = await bcrypt.hash('Admin@2024', 12);
      await User.create({
        username: 'admin', email: 'admin@policyquest.cn',
        password: adminPw, nickname: '管理员', role: 'admin', status: 'active',
      });
      console.log('Admin account created: admin / Admin@2024');
    }

    const userExists = await User.findOne({ where: { username: 'user01' } });
    if (!userExists) {
      const userPw = await bcrypt.hash('User@2024', 12);
      await User.create({
        username: 'user01', email: 'user01@policyquest.cn',
        password: userPw, nickname: '考生小明', role: 'user', status: 'active',
        exam_target: '国考', province: '山东',
      });
      console.log('User account created: user01 / User@2024');
    }

    const qCount = await Question.count();
    if (qCount === 0) {
      const srcCount = await ArticleSource.count();
      let sourceMap = {};
      if (srcCount === 0) {
        const sources = [
          { name: '人民日报', source_type: 'web', base_url: 'http://www.people.com.cn', enabled: true, crawl_interval: 3600 },
          { name: '新华网', source_type: 'web', base_url: 'http://www.xinhuanet.com', enabled: true, crawl_interval: 3600 },
          { name: '中国政府网', source_type: 'web', base_url: 'http://www.gov.cn', enabled: true, crawl_interval: 7200 },
          { name: '求是网', source_type: 'web', base_url: 'http://www.qstheory.cn', enabled: true, crawl_interval: 14400 },
          { name: '光明日报', source_type: 'web', base_url: 'http://www.gmw.cn', enabled: true, crawl_interval: 3600 },
          { name: '经济日报', source_type: 'web', base_url: 'http://www.ce.cn', enabled: true, crawl_interval: 7200 },
        ];
        for (const s of sources) {
          const created = await ArticleSource.create(s);
          sourceMap[s.name] = created.id;
        }
        console.log('Seeded article sources');
      }

      const SEED_ARTICLES = [
        { source_name: '人民日报', title: '加快发展新质生产力 扎实推进高质量发展', url: 'https://www.people.com.cn/example/1', publish_time: new Date('2024-03-15'), content: '新质生产力是由技术革命性突破、生产要素创新性配置、产业深度转型升级而催生的先进生产力...', summary: '深入分析新质生产力的内涵与发展路径', category: '政策解读', region: '全国', tags: ['新质生产力', '高质量发展', '科技创新'], status: 'processed' },
        { source_name: '新华网', title: '数字政府建设的实践与思考', url: 'https://www.xinhuanet.com/example/2', publish_time: new Date('2024-04-02'), content: '数字政府建设是推进国家治理体系和治理能力现代化的重要举措...', summary: '探讨数字政府建设中的问题与对策', category: '新闻报道', region: '全国', tags: ['数字政府', '治理现代化', '政务服务'], status: 'processed' },
        { source_name: '中国政府网', title: '2024年政府工作报告', url: 'https://www.gov.cn/example/3', publish_time: new Date('2024-03-05'), content: '国内生产总值增长5%左右...', summary: '2024年政府工作报告核心要点', category: '政策文件', region: '全国', tags: ['政府工作报告', 'GDP目标', '经济政策'], status: 'processed' },
        { source_name: '求是网', title: '中国式现代化的本质要求', url: 'https://www.qstheory.cn/example/4', publish_time: new Date('2024-02-20'), content: '党的二十大报告明确提出中国式现代化的本质要求...', summary: '深入解读中国式现代化的理论内涵', category: '政策解读', region: '全国', tags: ['中国式现代化', '二十大', '理论学习'], status: 'processed' },
        { source_name: '人民日报', title: '推进基层治理现代化的实践探索', url: 'https://www.people.com.cn/example/5', publish_time: new Date('2024-05-10'), content: '基层治理是国家治理的基石...', summary: '各地基层治理创新经验总结', category: '新闻报道', region: '全国', tags: ['基层治理', '枫桥经验', '社会治理'], status: 'processed' },
        { source_name: '光明日报', title: '全面依法治国的理论与实践', url: 'https://www.gmw.cn/example/6', publish_time: new Date('2024-04-15'), content: '全面依法治国是中国特色社会主义的本质要求...', summary: '法治中国建设的新进展新成效', category: '评论文章', region: '全国', tags: ['依法治国', '法治', '法治体系'], status: 'processed' },
        { source_name: '经济日报', title: '优化营商环境的若干措施', url: 'https://www.ce.cn/example/7', publish_time: new Date('2024-06-01'), content: '优化营商环境是一项涉及面广的系统工程...', summary: '各地优化营商环境的政策与实践', category: '政策解读', region: '全国', tags: ['营商环境', '放管服', '市场化'], status: 'processed' },
        { source_name: '新华网', title: '银发经济：机遇与挑战', url: 'https://www.xinhuanet.com/example/8', publish_time: new Date('2024-05-20'), content: '随着我国老龄化程度不断加深...', summary: '银发经济的发展前景与政策建议', category: '新闻报道', region: '全国', tags: ['银发经济', '老龄化', '养老服务'], status: 'processed' },
        { source_name: '中国政府网', title: '关于全面推进依法治税的意见', url: 'https://www.gov.cn/example/9', publish_time: new Date('2024-03-25'), content: '依法治税是落实全面依法治国方略的重要实践...', summary: '税务系统依法治税的指导意见', category: '政策文件', region: '全国', tags: ['依法治税', '税收法定', '税务改革'], status: 'processed' },
        { source_name: '人民日报', title: '乡村振兴：从产业兴旺到生态宜居', url: 'https://www.people.com.cn/example/10', publish_time: new Date('2024-04-28'), content: '乡村振兴不能只盯着经济发展...', summary: '乡村振兴战略的多维推进路径', category: '评论文章', region: '全国', tags: ['乡村振兴', '基层治理', '生态文明'], status: 'processed' },
        { source_name: '新华网', title: '"办不成事"反映窗口的启示', url: 'https://www.xinhuanet.com/example/11', publish_time: new Date('2024-05-05'), content: '某市推行"办不成事"反映窗口...', summary: '政务服务创新的思考', category: '新闻报道', region: '全国', tags: ['政务服务', '放管服', '基层治理'], status: 'processed' },
        { source_name: '求是网', title: '中央经济工作会议精神解读', url: 'https://www.qstheory.cn/example/12', publish_time: new Date('2024-01-10'), content: '中央经济工作会议强调稳中求进、以进促稳、先立后破...', summary: '2024年经济工作重点任务解读', category: '政策解读', region: '全国', tags: ['经济工作', '稳中求进', '先立后破'], status: 'processed' },
      ];

      const articleMap = {};
      for (const a of SEED_ARTICLES) {
        const sid = sourceMap[a.source_name] || 1;
        const article = await Article.create({
          source_id: sid, title: a.title, url: a.url, publish_time: a.publish_time,
          content: a.content, summary: a.summary, category: a.category,
          region: a.region, tags: a.tags, status: a.status, question_count: 0,
        });
        articleMap[a.title] = article.id;
      }
      console.log(`Seeded ${SEED_ARTICLES.length} articles`);

      for (const q of SEED_QUESTIONS) {
        const artId = q._article ? articleMap[q._article] : null;
        const { _article, ...qData } = q;
        await Question.create({ ...qData, source_article_id: artId, status: 'approved', quality_score: 85 });
      }
      console.log(`Seeded ${SEED_QUESTIONS.length} questions`);
    } else {
      const srcCount = await ArticleSource.count();
      if (srcCount === 0) {
        const sources = [
          { name: '人民日报', source_type: 'web', base_url: 'http://www.people.com.cn', enabled: true, crawl_interval: 3600 },
          { name: '新华网', source_type: 'web', base_url: 'http://www.xinhuanet.com', enabled: true, crawl_interval: 3600 },
          { name: '中国政府网', source_type: 'web', base_url: 'http://www.gov.cn', enabled: true, crawl_interval: 7200 },
          { name: '求是网', source_type: 'web', base_url: 'http://www.qstheory.cn', enabled: true, crawl_interval: 14400 },
        ];
        for (const s of sources) await ArticleSource.create(s);
        console.log('Seeded article sources');
      }
    }

    console.log('Seed data completed');
  } catch (e) {
    console.error('Seed error:', e.message);
  }
}

module.exports = { seedData };
