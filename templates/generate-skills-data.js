/**
 * Skills Dashboard — 数据生成脚本
 * 扫描全局 + 项目技能目录，读取 SKILL.md，生成 skills-data.js
 * 用法：node generate-skills-data.js
 * 零依赖，纯 Node.js
 */

const fs = require('fs');
const path = require('path');

// ============ 路径配置 ============
// 全局技能目录（通常为 ~/.claude/skills/）
// Windows: C:\Users\<用户名>\.claude\skills\
// macOS/Linux: /Users/<用户名>/.claude/skills/
const GLOBAL_SKILLS_DIR = path.join(
  process.env.USERPROFILE || process.env.HOME,
  '.claude', 'skills'
);
// 项目级技能目录（项目根目录下的 .claude/skills/）
const PROJECT_SKILLS_DIR = path.join(process.cwd(), '.claude', 'skills');
// 输出文件路径（与脚本同目录）
const OUTPUT_FILE = path.join(__dirname, 'skills-data.js');

// ============ 内置技能（Claude Code 系统技能，无 SKILL.md 源文件） ============
// 格式：{ name, description, source, category, dimensions: { scenario, trigger, features, solves, steps[], tools[], verification } }
// 当 Claude Code 新增系统内置技能时，在此数组中添加条目。
const BUILTIN_SKILLS = [
  {
    name: 'init',
    description: '初始化新项目。当用户说"初始化项目""创建新项目""setup"时触发。',
    source: '系统内置',
    category: '项目管理',
    dimensions: {
      scenario: '开始一个新项目时，快速搭建项目骨架和配置文件。',
      trigger: '用户说"初始化项目""新建项目""init""setup"',
      features: '自动检测项目类型、生成基础配置文件、初始化 git 仓库',
      solves: '省去手动创建配置文件的繁琐步骤，确保项目结构规范统一。',
      steps: ['检测当前目录状态', '确定项目类型', '生成配置模板', '初始化 git'],
      tools: ['git init', '模板文件生成'],
      verification: '项目目录下是否生成了基础配置文件？git 仓库是否初始化成功？'
    }
  },
  {
    name: 'review',
    description: 'PR 代码审查。当用户说"review""审查""code review"时触发。',
    source: '系统内置',
    category: '开发工具',
    dimensions: {
      scenario: '提交代码前或审查同事的 Pull Request 时，获得专业的代码审查意见。',
      trigger: '用户说"review""审查这个 PR""帮我 review 一下"',
      features: '检查代码逻辑、命名规范、潜在 bug、安全漏洞、性能问题',
      solves: '在合并前发现肉眼容易忽略的问题，提升代码质量。',
      steps: ['获取 PR diff', '逐文件审查', '标注问题等级', '给出修改建议'],
      tools: ['gh CLI', 'git diff'],
      verification: '是否找出了肉眼容易忽略的 bug？建议是否具体可操作？是否标注了问题严重等级？'
    }
  },
  {
    name: 'security-review',
    description: '安全漏洞审查。当用户说"安全检查""安全审查""security audit"时触发。',
    source: '系统内置',
    category: '开发工具',
    dimensions: {
      scenario: '发布前或处理敏感数据时，排查代码中的安全风险。',
      trigger: '用户说"安全审查""安全检查""security review""有没有安全漏洞"',
      features: '检测 SQL 注入、XSS、密钥泄露、权限漏洞、依赖项漏洞',
      solves: '在代码上线前拦截常见安全漏洞，降低被攻击风险。',
      steps: ['扫描代码文件', '匹配漏洞模式', '评估风险等级', '给出修复方案'],
      tools: ['静态代码分析', '依赖项扫描'],
      verification: '是否扫描了所有关键文件？漏洞是否按严重度分级？修复方案是否可行且不影响功能？'
    }
  },
  {
    name: 'simplify',
    description: '代码简化与优化。当用户说"简化""优化代码""simplify"时触发。',
    source: '系统内置',
    category: '开发工具',
    dimensions: {
      scenario: '代码写完后觉得冗余、不够优雅，想让它更简洁高效。',
      trigger: '用户说"简化一下""能不能更简洁""optimize"',
      features: '检查重复代码、冗余逻辑、过度抽象、可读性问题',
      solves: '减少代码量同时保持可读性，降低维护成本。',
      steps: ['读取代码文件', '识别优化点', '给出简化方案', '应用修改'],
      tools: ['AST 分析'],
      verification: '简化后功能是否完好？代码行数是否减少？可读性是否反而变差？'
    }
  },
  {
    name: 'update-config',
    description: '修改 Claude Code 的 settings.json 配置。当用户说"改配置""更新设置""settings""添加权限""环境变量"时触发。',
    source: '系统内置',
    category: '系统配置',
    dimensions: {
      scenario: '需要修改 Claude Code 的行为设置、添加新权限、配置环境变量时。',
      trigger: '用户说"改配置""settings""添加 permission""配置环境变量""允许 X 命令"',
      features: '管理权限白名单、环境变量、hooks、系统行为开关',
      solves: '不用手动找到并编辑 JSON 文件，自然语言就能改配置。',
      steps: ['确认修改项', '读取当前配置', '合并新配置', '写入文件'],
      tools: ['settings.json', 'settings.local.json'],
      verification: '配置是否正确写入 JSON？新增权限是否生效？原有配置是否被误删？'
    }
  },
  {
    name: 'keybindings-help',
    description: '自定义键盘快捷键。当用户想修改快捷键、添加组合键时触发。',
    source: '系统内置',
    category: '系统配置',
    dimensions: {
      scenario: '觉得默认快捷键不顺手，想自定义一套适合自己的快捷键方案。',
      trigger: '用户说"快捷键""keybinding""改快捷键""绑定按键"',
      features: '查看当前快捷键、添加新快捷键、修改已有绑定',
      solves: '不用死记默认快捷键，按自己的习惯来。',
      steps: ['读取 keybindings.json', '理解用户意图', '生成新绑定', '写入配置'],
      tools: ['keybindings.json'],
      verification: '快捷键是否正确绑定？是否与已有快捷键冲突？用户按下组合键后是否触发预期功能？'
    }
  },
  {
    name: 'fewer-permission-prompts',
    description: '智能减少权限弹窗。分析使用习惯，自动建议权限白名单。',
    source: '系统内置',
    category: '系统配置',
    dimensions: {
      scenario: '频繁弹出权限确认窗口打断工作流，想批量设置信任规则。',
      trigger: '用户说"减少弹窗""少点确认""权限太多了""allow list"',
      features: '扫描历史记录，识别常用安全操作，批量添加到白名单',
      solves: '一次配置，后续同类操作不再反复弹窗确认。',
      steps: ['扫描操作历史', '识别高频安全命令', '生成白名单建议', '写入配置'],
      tools: ['settings.json'],
      verification: '弹窗频率是否明显减少？建议的白名单是否真实命中高频操作？是否有误放危险命令？'
    }
  },
  {
    name: 'loop',
    description: '定时循环执行指令。用户说"每 X 分钟执行 Y""定时""loop"时触发。',
    source: '系统内置',
    category: '系统配置',
    dimensions: {
      scenario: '需要定期检查某个状态（如 CI 结果、部署进度、数据更新）。',
      trigger: '用户说"每 5 分钟""定时""循环""loop""一直监控"',
      features: '设置间隔时间、指定执行指令、自动重复运行直到停止',
      solves: '不用手动反复输入同样的指令，自动轮询等待结果。',
      steps: ['确定执行间隔', '指定执行指令', '启动循环', '按需停止'],
      tools: ['Cron / Schedule Wakeup'],
      verification: '循环是否按设定间隔执行？是否能手动正常停止？执行结果是否符合预期？'
    }
  }
];

