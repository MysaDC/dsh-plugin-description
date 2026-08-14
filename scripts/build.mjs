// 构建脚本:把 src 两半源码 + descriptions 字典组装成可安装的组合包产物。
// 产物:
//   lib/index.js            Host 半(字典内联,ESM,exports["."] 目标)
//   lib/client.js           Client 半(__ModuleLoader__ factory,exports["./client"] 目标)
//   dist/package/           可直接安装的包内容(package.json + lib + README + LICENSE + descriptions)
// 用法:
//   node scripts/build.mjs          构建
//   node scripts/build.mjs --verify 构建并做完整校验(CI 使用)
import { readFileSync, writeFileSync, mkdirSync, rmSync, copyFileSync, existsSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const verify = process.argv.includes('--verify')

const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'))
const hostSource = readFileSync(join(root, 'src', 'index.js'), 'utf8')
const clientSource = readFileSync(join(root, 'src', 'client.js'), 'utf8')
const descriptions = JSON.parse(readFileSync(join(root, 'descriptions', 'plugin-descriptions.json'), 'utf8'))

// 1. 字典检查
const keys = Object.keys(descriptions)
if (keys.length === 0) throw new Error('descriptions/plugin-descriptions.json 为空')
for (const key of keys) {
  const entry = descriptions[key]
  if (entry === null || typeof entry !== 'object' || typeof entry.zh !== 'string' || typeof entry.en !== 'string') {
    throw new Error(`字典条目 ${key} 缺少 zh/en 字符串字段`)
  }
}

// 2. 内联字典(紧凑 JSON,替换 src/index.js 中的 /*__DESCRIPTIONS__*/ 标记)
const MARKER = '/*__DESCRIPTIONS__*/ null'
if (!hostSource.includes(MARKER)) throw new Error('src/index.js 中缺少描述字典标记 ' + MARKER)
const hostCode = hostSource.replace(MARKER, JSON.stringify(descriptions))

// 3. 客户端工厂自检(纯语法 + 关键字段)
new Function(clientSource)
if (!/id:\s*'dsh-plugin-description'/.test(clientSource)) throw new Error('src/client.js 的模块 id 必须等于包名 dsh-plugin-description')
// 静态客户端内核:同 id 同 priority 的 list slot 注册会抛错,遮蔽必须用更低 priority
if (!/name:\s*'settings\.plugins\.tab',\s*id:\s*'all',\s*order:\s*10,\s*priority:\s*-1,/.test(clientSource)) {
  throw new Error('settings.plugins.tab 注册必须显式声明 priority: -1(静态 SlotCore 要求不同 priority 才能遮蔽)')
}
// 卡片布局回归守卫:闭合卡片通过固定三行描述框等高,行内用 align-items: start,
// 展开某张卡片时不得拉伸同行邻居。
if (!/\.pd-cards\s*\{[^}]*align-items:\s*start/.test(clientSource)) {
  throw new Error('.pd-cards 必须使用 align-items: start(展开卡片不得拉伸同行邻居)')
}
if (!/\.pd-desc\s*\{[^}]*height:\s*54px/.test(clientSource)) {
  throw new Error('.pd-desc 必须固定三行高度(54px),保证闭合卡片等高')
}
// 用户自定义入口回归守卫:Host 提供 overrides 写入端点,Client 提供编辑表单。
if (!/path:\s*'\/plugin-descriptions\/overrides'/.test(hostSource)) {
  throw new Error('Host 半必须注册 POST /plugin-descriptions/overrides(普通用户自定义说明的写入端点)')
}
if (!/fetch\('\/plugin-descriptions\/overrides'/.test(clientSource) || !/edit:\s*'编辑说明'/.test(clientSource)) {
  throw new Error('Client 半必须提供编辑说明表单(调用 overrides 端点)')
}

// 4. 写入 lib/
mkdirSync(join(root, 'lib'), { recursive: true })
writeFileSync(join(root, 'lib', 'index.js'), hostCode, 'utf8')
writeFileSync(join(root, 'lib', 'client.js'), clientSource, 'utf8')

// 5. 打包 dist/package/(给发布工作流打 zip 用)
const packageDir = join(root, 'dist', 'package')
rmSync(packageDir, { recursive: true, force: true })
for (const dir of ['lib', 'descriptions']) {
  mkdirSync(join(packageDir, dir), { recursive: true })
}
writeFileSync(join(packageDir, 'lib', 'index.js'), hostCode, 'utf8')
writeFileSync(join(packageDir, 'lib', 'client.js'), clientSource, 'utf8')
writeFileSync(join(packageDir, 'descriptions', 'plugin-descriptions.json'), JSON.stringify(descriptions, null, 1), 'utf8')
for (const file of ['package.json', 'cordis.patch.yml', 'README.md', 'README_en.md', 'LICENSE']) {
  const from = join(root, file)
  if (existsSync(from)) copyFileSync(from, join(packageDir, file))
}

// 6. 校验
if (verify) {
  // Host 半可被 Node 完整加载,默认导出是插件对象
  const mod = await import(pathToFileURL(join(root, 'lib', 'index.js')).href + '?v=' + Date.now())
  const plugin = mod.default
  if (plugin === null || typeof plugin !== 'object' || typeof plugin.apply !== 'function') {
    throw new Error('lib/index.js 的默认导出必须是带 apply 的 Cordis 插件对象')
  }
  if (!Array.isArray(plugin.inject) || !plugin.inject.includes('loader') || !plugin.inject.includes('webServer')) {
    throw new Error('lib/index.js 必须注入 loader 与 webServer')
  }
  const dictMatch = /const DESCRIPTIONS = (\{[^\n]*\})/.exec(hostCode)
  if (dictMatch === null) throw new Error('lib/index.js 中未找到内联字典')
  const embedded = JSON.parse(dictMatch[1])
  if (Object.keys(embedded).length !== keys.length) throw new Error('内联字典条目数与源字典不一致')
  // 包声明:客户端名册扫描器(parseDshClient/clientExportOf)所需的字段
  const decl = pkg.dsh && pkg.dsh.client
  if (decl === undefined || decl.platform !== 'web') throw new Error('package.json 必须声明 dsh.client.platform = "web"')
  const clientExport = pkg.exports['./client']
  const clientRel = typeof clientExport === 'string' ? clientExport : (clientExport && typeof clientExport === 'object' ? clientExport.default : undefined)
  if (clientRel !== './lib/client.js') throw new Error('exports["./client"] 必须指向 ./lib/client.js')
  if (pkg.exports['./package.json'] !== './package.json') throw new Error('exports 必须包含 "./package.json": "./package.json"(client-modules 扫描器依赖它)')
  // bundle 声明:dsh plugin add 的 reconcile 据此把包追加进 dsh.profile.bundles
  const bundlePatch = pkg.dsh && pkg.dsh.bundle && pkg.dsh.bundle.patch
  if (bundlePatch !== './cordis.patch.yml') throw new Error('package.json 必须声明 dsh.bundle.patch = "./cordis.patch.yml"(dsh plugin add 依赖它接入组合)')
  const patchText = readFileSync(join(root, 'cordis.patch.yml'), 'utf8')
  if (!/name:\s*'dsh-plugin-description'/.test(patchText)) throw new Error('cordis.patch.yml 必须插入 name: dsh-plugin-description 的组合行')
  console.log('verify: OK')
}

console.log(`build: ${keys.length} 条描述 -> lib/{index,client}.js + dist/package (v${pkg.version})`)
