# 企数睿思页面能力矩阵

## 一句话结论

`qeeshu-ruisi` 当前不是“已经做完的真实产品”，而是一个 **QeeClaw SDK 验证样板**：

- 有些页面已经能真实访问平台接口
- 有些页面是“真实 SDK + 前端装配/推导”
- 还有一些页面只是用真实控制面去包裹高保真样板交互

如果要对客户或内部团队做口径统一，最安全的说法是：

> `企数睿思` 当前可作为 SDK 联调样板、方案演示样板、产品化蓝本，但还不是可直接交付上线的完整销售驾驶舱产品。

## 页面 x 数据成熟度矩阵

| 页面 | 真实接入部分 | 当前仍是样板/前端推导 | 当前成熟度 | 建议对外口径 |
| --- | --- | --- | --- | --- |
| Dashboard | `product.salesCockpit.loadHome` `product.salesCockpit.loadOpportunityBoard` `product.deviceCenter.loadOverview` `core.file.listDocuments` | 趋势小图、卡片视觉、部分健康度算法与推荐文案是前端装配 | `A- 可做 SDK 联调` | 可以展示“首页已能真实取数”，但不要宣传成业务规则已全部定型 |
| Search | `product.knowledgeCenter.search`，无结果时会回退 `core.file.listDocuments` | 右侧“方法论洞察”、底部追问 chat、筛选条件、图表建议仍是前端样板 | `B+ 半真实` | 可以验证检索，但不能说“文档追问/流式问答已完成” |
| Assets | `product.deviceCenter.loadOverview` `product.knowledgeCenter.loadHome` | CPU/NPU/温度仪表盘是估算值，上传、索引队列、进度联动仍是样板 | `B 半真实` | 可以展示“知识资产与设备在线态已接平台”，不能说“遥测/上传链路已打通” |
| CRM | `product.salesCockpit.loadHome` `product.salesCockpit.loadOpportunityBoard` `product.conversationCenter.loadHome` | 客户档案是前端从会话与商机数据派生，非正式 CRM 领域模型 | `B- Beta` | 只能说“验证了 CRM 装配思路”，不能作为正式 CRM 交付 |
| System Settings | `core.models.getRouteProfile` `core.models.getQuota` `core.models.listRuntimes`，加上本地 `baseUrl + API Key` 配置 | 个人资料、通知、安全偏好仍大多是页面静态项 | `A- 可做接入配置页` | 可直接用于客户接入和环境诊断，但不等于账号中心已完整产品化 |
| AI Writer | `core.models.getRouteProfile` `core.models.listProviderSummary` `core.models.getUsage` `core.models.getCost` `core.models.getQuota` | 编辑器正文、slash command、方法论审查、图表/配图、生成动作都还是样板 | `C 控制面真实，业务未完成` | 只能当“未来产品方向演示”，不能作为已交付 AI 写作能力 |
| Methodology Settings | `core.models.getRouteProfile` `core.models.listProviderSummary` `product.knowledgeCenter.loadHome` | 策略切换、框架开关、私有方法论导入、详情弹窗基本都是样板 | `C 控制面真实，业务未完成` | 只能展示“方法论产品方向”，不能作为已完工配置中心 |

## 关键判断依据

### 可以认为“已接真实 SDK”的页面

- `Dashboard`
  - 真实加载入口在 `loadDashboardSnapshot()`
- `Assets`
  - 真实加载入口在 `loadAssetsSnapshot()`
- `System Settings`
  - 真实加载入口在 `loadSystemSnapshot()`

这些页面的主要价值是验证：

- `baseUrl + API Key` 是否可用
- `teamId` 是否能自动解析
- `runtimeType=openclaw` 的平台访问是否正常
- `core-sdk` / `product-sdk` 在真实前端中是否顺手

### 明确属于“半真实 / 混合态”的页面

- `Search`
  - 左侧检索结果来自 SDK，但追问区仍是前端 `setTimeout()` 模拟
- `CRM`
  - 页面数据是真实平台数据二次装配，不是正式 CRM 领域接口
- `Assets`
  - 设备在线态和知识资产是真实数据，但硬件指标不是实时遥测

### 目前仍然主要是“高保真样板”的页面

- `AI Writer`
  - 写作核心区块、命令菜单、方法论审查都是前端演示逻辑
- `Methodology Settings`
  - 开关、框架库、私有 IP 管理几乎都未落平台接口

## 当前已经比较清楚的 SDK 结论

- `core-sdk` 已经足够支撑“平台能力访问层”这类真实前端接入。
- `product-sdk` 已经能承担首页装配、知识中心、设备中心这类中层聚合。
- `product-sdk` 还不够覆盖写作、方法论、CRM 这类更高业务语义页面。

## 最优先补的能力

1. `AI Writer`
   - `document chat`
   - `SSE stream`
   - `block generate`
   - `methodology check`
   - `structured attachments`
2. `Assets`
   - `edge telemetry`
   - `queue progress`
   - `knowledge ingest lifecycle`
3. `CRM`
   - `customer`
   - `opportunity`
   - `health score`
   - `follow-up suggestion`
4. `Methodology`
   - `framework registry`
   - `private methodology ingestion`
   - `strategy preference persistence`
   - `writer linkage`

## 建议推进方式

1. 先把 `Dashboard / Search / Assets / System Settings` 作为第一批“真实 SDK 验证页”跑稳定。
2. 再按 `AI Writer -> CRM -> Methodology` 的顺序，把样板页逐步替换成真实能力页。
3. 每补一组能力，就回到这个产品里直接验证，不做只停留在 demo 的 SDK 开发。
