// dsh-plugin-description — Host half(Node 半,组合插件的主入口)。
//
// 在宿主组合中挂载本包后:
//   1. 提供 pluginDescriptions 服务:其他 Host 插件用 ctx.get('pluginDescriptions')
//      注册自己的说明文字(register(entries) 返回 disposer,resolve(moduleName, entryId) 查询)。
//   2. 注册 GET /plugin-descriptions 端点:返回当前 Loader 清单 + 说明(浏览器半消费)。
//   3. 注册 POST /plugin-descriptions/overrides 端点:普通用户在界面上编辑/新增说明,
//      持久化到用户字典 <DSH_HOME>/plugin-descriptions.json(仅回环地址可写)。
//
// 说明来源优先级(高 → 低):
//   用户字典(entryId > moduleName) > pluginDescriptions 注册表(entryId > moduleName)
//   > ENTRY_OVERRIDES(codex/claude-code 等特殊条目)
//   > 内置字典 DESCRIPTIONS(由 scripts/build.mjs 从 descriptions/plugin-descriptions.json 内联)。
import { readFileSync, writeFileSync } from 'node:fs'
import { homedir } from 'node:os'
import { join } from 'node:path'

const DESCRIPTIONS = /*__DESCRIPTIONS__*/ null

const ENTRY_OVERRIDES = {
  'include:agent-presets:tool-subagent-codex': { zh: '为 tool-subagent 装载 codex 子代理后端：把委派工具绑定到 codex 传输（本部署默认关闭）。', en: 'Loads the codex subagent backend for tool-subagent: binds the delegation tool to the codex transport (disabled by default in this deployment).' },
  'include:agent-presets:tool-subagent-claude-code': { zh: '为 tool-subagent 装载 claude-code 子代理后端：把委派工具绑定到 claude-code 传输（本部署默认关闭）。', en: 'Loads the claude-code subagent backend for tool-subagent: binds the delegation tool to the claude-code transport (disabled by default in this deployment).' },
}

/** Loader Fiber 状态 → 界面阶段(与 dsh-host-plugin-inventory 的 FIBER_PHASE 一致)。 */
const FIBER_PHASE = ['pending', 'loading', 'active', 'failed', null, 'unloading']

/** 用户字典路径:与 settings.yaml、.credentials.yaml 同级的用户自有文件。 */
const USER_DICT_PATH = join(process.env.DSH_HOME !== undefined && process.env.DSH_HOME !== '' ? process.env.DSH_HOME : join(homedir(), '.dsh'), 'plugin-descriptions.json')

/** 读取用户字典:文件缺失/损坏时回退为空字典,绝不因此影响内置说明。 */
function loadUserDict() {
  try {
    const parsed = JSON.parse(readFileSync(USER_DICT_PATH, 'utf8'))
    if (parsed === null || typeof parsed !== 'object' || Array.isArray(parsed)) return { modules: {}, entries: {} }
    const modules = parsed.modules !== null && typeof parsed.modules === 'object' && !Array.isArray(parsed.modules) ? parsed.modules : {}
    const entries = parsed.entries !== null && typeof parsed.entries === 'object' && !Array.isArray(parsed.entries) ? parsed.entries : {}
    return { modules, entries }
  } catch {
    return { modules: {}, entries: {} }
  }
}

function saveUserDict(dict) {
  writeFileSync(USER_DICT_PATH, JSON.stringify(dict, null, 1) + '\n', 'utf8')
}

function isLoopback(address) {
  return address === '127.0.0.1' || address === '::1' || address === '::ffff:127.0.0.1'
}

function pick(modules, entries, moduleName, entryId) {
  const byId = entries[entryId]
  if (byId !== undefined) return { rec: byId, source: 'user' }
  const byName = modules[moduleName]
  if (byName !== undefined) return { rec: byName, source: 'user' }
  return undefined
}

