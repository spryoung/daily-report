import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'fs'
import path from 'path'
import { execFile } from 'child_process'

const DATA_FILE = path.resolve(__dirname, 'data/reports.json')
const EMPTY_DATA = JSON.stringify({ daily: {}, weekly: {} })

function ensureDataFile() {
  const dir = path.dirname(DATA_FILE)
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
  if (!fs.existsSync(DATA_FILE)) fs.writeFileSync(DATA_FILE, EMPTY_DATA, 'utf-8')
}

function callClaude(prompt: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const apiKey = process.env.ANTHROPIC_AUTH_TOKEN || process.env.ANTHROPIC_API_KEY
    if (!apiKey) { reject(new Error('未配置 ANTHROPIC_AUTH_TOKEN 或 ANTHROPIC_API_KEY')); return }

    const baseUrl = (process.env.ANTHROPIC_BASE_URL || 'https://api.anthropic.com/').replace(/\/$/, '')
    const endpoint = `${baseUrl}/v1/messages`

    const bodyObj = {
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 2048,
      messages: [{ role: 'user', content: prompt }],
    }

    execFile('curl', [
      '-s', '-X', 'POST', endpoint,
      '-H', 'Content-Type: application/json',
      '-H', `x-api-key: ${apiKey}`,
      '-H', `Authorization: Bearer ${apiKey}`,
      '-H', 'anthropic-version: 2023-06-01',
      '-d', JSON.stringify(bodyObj),
    ], { maxBuffer: 1024 * 1024 * 4 }, (err, stdout, stderr) => {
      if (err) { reject(new Error(stderr || err.message)); return }
      try {
        const parsed = JSON.parse(stdout)
        if (parsed.error) { reject(new Error(parsed.error.message)); return }
        resolve(parsed.content[0].text)
      } catch (e) {
        reject(new Error(`解析响应失败: ${stdout.slice(0, 200)}`))
      }
    })
  })
}

export default defineConfig({
  plugins: [
    react(),
    {
      name: 'reports-api',
      configureServer(server) {
        ensureDataFile()
        server.middlewares.use('/api/reports', (req, res) => {
          res.setHeader('Content-Type', 'application/json')
          res.setHeader('Access-Control-Allow-Origin', '*')

          if (req.method === 'GET') {
            try {
              const content = fs.readFileSync(DATA_FILE, 'utf-8')
              res.statusCode = 200
              res.end(content)
            } catch {
              res.statusCode = 200
              res.end(EMPTY_DATA)
            }
            return
          }

          if (req.method === 'POST') {
            let body = ''
            req.on('data', chunk => { body += chunk })
            req.on('end', () => {
              try {
                JSON.parse(body) // validate
                fs.writeFileSync(DATA_FILE, body, 'utf-8')
                res.statusCode = 200
                res.end('{"ok":true}')
              } catch {
                res.statusCode = 400
                res.end('{"error":"invalid json"}')
              }
            })
            return
          }

          res.statusCode = 405
          res.end('{"error":"method not allowed"}')
        })

        server.middlewares.use('/api/generate-weekly', (req, res) => {
          res.setHeader('Content-Type', 'application/json')
          res.setHeader('Access-Control-Allow-Origin', '*')

          if (req.method !== 'POST') {
            res.statusCode = 405
            res.end('{"error":"method not allowed"}')
            return
          }

          let body = ''
          req.on('data', chunk => { body += chunk })
          req.on('end', async () => {
            try {
              const { weekLabel, dateRange, dailyReports } = JSON.parse(body) as {
                weekLabel: string
                dateRange: string
                dailyReports: { dayName: string; date: string; content: string }[]
              }

              const dailyText = dailyReports
                .map(d => `【${d.dayName} ${d.date}】\n${d.content.trim()}`)
                .join('\n\n')

              const prompt = `你是一名IT运维工程师，请根据以下日报内容，归纳总结成一份正式的周报。

周报要求：
- 按工作分类（OA、桌面运维、资产管理、日常巡检、权限管理、IT助理机器人等）归纳汇总，不要逐条罗列日报原文，要提炼合并同类项
- 数量、次数等数据要汇总（如"本周共处理桌面问题X次"）
- 语言简洁专业，用中文
- 格式参考如下：

一、本周工作

1.OA：
（归纳OA相关工作）

2.桌面：
（归纳桌面运维工作）

3.资产管理：
（归纳资产管理工作）

4.日常巡检：
（归纳巡检工作）

5.权限管理：
（归纳权限管理工作）

6.IT助理机器人：
（归纳机器人相关工作，如无则省略此项）

二、下周计划

1. （根据本周工作情况，合理推断下周计划，3-4条）

以下是本周（${weekLabel}，${dateRange}）的日报内容：

${dailyText}`

              const result = await callClaude(prompt)
              res.statusCode = 200
              res.end(JSON.stringify({ content: result }))
            } catch (e) {
              res.statusCode = 500
              res.end(JSON.stringify({ error: e instanceof Error ? e.message : '生成失败' }))
            }
          })
        })
      },
    },
  ],
})
