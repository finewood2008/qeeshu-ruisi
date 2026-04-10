<p align="center">
  <h1 align="center">企数睿思 (QEESHU RUISI)<br> 咨询行业超级大脑 AI 助手</h1>
</p>

<p align="center">
  <a href="https://finewood2008.github.io/qeeshu-ruisi/"><strong>🚀 点击在线体验 Demo (Live Demo)</strong></a>
</p>

---

## 📖 产品简介 (Introduction)

**企数睿思 (QEESHU RUISI)** 是专为**咨询行业**打造的软硬一体化“超级大脑”。
本项目展示了其基于 React 构建的高保真前端 GUI 交互原型。它不仅仅是一个大模型对话框，而是一个深度整合了企业私有知识库（PDF、PPT、录音等历史交付资产），并以咨询行业严谨方法论为导向的智能辅助系统。

它通过私有化部署的边缘计算终端 (Qee-Box)，结合后端的 QEECLAW RAG 引擎，将咨询公司积累的非结构化“死资料”，转化为即时响应、高度精准的辅助决策生产力。

**QEESHU RUISI** is a hardware-software integrated "Super Assistant" prototype strictly tailored for the management consulting industry. 
This repository showcases its high-fidelity frontend GUI built with React. It's not just a generic AI chatbot, but an intelligent system deeply integrated with an enterprise's private knowledge base (PDFs, PPTs, audio recordings), driven by rigorous consulting methodologies.

Powered by the Qee-Box edge computing terminal and the QEECLAW RAG engine backend, it transforms unstructured historical assets into instantly responsive, highly accurate productivity tools.

---

## ✨ 核心模块详解 (Core Features Detail)

### 1. 智能工作台 (Intelligent Dashboard)
咨询顾问的全局控制塔。
*   **边缘算力监控**：实时查看 Qee-Box 本地算力的运转状态与向量化进度。
*   **活跃项目预警**：基于顾问当前进行中的项目，AI 主动检测并推送警告（如：检测到报告缺失某些标准模型框架）。
*   **智能资产策展**：根据近期浏览记录，系统主动推荐内部高匹配度的知识资产。

### 2. 知识库诊断检索 (Smart Search & Diagnosis)
将海量文档转化为交互式洞察面板。
*   **多模态检索**：支持对 PPT、PDF 及脱敏录音文件进行全文语义检索并高亮命中词。
*   **AI 深度洞察 (Insight Panel)**：点击任意案例，右侧将自动提取该报告的“核心观点”和“关键图表引用”。
*   **文档级追问 (Chat with Document)**：内置打字机交互效果的 AI 追问引擎，支持对选中文档进行深度 QA 交互。

### 3. AI 撰写助手 (Advanced AI Writer)
引入了强大的、基于块 (Block-based) 的富文本编辑器。
*   **内联 AI 悬浮指令 (Slash Command)**：输入 `/` 唤出智能生成菜单，支持自动续写、生成专业配图。
*   **动态数据转图表**：支持顾问输入原生数据，AI 自动清洗并渲染为具有商业水准的前端交互式图表 (Recharts)。
*   **方法论完整性审查 (Copilot)**：右侧面板会实时扫描左侧正文，检测是否遗漏了标准的咨询框架模型，并提供 **“一键让 AI 补齐缺失段落”** 的自动化动作。

### 4. 融合客户管理 (Smart CRM)
以“经营健康度”为核心的商机管理系统。
*   **动态健康度打分**：基于业务数据动态更新客户分数，高亮显示存在流失或业绩下滑风险的客户。
*   **AI 处置建议**：为触发预警的客户自动生成专属的“降本增效白皮书”或后续商机接洽大纲。

### 5. 本地资产与算力管理 (Assets & Hardware)
管理 Qee-Box 边缘计算硬件的虚拟控制面板。
*   实时监控本地 CPU、NPU (AI专用算力)、内存及存储的使用率波动。
*   展示新上传的保密文件或录音在进行“多模态解析及向量化入库”时的动态进度队列。

### 6. 系统与方法论设置 (Methodology Settings)
管理系统的“大脑思考逻辑”。
*   **思考策略配置**：一键切换 智能混合模式 / 严格私有模式 (仅依赖内部 IP) / 通用公开模式。
*   **全球框架插件库**：内置并可开启 麦肯锡 7S、波士顿矩阵、PESTEL 等经典战略理论模型作为 AI 的辅助参考系。
*   **企业私有 IP 导入**：上传并优先调用咨询公司自身沉淀的核心方法论。

---

## 📚 产品需求文档 (PRD)

为了方便研发团队（尤其是后端对接人员）理解产品的底层业务逻辑与 API 打通要求，请查阅根目录下的产品需求文档：
👉 **[PRD-QEESHU-RUISI.md](./PRD-QEESHU-RUISI.md)**

该文档详细描述了前端与 QEECLAW 后端关于 RAG 检索生成、边缘遥测、数据脱敏等方面的接口设计规范。

---

## 🛠️ 技术栈 (Tech Stack)

*   **框架:** React 19 (Create React App)
*   **样式:** Tailwind CSS
*   **图标库:** Lucide React
*   **数据可视化:** Recharts
*   **SDK 接入:** `@qeeclaw/core-sdk` + `@qeeclaw/product-sdk`
*   **部署环境:** GitHub Pages / 本地 SDK 联调

---

## 🔌 QeeClaw SDK 真实产品验证模式