// ============ 技能详情补充表（手写中文翻译 + 7维度数据） ============
// 格式：{ 技能名: { description, scenario, trigger, features, solves, steps[], tools[], verification } }
// 当 SKILL.md 为英文或描述不完整时，此表提供高质量中文补充数据。
// 翻译优先级：ENRICHMENTS 手写 > PHRASE_DICT 自动翻译 > 保留英文原文
//
// 以下已预填 Anthropic 官方技能和常见第三方技能的中文翻译。
// 安装新技能后，在此表中添加对应条目即可。
const ENRICHMENTS = {
  'brand-guidelines': {
    description: '将 Anthropic 官方品牌色彩和字体应用到任何需要统一视觉风格的作品中。当涉及品牌颜色、样式规范、视觉格式化或公司设计标准时使用。',
    scenario: '做 PPT、文档、网页时，希望统一用上 Anthropic 的专业品牌配色和字体。',
    trigger: '用户提到"品牌配色""品牌规范""Anthropic 风格""公司配色"',
    features: '提供 4 种主色 + 3 种强调色的完整调色板，2 套字体方案（Poppins + Lora），自动降级策略',
    solves: '不用自己配颜色、不用纠结字体搭配，一键获得专业视觉规范。',
    steps: ['选择配色方案', '选择字体方案', '应用到目标元素', '检查字体降级'],
    tools: ['色值表 (#141413 等)', '字体栈 (Poppins/Lora → Arial/Georgia)'],
    verification: '标题字体是否为 Poppins？按钮色值是否为 #3b82f6？字体缺失时是否自动降级为 Georgia/Arial？'
  },
  'theme-factory': {
    description: '为各类作品（幻灯片、文档、报告、HTML 落地页等）应用主题样式。内置 10 套预设主题（含配色+字体），也可即时生成新主题。',
    scenario: '在做 PPT、文档、网页时需要一套完整的配色+字体方案，不想自己从零搭配。',
    trigger: '用户提到"主题""theme""配色方案""字体搭配""换个风格"',
    features: '10 套预设主题（Ocean Depths, Sunset Boulevard 等），每套含色板+字体对，可自创主题',
    solves: '告别"不知道什么颜色配什么颜色"的困扰，10秒选定一套专业方案。',
    steps: ['展示主题预览', '用户选择主题', '读取主题配置', '应用到目标文件'],
    tools: ['theme-showcase.pdf', 'themes/ 目录下的主题配置'],
    verification: '颜色是否来自选定主题？字体对是否正确应用？整体风格是否与主题预览一致？'
  },
  'frontend-design': {
    description: '创建独具风格、生产级质量的前端界面。当用户要求构建网页组件、页面、Dashboard、React 组件、HTML/CSS 布局，或美化任何 Web UI 时使用。告别 AI 味的通用设计。',
    scenario: '需要做网页、落地页、Dashboard、UI 组件时，想做出不千篇一律的设计。',
    trigger: '用户提到"做网页""前端""UI""landing page""Dashboard""网站"',
    features: '独特字体选择、大胆配色、非对称布局、微动效、氛围背景纹理',
    solves: '告别 AI 味十足的紫渐变白底+Inter 字体，做出让人眼前一亮的前端作品。',
    steps: ['理解设计目标', '确定美学方向', '选择字体配色', '实现 HTML/CSS', '打磨细节动效'],
    tools: ['HTML/CSS/JS', 'React/Vue (按需)', 'CSS 动画'],
    verification: '页面是否避免了 AI 味的紫渐变+Inter 字体？是否有独特的字体和配色选择？布局是否突破对称模板？'
  },
  'algorithmic-art': {
    description: '使用 p5.js 创建生成式算法艺术，支持种子随机和交互式参数探索。当用户请求用代码创作艺术、生成艺术、算法艺术、流场或粒子系统时使用。',
    scenario: '想用代码生成独一无二的艺术作品，探索生成式算法美学。',
    trigger: '用户提到"生成艺术""algorithmic art""p5.js""粒子系统""流场"',
    features: '两步工作流：先写算法哲学宣言 → 再转 p5.js 交互作品，支持种子随机和参数探索',
    solves: '不会写生成式艺术代码？技能帮你把美学理念翻译成 p5.js 算法。',
    steps: ['撰写算法哲学 ( manifesto )', '设计 p5.js 生成逻辑', '实现交互参数面板', '输出 HTML+JS 文件'],
    tools: ['p5.js', '种子随机函数', '参数面板'],
    verification: '页面是否可交互（参数面板可用）？同一种子是否产生相同结果？作品是否原创而非复制现有艺术家？'
  },
  'canvas-design': {
    description: '使用设计哲学创作精美的 PNG 和 PDF 静态视觉艺术作品。当用户要求创建海报、艺术作品、设计或其他静态视觉作品时使用。',
    scenario: '需要做海报、视觉设计、静态艺术作品，输出 PNG 或 PDF。',
    trigger: '用户提到"海报""poster""设计图""视觉设计""静态作品"',
    features: '设计哲学→视觉表达两步法，输出 PNG/PDF，强调原创性',
    solves: '没有设计基础也能产出有美学理念支撑的视觉作品，而不是随便拼凑。',
    steps: ['创建设计哲学', '确定视觉语言', '在画布上实现', '导出 PNG/PDF'],
    tools: ['HTML Canvas', 'Python Pillow', '设计模板'],
    verification: '输出是否为 PNG 或 PDF？画面元素是否符合设计哲学描述？是否原创而非复制现有艺术家？'
  },
  'pptx': {
    description: '处理任何与 .pptx 文件相关的操作：创建幻灯片、演示文稿、提取内容、编辑修改、合并拆分、模板布局、演讲者备注。只要用户提到"PPT""幻灯片""演示文稿"或引用 .pptx 文件就触发。',
    scenario: '需要创建、编辑、合并 PPT 文件，做演示文稿或提案。',
    trigger: '用户提到"PPT""幻灯片""slide""deck""presentation""pptx"',
    features: '创建新 PPT、编辑已有 PPT、合并拆分、模板布局、演讲者备注、评论管理',
    solves: '不用开 PowerPoint 逐页手动做，AI 直接生成结构完整、排版美观的 PPT 文件。',
    steps: ['分析内容结构', '选择主题模板', '逐页生成内容', '调整布局细节'],
    tools: ['python-pptx', 'HTML→PPTX 转换', '模板文件'],
    verification: '生成的 .pptx 能否用 PowerPoint/WPS 正常打开？幻灯片页数是否正确？文字和图片是否在预期位置？'
  },
  'pdf': {
    description: '处理任何 PDF 相关操作：读取提取文本/表格、合并拆分、旋转页面、添加水印、创建填写表单、加密解密、OCR 识别。用户提到 .pdf 文件或要生成 PDF 时使用。',
    scenario: '处理任何 PDF 相关操作：读取、合并、拆分、水印、表单、OCR。',
    trigger: '用户提到".pdf""PDF""合并 PDF""拆分 PDF""OCR""加水印"',
    features: '读取/提取文本表格、合并/拆分 PDF、旋转页面、水印、加密/解密、OCR 识别',
    solves: '一个技能覆盖所有 PDF 操作，不用装多个工具。',
    steps: ['确定操作类型', '读取相关文件', '执行操作', '验证输出'],
    tools: ['pypdf', 'pdfplumber', 'OCR 引擎', '加密库'],
    verification: '输出 PDF 能否正常打开？合并/拆分页数是否正确？OCR 结果是否可搜索？水印是否在预期位置？'
  },
  'claude-api': {
    description: '构建、调试和优化 Claude API / Anthropic SDK 应用。覆盖 prompt caching、streaming、thinking、tool use、compaction、batch、files、citations、memory 等全部功能，以及模型版本迁移（4.5→4.6→4.7）。',
    scenario: '用代码调用 Claude API，需要正确使用 SDK、prompt caching、tool use 等高级功能。',
    trigger: '代码中 import anthropic SDK，或用户问"Claude API""Anthropic SDK""prompt caching""tool use"',
    features: '自动检测项目语言→调度对应语言 SDK 文档，覆盖 caching / thinking / tool use / compaction / 文件 API',
    solves: '不用翻官方文档，技能直接告诉你当前语言的最佳实践和完整代码示例。',
    steps: ['检测项目语言', '读取对应语言文档', '检查 caching 机会', '生成 SDK 代码'],
    tools: ['各语言 SDK', 'Models API', 'Files API', 'Beta features'],
    verification: '生成的代码能否直接运行？是否使用了 prompt caching？SDK 版本是否匹配项目语言？'
  },
  'claude-api-curl': {
    description: '使用原始 HTTP 请求（curl）调用 Claude API。覆盖 REST 端点、认证头、JSON 请求响应、SSE 流式事件、tool use 循环、prompt caching、extended thinking 等功能。',
    scenario: '想用 shell 脚本或 curl 直接调 Claude API，不引入任何 SDK 依赖。',
    trigger: '用户写 curl 命令调 Claude API，或在 bash/zsh 脚本中调用 Anthropic API',
    features: '完整的 REST API 调用示例：消息、流式、工具调用、caching、thinking、所有必需 headers',
    solves: '最快验证 API 的方式——一行 curl 就能跑通，不用配 SDK 环境。',
    steps: ['设置 API key 环境变量', '构造 JSON 请求体', '发送 curl 请求', '用 jq 解析响应'],
    tools: ['curl', 'jq', 'Anthropic REST API'],
    verification: 'curl 命令能否成功返回 200？响应体是否能用 jq 正确解析？headers 是否完整？'
  },
  'claude-api-go': {
    description: '使用官方 Go Anthropic SDK 构建 Claude API 应用。覆盖 go get 安装、客户端初始化、消息发送、流式累积、tool use（Beta ToolRunner + jsonschema struct tags）、thinking、prompt caching 等功能。',
    scenario: '用 Go 语言开发调用 Claude API 的应用或 Agent 系统。',
    trigger: '.go 文件 import anthropic-sdk-go，用户问"Go SDK""Claude Go""golang Claude"',
    features: 'Go SDK 全功能：Messages、Streaming、Tool Runner (Beta)、Thinking、Caching、Files API',
    solves: 'Go 的 Tool Runner 自动管理 Agent 工具调用循环，RunToCompletion() 一行搞定。',
    steps: ['go get SDK', '初始化 Client', '定义 Tools', 'Run ToolRunner', '处理结果'],
    tools: ['anthropic-sdk-go', 'ToolRunner', 'jsonschema struct tags'],
    verification: 'Go 代码能否 go build 通过？ToolRunner 是否正确处理工具调用循环？流式响应是否完整累积？'
  },
  'claude-api-java': {
    description: '使用官方 Java Anthropic SDK 构建 Claude API 应用。覆盖 Maven/Gradle 安装、客户端初始化、消息发送、流式响应、thinking、tool use、prompt caching、结构化输出、PDF 输入、Files API 等功能。',
    scenario: '用 Java 开发企业级应用，需要集成 Claude API。',
    trigger: '.java 文件 import com.anthropic.*，用户问"Java SDK""Claude Java"',
    features: 'Java SDK：Messages、Streaming、Tool Use、Thinking、Caching、Files API',
    solves: '企业后端直接集成 Claude，不用再搭一层 Python/Node 中转。',
    steps: ['Maven/Gradle 加依赖', '初始化 Client', '构造 Message 请求', '处理 Response'],
    tools: ['Maven/Gradle', 'Anthropic Java SDK'],
    verification: 'Java 代码能否 mvn/gradle 编译通过？Response 类型是否正确解析？异常是否被妥善处理？'
  },
  'claude-api-csharp': {
    description: '使用官方 C# Anthropic SDK 构建 Claude API 应用。覆盖 dotnet 安装、客户端初始化、消息发送、流式响应、thinking、tool use、prompt caching、结构化输出、PDF 输入、Files API、effort 参数等功能。',
    scenario: '用 C# / .NET 开发，需要调用 Claude API。',
    trigger: '.cs 文件 import Anthropic SDK，用户问"C# SDK""Claude .NET""dotnet Claude"',
    features: 'C# SDK：Messages、Streaming、Tool Use、Thinking、Caching、Files API、Effort 参数',
    solves: '.NET 生态直接集成 Claude，支持 Microsoft.Extensions.AI IChatClient 集成。',
    steps: ['dotnet add package', '初始化 AnthropicClient', '构造请求参数', '处理响应 union 类型'],
    tools: ['NuGet Anthropic 包', 'AnthropicClient', 'Union 类型 TryPick* 方法'],
    verification: 'C# 代码能否 dotnet build 通过？Union 类型是否由 TryPick* 正确处理？'
  },
  'claude-api-php': {
    description: '使用官方 PHP Anthropic SDK 构建 Claude API 应用。覆盖 composer 安装、客户端初始化、消息发送、流式响应、thinking、tool use、prompt caching、结构化输出、PDF 输入、Files API 等功能。',
    scenario: '用 PHP 开发 Web 应用，需要接入 Claude API。',
    trigger: '.php 文件 use Anthropic\\*，用户问"PHP SDK""Claude PHP"',
    features: 'PHP SDK：Messages、Streaming、Tool Use、Thinking、Caching',
    solves: '快速在 PHP Web 项目中接入 Claude，做轻量 API 代理层。',
    steps: ['composer require', '初始化 Client', '构造请求', '处理响应'],
    tools: ['Composer', 'Anthropic PHP SDK'],
    verification: 'PHP 代码能否 composer install 后正常运行？Response 是否正确解析？异常处理是否到位？'
  },
  'mcp-builder': {
    description: '创建高质量 MCP（模型上下文协议）服务器的指南，让 LLM 能通过标准化工具与外部服务交互。支持 Python（FastMCP）和 Node/TypeScript（MCP SDK）两种实现方式。',
    scenario: '需要创建一个 MCP 服务器，让 LLM 能通过标准化接口调用外部服务。',
    trigger: '用户说"创建 MCP""MCP server""模型上下文协议""FastMCP""MCP SDK"',
    features: 'Python (FastMCP) 和 Node/TypeScript (MCP SDK) 两种实现方式，完整工具定义、资源管理',
    solves: '不用从零学习 MCP 协议规范，技能提供经过验证的实现模式和最佳实践。',
    steps: ['选择语言（Python/Node）', '定义 Tools 接口', '实现业务逻辑', '测试 MCP 连接'],
    tools: ['FastMCP (Python)', 'MCP SDK (Node/TypeScript)', 'Claude Desktop 配置'],
    verification: 'MCP 服务器能否成功连接？工具列表是否正确注册？调用工具后是否返回预期 JSON？'
  },
  'skill-creator': {
    description: '创建新技能、修改优化已有技能、评测技能表现。当用户想从零创建技能、编辑优化已有技能、运行 eval 测试、基准评测技能性能、优化技能描述以提升触发准确率时使用。',
    scenario: '想要创建、优化或评估一个 Skill，让它更精准地触发和更好地完成任务。',
    trigger: '用户说"创建 skill""优化技能""skill 评测""写个技能"',
    features: '完整工作流：写草稿→创建 eval 用例→运行测试→盲评对比→分析改进→迭代优化',
    solves: '从"凭感觉写技能"升级到"有数据验证的技能工程"，确保技能真的有用。',
    steps: ['定义技能目标', '写 SKILL.md 草稿', '创建 evals 测试', '运行 grading', '分析结果迭代'],
    tools: ['run_eval.py', 'grading agent', 'analyzer agent', 'comparator agent'],
    verification: '技能触发准确率是否提升？eval 评分是否达标？盲评对比是否优于旧版本？'
  },
  'karpathy-guidelines': {
    description: '减少 LLM 常见编码错误的五条行为准则。在写代码、审查代码、重构代码时使用，避免过度工程、盲目修改、缺乏验证等问题，让代码改动更精准可控。',
    scenario: '写代码、改代码、重构代码时，需要遵循一套经过验证的行为准则，避免低级错误。',
    trigger: '用户写代码、审查代码、重构代码——任何涉及代码修改的场景自动激活。',
    features: '5 条核心准则：先思考再动手、极简优先、手术刀式修改、验证再迭代、坦诚沟通',
    solves: '减少过度工程、盲目修改、缺乏验证等 LLM 常见编码坏习惯，让代码改动更精准可控。',
    steps: ['理解需求后再动手', '用最简方案解决问题', '只改必要的代码', '验证改动效果', '如实报告结果'],
    tools: ['无特定外部依赖'],
    verification: '代码改动是否符合"最小修改"原则？是否在改代码前先理解了需求？改完后是否验证了效果？'
  },
  'lark-event': {
    description: '飞书实时事件监听与订阅：通过 lark-cli 流式消费 NDJSON 事件（覆盖消息接收、表情回应、群成员变更等）。用于飞书机器人、实时消息处理、长期运行的订阅者、流式 webhook 推送处理。',
    verification: '事件流是否正确消费？事件类型是否匹配预期？--max-events / --timeout 限制下是否正常退出？'
  },
  'lark-whiteboard': {
    description: '飞书画板：查询和编辑飞书云文档中的画板。支持导出画板为预览图片、导出原始节点结构、使用 DSL/PlantUML/Mermaid 格式更新画板内容。当需要可视化表达架构、流程、组织关系等结构化信息时使用。',
    verification: '画板内容是否正确导出为图片？DSL/PlantUML/Mermaid 格式更新是否生效？'
  }
};