export default {
  name: 'plugin-description-annotator',
  inject: ['loader', 'webServer'],
  apply(ctx) {
    const byModule = new Map()
    const byEntry = new Map()
    const descriptions = {
      register(entries) {
        const removes = []
        if (Array.isArray(entries)) {
          for (const item of entries) {
            if (item === null || typeof item !== 'object') continue
            const rec = {
              zh: typeof item.zh === 'string' ? item.zh : '',
              en: typeof item.en === 'string' ? item.en : '',
            }
            if (typeof item.moduleName === 'string') {
              byModule.set(item.moduleName, rec)
              removes.push(() => { byModule.delete(item.moduleName) })
            }
            if (typeof item.entryId === 'string') {
              byEntry.set(item.entryId, rec)
              removes.push(() => { byEntry.delete(item.entryId) })
            }
          }
        }
        return () => { for (const remove of removes) remove() }
      },
      resolve(moduleName, entryId) {
        const byId = byEntry.get(entryId)
        if (byId !== undefined) return byId
        const byName = byModule.get(moduleName)
        if (byName !== undefined) return byName
        return undefined
      },
    }
    ctx.provide('pluginDescriptions', descriptions)

    // 吃自己的狗粮:通过同一公开服务注册本插件自身的说明,
    // 让「插件列表」页里 plugin-description 这张卡片也有描述
    // (内置字典同时含 dsh-plugin-description 条目,双保险)。
    ctx.effect(() => descriptions.register([
      {
        moduleName: 'dsh-plugin-description',
        entryId: 'plugin-description',
        zh: '本插件自身：为 Web 设置中的插件列表页添加中英文功能说明，并发布 pluginDescriptions 服务，供其他插件注册自己的说明。',
        en: 'The annotator itself: adds bilingual descriptions to the Web Settings plugin list and publishes the pluginDescriptions service for other plugins to register their own descriptions.',
      },
    ]))

    ctx.effect(() => ctx.webServer.register({
      kind: 'exact',
      path: '/plugin-descriptions',
      handler: async (req, res) => {
        if (req.method !== 'GET' && req.method !== 'HEAD') {
          res.writeHead(405)
          res.end()
          return
        }
        try {
          const user = loadUserDict()
          const entries = []
          for (const entry of ctx.loader.entries()) {
            if (entry.options.group) continue
            const moduleName = String(entry.options.name)
            const entryId = String(entry.id)
            const chosen = pick(user.modules, user.entries, moduleName, entryId)
            if (chosen !== undefined) {
              entries.push({
                entryId,
                moduleName,
                enabled: !entry.disabled,
                fiberPhase: entry.fiber === undefined ? null : FIBER_PHASE[entry.fiber.state],
                zh: typeof chosen.rec.zh === 'string' ? chosen.rec.zh : '',
                en: typeof chosen.rec.en === 'string' ? chosen.rec.en : '',
                source: chosen.source,
              })
              continue
            }
            const registered = descriptions.resolve(moduleName, entryId)
            if (registered !== undefined) {
              entries.push({
                entryId,
                moduleName,
                enabled: !entry.disabled,
                fiberPhase: entry.fiber === undefined ? null : FIBER_PHASE[entry.fiber.state],
                zh: typeof registered.zh === 'string' ? registered.zh : '',
                en: typeof registered.en === 'string' ? registered.en : '',
                source: 'registry',
              })
              continue
            }
            const override = ENTRY_OVERRIDES[entryId]
            if (override !== undefined) {
              entries.push({
                entryId,
                moduleName,
                enabled: !entry.disabled,
                fiberPhase: entry.fiber === undefined ? null : FIBER_PHASE[entry.fiber.state],
                zh: override.zh,
                en: override.en,
                source: 'override',
              })
              continue
            }
            const builtin = DESCRIPTIONS[moduleName]
            entries.push({
              entryId,
              moduleName,
              enabled: !entry.disabled,
              fiberPhase: entry.fiber === undefined ? null : FIBER_PHASE[entry.fiber.state],
              zh: builtin !== undefined && typeof builtin.zh === 'string' ? builtin.zh : '',
              en: builtin !== undefined && typeof builtin.en === 'string' ? builtin.en : '',
              source: builtin !== undefined ? 'builtin' : '',
            })
          }
          res.writeHead(200, {
            'content-type': 'application/json; charset=utf-8',
            'cache-control': 'no-cache',
          })
          res.end(JSON.stringify({ ok: true, entries, overrides: user }))
        } catch (error) {
          res.writeHead(500, { 'content-type': 'application/json; charset=utf-8' })
          res.end(JSON.stringify({ ok: false, error: String(error && error.message ? error.message : error) }))
        }
      },
    }))

    // 普通用户的自定义入口:界面上的编辑/新增/恢复默认都落到这里,
    // 持久化到用户字典文件;仅允许回环地址写入(与 settings API 同级约束)。
    ctx.effect(() => ctx.webServer.register({
      kind: 'exact',
      path: '/plugin-descriptions/overrides',
      handler: async (req, res) => {
        if (req.method !== 'POST') {
          res.writeHead(405)
          res.end()
          return
        }
        const send = (status, payload) => {
          res.writeHead(status, { 'content-type': 'application/json; charset=utf-8' })
          res.end(JSON.stringify(payload))
        }
        if (!isLoopback(req.socket.remoteAddress)) {
          send(403, { ok: false, error: 'write access is limited to loopback requests' })
          return
        }
        try {
          const chunks = []
          let size = 0
          for await (const chunk of req) {
            size += chunk.length
            if (size > 64 * 1024) throw new Error('request body too large')
            chunks.push(chunk)
          }
          const body = JSON.parse(Buffer.concat(chunks).toString('utf8'))
          if (body === null || typeof body !== 'object') throw new Error('invalid body')
          const scope = body.scope === 'entry' ? 'entry' : 'module'
          const key = scope === 'entry' ? body.entryId : body.moduleName
          if (typeof key !== 'string' || key.length === 0 || key.length > 256) throw new Error('invalid key')
          const dict = loadUserDict()
          const table = scope === 'entry' ? dict.entries : dict.modules
          if (body.delete === true) {
            delete table[key]
          } else {
            const zh = typeof body.zh === 'string' ? body.zh.slice(0, 4000) : ''
            const en = typeof body.en === 'string' ? body.en.slice(0, 4000) : ''
            if (zh.trim() === '' && en.trim() === '') throw new Error('description must not be empty')
            table[key] = { zh, en }
          }
          saveUserDict(dict)
          send(200, { ok: true, overrides: dict })
        } catch (error) {
          send(400, { ok: false, error: String(error && error.message ? error.message : error) })
        }
      },
    }))
  },
}