当前目录已经切到“真实产品接 SDK”的开发方式：

*   工作台、知识检索、资产页、CRM beta 视图、账号页已经接入 `QeeClaw SDK`
*   `企数睿思` 本身不需要独立后端，前端可直接连接 `QeeClaw Platform API`
*   面向客户的最小配置面收口为：`baseUrl + API Key`
*   `runtimeType` 固定为 `openclaw`
*   默认工作空间会根据 API Key 自动识别，无需手工传 `teamId / agentId`
*   当前使用的是 **monorepo 内本地 file dependency**
*   也就是说，这一版默认假设项目位于：

```bash
qs-nexus-aos/
  sdk/
  qeeshu-ruisi/
```

如果只把 `qeeshu-ruisi` 单独拎出来运行，需要把本地依赖改回正式 NPM 包版本。

但需要特别注意：

*   `企数睿思` 当前是 **SDK 验证样板 + 产品蓝本**
*   不是“所有页面都已经完成真实业务开发”的成品
*   已经接入本地真实业务闭环的页面主要是：
*   `Dashboard`
*   `Search` 的检索结果区
*   `Assets` 的本地知识资产登记与设备态区
*   `CRM` 的本地客户资料与商机管理
*   `AI Writer` 的本地草稿保存与回读
*   `System Settings` 的接入与环境诊断区
*   当前仍然偏样板的页面主要是：
*   `Search` 右侧追问面板
*   `AI Writer` 的 AI 生成执行链路
*   `Methodology` 的正式策略持久化能力

对外更安全的表述应该是：

> 这是一个用于验证 `QeeClaw SDK`、承载客户产品化开发的前端样板工程，而不是已经完整交付的最终业务产品。

更详细的验证说明请看：
👉 **[QEECLAW_SDK_REAL_PRODUCT_VALIDATION.md](./QEECLAW_SDK_REAL_PRODUCT_VALIDATION.md)**

页面粒度的能力映射请看：
👉 **[QEECLAW_SDK_PAGE_CAPABILITY_MATRIX.md](./QEECLAW_SDK_PAGE_CAPABILITY_MATRIX.md)**

桌面版 `ruisi` 的本地优先方案请看：
👉 **[docs/README.md](./docs/README.md)**

---

## 🚀 快速启动 (Quick Start)

如果您希望在当前 monorepo 中运行这套“真实产品 + SDK 联调”版本：

```bash
# 1. 进入目录
cd qeeshu-ruisi

# 2. 复制环境变量模板
cp .env.example .env.local

# 3. 如需本地 mock server，可先启动 QeeClaw Core SDK 自带 mock
npm run mock:platform

# 4. 安装依赖
npm install

# 5. 启动开发服务器
npm start
```

浏览器将自动打开 `http://localhost:3000`。

如果要以桌面端本地优先模式启动：

```bash
# 先启动前端开发服务器
npm run dev

# 再启动 Electron 桌面壳
npm run desktop:dev
```

如果已经完成 `npm run build`，也可以直接启动桌面产物：

```bash
npm run desktop:start
```

默认情况下：

*   `REACT_APP_QEECLAW_MODE=auto`
*   有真实 `baseUrl/API Key` 时走 SDK
*   没有配置时自动回退到本地样板数据
*   工作空间由 API Key 自动识别
*   `runtimeType` 固定为 `openclaw`

如果是客户本地使用，不一定要改 `.env.local`。启动应用后，也可以直接进入“个人账号与偏好”页面，在“本地接入配置”中填写：

```bash
baseUrl
apiKey
```

保存后页面会自动刷新，并切换到真实平台。

当前版本在首次打开且未配置连接时，还会默认进入“首次接入引导页”，客户可以直接在首屏填写 `baseUrl + API Key`，也可以先跳过查看样板数据。

如果要做严格的 SDK 联调，请把 `.env.local` 里的模式改成：

```bash
REACT_APP_QEECLAW_MODE=sdk
```

如果要切换到真实线上环境，只需要修改：

```bash
REACT_APP_QEECLAW_BASE_URL=https://your-real-host
REACT_APP_QEECLAW_API_KEY=sk-your-real-api-key
```

说明：

*   `.env.local` 更适合研发联调
*   页面内“本地接入配置”更适合客户本地安装包或桌面端使用

---

## ✅ 发版后最小验证

如果后端刚发布，或者你怀疑某些接口还没有切到支持 `API Key` 的新版本，建议直接跑一遍下面这个脚本：

```bash
API_KEY=sk-xxxx bash scripts/verify-ruisi-api-key-routes.sh https://paas.qeeshu.com
```

这个脚本会自动完成：

*   用 `API Key` 请求 `/api/users/me/context`
*   自动解析默认工作空间 `team_id`
*   验证 `ruisi` 当前会用到的关键接口：
*   `/api/platform/models`
*   `/api/platform/models/runtimes`
*   `/api/billing/wallet`
*   `/api/platform/devices`
*   `/api/platform/conversations`
*   `/api/platform/knowledge/search`
*   `/api/platform/knowledge/config`
*   `/api/workflows`
*   `/api/platform/audit/summary`
*   `/api/platform/audit/events`

如果这里都返回 `200`，而页面仍然异常，问题大概率就在前端构建产物或浏览器缓存；如果这里仍有 `401/404/405`，优先检查线上后台是否已经切到最新后端版本。

---
*Powered by QEECLAW Engine.*
