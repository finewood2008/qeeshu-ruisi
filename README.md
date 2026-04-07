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

*   **框架:** React 18 (Create React App)
*   **样式:** Tailwind CSS
*   **图标库:** Lucide React
*   **数据可视化:** Recharts
*   **部署环境:** GitHub Pages

---

## 🚀 快速启动 (Quick Start)

如果您希望在本地运行或二次开发此项目 / If you wish to run or develop this project locally:

```bash
# 1. 克隆仓库 Clone the repository
git clone https://github.com/finewood2008/qeeshu-ruisi.git

# 2. 进入目录 Navigate to the directory
cd stm-ai-brainbox-gui

# 3. 安装依赖 Install dependencies
npm install

# 4. 启动开发服务器 Start the development server
npm start
```
浏览器将自动打开 `http://localhost:3000`。
The browser will automatically open `http://localhost:3000`.

---
*Powered by QEECLAW Engine.*