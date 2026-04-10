# Ruisi SQLite 表结构与 Electron IPC 接口清单

## 1. 文档目标

这份文档用于把 `ruisi` 作为本地优先桌面应用时，最核心的两块技术基座落下来：

- 本地数据库结构
- Renderer 与 Electron Main 之间的 IPC 接口

目标不是一次性把所有未来能力全部定死，而是给出一版可以直接进入开发的初稿。

## 2. 总体设计原则

### 2.1 存储原则

- 业务数据优先写本地 SQLite
- API Key 不进 SQLite，进 OS Keychain
- 需要追溯的业务动作写本地审计表
- 所有页面状态尽量有持久化落点

### 2.2 IPC 原则

- Renderer 不直接访问 Node API
- 所有系统能力走 `preload -> ipcRenderer -> ipcMain`
- 只暴露白名单接口
- IPC 返回统一结构

建议统一返回：

```ts
type IpcResult<T> = {
  ok: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
};
```

## 3. 本地数据库分层

建议数据库分为 6 组：

- 应用配置
- 本地账户与工作空间
- CRM
- 会话与消息
- 知识与索引元数据
- 设备与审计

## 4. SQLite 表结构初稿

## 4.1 应用配置层

### `app_settings`

用途：

- 全局应用设置
- UI 偏好
- 默认工作模式

字段建议：

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `id` | `text` | 固定单例主键，如 `default` |
| `theme` | `text` | `light` / `dark` / `system` |
| `language` | `text` | `zh-CN` 等 |
| `default_runtime` | `text` | 默认固定为 `openclaw` |
| `default_scope` | `text` | `mine` / `all` |
| `auto_launch_qeeclaw` | `integer` | 是否自动探测/拉起 |
| `created_at` | `text` | ISO 时间 |
| `updated_at` | `text` | ISO 时间 |

### `workspace_profiles`

用途：

- 本地保存工作空间接入信息
- 支持多个客户环境配置

字段建议：

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `id` | `text` | 主键 |
| `workspace_name` | `text` | 展示名称 |
| `base_url` | `text` | 平台地址 |
| `runtime_type` | `text` | 固定 `openclaw` |
| `is_active` | `integer` | 是否当前启用 |
| `masked_api_key` | `text` | 仅保存脱敏展示值 |
| `last_verified_at` | `text` | 最近校验时间 |
| `created_at` | `text` | 创建时间 |
| `updated_at` | `text` | 更新时间 |

备注：

- 真正的 `API Key` 存 Keychain
- SQLite 只存脱敏值与引用信息

## 4.2 CRM 层

### `crm_customers`

用途：

- 客户主档

字段建议：

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `id` | `text` | 主键 |
| `external_id` | `text` | 外部映射 ID，可空 |
| `name` | `text` | 客户名称 |
| `industry` | `text` | 行业 |
| `owner` | `text` | 负责人 |
| `status` | `text` | 客户状态 |
| `health_score` | `real` | 健康度 |
| `phone` | `text` | 联系电话 |
| `email` | `text` | 邮箱 |
| `address` | `text` | 地址 |
| `tags_json` | `text` | 标签数组 JSON |
| `description` | `text` | 描述 |
| `created_at` | `text` | 创建时间 |
| `updated_at` | `text` | 更新时间 |

### `crm_contacts`

用途：

- 客户联系人

字段建议：

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `id` | `text` | 主键 |
| `customer_id` | `text` | 所属客户 |
| `name` | `text` | 姓名 |
| `role` | `text` | 职务 |
| `phone` | `text` | 电话 |
| `email` | `text` | 邮箱 |
| `is_primary` | `integer` | 是否主联系人 |
| `created_at` | `text` | 创建时间 |
| `updated_at` | `text` | 更新时间 |

### `crm_opportunities`

用途：

- 商机主表

字段建议：

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `id` | `text` | 主键 |
| `customer_id` | `text` | 所属客户 |
| `title` | `text` | 商机名称 |
| `stage` | `text` | 阶段 |
| `amount` | `real` | 金额 |
| `probability` | `real` | 成交概率 |
| `owner` | `text` | 负责人 |
| `next_action` | `text` | 下一步动作 |
| `expected_close_at` | `text` | 预计成交时间 |
| `status` | `text` | 状态 |
| `created_at` | `text` | 创建时间 |
| `updated_at` | `text` | 更新时间 |

### `crm_activities`

用途：

