# Ruisi Mock 数据清理清单

最后更新：2026-04-09

## 1. 结论

当前 `qeeshu-ruisi` 已经不再是“纯前端原型”，但仍残留多处 mock / fallback / seed 数据。

这些残留大致分 4 类：

1. 页面级 fallback 数据
2. 本地数据库初始化 seed 数据
3. SDK 已接通但正文/业务流程仍是前端模拟
4. 仅用于纯浏览器开发模式的本地测试数据

## 2. 已优先处理

### 2.1 通知中心 seed

- 文件：`src/App.js`
- 现状：原先启动时固定写入一条 `seed-runtime`
- 处理：已改为本地持久化通知流，不再预塞默认通知

### 2.2 AI 撰写助手初始正文 seed

- 文件：`src/views/AIWriter.js`
- 现状：原先打开页面就带一份硬编码“降本增效初稿”
- 处理：已改为空白草稿，不再自动注入业务正文和 seed log

### 2.3 桌面数据库 writer seed

- 文件：`electron/services/database.js`
- 现状：初始化时预塞 `draft-a` 草稿和一条 AI 日志
- 处理：已取消新的数据库初始化 seed

### 2.4 桌面数据库业务 seed

- 文件：`electron/services/database.js`
- 现状：原先首次启动会自动写入 CRM、会话、知识资产、设备状态等演示数据
- 处理：已移除 `seedIfEmpty()` 的业务演示数据注入逻辑，并增加历史演示数据清理；新库只保留最小系统配置
- 当前效果：客户首次启动看到的是空态和真实接入引导，而不是预置业务数据

## 3. 当前已完成的页面清理

### 3.1 Dashboard

- 文件：`src/views/Dashboard.js`
- 文件：`electron/services/database.js`
- 处理：
  - 已移除首页完整 fallback 业务数据
  - 未接真实数据时改为显示空态、接入引导和本地资产入口
  - 已移除前端推导的整体健康分、推荐匹配分、客户预警分和项目进度条
  - 已把首页“边缘设备综合算力”改为更真实的“设备在线状态”，不再把 CPU/NPU 利用率样式包装成首页核心指标
- 当前效果：不会再把首页指标、推荐、客户预警伪装成真实数据

### 3.2 Search

- 文件：`src/views/Search.js`
- 处理：
  - 已移除默认示例查询和 fallback 检索结果
  - 未输入关键词或未接入知识库时显示空态
  - 未接入 document chat / SSE 时，不再生成前端模拟回复
  - 已移除结果卡片上的前端匹配度展示、自动推荐追问和图表引用占位动作
  - 已把检索结果返回结构里残留的 `match / chart / suggestedQuestions` 伪字段一并收口，避免被误接成真实能力
- 当前效果：检索页只展示真实命中结果或明确空态，不再出现示例资产和伪对话

### 3.3 AIWriter

- 文件：`src/views/AIWriter.js`
- 文件：`electron/services/database.js`
- 处理：
  - 已移除默认额度、Provider、用量等伪快照
  - 已停止前端自动拼装 AI 正文、图表、路线图、风险块
  - 自动写作能力未接入时，统一记录请求并提示“待接入”，不再插入模拟内容
  - 已把方法论审查从前端推导得分改成真实完成项计数
  - 本地模式下已改为展示真实本地草稿数、执行日志数和能力开关，不再显示伪造的 30 天调用量、无限额度和假 Provider 数
- 当前效果：写作页只保留真实路由快照、本地草稿、导入资料和导出能力

### 3.4 Settings

- 文件：`src/views/Settings.js`
- 处理：
  - 已移除方法论页默认控制面快照
  - 已移除机构自有框架默认列表
  - 内置框架只保留真实产品配置说明，不再展示伪知识卡细节
  - 未上传机构自有框架时显示空态
- 当前效果：方法论页不再暗示“已经内置一整套客户专属方法论资产库”

### 3.5 Assets

- 文件：`src/views/Assets.js`
- 处理：
  - 已移除默认资产列表、默认路径和伪遥测状态
  - 未接入真实资产时显示空态，不再展示示例文件
  - 已移除 CPU/NPU/内存利用率进度条与文件处理百分比，避免把前端估算伪装成真实运行指标
  - 资产上传、查看、索引等行为仍按真实本地/SDK链路执行
- 当前效果：资产页只展示真实资产数据或空态

## 4. 本轮继续完成的清理

### 4.1 通知中心

- 文件：
  - `src/App.js`
  - `src/browser-storage/notifications.js`
  - `electron/services/database.js`
  - `electron/services/desktop-services.js`
  - `electron/preload.js`
- 处理：
  - 桌面模式下已接入本地 SQLite `notification_events`
  - 浏览器模式下仍使用本地存储，但已整理为正式事件结构
  - 已补未读/已读、清空和统一读取逻辑
- 当前效果：通知中心不再是临时 seed 流，而是本地事件中心

### 4.2 browser-storage/crm.js

- 文件：`src/browser-storage/crm.js`
- 处理：
  - 已改成仅在非生产浏览器开发模式下启用
  - 正式浏览器交付态不会自动落入浏览器本地 CRM fallback
- 当前效果：浏览器本地 CRM 数据明确变成 `DEV_ONLY` 能力

### 4.3 ConnectWorkspace

- 文件：`src/views/ConnectWorkspace.js`
- 处理：
  - 已隐藏交付态“先看演示数据”入口
  - 仅在浏览器开发模式下显示“进入浏览器开发模式”
- 当前效果：客户交付态不会再看到演示入口，内部开发仍可保留调试通道

## 5. 下一步顺序

1. 继续补 Search document chat / SSE 真链路
2. 继续补 AIWriter block generate / methodology check 真链路
3. 继续清理纯浏览器开发模式下的默认 seed 初始化策略
4. 持续收口文档口径，避免代码已移除演示数据而文档仍写成“原型工程”

## 6. 清理原则

- 不再默认展示完整业务演示数据
- 如果页面未接真实链路，应显示空态、接入引导或开发态说明
- 浏览器 fallback 仅用于开发，不应混入交付口径
- 桌面端本地数据库应优先作为“真实本地数据底座”
