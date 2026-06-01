const fetch = require('node-fetch');
const config = require('../config');
const { Article, Question, AiTask } = require('../models');
const { Op } = require('sequelize');

async function callDeepSeek(messages, maxTokens = 4000) {
  const resp = await fetch(config.deepseek.apiUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${config.deepseek.apiKey}` },
    body: JSON.stringify({
      model: config.deepseek.model, messages, temperature: 0.7, max_tokens: maxTokens,
    }),
    timeout: 60000,
  });
  const data = await resp.json();
  if (!data.choices?.[0]?.message?.content) throw new Error('DeepSeek returned empty response');
  return { content: data.choices[0].message.content, usage: data.usage?.total_tokens || 0 };
}

async function processArticle(article) {
  console.log(`[Processor] Processing article #${article.id}: ${article.title}`);

  try {
    const contentSnippet = (article.content || '').substring(0, 3000);
    const { content, usage } = await callDeepSeek([
      { role: 'system', content: '你是一名公考教研分析师。请分析以下文章，输出JSON格式的结果。' },
      { role: 'user', content: `请分析以下文章，输出JSON格式：
{
  "summary": "200字以内的摘要",
  "tags": ["标签1", "标签2", ...],
  "category": "政策文件/评论文章/新闻报道/案例报道/领导讲话/政策解读 之一",
  "region": "全国/或具体省份",
  "exam_relevance": ["national","provincial","institution","tax","selection"],
  "question_types": ["适合生成的题型代码"],
  "key_points": ["核心知识点1", "核心知识点2"]
}

题型代码可选：verbal_main_idea, verbal_intent, verbal_detail, verbal_fill, politics_single, politics_judge, politics_current, politics_policy, interview_analysis, interview_policy, interview_grassroots

文章标题：${article.title}
文章内容：${contentSnippet}

只输出JSON，不要其他内容。` }
    ], 1500);

    let analysis;
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      analysis = jsonMatch ? JSON.parse(jsonMatch[0]) : null;
    } catch (e) {
      console.error(`[Processor] JSON parse failed for article #${article.id}`);
      await article.update({ status: 'failed' });
      return null;
    }

    if (analysis) {
      await article.update({
        summary: analysis.summary || article.summary,
        tags: analysis.tags || [],
        category: analysis.category || article.category,
        region: analysis.region || '全国',
        status: 'processed',
      });
      console.log(`[Processor] Article #${article.id} processed: ${(analysis.tags || []).join(', ')}`);
      return { ...analysis, article_id: article.id, token_usage: usage };
    }
  } catch (e) {
    console.error(`[Processor] Error processing article #${article.id}: ${e.message}`);
    await article.update({ status: 'failed' });
  }
  return null;
}

async function generateQuestionsForArticle(article, count = 3) {
  console.log(`[Generator] Generating ${count} questions for article #${article.id}`);

  const task = await AiTask.create({
    task_type: 'generate_question', article_id: article.id,
    config: { count, auto: true }, status: 'processing', started_at: new Date(),
  });

  try {
    const contentSnippet = (article.content || '').substring(0, 4000);
    const tags = Array.isArray(article.tags) ? article.tags : [];
    const { content, usage } = await callDeepSeek([
      { role: 'system', content: '你是一名资深公考教研老师，擅长根据时政文章生成高质量考试题目。请严格按JSON数组格式输出题目。每道题必须基于文章实际内容，不得编造政策表述。' },
      { role: 'user', content: `请根据以下文章内容，生成 ${count} 道公考题目。要求题目类型多样（言语理解、政治理论混合），难度分布合理。

文章标题：${article.title}
文章来源：${article.category || '时政新闻'}
文章主题：${tags.join('、') || '时政热点'}
文章内容：
${contentSnippet}

请严格按照以下JSON数组格式输出：
[
  {
    "question_type": "题型代码(如verbal_main_idea/politics_single/politics_current等)",
    "exam_type": "national",
    "stem": "完整题干",
    "options": {"A": "选项A", "B": "选项B", "C": "选项C", "D": "选项D"},
    "answer": "正确答案字母",
    "analysis": "详细解析：正确答案为什么对，错误选项为什么错",
    "difficulty": "easy/medium/hard",
    "knowledge_points": ["考点1", "考点2"]
  }
]
只输出JSON数组，不要输出其他内容。` }
    ], 6000);

    let questions = [];
    try {
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      if (jsonMatch) questions = JSON.parse(jsonMatch[0]);
    } catch (e) {
      await task.update({ status: 'failed', error_message: 'AI返回JSON解析失败', completed_at: new Date() });
      return [];
    }

    const created = [];
    for (const q of questions) {
      if (!q.stem || !q.answer) continue;
      const newQ = await Question.create({
        question_type: q.question_type || 'politics_single',
        exam_type: q.exam_type || 'national',
        stem: q.stem, options: q.options || {}, answer: q.answer,
        analysis: q.analysis || '', difficulty: q.difficulty || 'medium',
        knowledge_points: q.knowledge_points || [],
        source_article_id: article.id,
        status: 'pending', quality_score: 0,
      });
      created.push(newQ);
    }

    await article.update({ question_count: (article.question_count || 0) + created.length });
    await task.update({
      status: 'completed',
      result: { question_ids: created.map(q => q.id), count: created.length },
      token_usage: usage, completed_at: new Date(),
    });

    console.log(`[Generator] Created ${created.length} questions for article #${article.id}`);
    return created;
  } catch (e) {
    console.error(`[Generator] Error: ${e.message}`);
    await task.update({ status: 'failed', error_message: e.message, completed_at: new Date() });
    return [];
  }
}

async function processPendingArticles(limit = 5) {
  const articles = await Article.findAll({
    where: { status: 'pending', content: { [Op.ne]: null } },
    order: [['created_at', 'DESC']], limit,
  });

  console.log(`[Processor] Found ${articles.length} pending articles`);
  const results = { processed: 0, questions_generated: 0 };

  for (const article of articles) {
    const analysis = await processArticle(article);
    if (analysis) {
      results.processed++;
      await new Promise(r => setTimeout(r, 2000));
      const questions = await generateQuestionsForArticle(article, 3);
      results.questions_generated += questions.length;
      await new Promise(r => setTimeout(r, 3000));
    }
  }

  console.log(`[Processor] Processed ${results.processed} articles, generated ${results.questions_generated} questions`);
  return results;
}

module.exports = { processArticle, generateQuestionsForArticle, processPendingArticles, callDeepSeek };
