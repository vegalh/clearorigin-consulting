import type { ChineseLevel, LearnerGroupId, LearningGoal, PaymentMethodId } from '@/types';
import type { FaqSection } from '@/config/faq';

/**
 * Simplified Chinese overlays for content that lives in data/config. Data
 * stays English at the source (it is persisted in localStorage); the UI swaps
 * in these strings by id when the language is Chinese and falls back to the
 * English source for anything not listed. Prototype translations pending a
 * native-speaker review at ClearOrigin.
 */

export interface CourseCopy {
  title: string;
  description: string;
  includes: string[];
  terms?: string[];
}

export const zhCourses: Record<string, CourseCopy> = {
  'trial-lesson': {
    title: '体验课',
    description: '认识老师，聊聊你的学习目标，并在做决定前亲身体验一小段真实课程。',
    includes: ['轻松的水平评估', '体验引导式对话', '推荐学习路径'],
  },
  'lesson-30': {
    title: '30 分钟课程',
    description: '专注的一对一课程 —— 适合小学员，或养成规律的口语练习习惯。',
    includes: ['与老师一对一', '课后简短练习笔记'],
  },
  'lesson-45': {
    title: '45 分钟课程',
    description: '有时间去听、去说、去改 —— 最平衡、最适合稳步进步的课程形式。',
    includes: ['与老师一对一', '课程材料', '课后练习笔记'],
  },
  'lesson-60': {
    title: '60 分钟课程',
    description: '完整的一节课，适合深入对话、阅读练习或系统复习。',
    includes: ['与老师一对一', '课程材料', '课后详细练习笔记'],
  },
  'package-5x45': {
    title: '5 节课套餐',
    description: '五节 45 分钟课程，和同一位或几位老师建立稳定的每周学习节奏。',
    includes: ['5 个课时（每节 45 分钟）', '结账时预约第一节课', '其余课时随时预约'],
    terms: ['只有课程确认时才会扣除课时。', '课时自购买起 90 天内有效（条款草案）。', '提前足够时间取消，课时将退回余额（条款草案）。'],
  },
  'package-10x45': {
    title: '10 节课套餐',
    description: '十节 45 分钟课程，适合准备让中文成为每周固定习惯的学员。',
    includes: ['10 个课时（每节 45 分钟）', '结账时预约第一节课', '其余课时随时预约'],
    terms: ['只有课程确认时才会扣除课时。', '课时自购买起 180 天内有效（条款草案）。', '提前足够时间取消，课时将退回余额（条款草案）。'],
  },
};

/** Legacy v1 session types, shown on bookings made before courses existed. */
export const zhSessionTypes: Record<string, string> = {
  'trial-30': '体验课',
  'lesson-30': '30 分钟课程',
  'lesson-45': '45 分钟课程',
  'lesson-60': '60 分钟课程',
  'discovery-conversation': '初次交流',
  'conversation-practice': '会话练习',
  'personalized-session': '个性化课程',
  'extended-conversation': '加长会话',
};

export interface InstructorCopy {
  title: string;
  bio: string;
  specialties: string[];
  languages: string[];
  education: string[];
  certifications: string[];
  credentials: string[];
  experience: string[];
  philosophy: string;
  methods: string[];
}

