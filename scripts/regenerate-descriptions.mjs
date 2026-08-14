// 描述字典再生器:从一个 DeepSeek Harness checkout 的 node_modules 里提取各包
// README 首段(中英双语),叠加人工校对覆盖,生成 descriptions/plugin-descriptions.json。
// 用法:
//   node scripts/regenerate-descriptions.mjs <checkout路径>
//   DSH_CHECKOUT=<checkout路径> node scripts/regenerate-descriptions.mjs
import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const CHECKOUT = process.argv[2] ?? process.env.DSH_CHECKOUT
if (CHECKOUT === undefined) {
  console.error('用法: node scripts/regenerate-descriptions.mjs <dsh-checkout 路径>')
  process.exit(1)
}

// 当前 DSH 组合里出现的全部模块名(与运行期 pluginInventory/list 的 moduleName 一致)。
const MODULES = [
  'dsh-plugin-description',
  'cordis:include',
  '@deepseek-ai/cordis-plugin-timer',
  '@deepseek-ai/cordis-plugin-hmr',
  '@deepseek-ai/dsh-llm',
  '@deepseek-ai/dsh-session',
  '@deepseek-ai/dsh-typert-registry',
  '@deepseek-ai/dsh-typert-loader',
  '@deepseek-ai/dsh-api-gateway',
  '@deepseek-ai/dsh-session-title',
  '@deepseek-ai/dsh-session-title-first-prompt-llm',
  '@deepseek-ai/dsh-user-questions',
  '@deepseek-ai/dsh-agent',
  '@deepseek-ai/dsh-agent-default-model',
  '@deepseek-ai/dsh-jobs-local',
  '@deepseek-ai/dsh-llm-retry',
  '@deepseek-ai/dsh-settings-file',
  '@deepseek-ai/dsh-credentials-local',
  '@deepseek-ai/dsh-llm-pi-ai',
  '@deepseek-ai/dsh-session-persistence-jsonl',
  '@deepseek-ai/dsh-attachment-local',
  '@deepseek-ai/dsh-session-query-sqlite',
  '@deepseek-ai/dsh-session-projection',
  '@deepseek-ai/dsh-session-telemetry-otel',
  '@deepseek-ai/dsh-subprocess-local',
  '@deepseek-ai/dsh-sandbox-local',
  '@deepseek-ai/dsh-sandbox-policy',
  '@deepseek-ai/dsh-bash-sandbox',
  '@deepseek-ai/dsh-pwsh-sandbox',
  '@deepseek-ai/dsh-user-approval',
  '@deepseek-ai/dsh-permission-presets',
  '@deepseek-ai/dsh-shell-env',
  '@deepseek-ai/dsh-tool-bash',
  '@deepseek-ai/dsh-tool-pwsh',
  '@deepseek-ai/dsh-tool-jobs',
  '@deepseek-ai/dsh-fs-observation-policy',
  '@deepseek-ai/dsh-tool-fs',
  '@deepseek-ai/dsh-tool-fs-search',
  '@deepseek-ai/dsh-agent-instructions',
  '@deepseek-ai/dsh-skill',
  '@deepseek-ai/dsh-skill-filesystem',
  '@deepseek-ai/dsh-skill-badge',
  '@deepseek-ai/dsh-tool-skill',
  '@deepseek-ai/dsh-commands',
  '@deepseek-ai/dsh-command-feedback',
  '@deepseek-ai/dsh-goal',
  '@deepseek-ai/dsh-goal-round-driver',
  '@deepseek-ai/dsh-command-goal',
  '@deepseek-ai/dsh-plan-mode',
  '@deepseek-ai/dsh-token-meter',
  '@deepseek-ai/dsh-compaction-basic',
  '@deepseek-ai/dsh-command-compact',
  '@deepseek-ai/dsh-subagent',
  '@deepseek-ai/dsh-subagent-spawn-in-process',
  '@deepseek-ai/dsh-subagent-fork-in-process',
  '@deepseek-ai/dsh-tool-subagent-control',
  '@deepseek-ai/dsh-tool-subagent-control/list-agents',
  '@deepseek-ai/dsh-tool-subagent',
  '@deepseek-ai/dsh-tool-subagent-report',
  '@deepseek-ai/dsh-workflow-worker-thread',
  '@deepseek-ai/dsh-tool-workflow',
  '@deepseek-ai/dsh-tool-call-timeout-policy',
  '@deepseek-ai/dsh-spill-local',
  '@deepseek-ai/dsh-spill-policy',
  '@deepseek-ai/dsh-session-checkpoint-policy',
  '@deepseek-ai/dsh-compaction-tool-result-pruner',
  '@deepseek-ai/dsh-tool-todo',
  '@deepseek-ai/dsh-tool-goal',
  '@deepseek-ai/dsh-tool-ralph',
  '@deepseek-ai/dsh-tool-str-replace-editor',
  '@deepseek-ai/dsh-repeat-tool-reminder',
  '@deepseek-ai/dsh-web',
  '@deepseek-ai/dsh-web-search-deepseek',
  '@deepseek-ai/dsh-tool-web',
  '@deepseek-ai/dsh-tools',
  '@deepseek-ai/dsh-system-prompt',
  '@deepseek-ai/dsh-agent-loop',
  '@deepseek-ai/dsh-fs-sandbox',
  '@deepseek-ai/dsh-llm-deepseek',
  '@deepseek-ai/dsh-code-runtime-worker-thread',
  '@deepseek-ai/dsh-storage',
  '@deepseek-ai/dsh-storage-json',
  '@deepseek-ai/dsh-storage-domain',
  '@deepseek-ai/dsh-message-feedback',
  '@deepseek-ai/dsh-session-log-export',
  '@deepseek-ai/dsh-workspace',
  '@deepseek-ai/dsh-session-projection-cache',
  '@deepseek-ai/dsh-session-stats',
  '@deepseek-ai/dsh-host-directory-picker-auto',
  '@deepseek-ai/dsh-host-directory-picker-native',
  '@deepseek-ai/dsh-host-plugin-inventory',
  '@deepseek-ai/dsh-host-apiproxy',
  '@deepseek-ai/dsh-cordis-host-runner',
  '@deepseek-ai/dsh-web-app',
  '@deepseek-ai/dsh-web-app/startup',
  '@deepseek-ai/dsh-host-webserver',
  '@deepseek-ai/dsh-client-hmr',
  '@deepseek-ai/dsh-client-modules',
  '@deepseek-ai/dsh-client-connection',
  '@deepseek-ai/dsh-api-remotes',
  '@deepseek-ai/dsh-client-runtime',
  '@deepseek-ai/dsh-cordis-client-runner',
  '@deepseek-ai/dsh-client-ui-theme',
  '@deepseek-ai/dsh-client-locale',
  '@deepseek-ai/dsh-client-ui-layout',
  '@deepseek-ai/dsh-client-ui-sidebar',
  '@deepseek-ai/dsh-client-ui-settings',
  '@deepseek-ai/dsh-client-ui-settings-general',
  '@deepseek-ai/dsh-client-ui-settings-models',
  '@deepseek-ai/dsh-client-ui-settings-plugin-inventory',
  '@deepseek-ai/dsh-client-ui-conversation',
  '@deepseek-ai/dsh-client-ui-tool',
  '@deepseek-ai/dsh-client-ui-cordis',
  '@deepseek-ai/dsh-client-ui-workflow-run',
  '@deepseek-ai/dsh-client-ui-deliverables',
  '@deepseek-ai/dsh-client-ui-workspace',
  '@deepseek-ai/dsh-client-ui-input-trigger',
  '@deepseek-ai/dsh-client-ui-commands',
  '@deepseek-ai/dsh-client-ui-skill',
  '@deepseek-ai/dsh-client-ui-subagent',
  '@deepseek-ai/dsh-client-ui-jobs',
  '@deepseek-ai/dsh-client-ui-goal',
  '@deepseek-ai/dsh-client-ui-message-feedback',
  '@deepseek-ai/dsh-client-ui-model-selection',
  '@deepseek-ai/dsh-client-ui-permission-presets',
  '@deepseek-ai/dsh-client-ui-agent-preset',
  '@deepseek-ai/dsh-client-ui-settings-plugins',
  '@deepseek-ai/dsh-client-ui-plan',
  '@deepseek-ai/dsh-client-ui-user-questions',
  '@deepseek-ai/dsh-client-ui-trajectory',
  '@deepseek-ai/dsh-agent-presets',
  '@deepseek-ai/dsh-persona',
  '@deepseek-ai/dsh-tool-ask-user',
  '@deepseek-ai/dsh-tool-cordis',
  '@deepseek-ai/dsh-client-ui-directory-picker-native',
]

