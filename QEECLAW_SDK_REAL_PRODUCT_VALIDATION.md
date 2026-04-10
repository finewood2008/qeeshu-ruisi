# 企数睿思 x QeeClaw SDK 真实产品验证清单

## 目标

这个目录不再只是高保真前端原型，而是作为 `QeeClaw SDK` 的真实产品接入样板，承担两件事：

1. 用真实产品页面验证 `core-sdk` 与 `product-sdk` 的接入路径是否顺手。
2. 在开发过程中持续暴露 SDK 缺口，反向驱动平台接口、装配层和开发流程优化。

当前默认商业假设也已经收口为：

- `企数睿思` 不需要独立后端
- 前端或本地桌面端直接接 `QeeClaw Platform API`
- 面向客户的最小配置只保留 `baseUrl + API Key`
- `runtimeType` 固定为 `openclaw`
- 默认工作空间根据 API Key 自动识别，不再要求客户显式配置 `teamId / agentId`

## 当前接入范围

- `Dashboard`
  - 使用 `product.salesCockpit` + `product.deviceCenter` + `core.file`
- `知识库诊断检索`
  - 使用 `product.knowledgeCenter.search`
- `本地资产与算力管理`
  - 使用 `product.deviceCenter.loadOverview` + `product.knowledgeCenter.loadHome`
- `Smart CRM`
  - 当前是 `conversations + approvals` 组合出来的 beta 视图，用于验证 SDK 能否支持“前端先接、领域后补”
- `个人账号与偏好`
  - 使用 `core.iam` + `core.models` + `core.devices` + `core.billing`

## 当前产品边界

这一点需要特别说明清楚：

- `企数睿思` 当前已经不是纯静态原型
- 但它也还不是“所有页面都完成真实业务开发”的成品

更准确的判断是：

- 它是一个 **真实 SDK 接入样板**
- 同时也是一个 **高保真产品蓝本**
- 其中部分页面已经能真实取数
- 部分页面还是“真实控制面 + 业务样板”的混合形态

因此：

- 可以用它做 SDK 联调
- 可以用它做售前演示与方向验证
- 不建议把它直接当成“已完工销售驾驶舱”对外承诺

页面粒度的真实度边界，请同步查看：

- `QEECLAW_SDK_PAGE_CAPABILITY_MATRIX.md`

## 本地联调方式

### 1. 使用 SDK 自带 mock server

在 `qeeshu-ruisi` 目录中：

```bash
npm run mock:platform
```

然后新开一个终端：

```bash
cp .env.example .env.local
npm install
npm start
```

默认会连接：

- `baseUrl=http://127.0.0.1:3456`
- `apiKey=sk-mock-token`
- `runtimeType=openclaw`
- 默认工作空间自动识别

如果不想改 `.env.local`，启动后也可以直接在应用内进入：

- `个人账号与偏好`
- `本地接入配置`

填写 `baseUrl + API Key` 后保存，页面会自动刷新并生效。

另外，当前版本在“未配置连接”的首次打开场景下，会默认进入首屏接入引导页，客户可以直接在引导页填写 `baseUrl + API Key`，不需要先自行摸索菜单。

### 2. 切真实环境验证

把 `.env.local` 改成真实值：

```bash
REACT_APP_QEECLAW_MODE=sdk
REACT_APP_QEECLAW_BASE_URL=https://your-real-host
REACT_APP_QEECLAW_API_KEY=sk-your-real-api-key
REACT_APP_QEECLAW_SCOPE=mine
```

说明：

- `auto` 模式：有配置就走 SDK，没有配置就走本地 mock
- `sdk` 模式：强制走 SDK，失败直接暴露，适合做联调验收
- `mock` 模式：强制看样板数据，适合做纯视觉调整
- `runtimeType` 固定为 `openclaw`
- `teamId` 仍然存在于平台内部作用域，但由 API Key 自动解析，前端不再要求客户手工传入
- `agentId` 当前不作为 `企数睿思` 的客户侧配置项
- 开发联调优先使用 `.env.local`
- 客户本地安装包/桌面端优先使用页面内“本地接入配置”

## 这轮验证已经暴露出的 SDK 缺口

### 已经能跑通的部分

- 标准认证 + `baseUrl/API Key` 初始化
- 前端直接接 `core-sdk`
- 前端通过 `product-sdk` 装工作台、知识中心、设备中心
- 真实产品中“页面只依赖 view model，不直接拼 HTTP 接口”的开发方式

### 明确还需要补的部分

- `AI Writer`
  - 需要 `document chat / block generate / methodology check / structured generation` 这类更高阶 API
- `Assets`
  - 需要真实的 `edge telemetry / queue progress / upload ingest progress`
- `CRM`
  - 需要独立的 `customer / opportunity / health-score` 领域 SDK，而不是继续让前端从 conversation 里硬推
- `Methodology`
  - 需要“方法论框架库”与“私有 IP 管理”的专属模块
- 前端工程体验
  - 后续建议补 `React hooks` / `query helpers` / `stream helpers`，让 SDK 更适合直接在前端产品里落

## 建议的下一步打磨节奏

1. 先让 `Search` 和 `Dashboard` 在真实线上环境稳定跑通。
2. 再补 `AI Writer` 所需的流式接口与结构化生成接口。
3. 然后把 `CRM` 从 beta 派生视图升级为正式领域 SDK。
4. 最后沉淀成一套外部团队也能复用的接入模板。

## 配套材料

- `QEECLAW_SDK_PAGE_CAPABILITY_MATRIX.md`
  - 按页面拆开的能力矩阵与缺口优先级
