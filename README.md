# 日报 & 周报系统

一个本地运行的日报、周报管理工具，支持 AI 一键生成周报草稿。

## 功能

- 日报编写与保存，按日历导航
- 周报编写，支持 Markdown 编辑和预览
- AI 自动归纳本周日报生成周报草稿
- 上一封 / 下一封 / 最新导航
- 暗夜模式（跟随系统，手动切换）
- 数据导出 / 导入（JSON 格式）

## 快速开始

```bash
git clone https://github.com/spryoung/daily-report.git
cd daily-report
npm install
npm run dev
```

打开 http://localhost:5173 即可使用。

## AI 生成周报（可选）

周报页面的「从日报生成草稿」功能需要配置 Anthropic API Key。

在项目根目录创建 `.env.local` 文件：

```
ANTHROPIC_API_KEY=你的API Key
```

如果使用公司代理：

```
ANTHROPIC_AUTH_TOKEN=你的Token
ANTHROPIC_BASE_URL=https://你的代理地址/
```

## 换电脑迁移数据

数据存储在本地 `data/reports.json`，不会上传到 GitHub。

迁移步骤：
1. 原电脑点右上角「导出」，保存 JSON 文件
2. 新电脑拉取代码启动后，点「导入」加载该文件

## 技术栈

- React 19 + TypeScript + Vite
- date-fns 日期处理
- marked Markdown 渲染