- 客户跟进记录
- 拜访、电话、会议、备注

字段建议：

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `id` | `text` | 主键 |
| `customer_id` | `text` | 客户 ID |
| `opportunity_id` | `text` | 商机 ID，可空 |
| `activity_type` | `text` | `call` / `meeting` / `note` / `task` |
| `title` | `text` | 标题 |
| `content` | `text` | 内容 |
| `occurred_at` | `text` | 发生时间 |
| `created_by` | `text` | 操作人 |
| `created_at` | `text` | 创建时间 |

## 4.3 会话与消息层

### `conversation_threads`

用途：

- 会话主表

字段建议：

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `id` | `text` | 主键 |
| `channel_type` | `text` | `wechat_personal` 等 |
| `channel_account_id` | `text` | 渠道账号 ID |
| `peer_name` | `text` | 对端名称 |
| `thread_title` | `text` | 会话标题 |
| `last_message_at` | `text` | 最近消息时间 |
| `summary` | `text` | 摘要 |
| `unread_count` | `integer` | 未读数 |
| `created_at` | `text` | 创建时间 |
| `updated_at` | `text` | 更新时间 |

### `conversation_messages`

用途：

- 消息明细

字段建议：

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `id` | `text` | 主键 |
| `thread_id` | `text` | 所属会话 |
| `role` | `text` | `user` / `assistant` / `system` |
| `sender_name` | `text` | 发送者名称 |
| `content` | `text` | 文本内容 |
| `content_type` | `text` | `text` / `image` / `audio` / `file` |
| `attachments_json` | `text` | 附件 JSON |
| `sent_at` | `text` | 发送时间 |
| `created_at` | `text` | 入库时间 |

### `conversation_tags`

用途：

- 会话打标签

字段建议：

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `id` | `text` | 主键 |
| `thread_id` | `text` | 会话 ID |
| `tag` | `text` | 标签 |
| `created_at` | `text` | 创建时间 |

## 4.4 知识层

### `knowledge_documents`

用途：

- 知识文件主表

字段建议：

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `id` | `text` | 主键 |
| `source_path` | `text` | 本地路径 |
| `title` | `text` | 标题 |
| `mime_type` | `text` | 文件类型 |
| `file_size` | `integer` | 文件大小 |
| `hash` | `text` | 文件哈希 |
| `index_status` | `text` | `pending` / `processing` / `indexed` / `failed` |
| `summary` | `text` | 简要摘要 |
| `indexed_at` | `text` | 索引完成时间 |
| `created_at` | `text` | 创建时间 |
| `updated_at` | `text` | 更新时间 |

### `knowledge_chunks`

用途：

- 文档切片

字段建议：

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `id` | `text` | 主键 |
| `document_id` | `text` | 文档 ID |
| `chunk_no` | `integer` | 切片序号 |
| `content` | `text` | 切片内容 |
| `embedding_ref` | `text` | 向量引用，可空 |
| `metadata_json` | `text` | 元数据 |
| `created_at` | `text` | 创建时间 |

### `knowledge_search_history`

用途：

- 本地检索历史

字段建议：

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `id` | `text` | 主键 |
| `query` | `text` | 检索词 |
| `result_count` | `integer` | 命中数 |
| `created_at` | `text` | 时间 |

## 4.5 设备与运行时层

### `device_states`

用途：

- 设备在线态和资源指标历史

字段建议：

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `id` | `text` | 主键 |
| `device_id` | `text` | 设备 ID |
| `device_name` | `text` | 设备名称 |
| `runtime_status` | `text` | 运行时状态 |
| `online` | `integer` | 是否在线 |
| `cpu` | `real` | CPU |
| `memory` | `real` | 内存 |
| `npu` | `real` | NPU |
| `temperature` | `real` | 温度 |
| `reported_at` | `text` | 采集时间 |

### `runtime_health_checks`

用途：

- 本地 QeeClaw / Gateway 健康检查记录

字段建议：

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `id` | `text` | 主键 |
| `check_type` | `text` | `gateway` / `wechat` / `knowledge` / `device` |
| `status` | `text` | `ok` / `warn` / `error` |
| `message` | `text` | 诊断信息 |
| `details_json` | `text` | 详情 |
| `created_at` | `text` | 时间 |

## 4.6 审计与草稿层

### `audit_logs`

用途：

- 本地业务审计日志