// Lark/飞书技能批量配置（24 个，结构高度一致）。
// 格式：{ 技能名: { category, scenario, tools[] } }
const LARK_SKILLS_MAP = {
  'lark-shared': { category: '飞书基础', scenario: '使用任何飞书功能前，进行认证、权限配置和环境初始化。', tools: ['lark-cli'] },
  'lark-contact': { category: '飞书通讯', scenario: '管理飞书通讯录：搜索用户/部门、查看联系人信息。', tools: ['lark-cli'] },
  'lark-im': { category: '飞书通讯', scenario: '收发飞书消息、管理群聊、搜索聊天记录、下载文件。', tools: ['lark-cli'] },
  'lark-calendar': { category: '飞书日程', scenario: '管理日历和日程：创建/搜索日程、预定会议室、查询忙闲。', tools: ['lark-cli'] },
  'lark-doc': { category: '飞书文档', scenario: '创建和编辑飞书云文档，支持 XML 和 Markdown 格式。', tools: ['lark-cli'] },
  'lark-wiki': { category: '飞书文档', scenario: '管理飞书知识库（Wiki）：创建/搜索/编辑知识空间和条目。', tools: ['lark-cli'] },
  'lark-minutes': { category: '飞书文档', scenario: '管理飞书会议纪要（Minutes）。', tools: ['lark-cli'] },
  'lark-markdown': { category: '飞书文档', scenario: '飞书 Markdown 内容处理与转换。', tools: ['lark-cli'] },
  'lark-whiteboard': { category: '飞书文档', scenario: '创建和管理飞书白板。', tools: ['lark-cli'] },
  'lark-base': { category: '飞书表格', scenario: '操作飞书多维表格：建表、字段管理、记录读写、视图配置、公式字段。', tools: ['lark-cli'] },
  'lark-sheets': { category: '飞书表格', scenario: '操作飞书电子表格。', tools: ['lark-cli'] },
  'lark-slides': { category: '飞书表格', scenario: '创建和管理飞书幻灯片。', tools: ['lark-cli'] },
  'lark-drive': { category: '飞书文件', scenario: '管理飞书云盘：上传/下载文件、搜索文件、管理目录。', tools: ['lark-cli'] },
  'lark-mail': { category: '飞书通讯', scenario: '使用飞书邮箱收发邮件。', tools: ['lark-cli'] },
  'lark-vc': { category: '飞书通讯', scenario: '飞书视频会议：搜索会议记录、查询会议详情。', tools: ['lark-cli'] },
  'lark-task': { category: '飞书协作', scenario: '管理飞书任务（Task）：创建/分配/追踪任务。', tools: ['lark-cli'] },
  'lark-okr': { category: '飞书协作', scenario: '管理飞书 OKR 目标和关键结果。', tools: ['lark-cli'] },
  'lark-approval': { category: '飞书协作', scenario: '飞书审批：管理审批实例和审批任务。', tools: ['lark-cli'] },
  'lark-attendance': { category: '飞书协作', scenario: '飞书考勤打卡：查询考勤记录。', tools: ['lark-cli'] },
  'lark-event': { category: '飞书基础', scenario: '飞书事件订阅：监听飞书开放平台事件。', tools: ['lark-cli'] },
  'lark-openapi-explorer': { category: '飞书工具', scenario: '浏览和调试飞书开放平台 OpenAPI。', tools: ['lark-cli'] },
  'lark-skill-maker': { category: '飞书工具', scenario: '飞书技能生成器：快速创建飞书相关技能。', tools: ['lark-cli'] },
  'lark-workflow-meeting-summary': { category: '飞书工作流', scenario: '自动生成飞书会议总结。', tools: ['lark-cli'] },
  'lark-workflow-standup-report': { category: '飞书工作流', scenario: '自动生成飞书每日站会报告。', tools: ['lark-cli'] }
};