// 人工校对覆盖:提取结果不理想时在此修正(键为模块名)。
const OVERRIDES = {
  'dsh-plugin-description': {
    zh: `本插件自身：为 Web 设置中的插件列表页添加中英文功能说明，并发布 pluginDescriptions 服务，供其他插件注册自己的说明。`,
    en: `The annotator itself: adds bilingual descriptions to the Web Settings plugin list and publishes the pluginDescriptions service for other plugins to register their own descriptions.`,
  },
  'cordis:include': {
    zh: `Cordis 内置的 include 插件：把 include 行指向的子组合挂载进宿主组合，是 dsh 组合文件（cordis.yml）的基础行。`,
    en: `Cordis's built-in include plugin: mounts the sub-composition an include row points at into the host composition — the base row of every dsh composition (cordis.yml).`,
  },
  '@deepseek-ai/cordis-plugin-timer': {
    zh: `Cordis 的定时器插件：向上下文提供 timeout/interval/throttle/debounce 定时能力，并随 fiber 一起释放。`,
  },
  '@deepseek-ai/cordis-plugin-hmr': {
    zh: `Cordis 插件的热模块替换（HMR）：开发期间由 Loader 管理的插件代码被热更新。`,
  },
  '@deepseek-ai/dsh-tool-subagent-control': {
    zh: `可选的全局具名 send_message、interrupt_agent 与 list_agents 工具，是 ctx.subagents 之上的轻量适配器。绑定提供方的 dsh-tool-subagent 实例会为每种传输注册不同的委派工具；这个单独加载的包只注册一次共享控制工具，因此多个委派工具绝不会重复注册全局控制工具。`,
    en: `The optional, globally named send_message, interrupt_agent, and list_agents tools are thin adapters over ctx.subagents. Provider-bound dsh-tool-subagent instances register distinct delegation tools per transport; this separately loaded package registers shared control tools once, so multiple delegation tools never register duplicate global controls.`,
  },
  '@deepseek-ai/dsh-tool-subagent-control/list-agents': {
    zh: `dsh-tool-subagent-control 的 list-agents 入口：在 send_message 与 interrupt_agent 之外追加 list_agents 工具，并把 subagents 与 agents 声明为加载时依赖。`,
    en: `The list-agents entry of dsh-tool-subagent-control: adds the list_agents tool beside send_message and interrupt_agent, declaring subagents and agents as load-time dependencies.`,
  },
  '@deepseek-ai/dsh-host-apiproxy': {
    zh: `所有客户端共用的 API 网关：TypeScript API 约定（src/api/，不依赖 Node，可从浏览器导入）、fetch 载体对（宿主侧 toFetchHandler、客户端侧 AbstractApiClient），以及提供 ctx.apiProxy 的宿主侧实现。该包不注册任何路由；HTTP 等载体自行包装 ctx.apiProxy。`,
    en: `The API gateway shared by every client: the TypeScript API contract (src/api/, zero Node dependencies, importable from the browser), the fetch carrier pair (toFetchHandler on the host side, AbstractApiClient plus platform subclasses on the client side), and the host-side implementation that provides ctx.apiProxy. The package registers no routes; carriers wrap ctx.apiProxy themselves.`,
  },
  '@deepseek-ai/dsh-client-ui-settings': {
    zh: `设置领域的底座，本身不含任何呈现内容。它提供 ctx.settingsScope——每个偏好设置行绑定自己那份持久化命名空间分区所用的宿主传输层；并声明由注册方填充的设置 slot 类型：settings.trigger／settings.header／settings.close、settings.action、settings.section、settings.plugins.tab 和 settings.onboarding。`,
    en: `The settings domain base layer, with two roles and no presentation of its own. It provides ctx.settingsScope, the Host transport every preference row binds its durable namespace section through, and declares the settings slot types registrants fill: settings.trigger / settings.header / settings.close, settings.action, settings.section, settings.plugins.tab, and settings.onboarding.`,
  },
  '@deepseek-ai/dsh-client-ui-settings-general': {
    zh: `设置外壳与无特定功能归属的文案。它占用 sidebar.settings，把 settings.section 账本投影成导航、把 settings.onboarding 投影成引导流程，并注册触发器、标题栏与关闭控件内容、本地配置文件操作、「通用」分区及 settings 字典；具体功能行与分区仍由各自的功能包提供。`,
    en: `Settings shell, ownerless copy, and durable product-onboarding namespace. It occupies sidebar.settings with the trigger chrome and modal settings panel, projects the settings.section ledger into the navigation and the settings.onboarding ledger into one mounted step at a time, and registers everything on the Settings pages that belongs to no single feature.`,
  },
  '@deepseek-ai/dsh-client-ui-settings-models': {
    zh: `模型设置与产品引导插件。同一个 client Cordis 插件会注册 Models 页面和两个有序的首次使用弹窗：版本化内测声明，以及按条件显示的 DeepSeek 官方凭据步骤。Models 平面把 llm.providers、settings.describe 与 credentials.describe 三个协议领域汇聚为一个共享快照。`,
    en: `Models settings and product-onboarding plugin. The same client Cordis plugin registers the Models page plus two ordered first-run dialogs: a versioned internal-testing notice and the conditional official-DeepSeek credential step. The Models plane joins the llm.providers, settings.describe, and credentials.describe wire domains into one shared snapshot.`,
  },
  '@deepseek-ai/dsh-client-ui-goal': {
    zh: `Goal 界面插件（浏览器端）：GoalBar 条带是 conversation.input.dock composer 上下文堆栈中的第二张独立卡片（order 10，位于 Todo 之后、Queue 之前）。活值经 useProjection('goal') 到达，因此本插件不持有领域 store、不设刷新链、不挂事件监听；slot 注入面只携带四个变更动词（edit / pause / resume / clear，经 ctx.remote.goals 调用）。`,
    en: `Goal surface plugin, browser half: the GoalBar strip is the second standalone card in the conversation.input.dock composer-context stack (order 10, after Todo and before Queue). The live goal arrives through useProjection('goal'), so the plugin owns no domain store, refresh chain, or event listener; the slot inject face carries only the four mutation verbs (edit / pause / resume / clear through ctx.remote.goals).`,
  },
  '@deepseek-ai/dsh-tool-web': {
    zh: `面向模型的 web 工具套件 web_search 与 web_fetch，构建于 web 能力 seam（ctx.web）之上。它只负责面向模型的事项：工具名称、JSON Schema、snake_case 参数名称、提示词区段、结果数量上限、结果格式、HTML→markdown 呈现，以及承载结构化搜索来源或抓取摘要的 UI 呈现投影（presentCall、presentResult、output.presentationMeta）。`,
    en: `The model-facing web tool suite — web_search and web_fetch — over the web capability seam (ctx.web). It owns model-facing concerns only: tool names, JSON schemas, snake_case argument names, prompt sections, the result-count bound, result formatting, HTML→markdown presentation, and the UI presentation projection (presentCall, presentResult, output.presentationMeta).`,
  },
  '@deepseek-ai/dsh-tool-cordis': {
    zh: `自引用 Cordis 工具集：五个面向模型的工具（cordis_inspect、cordis_define、cordis_run、cordis_stop、cordis_undefine），操作当前 DSH 进程中的实时运行时。注册表、vm 沙箱与浏览器广播属于 dsh-cordis-host-runner（ctx.dynamic），本工具集注入它。`,
    en: `The self-referential Cordis toolset: five model-facing tools over the live runtime in the current DSH process. The registry, the vm sandbox, and the browser broadcast belong to dsh-cordis-host-runner (ctx.dynamic), which this toolset injects.`,
  },
  '@deepseek-ai/dsh-client-ui-directory-picker-native': {
    zh: `原生目录选择界面：原生选取交互的浏览器半边。它通过 ui-workspace 的两个 directory-flow 洞装入一个无渲染占位者，每次收到 open 请求就用 ctx.workspaces.pickDirectory() 驱动本地 Host 的操作系统选择框，然后回报恰好一个结果——选中的路径、取消、或失败。`,
    en: `Native directory-picker surface: the browser half of the native picking interaction. It fills ui-workspace's two directory-flow holes with a renderless occupant that answers each open request by driving the local Host's OS chooser through ctx.workspaces.pickDirectory(), then reports exactly one outcome — a picked path, a cancellation, or a failure.`,
  },
  '@deepseek-ai/dsh-session-telemetry-otel': {
    zh: `遥测 seam 的 OpenTelemetry 后端，也是部署方唯一要加载的条目。其 mode 决定 seam 是实时跟随会话事件、仅在记录反馈时回放权威日志，还是将遥测留在本地。上传模式会原样组合 OTel JS SDK，把每条已交接记录映射到 logger.emit()。`,
    en: `The OpenTelemetry backend for the telemetry seam — the only entry a deployment loads. Its mode decides whether the seam follows session events live, replays the canonical log only at recorded feedback, or keeps telemetry local. Uploading modes compose the OTel JS SDK as-is and map each handed-over record onto logger.emit().`,
  },
  '@deepseek-ai/dsh-tool-fs-search': {
    zh: `面向模型的文件系统发现工具（glob、grep），由打包的 ripgrep 二进制（@vscode/ripgrep）支持，而不是由 ctx.fs 提供方方法或系统 rg 安装支持。每次调用都通过 ctx.subprocess seam 以固定 argv 向量 spawn 该二进制，解析原始 rg 输出，并返回相对于工作目录的规范值。`,
    en: `The model-facing filesystem discovery tools — glob and grep — are backed by the packaged ripgrep binary (@vscode/ripgrep), not by ctx.fs provider methods and not by a system rg install. Each call spawns the binary through the ctx.subprocess seam with a fixed argv vector, parses the raw rg output, and returns canonical values relative to the working directory.`,
  },
  '@deepseek-ai/dsh-tool-subagent-report': {
    zh: `可选的子级作用域 report 工具，是 ctx.subagents.reportFrom() 之上的轻量适配器。它为每个可继续的进程内子级提供一条返回通道，指向启动该子级的 Agent，并安装指示子级使用该通道的提示词 section；该工具及其指引只存在于这些子级内部。`,
    en: `The optional child-scoped report tool is a thin adapter over ctx.subagents.reportFrom(). It gives every continuable in-process child a return channel to the Agent that started it, and installs the prompt section that instructs the child to use it; the tool and its guidance exist only inside those children.`,
  },
  '@deepseek-ai/dsh-attachment-local': {
    zh: `@deepseek-ai/dsh-attachment 的私有本地实现。对象存放在 <DSH_HOME>/attachments/v1/objects/<sha256-prefix>/<sha256>，并通过不透明的 sha256: 标识符寻址；写入使用私有暂存目录、仅所有者可访问的文件与原子且排他的硬链接发布，确保已报告的引用能够在崩溃后继续存在。`,
    en: `The private local implementation of @deepseek-ai/dsh-attachment. Objects land at <DSH_HOME>/attachments/v1/objects/<sha256-prefix>/<sha256> and are addressed by an opaque sha256: id; writes use a private staging directory, owner-only files, and atomic exclusive hard-link publication so a reported reference survives a crash.`,
  },
  '@deepseek-ai/dsh-llm-pi-ai': {
    zh: `基于 @earendil-works/pi-ai 的 harness LLM seam 通用多提供方适配器。一个插件实例拥有一份以路由为键的提供方 profile 字典；每个请求使用 GenerateOptions.provider 选择 profile，并针对该路由已配置的 catalog 解析模型。pi-ai 未提供的路由可整体声明，因此接入 OpenAI 兼容网关、自建服务都属于配置而非改代码。`,
    en: `Generic multi-provider adapter for the harness LLM seam backed by @earendil-works/pi-ai. One plugin instance owns a dict of provider profiles keyed by route; every request selects a profile with GenerateOptions.provider and resolves the model against that route's configured catalog. Routes pi-ai does not provide are declared wholesale, so adding OpenAI-compatible gateways or self-hosted services is configuration, not code.`,
  },
  '@deepseek-ai/dsh-client-ui-layout': {
    zh: `外壳插件：三栏 AppFrame（拖动手柄与让步链）加 ctx.layout 面板几何服务；它注册到运行时拥有的 root slot，并声明 sidebar、conversation、details 和 conversation.empty。该包还提供主题呈现器：消费解析后的 ctx.theme 快照，并把配色方案与别名 token 投影到 document。`,
    en: `Shell plugin: three-column AppFrame (drag handles and concession chain) plus the ctx.layout panel-geometry service; it registers into the runtime-owned root slot and declares sidebar, conversation, details, and conversation.empty. The package also provides the theme renderer, which consumes resolved ctx.theme snapshots and projects the color scheme and alias tokens onto the document.`,
  },
  '@deepseek-ai/dsh-credentials-local': {
    zh: `文件型凭据提供方：四层来源，一套明确的优先级——继承的进程环境（始终优先）、$DSH_HOME/.credentials.yaml 文档（可写）、调用目录的 .env 与 $DSH_HOME/.env。`,
    en: `File-backed credentials provider: four layers, one honest precedence — the inherited process environment (always wins), the $DSH_HOME/.credentials.yaml document (writable), the invocation-cwd .env, and the $DSH_HOME/.env.`,
  },
  '@deepseek-ai/dsh-api-gateway': {
    zh: `为 Host 与 Client 两侧的 Cordis 环境提供 Typert RPC endpoint。Host 入口提供 ctx.typertGateway，@deepseek-ai/dsh-api-gateway/client 则提供 ctx.remote；两者使用同一份生成的 InvocationDescriptor 约定，并将业务选择交给 API Remotes，将传输、请求关联、信任和响应封装交给 Connection。`,
    en: `Two-sided Typert RPC endpoint for Host and Client Cordis environments. The Host entry provides ctx.typertGateway, while @deepseek-ai/dsh-api-gateway/client provides ctx.remote; both consume the same generated InvocationDescriptor contract and leave business selection to API Remotes and transport, request correlation, trust, and response envelopes to Connection.`,
  },
  '@deepseek-ai/dsh-skill': {
    zh: `纯 agent skill 提供方注册表：负责 ctx.skills 接口。它不知道 skill 来自本地文件、嵌入式插件数据还是 HTTP；提供方通过 ctx.skills.registerProvider(...) 注册来源，注册表按宿主 + scope 分层，已发布的本地实现是 dsh-skill-filesystem。`,
    en: `Pure agent skill provider registry: owns the ctx.skills interface. It does not know whether skills come from local files, embedded plugin data, or HTTP; providers register sources with ctx.skills.registerProvider(...), and the registry is host+per-scope layered. The shipped local implementation is dsh-skill-filesystem.`,
  },
  '@deepseek-ai/dsh-skill-filesystem': {
    zh: `ctx.skills 注册表的本地文件系统提供方：扫描本地项目、自定义和用户 skill 根目录，解析 SKILL.md 或平铺 Markdown skill 文件，并把提供方注册到 ctx.skills。`,
    en: `Local filesystem provider for the ctx.skills registry: scans local project, custom, and user skill roots, parses SKILL.md or flat Markdown skill files, and registers the provider on ctx.skills.`,
  },
  '@deepseek-ai/dsh-web-app': {
    en: `The dsh browser-surface bundle. cordis.patch.yml rides over dsh-base: it sets the coding persona, inserts the Web host rows (webserver, API gateway, workspace, projection cache, storage) and the browser plugin roster, the always-on client-plugin reload chain, and mounts this package's web-runtime glue plugin.`,
  },
  '@deepseek-ai/dsh-web-app/startup': {
    zh: `dsh-web-app 的 web 启动行：注入命令行参数并发布 webStartup（解析后的 Web 标志，如 host/port），供 webserver 等 Web 宿主行读取。`,
    en: `The web-startup row of dsh-web-app: injects cmdlineArgs and provides webStartup (the parsed Web flags such as host/port) that the webserver and other Web host rows consume.`,
  },
  '@deepseek-ai/dsh-repeat-tool-reminder': {
    en: `An advisory loop-breaker, not a model-facing tool: it never appears in the tool list, never vetoes or rewrites a call, and adds exactly one behavior — it watches each agent's stream of tool calls and counts runs of consecutive calls to the same tool with identical canonicalized arguments; at the configured count it injects escalating prompts asking the model to stop repeating, re-read the last result, and try another approach or finish.`,
  },
  '@deepseek-ai/dsh-tools': {
    en: `Tool registry and execution pipeline. Tool plugins register their schemas and executors; the agent loop executes each call through tools/pre-execute (the extensible allow/deny gate), monotonic registered guards, tools/execute (an around-dispatch wrapper for timeout/retry/metrics plugins), tools/post-execute (inspect/replace results, attach context), and the observing tools/result notification.`,
  },
  '@deepseek-ai/dsh-session-stats': {
    en: `Function plugin registering the sessionStats projection unit: whole-log conversation figures — turn/step counts and the LLM, tool, first-token, and decode wall times — folded from step boundaries, stream chunks, tool pairs, and assembled assistant messages, and served through the session-projection seam.`,
  },
  '@deepseek-ai/dsh-client-modules': {
    en: `Client module system: the browser peer of Node's internal ESM loader, built as a lazy CJS table. The web shell mounts the vendored cordis Loader for entry governance (fiber lifecycle, inject waiting, update/refresh) and injects this package's ClientModuleLoader through its internal contract.`,
  },
  '@deepseek-ai/dsh-client-ui-theme': {
    en: `Theme plugin: ThemeRuntime over the --dsw- token base stylesheets (static scale + alias semantic layers). The service owns the live theme preference (light/dark/system), resolves system through prefers-color-scheme, and publishes immutable ThemeSnapshots on the theme/change event; it never touches the DOM — ui-layout's renderer applies the resolved snapshot.`,
  },
}

