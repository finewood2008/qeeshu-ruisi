# 企数睿思本地优先方案目录

这组文档用于收口 `qeeshu-ruisi` 作为桌面交付产品的最终技术方向。

当前统一结论：

- `企数睿思` 不需要独立远程后端
- `企数睿思` 需要本地应用服务层
- 这层优先由 `Electron Main + Preload + SQLite + OS Keychain` 承担
- `QeeClaw / OpenClaw Gateway` 继续承担本地运行时网关职责
- 云端 `QeeClaw Platform` 只保留授权、计费、钱包、API Key 等控制面能力
- 新建本地数据库后不再自动注入 CRM / 会话 / 知识 / 设备预置演示数据

## 文档清单

### 1. 本地优先技术方案

文件：

- [`Ruisi_本地优先技术方案.md`](./Ruisi_本地优先技术方案.md)

适合阅读对象：

- 产品负责人
- 技术负责人
- 架构师
- 桌面端负责人

重点回答：

- 为什么 `ruisi` 不需要独立远程后端
- 为什么 `Electron Main` 就可以作为本地后端
- `QeeClaw Gateway` 与 `Electron Main` 如何分工
- 哪些数据放本地，哪些数据保留在云端
- 最终交付形态应该是什么

### 2. SQLite 表结构与 Electron IPC 接口清单

文件：

- [`Ruisi_SQLite表结构与Electron_IPC接口清单.md`](./Ruisi_SQLite表结构与Electron_IPC接口清单.md)

适合阅读对象：

- Electron 开发
- 前端开发
- 本地服务层开发
- SDK 对接开发

重点回答：

- 本地数据库要建哪些表
- 每张表存什么
- 敏感数据如何存
- Renderer 与 Main 之间应该暴露哪些 IPC
- 第一阶段最小可落地开发范围是什么

### 3. 功能可用性审计与开发清单

文件：

- [`Ruisi_功能可用性审计与开发清单_20260409.md`](./Ruisi_功能可用性审计与开发清单_20260409.md)

适合阅读对象：

- 产品负责人
- 项目经理
- 前端开发
- Electron 开发
- 测试负责人

重点回答：

- 当前哪些页面已经真正可用
- 哪些按钮仍未接业务动作
- 哪些功能还没有接业务动作
- 下一步该按什么优先级补开发

## 建议阅读顺序

1. 先看 [`Ruisi_本地优先技术方案.md`](./Ruisi_本地优先技术方案.md)
2. 再看 [`Ruisi_SQLite表结构与Electron_IPC接口清单.md`](./Ruisi_SQLite表结构与Electron_IPC接口清单.md)
3. 再看 [`Ruisi_功能可用性审计与开发清单_20260409.md`](./Ruisi_功能可用性审计与开发清单_20260409.md)
4. 最后结合 [`../QEECLAW_SDK_PAGE_CAPABILITY_MATRIX.md`](../QEECLAW_SDK_PAGE_CAPABILITY_MATRIX.md) 制定页面改造排期