// ============ 英文 → 中文短语翻译词典（按长度降序，避免短词误匹配） ============
// 当 ENRICHMENTS 表没有覆盖某个技能时，此词典自动翻译 description 字段。
// 翻译覆盖率 < 2 条时保留英文原文。
const PHRASE_DICT = [
  // Claude API 系列
  ['Build Claude API applications with the official', '使用官方'],
  ['Build Claude API applications using raw HTTP requests (curl)', '使用原始 HTTP 请求（curl）调用 Claude API'],
  ['Anthropic SDK', 'Anthropic SDK 构建 Claude API 应用'],
  ['Claude API / Anthropic SDK apps', 'Claude API / Anthropic SDK 应用'],
  ['Build, debug, and optimize', '构建、调试和优化'],
  ['Covers REST endpoint usage, authentication headers, JSON request/response handling, streaming SSE events, tool use loop, prompt caching, extended thinking, and beta features via anthropic-beta header', '覆盖 REST 端点、认证头、JSON 请求响应、SSE 流式事件、tool use 循环、prompt caching、extended thinking、beta features'],
  ['Covers go get install, client init, messages, streaming with accumulation, tool use (Beta ToolRunner with jsonschema struct tags + manual loop), thinking (adaptive), prompt caching, server-side tools, PDF input, Files API, and context editing/compaction', '覆盖 go get 安装、客户端初始化、消息发送、流式累积、tool use（Beta ToolRunner + jsonschema struct tags）、thinking、prompt caching、服务端工具、PDF 输入、Files API、context editing/compaction'],
  ['Covers Maven/Gradle install, client init, messages, streaming, thinking (adaptive), tool use, prompt caching, structured output, PDF input, Files API, and context editing/compaction', '覆盖 Maven/Gradle 安装、客户端初始化、消息发送、流式响应、thinking、tool use、prompt caching、结构化输出、PDF 输入、Files API、context editing/compaction'],
  ['Covers composer install, client init, messages, streaming, thinking (adaptive), tool use, prompt caching, structured output, PDF input, Files API, and context editing/compaction', '覆盖 composer 安装、客户端初始化、消息发送、流式响应、thinking、tool use、prompt caching、结构化输出、PDF 输入、Files API、context editing/compaction'],
  ['Covers installation, client init, messages, streaming, thinking, tool use (raw definitions + JSON schema), prompt caching, structured output, PDF input, Files API, context editing/compaction, effort parameter, token counting, and server-side tools', '覆盖安装、客户端初始化、消息发送、流式响应、thinking、tool use（raw + JSON Schema）、prompt caching、结构化输出、PDF 输入、Files API、context editing/compaction、effort 参数、token 计数、server-side tools'],
  ['Also handles migrating existing Claude API code between Claude model versions', '同时处理模型版本迁移'],
  ['Apps built with this skill should include prompt caching', '推荐启用 prompt caching'],

  // 创意设计系列
  ['Creating algorithmic art using p5.js with seeded randomness and interactive parameter exploration', '使用 p5.js 创建生成式算法艺术，支持种子随机和交互式参数探索'],
  ['Create original algorithmic art rather than copying existing artists\' work to avoid copyright violations', '创作原创算法艺术作品'],
  ['Applies Anthropic\'s official brand colors and typography to any sort of artifact that may benefit from having Anthropic\'s look-and-feel', '将 Anthropic 官方品牌色彩和字体应用到任何需要统一视觉风格的作品中'],
  ['Create beautiful visual art in .png and .pdf documents using design philosophy', '使用设计哲学创作精美的 PNG 和 PDF 静态视觉艺术作品'],
  ['Create distinctive, production-grade frontend interfaces with high design quality', '创建独具风格、生产级质量的前端界面'],
  ['Generates creative, polished code and UI design that avoids generic AI aesthetics', '产出有创意的代码和 UI 设计，告别 AI 味的通用美学'],
  ['Toolkit for styling artifacts with a theme', '为各类作品应用主题样式的工具箱'],
  ['There are 10 pre-set themes with colors/fonts that you can apply to any artifact', '内置 10 套预设主题（含配色+字体），可应用到任何作品'],

  // 文档处理系列
  ['Use this skill any time a .pptx file is involved in any way — as input, output, or both', '处理任何与 .pptx 文件相关的操作——读取、创建、编辑均可'],
  ['This includes: creating slide decks, pitch decks, or presentations; reading, parsing, or extracting text from any .pptx file; editing, modifying, or updating existing presentations; combining or splitting slide files; working with templates, layouts, speaker notes, or comments', '包括：创建幻灯片/演示文稿、提取文本内容、编辑修改已有文件、合并拆分、模板布局、演讲者备注、评论管理'],
  ['Use this skill whenever the user wants to do anything with PDF files', '处理任何 PDF 相关操作'],
  ['This includes reading or extracting text/tables from PDFs, combining or merging multiple PDFs into one, splitting PDFs apart, rotating pages, adding watermarks, creating new PDFs, filling PDF forms, encrypting/decrypting PDFs, extracting images, and OCR on scanned PDFs to make them searchable', '包括：读取提取文本/表格、合并拆分、旋转页面、添加水印、创建填写表单、加密解密、提取图片、OCR 识别'],

  // 开发工具系列
  ['Guide for creating high-quality MCP (Model Context Protocol) servers that enable LLMs to interact with external services through well-designed tools', '创建高质量 MCP 服务器的指南，让 LLM 通过标准化工具与外部服务交互'],
  ['Create new skills, modify and improve existing skills, and measure skill performance', '创建新技能、修改优化已有技能、评测技能表现'],
  ['Behavioral guidelines to reduce common LLM coding mistakes', '减少 LLM 常见编码错误的行为准则'],

  // 飞书系列
  ['Lark/Feishu real-time event listening / subscribing / consuming: stream events as NDJSON via `lark-cli event consume <EventKey>`', '飞书实时事件监听与订阅：通过 lark-cli 流式消费 NDJSON 事件'],
  ['covers IM message receive, reactions, chat member changes, etc.', '覆盖消息接收、表情回应、群成员变更等'],

  // 通用片段（放最后，避免短匹配）
  ['Use this when users request creating art using code, generative art, algorithmic art, flow fields, or particle systems', '当用户请求用代码创作艺术、生成艺术、算法艺术、流场或粒子系统时使用'],
  ['Use it when brand colors or style guidelines, visual formatting, or company design standards apply', '当涉及品牌颜色、样式规范、视觉格式化或公司设计标准时使用'],
  ['You should use this skill when the user asks to create a poster, piece of art, design, or other static piece', '当用户要求创建海报、艺术作品、设计或其他静态视觉作品时使用'],
  ['Create original visual designs, never copying existing artists\' work to avoid copyright violations', '创作原创视觉设计'],
  ['Use this skill when the user asks to build web components, pages, artifacts, posters, or applications', '当用户要求构建网页组件、页面、Dashboard、应用时使用'],
  ['examples include websites, landing pages, dashboards, React components, HTML/CSS layouts, or when styling/beautifying any web UI', '包括网站、落地页、Dashboard、React 组件、HTML/CSS 布局、美化 Web UI 等'],
  ['Use for Lark bots, real-time message processing, long-running subscribers, streaming webhook/push handlers', '用于飞书机器人、实时消息处理、长期订阅、流式 webhook 推送'],
  ['Supports `--max-events` / `--timeout` bounded runs and a stderr ready-marker contract', '支持 --max-events / --timeout 边界运行和 stderr 就绪标记'],
  ['designed for AI agents running as subprocesses', '专为 AI agent 子进程设计'],
  ['Use when writing, reviewing, or refactoring code to avoid overcomplication, make surgical changes, surface assumptions, and define verifiable success criteria', '在写代码、审查、重构时避免过度工程、做手术刀式修改、暴露假设、定义可验证的成功标准'],
  ['Use when building MCP servers to integrate external APIs or services, whether in Python (FastMCP) or Node/TypeScript (MCP SDK)', '构建 MCP 服务器来集成外部 API 或服务时使用，支持 Python (FastMCP) 和 Node/TypeScript (MCP SDK)'],
  ['Use when users want to create a skill from scratch, edit, or optimize an existing skill, run evals to test a skill, benchmark skill performance with variance analysis, or optimize a skill\'s description for better triggering accuracy', '当用户想从零创建技能、编辑优化已有技能、运行 eval 测试、基准评测性能、优化描述以提升触发准确率时使用'],
  ['Trigger whenever the user mentions "deck," "slides," "presentation," or references a .pptx filename', '当用户提到"PPT""幻灯片""演示文稿"或引用 .pptx 文件时触发'],
  ['If the user mentions a .pdf file or asks to produce one, use this skill', '用户提到 .pdf 文件或要生成 PDF 时使用'],

  // SKIP 清理
  ['SKIP:', ''],
  ['SKIP :', ''],
].sort((a, b) => b[0].length - a[0].length); // 长优先，防止短词误匹配