字段建议：

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `id` | `text` | 主键 |
| `module` | `text` | 模块 |
| `action` | `text` | 动作 |
| `operator` | `text` | 操作者 |
| `target_type` | `text` | 目标类型 |
| `target_id` | `text` | 目标 ID |
| `payload_json` | `text` | 详情 |
| `created_at` | `text` | 时间 |

### `drafts`

用途：

- AI Writer 草稿
- 搜索面板临时结论
- CRM 跟进草稿

字段建议：

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `id` | `text` | 主键 |
| `type` | `text` | `writer` / `crm-note` / `search-note` |
| `title` | `text` | 标题 |
| `content_json` | `text` | 区块 JSON |
| `related_customer_id` | `text` | 关联客户，可空 |
| `related_thread_id` | `text` | 关联会话，可空 |
| `saved_at` | `text` | 保存时间 |
| `updated_at` | `text` | 更新时间 |

### `sync_outbox`

用途：

- 本地待同步任务
- 如果未来部分数据需要回传平台，可通过这个表管理重试

字段建议：

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `id` | `text` | 主键 |
| `kind` | `text` | 同步类型 |
| `payload_json` | `text` | 载荷 |
| `status` | `text` | `pending` / `processing` / `done` / `failed` |
| `retry_count` | `integer` | 重试次数 |
| `last_error` | `text` | 最近错误 |
| `created_at` | `text` | 创建时间 |
| `updated_at` | `text` | 更新时间 |

## 5. 密钥存储建议

### 5.1 不要这样做

不要把以下信息直接存在 SQLite：

- 完整 API Key
- Access Token
- 渠道敏感凭证

### 5.2 建议这样做

- API Key 存 `OS Keychain`
- SQLite 只保存：
  - `workspace_profile_id`
  - `masked_api_key`
  - `last_verified_at`
  - `auth_mode`

## 6. Electron IPC 分层设计

建议按业务域暴露 IPC，而不是杂乱无章地堆一组方法。

推荐按下面几类组织：

- `app`
- `auth`
- `workspace`
- `crm`
- `conversation`
- `knowledge`
- `device`
- `audit`
- `draft`
- `qeeclaw`

## 7. IPC 接口清单初稿

## 7.1 app 域

### `app.getVersion`

用途：

- 获取桌面应用版本

请求：

```ts
void
```

返回：

```ts
{ version: string; buildTime?: string }
```

### `app.getSettings`

用途：

- 获取应用设置

### `app.saveSettings`

用途：

- 保存应用设置

请求示例：

```ts
{
  theme: "system",
  language: "zh-CN",
  defaultRuntime: "openclaw"
}
```

## 7.2 auth 域

### `auth.saveApiKey`

用途：

- 将 API Key 存入 Keychain

请求示例：

```ts
{
  profileId: "workspace-1",
  apiKey: "sk-xxxx"
}
```

### `auth.removeApiKey`

用途：

- 删除 API Key

### `auth.verifyApiKey`

用途：

- 校验 API Key 是否可用
- 拉取授权与钱包摘要

返回示例：

```ts
{
  valid: true,
  workspaceName: "客户 A",
  walletBalance: 100.5,
  currency: "CNY"
}
```

## 7.3 workspace 域

### `workspace.listProfiles`

用途：

- 获取本地工作空间配置

### `workspace.saveProfile`

用途：

- 保存工作空间配置

### `workspace.setActiveProfile`

用途：

- 切换当前工作空间

### `workspace.getActiveProfile`

用途：

- 获取当前启用配置

## 7.4 crm 域

### `crm.listCustomers`

### `crm.getCustomer`

### `crm.saveCustomer`

### `crm.deleteCustomer`

### `crm.listOpportunities`

### `crm.saveOpportunity`

### `crm.listActivities`

### `crm.saveActivity`

请求示例：

```ts
{
  customerId: "cust-001",
  title: "二期销售驾驶仓项目",
  stage: "proposal",
  amount: 180000,
  probability: 0.45
}
```

## 7.5 conversation 域

### `conversation.listThreads`

### `conversation.getThread`

### `conversation.listMessages`

### `conversation.saveMessage`

### `conversation.tagThread`

### `conversation.searchMessages`

## 7.6 knowledge 域

### `knowledge.listDocuments`

### `knowledge.getDocument`

### `knowledge.importDocuments`

用途：

- 导入本地文件
- 写入文档表
- 交给本地 QeeClaw 或知识工作流处理

