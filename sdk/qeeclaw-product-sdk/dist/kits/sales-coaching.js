function truncate(value, length = 88) {
    if (!value) {
        return "";
    }
    return value.length > length ? `${value.slice(0, length)}...` : value;
}
function mapWorkflowTask(item) {
    return {
        title: item.name,
        type: "workflow",
        status: item.enabled ? "ready" : "planned",
        hint: item.description || "可用于销售复盘、提醒与培训编排",
    };
}
function mapTemplateTask(item) {
    return {
        title: item.name,
        type: "agent-template",
        status: "ready",
        hint: `默认可用工具：${item.allowedTools.join(", ") || "待补充"}`,
    };
}
function mapHistorySummary(item) {
    return {
        id: item.id,
        contentPreview: truncate(item.content),
        direction: item.direction,
        createdTime: item.createdTime,
    };
}
function buildMistakes(events) {
    if (events.length === 0) {
        return [
            {
                title: "暂无治理异常",
                level: "low",
                suggestion: "当前可以把训练重点放到销售问答质量和跟进节奏上。",
            },
        ];
    }
    return events.slice(0, 5).map((item) => ({
        title: item.title,
        level: item.riskLevel === "critical" || item.riskLevel === "high"
            ? "high"
            : item.riskLevel === "medium"
                ? "medium"
                : "low",
        suggestion: item.summary || "建议结合审计记录复盘本次操作链路。",
    }));
}
export class SalesCoachingKit {
    client;
    constructor(client) {
        this.client = client;
    }
    async loadTrainingOverview(teamId, scope = "mine") {
        const [conversationHome, workflows, templates, approvals, events, documents] = await Promise.all([
            this.client.conversations.getHome(teamId, 5, 6),
            this.client.workflow.list(),
            this.client.agent.listDefaultTemplates(),
            this.client.approval.list({ scope, status: "pending", page: 1, pageSize: 10 }),
            this.client.audit.listEvents({ scope, category: "all", page: 1, pageSize: 10 }),
            this.client.file.listDocuments({ limit: 5 }),
        ]);
        const trainingTasks = [
            ...workflows.slice(0, 3).map(mapWorkflowTask),
            ...templates.slice(0, 2).map(mapTemplateTask),
        ];
        if (approvals.total > 0) {
            trainingTasks.push({
                title: "待审批事项复盘",
                type: "governance",
                status: "attention",
                hint: `当前仍有 ${approvals.total} 个待审批事项，建议纳入销售训练案例。`,
            });
        }
        return {
            trainingTasks,
            reviewSummaries: conversationHome.history.slice(0, 5).map(mapHistorySummary),
            commonMistakes: buildMistakes(events.items),
            bestPractices: documents.slice(0, 3).map((item) => ({
                title: item.documentTitle,
                reason: item.documentDetail || "适合作为销售知识训练与复盘的参考样例。",
            })),
            assistantTemplates: templates.map((item) => ({
                code: item.code,
                name: item.name,
                allowedTools: item.allowedTools,
            })),
        };
    }
}