// ============ 核心引擎（以下函数无需修改） ============

/** 检测文本是否包含中文 */
function containsChinese(text) {
  return /[一-鿿㐀-䶿]/.test(text);
}

/** 利用短语词典翻译英文描述 */
function translateDescription(text) {
  if (!text || containsChinese(text)) return text;
  let result = text;
  let hitCount = 0;
  for (const [en, zh] of PHRASE_DICT) {
    if (result.includes(en)) {
      result = result.replace(en, zh);
      hitCount++;
    }
  }
  if (hitCount < 2 && !containsChinese(result)) {
    return text;
  }
  result = result.replace(/\s{2,}/g, ' ').replace(/\s,\s/g, '，').replace(/\.\s+/g, '。').trim();
  if (!result.endsWith('。') && !result.endsWith('）')) result += '。';
  return result;
}

/** 解析 YAML frontmatter */
function parseFrontmatter(content) {
  const match = content.match(/^---\s*\n([\s\S]*?)\n---/);
  if (!match) return {};
  const fm = {};
  const lines = match[1].split('\n');
  for (const line of lines) {
    const kvMatch = line.match(/^(\w[\w-]*)\s*:\s*(.+)/);
    if (kvMatch) {
      fm[kvMatch[1]] = kvMatch[2].trim().replace(/^["']|["']$/g, '');
    }
  }
  return fm;
}

/** 读取正文（frontmatter 之后的内容） */
function getBody(content) {
  const parts = content.split(/^---\s*$/m);
  if (parts.length >= 3) return parts.slice(2).join('---').trim();
  return content.trim();
}

/** 从正文中提取标题段落 */
function extractSections(body) {
  const sections = {};
  let currentHeading = '_intro';
  const lines = body.split('\n');
  for (const line of lines) {
    const h2 = line.match(/^##\s+(.+)/);
    const h3 = line.match(/^###\s+(.+)/);
    if (h2) {
      currentHeading = h2[1].toLowerCase();
      sections[currentHeading] = sections[currentHeading] || '';
    } else if (h3) {
      currentHeading = h3[1].toLowerCase();
      sections[currentHeading] = sections[currentHeading] || '';
    } else if (line.trim()) {
      sections[currentHeading] = (sections[currentHeading] || '') + line.trim() + ' ';
    }
  }
  return sections;
}

/** 从正文提取列表项 */
function extractListItems(body, heading) {
  const lines = body.split('\n');
  let inTarget = false;
  const items = [];
  for (const line of lines) {
    if (line.match(/^##\s+(.+)/)) {
      inTarget = line.match(new RegExp(heading, 'i')) !== null;
      continue;
    }
    if (inTarget) {
      const li = line.match(/^-\s+(.+)/);
      if (li) items.push(li[1].trim());
      if (line.match(/^##\s+/) || line.match(/^#\s+/)) break;
    }
  }
  return items;
}

/** 从描述中提取触发条件 */
function extractTrigger(description) {
  const triggerMatch = description.match(/TRIGGER\s*(?:when)?\s*:?\s*(.+?)(?:\.\s*SKIP|$)/i);
  if (triggerMatch) return triggerMatch[1].trim();
  const sentences = description.split(/[。.]/);
  return sentences.slice(0, 2).join('。').trim();
}

/** 从描述中提取核心功能 */
function extractFeatures(description) {
  return description.replace(/\bTRIGGER\b.*$/i, '').replace(/\bSKIP\b.*$/i, '').trim();
}

/**
 * 判断技能分类。
 * 按需扩展 designSet / contentSet / toolSet / customSet 数组。
 * 系统内置技能的分类在 BUILTIN_SKILLS 中指定。
 */
function categorize(name, fm) {
  const d = name.toLowerCase();
  if (d.startsWith('lark-')) {
    return LARK_SKILLS_MAP[name]?.category || '飞书协作';
  }
  if (d.startsWith('claude-api')) return 'API 开发';
  // ===== 扩展点：在此添加你的技能名到对应数组 =====
  const designSet = ['brand-guidelines', 'theme-factory', 'frontend-design', 'algorithmic-art', 'canvas-design'];
  const contentSet = ['pptx', 'pdf'];
  const toolSet = ['skill-creator', 'mcp-builder', 'karpathy-guidelines'];
  const customSet = [];
  if (designSet.includes(name)) return '创意设计';
  if (contentSet.includes(name)) return '内容创作';
  if (toolSet.includes(name)) return '开发工具';
  if (customSet.includes(name)) return '用户自定义';
  return '其他';
}

/**
 * 判断来源。
 * 按需扩展自定义技能名匹配和第三方技能名匹配。
 */
function getSource(name) {
  if (name.startsWith('lark-')) return '飞书';
  // ===== 扩展点：在此添加自定义/第三方技能名 =====
  // if (name === 'my-custom-skill') return '自定义';
  // if (name === 'some-third-party-skill') return '第三方';
  return 'Anthropic';
}

/** 为 Lark 技能生成通用执行步骤 */
function larkSteps(name) {
  const base = ['读取 lark-shared 认证配置'];
  if (name.includes('create') || name.includes('search')) base.push('构造查询参数');
  base.push('执行 lark-cli 命令', '格式化返回结果');
  return base;
}

// ============ 主流程 ============

function scanSkills(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir).filter(d => {
    const full = path.join(dir, d);
    if (!fs.statSync(full).isDirectory()) return false;
    return fs.existsSync(path.join(full, 'SKILL.md'));
  });
}

function parseSkill(dir, name) {
  const skillMdPath = path.join(dir, name, 'SKILL.md');
  const content = fs.readFileSync(skillMdPath, 'utf-8');
  const fm = parseFrontmatter(content);
  const body = getBody(content);
  const sections = extractSections(body);

  return { name, fm, body, sections };
}

function buildSkillData(raw) {
  const { name, fm, body, sections } = raw;
  const enrichment = ENRICHMENTS[name] || null;
  const larkInfo = LARK_SKILLS_MAP[name] || null;

  // description：优先 ENRICHMENTS 中文版 → 自动翻译英文 → 保留原文
  let description = enrichment?.description || fm.description || '';
  if (!containsChinese(description)) {
    const translated = translateDescription(description);
    if (containsChinese(translated)) {
      description = translated;
    }
  }
  const source = getSource(name);
  const category = categorize(name, fm);

  // 提取触发条件
  let trigger = extractTrigger(description);
  if (enrichment?.trigger) trigger = enrichment.trigger;
  else if (larkInfo) trigger = description.split('。')[0] + '。';

  // 提取应用场景
  let scenario = enrichment?.scenario || '';
  if (!scenario && larkInfo) scenario = larkInfo.scenario;
  if (!scenario) scenario = description.replace(/\bTRIGGER\b.*$/i, '').replace(/\bSKIP\b.*$/i, '').trim().split('。')[0] + '。';

  // 提取核心功能
  let features = enrichment?.features || extractFeatures(description);
  if (larkInfo && !enrichment) features = description;

  // 提取解决的问题
  let solves = enrichment?.solves || '';
  if (!solves) solves = '提升效率，减少手动操作和查找文档的时间。';

  // 提取执行步骤
  let steps = enrichment?.steps || [];
  if (steps.length === 0) {
    const stepSection = sections['执行步骤'] || sections['execution steps'] || sections['process'] || '';
    if (stepSection) {
      steps = stepSection.split(/[。.]/).filter(s => s.trim()).slice(0, 5).map(s => s.trim());
    } else if (larkInfo) {
      steps = larkSteps(name);
    } else {
      const listItems = extractListItems(body, 'step|步骤|流程|process');
      if (listItems.length > 0) steps = listItems.slice(0, 5);
    }
  }

  // 提取涉及工具
  let tools = enrichment?.tools || larkInfo?.tools ? [larkInfo?.tools || ''].filter(Boolean) : [];
  if (tools.length === 0) {
    const toolSection = sections['涉及工具'] || sections['tools'] || sections['scripts'] || '';
    if (toolSection) {
      tools = toolSection.match(/`[^`]+`/g)?.map(t => t.replace(/`/g, '')) || [];
    }
    if (fm.metadata?.requires?.bins) {
      try {
        const bins = JSON.parse(fm.metadata.requires.replace(/'/g, '"')).bins || [];
        tools = [...tools, ...bins];
      } catch (e) { /* ignore */ }
    }
    if (tools.length === 0) tools = ['无特定外部依赖'];
  }

  // 提取第7维度：评估验证
  let verification = enrichment?.verification || '';
  if (!verification) {
    const verifySection = sections['验证'] || sections['评测'] || sections['evaluation'] || sections['verification'] || sections['测试'] || '';
    if (verifySection) {
      verification = verifySection.trim();
    }
  }
  if (!verification) verification = '检查输出结果是否符合预期格式和内容要求。';

  // 清理数组
  steps = steps.filter(s => s && s.trim()).slice(0, 5).map(s => s.trim().replace(/^[-\s]+/, ''));
  tools = [...new Set(tools)].filter(Boolean).slice(0, 5);

  return {
    name,
    description,
    source,
    category,
    dimensions: {
      scenario: scenario || '使用该技能完成特定任务。',
      trigger: trigger || description.split('。')[0] + '。',
      features: features || description,
      solves: solves || '自动化处理，提高工作效率。',
      steps: steps.length > 0 ? steps : ['读取技能文档', '按文档执行操作', '输出结果'],
      tools: tools.length > 0 ? tools : ['无需特定外部工具'],
      verification: verification
    }
  };
}

// ============ 执行 ============

console.log('🔍 扫描技能目录...\n');

const globalSkillNames = scanSkills(GLOBAL_SKILLS_DIR);
const projectSkillNames = scanSkills(PROJECT_SKILLS_DIR);

console.log(`全局技能: ${globalSkillNames.length} 个`);
console.log(`项目技能: ${projectSkillNames.length} 个`);

const allSkills = [];

// 处理全局技能
for (const name of globalSkillNames) {
  try {
    const raw = parseSkill(GLOBAL_SKILLS_DIR, name);
    const data = buildSkillData(raw);
    allSkills.push(data);
    console.log(`  ✅ ${name}`);
  } catch (err) {
    console.log(`  ⚠️ ${name} — 解析失败: ${err.message}`);
    // 回退：仅使用 frontmatter 描述
    try {
      const skillMdPath = path.join(GLOBAL_SKILLS_DIR, name, 'SKILL.md');
      const content = fs.readFileSync(skillMdPath, 'utf-8');
      const fm = parseFrontmatter(content);
      if (fm.name) {
        allSkills.push({
          name: fm.name || name,
          description: fm.description || '',
          source: getSource(name),
          category: categorize(name, fm),
          dimensions: {
            scenario: fm.description || '',
            trigger: fm.description || '',
            features: fm.description || '',
            solves: '自动化处理，提高工作效率。',
            steps: ['读取技能文档', '按文档执行操作', '输出结果'],
            tools: ['无特定外部依赖'],
            verification: '检查输出结果是否符合预期格式和内容要求。'
          }
        });
      }
    } catch (e2) {
      console.log(`  ❌ ${name} — 完全无法解析，跳过`);
    }
  }
}

// 处理项目技能
for (const name of projectSkillNames) {
  try {
    const raw = parseSkill(PROJECT_SKILLS_DIR, name);
    const data = buildSkillData(raw);
    data.source = '项目级';
    allSkills.push(data);
    console.log(`  ✅ [项目] ${name}`);
  } catch (err) {
    console.log(`  ⚠️ [项目] ${name} — 解析失败: ${err.message}`);
  }
}

// 合并内置技能
for (const builtin of BUILTIN_SKILLS) {
  allSkills.push(builtin);
}

// 统计
const categories = [...new Set(allSkills.map(s => s.category))];
const sources = [...new Set(allSkills.map(s => s.source))];

console.log(`\n📊 总计: ${allSkills.length} 个技能`);
console.log(`📂 分类: ${categories.join(', ')}`);
console.log(`🏷️ 来源: ${sources.join(', ')}`);

// 生成 skills-data.js
const outputData = {
  generatedAt: new Date().toISOString(),
  totals: {
    all: allSkills.length,
    global: globalSkillNames.length,
    project: projectSkillNames.length,
    builtin: BUILTIN_SKILLS.length
  },
  categories: categories.sort(),
  sources: sources.sort(),
  skills: allSkills.sort((a, b) => {
    if (a.category !== b.category) return a.category.localeCompare(b.category);
    return a.name.localeCompare(b.name);
  })
};

const jsContent = `// 自动生成于 ${new Date().toLocaleString('zh-CN')}
// 运行 node generate-skills-data.js 重新生成
// 请勿手动编辑此文件
window.__SKILLS_DATA__ = ${JSON.stringify(outputData, null, 2)};
`;

fs.writeFileSync(OUTPUT_FILE, jsContent, 'utf-8');
console.log(`\n✨ 数据文件已生成: ${OUTPUT_FILE}`);
console.log(`   (${(jsContent.length / 1024).toFixed(1)} KB)`);