function clean(text) {
  return text
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/`{1,3}/g, '')
    .replace(/\*\*?/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

function firstParagraph(md) {
  if (!md) return ''
  const lines = md.split(/\r?\n/)
  const out = []
  let sawTitle = false
  const isSwitcher = (line) =>
    /^\[(English|中文)\]\([^)]*\)\s*\|\s*(English|中文)$/.test(line) ||
    /^(English|中文)\s*\|\s*\[(English|中文)\]\([^)]*\)$/.test(line) ||
    line === 'English | 中文' || line === '中文 | English'
  for (const raw of lines) {
    const line = raw.trim()
    if (!sawTitle) {
      if (/^#\s/.test(line)) { sawTitle = true; continue }
      continue
    }
    if (line === '') {
      if (out.length > 0) break
      continue
    }
    if (/^#+\s/.test(line)) break
    if (isSwitcher(line)) continue
    if (/^!\[/.test(line) || /^<img/.test(line) || /^<p align=/.test(line)) continue
    out.push(line)
  }
  let para = clean(out.join(' '))
  if (!para) return ''
  if (para.length > 430) {
    const cut = para.slice(0, 430)
    const dot = cut.lastIndexOf('. ')
    const zhDot = cut.lastIndexOf('。')
    const best = Math.max(dot, zhDot)
    para = (best > 140 ? cut.slice(0, best + 1) : cut + '…').trim()
  }
  return para
}

/** 保持卡片友好:在真实句界处截断,否则用省略号。 */
function trimHard(text, cap, marks) {
  if (text.length <= cap) return text
  const cut = text.slice(0, cap)
  let best = -1
  for (const mark of marks) best = Math.max(best, cut.lastIndexOf(mark))
  if (best > 40) return cut.slice(0, best + 1).trim()
  return cut.trimEnd() + '…'
}

/** 结尾不留悬空的子句标记。 */
function polish(text, lang) {
  let out = text.trim()
  if (lang === 'zh') {
    if (out.endsWith('；')) out = out.slice(0, -1) + '。'
    if (/[，、：]$/.test(out)) out = out.replace(/[，、：]+$/, '。')
  } else {
    if (out.endsWith(';')) out = out.slice(0, -1) + '.'
    if (/[,:(]$/.test(out)) out = out.replace(/[,:(]+$/, '.')
  }
  return out
}

const result = {}
for (const mod of MODULES) {
  const rec = { zh: '', en: '' }
  if (mod.startsWith('@deepseek-ai/')) {
    const base = mod.replace(/\/startup$/, '').replace(/\/list-agents$/, '')
    const dir = join(CHECKOUT, 'node_modules', base)
    const read = (f) => {
      const p = join(dir, f)
      return existsSync(p) ? readFileSync(p, 'utf8') : ''
    }
    rec.en = firstParagraph(read('README.md'))
    rec.zh = firstParagraph(read('README.zh.md')) || rec.en
  }
  const override = OVERRIDES[mod] || {}
  result[mod] = {
    zh: typeof override.zh === 'string' ? override.zh : polish(trimHard(rec.zh, 200, ['。', '；']), 'zh'),
    en: typeof override.en === 'string' ? override.en : polish(trimHard(rec.en, 230, ['. ', '! ', '? ']), 'en'),
  }
}

const missing = Object.entries(result).filter(([, v]) => !v.zh || !v.en).map(([k]) => k)
if (missing.length > 0) {
  console.error('以下模块缺少描述:', missing)
  process.exit(1)
}

writeFileSync(join(root, 'descriptions', 'plugin-descriptions.json'), JSON.stringify(result, null, 1), 'utf8')
console.log(`regenerate: ${Object.keys(result).length} 条描述已写入 descriptions/plugin-descriptions.json`)