export const zhInstructors: Record<string, InstructorCopy> = {
  'maya-chen': {
    title: '中文会话教练',
    bio: '美雅围绕学员真正想聊的话题设计课程，从引导式提问逐步过渡到自然自由的对话。',
    specialties: ['中文会话', '发音与声调'],
    languages: ['普通话', '英语'],
    education: ['汉语国际教育硕士（演示）'],
    certifications: ['国际中文教师证书（演示）'],
    credentials: ['普通话水平测试一级甲等（演示）'],
    experience: ['成人夜校课程', '一对一在线辅导'],
    philosophy: '先建立信心。开口说话感到安心时，准确度自然会提高。',
    methods: ['任务型对话', '在真实短语中练习声调', '简短的课后回顾笔记'],
  },
  'david-okafor': {
    title: '职场中文教练',
    bio: '大卫在上海工作了十年，帮助职场人士自信地用中文开会、寒暄和做演示。',
    specialties: ['商务中文', '会议与演示'],
    languages: ['英语', '普通话', '法语'],
    education: ['中国研究学士（演示）'],
    certifications: ['HSK 六级（演示）', '商务汉语考试高级（演示）'],
    credentials: ['企业语言培训师（演示）'],
    experience: ['企业语言培训项目', '面试准备'],
    philosophy: '学周一早上就用得上的中文。',
    methods: ['真实职场情景角色扮演', '可长期使用的短语库', '录音反馈'],
  },
  'priya-nandakumar': {
    title: '学校中文与 HSK 教练',
    bio: '李雅以清晰的结构和耐心，陪伴备考学校考试或 HSK 的青少年和成人，同时不失对话的乐趣。',
    specialties: ['HSK 备考', '阅读与写作'],
    languages: ['英语', '普通话', '印地语'],
    education: ['语言教育硕士（演示）'],
    certifications: ['HSK 考官培训（演示）'],
    credentials: ['中学中文教师（演示）'],
    experience: ['中学课堂教学', 'HSK 1–5 级备考'],
    philosophy: '结构清晰，每节课都有小进步，加上满满的鼓励。',
    methods: ['分级阅读', '汉字故事', '考试题型口语练习'],
  },
  'liang-wu': {
    title: '少儿与华裔中文老师',
    bio: '吴亮用故事、儿歌和短视频，帮助孩子和华裔学员自然地开口说中文，并在家里也爱上中文。',
    specialties: ['少儿中文', '华裔中文'],
    languages: ['普通话', '英语'],
    education: ['小学教育学士（演示）'],
    certifications: ['少儿中文教学证书（演示）'],
    credentials: ['周末中文学校主讲老师（演示）'],
    experience: ['周末中文学校', '6–12 岁在线课程'],
    philosophy: '孩子在玩中学得最好，家庭一起学效果最好。',
    methods: ['绘本阅读', '儿歌与童谣', '适合家长的练习建议'],
  },
};

export const zhLanguages: Record<string, string> = {
  Mandarin: '普通话',
  English: '英语',
  French: '法语',
  Hindi: '印地语',
};

export const zhLearnerGroups: Record<LearnerGroupId, { title: string; body: string }> = {
  young_learners: { title: '少儿学员', body: '活泼的短课，配合儿歌、图片和故事。由家长或监护人预约并随时了解进展。' },
  teenagers: { title: '青少年', body: '配合学校的中文课程，并围绕青少年真正关心的话题展开真实对话。' },
  adult_beginners: { title: '成人零基础', body: '从拼音、声调和生存用语开始 —— 按照忙碌生活能接受的节奏学习。' },
  heritage: { title: '华裔学员', body: '已经能听懂家人对话？在此基础上自信地说、读、写。' },
  conversational: { title: '会话学员', body: '已经在学中文？把课本中文变成自然的日常对话。' },
};

export const zhLevels: Record<ChineseLevel, string> = {
  complete_beginner: '零基础',
  beginner: '初级',
  intermediate: '中级',
  advanced: '高级',
  heritage: '华裔/传承语使用者',
  not_sure: '不确定',
};

export const zhGoals: Record<LearningGoal, string> = {
  everyday_conversation: '日常对话',
  pronunciation: '发音与声调',
  reading_writing: '汉字读写',
  school_support: '学校中文辅导',
  heritage_connection: '与家人和文化建立联系',
  travel: '旅行与在中国生活',
  business: '职场中文',
  exam_prep: '考试准备（如 HSK）',
  other: '其他',
};

export const zhPaymentMethods: Record<PaymentMethodId, { label: string; description: string }> = {
  card_demo: { label: '银行卡支付 — 演示', description: '模拟托管的银行卡结账，不会要求填写卡号。' },
  wechat_pay_demo: { label: '微信支付 — 演示', description: '模拟微信支付结账，无需扫码。' },
  alipay_demo: { label: '支付宝 — 演示', description: '模拟支付宝结账，不会要求登录账户。' },
};

export const zhHero = {
  eyebrow: '让对话自然发生 · A Place for Conversation',
  headline: '让中文成为你日常对话的一部分。',
  body: '围绕真实对话、有意义的练习和你的学习目标打造的个性化中文课程。',
  primaryCta: '预约体验课',
  secondaryCta: '浏览课程',
};

