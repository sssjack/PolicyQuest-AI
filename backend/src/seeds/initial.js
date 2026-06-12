const bcrypt = require('bcryptjs');
const { User, Question, ArticleSource, Article } = require('../models');

let verbalQuestions = [];
let politicsQuestions = [];
let interviewQuestions = [];
let generatedQuestions = [];

try { verbalQuestions = require('./questions-verbal'); } catch(e) { console.log('Verbal questions bank not found, skipping'); }
try { politicsQuestions = require('./questions-politics'); } catch(e) { console.log('Politics questions bank not found, skipping'); }
try { interviewQuestions = require('./questions-interview'); } catch(e) { console.log('Interview questions bank not found, skipping'); }
try { const { generate } = require('./question-generator'); generatedQuestions = generate(42); } catch(e) { console.log('Question generator not found, skipping:', e.message); }

const ALL_QUESTIONS = [...verbalQuestions, ...politicsQuestions, ...interviewQuestions, ...generatedQuestions];

const SEED_ARTICLES = [
  { source_name: '新华网', title: '"十五五"规划建议解读：锚定2035年远景目标', url: 'https://www.news.cn/20251028/337438370029449296539148a206bdd1/c.html', publish_time: new Date('2026-01-05'), content: '"十五五"时期是全面建设社会主义现代化国家的关键时期。规划建议提出坚持高质量发展，加快发展新质生产力，建设现代化产业体系，扩大内需，全面推进乡村振兴，推动绿色低碳转型，统筹安全与发展。', summary: '"十五五"规划建议的核心要点解读', category: '政策解读', region: '全国', tags: ['十五五规划','高质量发展','新质生产力'], status: 'processed' },
  { source_name: '新华网', title: '2026年政府工作报告全文', url: 'https://www.news.cn/politics/20260313/9e24773bf14649f59afe2d62550e48ce/c.html', publish_time: new Date('2026-03-13'), content: '国内生产总值增长5%左右。实施更加积极有为的宏观政策，扩大内需，发展新质生产力，推动高质量发展。深化改革开放，优化营商环境，促进民营经济发展壮大。做好稳就业促增收，加强社会保障。', summary: '2026年政府工作报告核心目标和政策部署', category: '政策文件', region: '全国', tags: ['政府工作报告','GDP目标','宏观政策'], status: 'processed' },
  { source_name: '人民日报', title: '加快发展新质生产力 推动高质量发展', url: 'https://opinion.people.com.cn/n1/2026/0115/c223228-40413256.html', publish_time: new Date('2026-01-15'), content: '新质生产力以科技创新为核心要素，以劳动者、劳动资料、劳动对象及其优化组合的跃升为基本内涵。发展新质生产力要坚持先立后破，统筹传统产业升级和新兴产业培育。', summary: '新质生产力的内涵与发展路径', category: '评论文章', region: '全国', tags: ['新质生产力','科技创新','高质量发展'], status: 'processed' },
  { source_name: '新华网', title: '二十届三中全会《决定》解读：进一步全面深化改革', url: 'https://www.news.cn/politics/20240721/cec09ea2bde840dfb99331c48ab5523a/c.html', publish_time: new Date('2026-01-10'), content: '全面深化改革要以经济体制改革为牵引，构建高水平社会主义市场经济体制，推进科技体制改革，完善城乡融合发展体制机制，推进法治建设和基层治理现代化。', summary: '二十届三中全会全面深化改革部署解读', category: '政策解读', region: '全国', tags: ['全面深化改革','二十届三中全会','体制改革'], status: 'processed' },
  { source_name: '中国政府网', title: '2026年中央一号文件发布：推进农业农村现代化', url: 'https://www.news.cn/politics/zywj/20260203/643ac1775607445a95e456a63557e670/c.html', publish_time: new Date('2026-02-03'), content: '2026年中央一号文件聚焦推进农业农村现代化，确保粮食安全，推动农民增收，深化农村改革。全面推进乡村振兴，加快建设农业强国。', summary: '2026年中央一号文件核心内容', category: '政策文件', region: '全国', tags: ['中央一号文件','乡村振兴','粮食安全','农业强国'], status: 'processed' },
  { source_name: '求是网', title: '深入理解中国式现代化的本质要求', url: 'https://www.qstheory.cn/dukan/qs/2026-01/16/c_1130350001.htm', publish_time: new Date('2026-01-16'), content: '中国式现代化是人口规模巨大的现代化，是全体人民共同富裕的现代化，是物质文明和精神文明相协调的现代化，是人与自然和谐共生的现代化，是走和平发展道路的现代化。', summary: '中国式现代化五个特征的理论阐释', category: '政策解读', region: '全国', tags: ['中国式现代化','二十大','共同富裕'], status: 'processed' },
  { source_name: '人民日报', title: '全过程人民民主的制度优势与实践创新', url: 'https://theory.people.com.cn/n1/2026/0220/c40531-40426891.html', publish_time: new Date('2026-02-20'), content: '全过程人民民主是社会主义民主政治的本质属性。从人大代表"家门口"联络站到村民议事会，基层民主实践不断丰富，让人民的声音直达决策层。', summary: '全过程人民民主的基层实践', category: '评论文章', region: '全国', tags: ['全过程人民民主','基层民主','人大制度'], status: 'processed' },
  { source_name: '经济日报', title: '数字经济赋能高质量发展', url: 'https://views.ce.cn/view/ent/202601/18/t20260118_39269873.shtml', publish_time: new Date('2026-01-18'), content: '数字经济正在成为推动高质量发展的关键力量。我国数字经济规模已超60万亿元，成为拉动经济增长的重要引擎。推进数字中国建设，加快数字技术与实体经济深度融合。', summary: '数字经济发展态势与政策方向', category: '新闻报道', region: '全国', tags: ['数字经济','数字中国','产业融合'], status: 'processed' },
  { source_name: '光明日报', title: '文化自信与中华优秀传统文化的创新发展', url: 'https://theory.gmw.cn/2026-02/08/content_37413568.htm', publish_time: new Date('2026-02-08'), content: '坚定文化自信，推动中华优秀传统文化创造性转化创新性发展。从故宫文创到非遗直播，传统文化正以崭新姿态走进千家万户。建设中华民族现代文明。', summary: '文化自信与传统文化创新发展', category: '评论文章', region: '全国', tags: ['文化自信','传统文化','文化强国'], status: 'processed' },
  { source_name: '人民日报', title: '推进基层治理现代化 夯实国家治理根基', url: 'https://opinion.people.com.cn/n1/2026/0305/c223228-40452178.html', publish_time: new Date('2026-03-05'), content: '基层强则国家强。坚持和发展新时代枫桥经验，推进基层治理体系和治理能力现代化。数字赋能社区治理，志愿服务激活社会参与，协商民主化解矛盾纠纷。', summary: '基层治理现代化的路径与经验', category: '评论文章', region: '全国', tags: ['基层治理','枫桥经验','社区治理'], status: 'processed' },
  { source_name: '新华网', title: '中央经济工作会议精神解读：更加积极有为', url: 'https://www.news.cn/zt/2025zyjjgzhy/index.html', publish_time: new Date('2026-01-08'), content: '中央经济工作会议强调实施更加积极有为的宏观政策。扩大内需是战略基点，要着力提振消费。促进民营经济发展壮大，优化营商环境。防范化解重大风险。', summary: '2025年中央经济工作会议部署解读', category: '政策解读', region: '全国', tags: ['中央经济工作会议','宏观政策','扩大内需'], status: 'processed' },
  { source_name: '科技日报', title: '人工智能赋能千行百业的新进展', url: 'https://www.stdaily.com/index/kejixinwen/202602/t20260215_1234567.shtml', publish_time: new Date('2026-02-15'), content: '人工智能大模型加速落地应用，在医疗诊断、智慧城市、自动驾驶、教育等领域取得突破。与此同时，AI治理和伦理规范建设也在加速推进，确保技术向善发展。', summary: 'AI大模型应用与治理双轮驱动', category: '新闻报道', region: '全国', tags: ['人工智能','大模型','科技伦理'], status: 'processed' },
  { source_name: '中国政府网', title: '关于加快建设全国统一大市场的实施方案', url: 'https://www.gov.cn/zhengce/202602/content_7234567.htm', publish_time: new Date('2026-02-25'), content: '破除地方保护和市场分割，加快建设全国统一大市场。统一市场准入、公平竞争、市场监管制度，促进商品和要素自由流通。', summary: '全国统一大市场实施方案解读', category: '政策文件', region: '全国', tags: ['统一大市场','市场经济','公平竞争'], status: 'processed' },
  { source_name: '人民日报', title: '绿色低碳转型的中国路径', url: 'https://opinion.people.com.cn/n1/2026/0422/c223228-40489234.html', publish_time: new Date('2026-04-22'), content: '碳达峰碳中和目标稳步推进，坚持先立后破。新能源装机容量持续增长，绿色技术创新取得新突破。推动经济社会绿色转型，建设美丽中国。', summary: '双碳目标推进与绿色发展', category: '评论文章', region: '全国', tags: ['双碳','绿色发展','先立后破'], status: 'processed' },
  { source_name: '新华网', title: '共同富裕示范区建设的浙江新实践', url: 'https://www.news.cn/local/20260318/abcdef123456.html', publish_time: new Date('2026-03-18'), content: '浙江共同富裕示范区建设持续深化。在缩小收入差距、城乡差距、地区差距方面取得积极进展。山区26县加快发展，公共服务优质共享。', summary: '浙江共同富裕示范区最新进展', category: '新闻报道', region: '浙江', tags: ['共同富裕','示范区','浙江'], status: 'processed' },
  { source_name: '半月谈', title: '基层减负：从"指尖上的形式主义"说起', url: 'https://www.banyuetan.org/byt/202603/t20260310_1234567.shtml', publish_time: new Date('2026-03-10'), content: '当前基层减负取得成效，但"指尖上的形式主义"等新问题值得关注。各类APP、工作群、打卡签到增加基层负担。要从考核机制入手，切实为基层松绑。', summary: '基层减负新形势新问题', category: '评论文章', region: '全国', tags: ['基层减负','形式主义','基层治理'], status: 'processed' },
  { source_name: '中国政府网', title: '关于促进民营经济发展壮大的若干措施', url: 'https://www.gov.cn/zhengce/202601/content_7345678.htm', publish_time: new Date('2026-01-20'), content: '从制度和法律上保障民营企业平等对待。优化融资环境，降低经营成本，保护企业家合法权益。民营经济促进法为民营经济发展提供法治保障。', summary: '促进民营经济发展的新政策新法律', category: '政策文件', region: '全国', tags: ['民营经济','营商环境','民营经济促进法'], status: 'processed' },
  { source_name: '人民日报', title: '数字政府建设提速：让数据多跑路群众少跑腿', url: 'https://opinion.people.com.cn/n1/2026/0225/c223228-40436782.html', publish_time: new Date('2026-02-25'), content: '全国一体化政务服务平台持续优化，"一网通办"深入推进。但老年人和农村群众使用率偏低的问题亟待解决，要保留线下渠道推进适老化改造。', summary: '数字政府建设的成效与挑战', category: '评论文章', region: '全国', tags: ['数字政府','一网通办','适老化'], status: 'processed' },
  { source_name: '新华网', title: '全面依法治国的新进展新成效', url: 'https://www.news.cn/politics/20260415/hijklmn789012.html', publish_time: new Date('2026-04-15'), content: '法治中国建设迈出坚实步伐。民营经济促进法等一批重要法律出台，行政复议体制改革深入推进，法治政府建设示范创建取得实效。', summary: '2026年法治中国建设重要进展', category: '新闻报道', region: '全国', tags: ['依法治国','法治政府','立法'], status: 'processed' },
  { source_name: '求是网', title: '教育强国建设的战略路径', url: 'https://www.qstheory.cn/dukan/qs/2026-03/01/c_1130380001.htm', publish_time: new Date('2026-03-01'), content: '建设教育强国是中华民族伟大复兴的基础工程。深化教育综合改革，推进义务教育优质均衡发展，加强拔尖创新人才培养，完善职业教育体系。', summary: '教育强国的目标与路径', category: '政策解读', region: '全国', tags: ['教育强国','教育改革','人才培养'], status: 'processed' },
  { source_name: '经济日报', title: '银发经济：万亿级市场的机遇与挑战', url: 'https://views.ce.cn/view/ent/202604/08/t20260408_39345678.shtml', publish_time: new Date('2026-04-08'), content: '我国60岁以上人口已超3亿。银发经济市场潜力巨大，涵盖养老服务、健康管理、老年教育等多个领域。要完善养老服务体系，发展普惠型养老服务。', summary: '银发经济的市场潜力与政策方向', category: '新闻报道', region: '全国', tags: ['银发经济','老龄化','养老服务'], status: 'processed' },
  { source_name: '人民日报', title: '粮食安全：端牢中国人自己的饭碗', url: 'https://opinion.people.com.cn/n1/2026/0320/c223228-40458901.html', publish_time: new Date('2026-03-20'), content: '粮食安全是国之大者。全方位夯实粮食安全根基，严守18亿亩耕地红线，加快推进种业振兴，发展智慧农业和设施农业。', summary: '保障国家粮食安全的战略举措', category: '评论文章', region: '全国', tags: ['粮食安全','耕地红线','种业振兴'], status: 'processed' },
  { source_name: '新华网', title: '新型城镇化与城市更新的新实践', url: 'https://www.news.cn/local/20260425/pqrstuv456789.html', publish_time: new Date('2026-04-25'), content: '以人为核心的新型城镇化持续推进。老旧小区改造、城市更新行动取得实效。保障性住房建设和城中村改造稳步推进。', summary: '新型城镇化与城市更新进展', category: '新闻报道', region: '全国', tags: ['新型城镇化','城市更新','保障性住房'], status: 'processed' },
  { source_name: '光明日报', title: '全面从严治党永远在路上', url: 'https://theory.gmw.cn/2026-01/22/content_37425678.htm', publish_time: new Date('2026-01-22'), content: '一体推进不敢腐不能腐不想腐。纪检监察体制改革持续深化，中央八项规定精神严格落实，反腐败斗争取得新成效。', summary: '全面从严治党的新进展', category: '评论文章', region: '全国', tags: ['从严治党','反腐败','八项规定'], status: 'processed' },
  { source_name: '中国政府网', title: '关于推进"平急两用"公共基础设施建设的指导意见', url: 'https://www.gov.cn/zhengce/202603/content_7456789.htm', publish_time: new Date('2026-03-08'), content: '推进"平急两用"公共基础设施建设，增强城市韧性和应急能力。平时用于旅游休闲、康养健身，重大公共突发事件时可转化为应急设施。', summary: '平急两用基础设施政策解读', category: '政策文件', region: '全国', tags: ['平急两用','应急管理','城市韧性'], status: 'processed' },
  { source_name: '人民日报', title: '一带一路高质量发展的新篇章', url: 'https://opinion.people.com.cn/n1/2026/0510/c223228-40512345.html', publish_time: new Date('2026-05-10'), content: '共建一带一路进入高质量发展新阶段。深化与共建国家在基础设施、贸易投资、绿色发展、数字经济等领域的合作。', summary: '一带一路高质量发展新进展', category: '评论文章', region: '全国', tags: ['一带一路','对外开放','国际合作'], status: 'processed' },
  { source_name: '新华网', title: '总体国家安全观引领安全发展', url: 'https://www.news.cn/politics/20260415/wxyzabc123456.html', publish_time: new Date('2026-04-15'), content: '坚持总体国家安全观，统筹发展和安全。防范化解重大风险，确保粮食安全、能源安全、产业链供应链安全。维护网络安全和数据安全。', summary: '总体国家安全观的实践深化', category: '政策解读', region: '全国', tags: ['国家安全','总体安全观','风险防控'], status: 'processed' },
  { source_name: '学习时报', title: '坚持和发展新时代"枫桥经验"', url: 'https://www.studytimes.cn/article/202603/20260308_abcdef.html', publish_time: new Date('2026-03-08'), content: '新时代枫桥经验的核心是依靠群众就地化解矛盾。推动矛盾纠纷多元化解，完善社会治理体系，实现小事不出村大事不出镇。', summary: '新时代枫桥经验的理论与实践', category: '评论文章', region: '全国', tags: ['枫桥经验','矛盾化解','基层治理'], status: 'processed' },
  { source_name: '中国环境报', title: '美丽中国建设的新征程', url: 'https://www.cenews.com.cn/news/202604/t20260422_1234567.html', publish_time: new Date('2026-04-22'), content: '深入推进污染防治攻坚战，生态环境质量持续改善。碳排放权交易市场运行平稳，全国碳市场覆盖范围进一步扩大。', summary: '美丽中国建设和双碳推进', category: '新闻报道', region: '全国', tags: ['美丽中国','碳市场','生态文明'], status: 'processed' },
  { source_name: '人民论坛', title: '青年干部如何在基层成长成才', url: 'https://paper.people.com.cn/rmlt/202605/t20260515_1234567.html', publish_time: new Date('2026-05-15'), content: '基层是年轻干部成长成才的最好课堂。要扑下身子、沉到一线，在实践中增长才干；要坚持人民立场，密切联系群众；要敢于担当作为，在急难险重任务中经受考验。', summary: '青年干部基层成长路径', category: '评论文章', region: '全国', tags: ['青年干部','基层锻炼','干部成长'], status: 'processed' },
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
          { name: '人民日报', source_type: 'web', base_url: 'https://opinion.people.com.cn', enabled: true, crawl_interval: 3600 },
          { name: '新华网', source_type: 'web', base_url: 'https://www.news.cn', enabled: true, crawl_interval: 3600 },
          { name: '中国政府网', source_type: 'web', base_url: 'https://www.gov.cn', enabled: true, crawl_interval: 7200 },
          { name: '求是网', source_type: 'web', base_url: 'https://www.qstheory.cn', enabled: true, crawl_interval: 14400 },
          { name: '光明日报', source_type: 'web', base_url: 'https://www.gmw.cn', enabled: true, crawl_interval: 3600 },
          { name: '经济日报', source_type: 'web', base_url: 'https://views.ce.cn', enabled: true, crawl_interval: 7200 },
          { name: '科技日报', source_type: 'web', base_url: 'https://www.stdaily.com', enabled: true, crawl_interval: 7200 },
          { name: '半月谈', source_type: 'web', base_url: 'https://www.banyuetan.org', enabled: true, crawl_interval: 14400 },
          { name: '学习时报', source_type: 'web', base_url: 'https://www.studytimes.cn', enabled: true, crawl_interval: 14400 },
          { name: '人民论坛', source_type: 'web', base_url: 'https://www.rmlt.com.cn', enabled: true, crawl_interval: 14400 },
          { name: '中国环境报', source_type: 'web', base_url: 'https://www.cenews.com.cn', enabled: true, crawl_interval: 14400 },
        ];
        for (const s of sources) {
          const created = await ArticleSource.create(s);
          sourceMap[s.name] = created.id;
        }
        console.log('Seeded article sources');
      }

      const artCount = await Article.count();
      if (artCount === 0) {
        for (const a of SEED_ARTICLES) {
          const sid = sourceMap[a.source_name] || 1;
          await Article.create({
            source_id: sid, title: a.title, url: a.url, publish_time: a.publish_time,
            content: a.content, summary: a.summary, category: a.category,
            region: a.region, tags: a.tags, status: a.status, question_count: 0,
          });
        }
        console.log(`Seeded ${SEED_ARTICLES.length} articles (2026)`);
      }

      if (ALL_QUESTIONS.length > 0) {
        const BATCH_SIZE = 100;
        let inserted = 0;
        for (let i = 0; i < ALL_QUESTIONS.length; i += BATCH_SIZE) {
          const batch = ALL_QUESTIONS.slice(i, i + BATCH_SIZE).map(q => ({
            ...q,
            status: 'approved',
            quality_score: 85,
            source_article_id: null,
          }));
          await Question.bulkCreate(batch);
          inserted += batch.length;
          if (inserted % 500 === 0 || inserted === ALL_QUESTIONS.length) {
            console.log(`Seeded ${inserted}/${ALL_QUESTIONS.length} questions...`);
          }
        }
        console.log(`Seeded ${ALL_QUESTIONS.length} questions total`);
      } else {
        console.log('No questions to seed');
      }
    } else {
      console.log(`Questions already exist (${qCount}), skipping seed`);
      const srcCount = await ArticleSource.count();
      if (srcCount === 0) {
        const sources = [
          { name: '人民日报', source_type: 'web', base_url: 'https://opinion.people.com.cn', enabled: true, crawl_interval: 3600 },
          { name: '新华网', source_type: 'web', base_url: 'https://www.news.cn', enabled: true, crawl_interval: 3600 },
          { name: '中国政府网', source_type: 'web', base_url: 'https://www.gov.cn', enabled: true, crawl_interval: 7200 },
          { name: '求是网', source_type: 'web', base_url: 'https://www.qstheory.cn', enabled: true, crawl_interval: 14400 },
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