### `knowledge.search`

用途：

- 在本地知识索引中检索

### `knowledge.deleteDocument`

### `knowledge.getIndexStatus`

### `knowledge.rebuildIndex`

## 7.7 device 域

### `device.getOverview`

### `device.listStates`

### `device.getLatestState`

### `device.subscribeState`

用途：

- 实时推送设备状态到 Renderer

## 7.8 audit 域

### `audit.listLogs`

### `audit.record`

请求示例：

```ts
{
  module: "crm",
  action: "save_customer",
  targetType: "customer",
  targetId: "cust-001",
  payload: {
    changedFields: ["health_score", "status"]
  }
}
```

## 7.9 draft 域

### `draft.list`

### `draft.get`

### `draft.save`

### `draft.remove`

请求示例：

```ts
{
  type: "writer",
  title: "A集团降本诊断初稿",
  contentJson: {
    blocks: []
  }
}
```

## 7.10 qeeclaw 域

### `qeeclaw.getHealth`

用途：

- 检查本地 QeeClaw 是否在线
- 返回微信、知识、设备桥接等健康状态

返回示例：

```ts
{
  online: true,
  runtimeType: "openclaw",
  gatewayStatus: "ok",
  wechatStatus: "warn",
  knowledgeWorkerStatus: "ok",
  deviceBridgeStatus: "ok"
}
```

### `qeeclaw.openDiagnostics`

用途：

- 打开本地诊断页或日志目录

### `qeeclaw.startHealthProbe`

用途：

- 主动触发一次探测

### `qeeclaw.getLogs`

用途：

- 拉取最近本地运行时日志摘要

## 8. Preload API 建议

建议 Renderer 最终只看到一组明确的 API：

```ts
window.ruisi = {
  app: { ... },
  auth: { ... },
  workspace: { ... },
  crm: { ... },
  conversation: { ... },
  knowledge: { ... },
  device: { ... },
  audit: { ... },
  draft: { ... },
  qeeclaw: { ... }
}
```

不建议：

- 把 `ipcRenderer` 直接暴露给前端
- 暴露开放式 `invoke(channel, payload)` 给业务代码随便用

## 9. 第一阶段最小开发范围

建议第一阶段只实现下面这些表和 IPC：

### 表

- `app_settings`
- `workspace_profiles`
- `crm_customers`
- `crm_opportunities`
- `conversation_threads`
- `conversation_messages`
- `drafts`
- `runtime_health_checks`

### IPC

- `app.getSettings`
- `app.saveSettings`
- `auth.saveApiKey`
- `auth.verifyApiKey`
- `workspace.listProfiles`
- `workspace.saveProfile`
- `workspace.setActiveProfile`
- `crm.listCustomers`
- `crm.saveCustomer`
- `crm.listOpportunities`
- `crm.saveOpportunity`
- `conversation.listThreads`
- `conversation.listMessages`
- `draft.save`
- `draft.get`
- `qeeclaw.getHealth`

## 10. 第二阶段再补的部分

- `knowledge_chunks`
- `knowledge_search_history`
- `audit_logs`
- `device_states`
- `sync_outbox`
- `device.subscribeState`
- `knowledge.rebuildIndex`
- `qeeclaw.getLogs`

## 11. 与现有前端页面的对应关系

### Dashboard

依赖：

- `crm_customers`
- `crm_opportunities`
- `device_states`
- `runtime_health_checks`

### Search

依赖：

- `knowledge_documents`
- `knowledge_chunks`
- `knowledge_search_history`

### CRM

依赖：

- `crm_customers`
- `crm_contacts`
- `crm_opportunities`
- `crm_activities`

### AI Writer

依赖：

- `drafts`
- `audit_logs`

### Assets

依赖：

- `knowledge_documents`
- `device_states`
- `runtime_health_checks`

### Settings

依赖：

- `app_settings`
- `workspace_profiles`
- Keychain
- `runtime_health_checks`

## 12. 最终收口

如果后续 `ruisi` 按桌面交付推进，那么最先要做的不是继续在前端堆 mock 数据，而是：

- 把本地 SQLite 建起来
- 把 Electron IPC 接口建起来
- 把 API Key 从前端 localStorage 迁到 Keychain
- 把 CRM、会话、草稿、知识元数据逐步落入本地库

这一步完成后，`ruisi` 才真正开始从“SDK 联调原型”进入“可交付桌面产品”的开发阶段。