export const zhPhilosophy: { title: string; chinese: string; body: string }[] = [
  { title: '听 · 留意', chinese: 'Listen & Notice', body: '每节课都从真实的中文开始 —— 一个故事、一段视频、一次对话 —— 留出时间去留意声音、声调和短语的真实用法。' },
  { title: '说 · 回应', chinese: 'Talk & Respond', body: '尽早开口、多开口。老师会按你的水平让对话持续下去，让说中文变得自然而不刻板。' },
  { title: '改 · 再用', chinese: 'Refine & Reuse', body: '温和的纠正和简短的练习笔记，帮助你在下一节课和日常生活中再次用上所学内容。' },
];

export const zhHowToBegin: { title: string; body: string }[] = [
  { title: '预约体验课', body: '按你自己的时区选择合适的时间。' },
  { title: '认识你的老师', body: '聊聊你的目标，体验一小段真实课程。' },
  { title: '选择你的学习路径', body: '继续上单节课或购买套餐 —— 怎么适合你的一周就怎么安排。' },
];

export const zhFaqSections: FaqSection[] = [
  {
    id: 'lessons',
    title: '上课',
    items: [
      { question: '课程如何进行？', answer: '课程通过视频在线直播进行。每节课遵循「听 · 留意 → 说 · 回应 → 改 · 再用」的节奏，并根据你的水平和目标调整。', status: 'proposed' },
      { question: '是一对一课程吗？', answer: '是的 —— 本原型中的每节课都是与一位老师的一对一课程。', status: 'proposed' },
      { question: '使用什么会议软件？', answer: '每位老师使用 Zoom 或 Google Meet。确认页会显示具体平台，会议链接创建后会出现在「我的学习空间」。（本原型不会创建真实会议。）', status: 'proposed' },
      { question: '学生需要准备材料吗？', answer: '不需要。老师会准备好课程材料。你只需要一个笔记本、一个安静的地方和耳机；对于小学员，第一节课时家长在旁边会更好。', status: 'proposed' },
    ],
  },
  {
    id: 'scheduling',
    title: '预约',
    items: [
      { question: '如何预约课程？', answer: '选择课程，选好老师和时间，填写几项学员信息，然后结账。付款期间会为你保留这个时间几分钟。', status: 'confirmed' },
      { question: '可以更改上课时间吗？', answer: '可以。在课程开始前 24 小时以上，你可以在「我的学习空间」把即将开始的课程改到同一位老师的其他空闲时间（规则草案）。', status: 'proposed' },
      { question: '如果我迟到了怎么办？', answer: '老师会等你，但课程仍会按原定时间结束，以免影响下一位学员。具体的迟到政策仍在制定中。', status: 'proposed' },
      { question: '时区是如何处理的？', answer: '老师按自己的时区设置可约时间，你看到的每个时间都会换算成你选择的时区 —— 包括夏令时变化。日历文件使用精确的 UTC 时间。', status: 'confirmed' },
    ],
  },
  {
    id: 'payments',
    title: '付款',
    items: [
      { question: '接受哪些支付方式？', answer: '计划为国际学员提供银行卡支付，并在 ClearOrigin 符合资格的情况下提供微信支付和支付宝。本原型中的所有支付方式都是模拟的 —— 不会产生真实扣款，也不会收集支付信息。', status: 'proposed' },
      { question: '可以购买套餐吗？', answer: '可以。套餐一次提供多个课时。结账时预约第一节课，只有课程确认时才会扣除课时。', status: 'proposed' },
      { question: '如果付款失败怎么办？', answer: '课程不会被确认，也不会扣费。在保留时间内你可以重试或换一种支付方式；保留时间结束后，这个时间会释放给其他人。', status: 'confirmed' },
    ],
  },
  {
    id: 'cancellations',
    title: '取消与退款',
    items: [
      { question: '如何取消课程？', answer: '在「我的学习空间」取消。确认前会显示适用的政策，无论如何预约记录都会保留在历史中。', status: 'proposed' },
      { question: '可以退款吗？', answer: '提前至少 24 小时取消，已付款的课程将发起退款审核，套餐课程的课时会退回（规则草案）。退款从不自动进行，最终政策需由 ClearOrigin 确认。', status: 'proposed' },
      { question: '如果老师取消课程怎么办？', answer: '你将获得新的上课时间，或课时退回，不会产生任何费用。具体流程仍在制定中。', status: 'proposed' },
    ],
  },
];
