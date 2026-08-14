// dsh-plugin-description — Client half(浏览器半,由模块系统以经典脚本加载)。
//
// 包声明了 dsh.client(platform: web),宿主侧的 client-modules 扫描器会把本文件
// 注册进 window.__DSH_BOOT__,浏览器内核按包名挂载 factory 的返回值为插件。
window.__ModuleLoader__.load({
  id: 'dsh-plugin-description',
  factory: (require) => {
    const React = require('react')

    const CSS = `
.pd-visuallyHidden { position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; border: 0; }
.pd-section { width: 100%; max-width: 760px; display: flex; flex-direction: column; gap: 14px; color: var(--dsw-alias-label-primary); }
.pd-status { margin: 0; color: var(--dsw-alias-label-tertiary); font-size: 13px; line-height: 20px; }
.pd-failure { color: var(--dsw-alias-state-error-primary); display: flex; align-items: center; gap: 10px; }
.pd-failure p { margin: 0; }
.pd-failure button { border: 1px solid var(--dsw-alias-border-l2); color: var(--dsw-alias-label-primary); font: inherit; cursor: pointer; background: transparent; border-radius: 6px; padding: 4px 10px; }
.pd-catalog { display: flex; flex-direction: column; gap: 12px; }
.pd-search { width: 100%; display: flex; align-items: center; position: relative; color: var(--dsw-alias-label-tertiary); }
.pd-search input { width: 100%; height: 36px; border: 1px solid var(--dsw-alias-border-l2); background: var(--dsw-alias-bg-layer-1); color: var(--dsw-alias-label-primary); font: inherit; font-size: 13px; border-radius: 8px; outline: none; padding: 0 12px; }
.pd-search input::placeholder { color: var(--dsw-alias-label-tertiary); }
.pd-search input:focus-visible { border-color: var(--dsw-alias-state-business-primary); box-shadow: 0 0 0 2px color-mix(in srgb, var(--dsw-alias-state-business-primary) 18%, transparent); }
.pd-heading { display: flex; align-items: baseline; gap: 7px; padding: 0 2px; }
.pd-heading h3 { margin: 0; font-size: 13px; font-weight: 600; line-height: 20px; }
.pd-heading span { color: var(--dsw-alias-label-tertiary); font-variant-numeric: tabular-nums; font-size: 12px; line-height: 18px; }
.pd-cards { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); align-items: start; gap: 10px; margin: 0; padding: 0; list-style: none; }
@media (max-width: 640px) { .pd-cards { grid-template-columns: minmax(0, 1fr); } }
.pd-card { border: 1px solid var(--dsw-alias-border-l2); background: var(--dsw-alias-bg-layer-3); border-radius: 10px; min-width: 0; overflow: hidden; }
.pd-card[data-open='true'] { border-color: var(--dsw-alias-border-l1); box-shadow: var(--dsw-shadow-lv1); }
.pd-cardContent { display: block; width: 100%; text-align: left; background: transparent; border: 0; color: inherit; font: inherit; cursor: pointer; padding: 12px; }
.pd-cardTitle { display: block; font-size: 13px; font-weight: 600; line-height: 18px; color: var(--dsw-alias-label-primary); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
/* 固定三行描述框:闭合卡片等高(补齐短描述);展开时行高不再影响邻居。 */
.pd-desc { display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden; height: 54px; margin-top: 6px; font-size: 12px; line-height: 18px; color: var(--dsw-alias-label-tertiary); }
.pd-descEmpty { font-style: italic; }
.pd-cardTrailing { display: flex; align-items: center; gap: 8px; margin-top: 10px; }
.pd-statusDot { width: 8px; height: 8px; border-radius: 50%; flex: none; }
.pd-statusDot[data-phase='active'] { background: var(--dsw-alias-state-business-primary); }
.pd-statusDot[data-phase='failed'] { background: var(--dsw-alias-state-error-primary); }
.pd-statusDot[data-phase='pending'], .pd-statusDot[data-phase='loading'], .pd-statusDot[data-phase='unloading'] { background: var(--dsw-alias-label-tertiary); }
.pd-statusDot[data-phase='unobserved'] { background: transparent; border: 1px solid var(--dsw-alias-label-tertiary); }
.pd-tag { font-size: 11px; line-height: 16px; padding: 0 8px; border-radius: 999px; border: 1px solid var(--dsw-alias-border-l2); color: var(--dsw-alias-label-tertiary); white-space: nowrap; }
.pd-tag[data-enabled='true'], .pd-tagUser { color: var(--dsw-alias-state-business-primary); border-color: color-mix(in srgb, var(--dsw-alias-state-business-primary) 40%, transparent); }
.pd-chevron { margin-left: auto; color: var(--dsw-alias-label-tertiary); flex: none; transition: transform 0.15s ease; }
.pd-card[data-open='true'] .pd-chevron { transform: rotate(180deg); }
.pd-cardDetails { padding: 0 12px 12px; border-top: 1px solid var(--dsw-alias-border-l2); }
.pd-entryValue { display: block; margin-top: 10px; padding: 6px 8px; font-size: 11px; line-height: 16px; background: var(--dsw-alias-bg-layer-1); border-radius: 6px; color: var(--dsw-alias-label-primary); overflow-x: auto; white-space: nowrap; }
.pd-details { display: flex; flex-direction: column; gap: 6px; margin: 10px 0 0; }
.pd-details > div { display: flex; gap: 8px; font-size: 12px; line-height: 18px; }
.pd-details dt { color: var(--dsw-alias-label-tertiary); flex: none; margin: 0; }
.pd-details dd { margin: 0; color: var(--dsw-alias-label-primary); }
.pd-descFull { margin: 10px 0 0; font-size: 12px; line-height: 18px; color: var(--dsw-alias-label-primary); }
.pd-detailsActions { display: flex; gap: 8px; margin-top: 10px; }
.pd-btn { border: 1px solid var(--dsw-alias-border-l2); color: var(--dsw-alias-label-primary); font: inherit; font-size: 12px; line-height: 18px; cursor: pointer; background: transparent; border-radius: 6px; padding: 4px 10px; }
.pd-btn:hover { border-color: var(--dsw-alias-border-l1); }
.pd-btnPrimary { background: var(--dsw-alias-state-business-primary); border-color: var(--dsw-alias-state-business-primary); color: #fff; }
.pd-btnPrimary:disabled { opacity: 0.6; cursor: default; }
.pd-edit { display: flex; flex-direction: column; gap: 8px; margin-top: 10px; }
.pd-editRow { display: flex; flex-direction: column; gap: 4px; }
.pd-editLabel { font-size: 12px; line-height: 18px; color: var(--dsw-alias-label-tertiary); }
.pd-editText { width: 100%; box-sizing: border-box; border: 1px solid var(--dsw-alias-border-l2); background: var(--dsw-alias-bg-layer-1); color: var(--dsw-alias-label-primary); font: inherit; font-size: 12px; line-height: 18px; border-radius: 6px; padding: 6px 8px; resize: vertical; }
.pd-editText:focus-visible { outline: none; border-color: var(--dsw-alias-state-business-primary); box-shadow: 0 0 0 2px color-mix(in srgb, var(--dsw-alias-state-business-primary) 18%, transparent); }
.pd-editScope { display: flex; align-items: center; gap: 6px; font-size: 12px; line-height: 18px; color: var(--dsw-alias-label-primary); cursor: pointer; }
.pd-editError { margin: 0; font-size: 12px; line-height: 18px; color: var(--dsw-alias-state-error-primary); }
.pd-editActions { display: flex; gap: 8px; }
/* 复用内置 "all" 标签单元格(内容替换);本条目自身的重复标签行是空标签幽灵行,按 role=tab:empty 隐藏。 */
button[role='tab']:empty { display: none; }
`
    const TAG_ID = 'dsh-plugin-description/client.css'
    if (typeof document !== 'undefined' && document.querySelector('style[data-plugin-css=' + JSON.stringify(TAG_ID) + ']') === null) {
      const tag = document.createElement('style')
      tag.dataset.plugin = 'dsh-plugin-description'
      tag.dataset.pluginCss = TAG_ID
      tag.textContent = CSS
      document.head.appendChild(tag)
    }

    const NS = 'settings.pluginDesc'
    const zh = {
      loading: '正在读取插件…',
      error: '暂时无法读取插件。',
      retry: '重试',
      search: '搜索插件或描述',
      catalog: '插件列表',
      empty: '暂无插件。',
      emptySearch: '没有匹配的插件。',
      enabled: '已启用',
      disabled: '已停用',
      configuration: '配置状态',
      cordis: 'Cordis 状态',
      noDescription: '暂无描述。',
      customized: '已自定义',
      edit: '编辑说明',
      cancel: '取消',
      save: '保存',
      restore: '恢复默认',
      zhLabel: '中文说明',
      enLabel: '英文说明',
      scopeEntry: '只改这一张卡片(默认:同名的所有卡片一起改)',
      unobserved: '未挂载',
      pending: '等待依赖',
      loadingPhase: '加载中',
      active: '已挂载',
      failed: '挂载失败',
      unloading: '卸载中',
    }
    const en = {
      loading: 'Reading plugins…',
      error: 'Plugins are temporarily unavailable.',
      retry: 'Retry',
      search: 'Search plugins or descriptions',
      catalog: 'Plugin list',
      empty: 'No plugins are available.',
      emptySearch: 'No matching plugins.',
      enabled: 'Enabled',
      disabled: 'Disabled',
      configuration: 'Configuration',
      cordis: 'Cordis status',
      noDescription: 'No description available.',
      customized: 'Customized',
      edit: 'Edit description',
      cancel: 'Cancel',
      save: 'Save',
      restore: 'Restore default',
      zhLabel: 'Chinese description',
      enLabel: 'English description',
      scopeEntry: 'Only change this card (default: all cards with the same name change together)',
      unobserved: 'Not mounted',
      pending: 'Waiting for dependencies',
      loadingPhase: 'Loading',
      active: 'Mounted',
      failed: 'Mount failed',
      unloading: 'Unloading',
    }

    function phaseLabel(phase, t) {
      if (phase === null || phase === undefined) return t('unobserved')
      if (phase === 'pending') return t('pending')
      if (phase === 'loading') return t('loadingPhase')
      if (phase === 'active') return t('active')
      if (phase === 'failed') return t('failed')
      if (phase === 'unloading') return t('unloading')
      return String(phase)
    }
    function shortName(name) {
      let s = String(name)
      if (s.startsWith('@')) {
        const slash = s.indexOf('/')
        if (slash >= 0) s = s.slice(slash + 1)
      }
      return s.replace(/^cordis:/, '').replace(/^cordis-plugin-/, '').replace(/^dsh-(?:host-|client-)?/, '')
    }
    function Chevron(props) {
      return React.createElement('svg', { viewBox: '0 0 16 16', width: 12, height: 12, 'aria-hidden': 'true', className: props.className, fill: 'none', stroke: 'currentColor', strokeWidth: 1.5 },
        React.createElement('path', { d: 'M4 6l4 4 4-4', strokeLinecap: 'round', strokeLinejoin: 'round' }))
    }
    function postOverrides(body) {
      return fetch('/plugin-descriptions/overrides', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(body),
      }).then((res) => {
        if (!res.ok) throw new Error('HTTP ' + res.status)
        return res.json()
      }).then((data) => {
        if (data === null || typeof data !== 'object' || data.ok !== true) {
          throw new Error((data && data.error) || 'save failed')
        }
        return data
      })
    }

    return {
      name: 'plugin-description-annotator-ui',
      apply(ctx) {
        const slots = ctx.get('slots')
        if (slots === undefined) return
        const locale = ctx.get('locale')
        if (locale !== undefined) {
          ctx.effect(() => locale.register(NS, { zh: zh, en: en }), 'plugin-desc-annotator dictionaries')
        }
        const t = locale !== undefined ? locale.bind(NS) : (key) => key
        const currentLang = () => {
          if (locale === undefined) return 'zh'
          const snapshot = locale.getLocale()
          return snapshot !== undefined && snapshot !== null && snapshot.active === 'en' ? 'en' : 'zh'
        }

        function PluginDescTab() {
          const [state, setState] = React.useState({ status: 'loading' })
          const [request, setRequest] = React.useState(0)
          const [query, setQuery] = React.useState('')
          const [expanded, setExpanded] = React.useState(null)
          const [localeRev, setLocaleRev] = React.useState(0)
          const [editing, setEditing] = React.useState(null)
          const [editZh, setEditZh] = React.useState('')
          const [editEn, setEditEn] = React.useState('')
          const [editScope, setEditScope] = React.useState('module')
          const [saving, setSaving] = React.useState(false)
          const [saveError, setSaveError] = React.useState('')
          React.useEffect(() => {
            let current = true
            fetch('/plugin-descriptions', { cache: 'no-store' }).then((res) => {
              if (!res.ok) throw new Error('HTTP ' + res.status)
              return res.json()
            }).then((data) => {
              if (!current) return
              if (data !== null && typeof data === 'object' && data.ok === true && Array.isArray(data.entries)) {
                setState({ status: 'ready', entries: data.entries, overrides: data.overrides || null })
              } else {
                setState({ status: 'error' })
              }
            }, () => {
              if (current) setState({ status: 'error' })
            })
            return () => { current = false }
          }, [request])
          React.useEffect(() => {
            if (locale === undefined) return undefined
            return locale.subscribe(() => setLocaleRev((value) => value + 1))
          }, [])
          const lang = currentLang()
          const normalized = query.trim().toLocaleLowerCase()
          const entries = state.status === 'ready' ? state.entries : []
          const overrides = state.status === 'ready' ? state.overrides : null
          const filtered = entries.filter((entry) => {
            if (normalized.length === 0) return true
            const text = String(entry.moduleName) + '|' + String(entry.entryId) + '|' + (lang === 'en' ? String(entry.en) : String(entry.zh))
            return text.toLocaleLowerCase().indexOf(normalized) >= 0
          })
          React.useEffect(() => {
            if (expanded !== null && !filtered.some((entry) => entry.entryId === expanded)) setExpanded(null)
          }, [expanded, filtered])
          const retry = () => {
            setState({ status: 'loading' })
            setRequest((value) => value + 1)
          }
          const beginEdit = (entry) => {
            let existing
            let scope = 'module'
            if (overrides !== null && overrides !== undefined) {
              if (overrides.entries !== undefined && overrides.entries[entry.entryId] !== undefined) {
                existing = overrides.entries[entry.entryId]
                scope = 'entry'
              } else if (overrides.modules !== undefined && overrides.modules[entry.moduleName] !== undefined) {
                existing = overrides.modules[entry.moduleName]
                scope = 'module'
              }
            }
            setEditZh(existing !== undefined && typeof existing.zh === 'string' ? existing.zh : String(entry.zh || ''))
            setEditEn(existing !== undefined && typeof existing.en === 'string' ? existing.en : String(entry.en || ''))
            setEditScope(scope)
            setSaveError('')
            setEditing(entry.entryId)
          }
          const saveEdit = (entry) => {
            setSaving(true)
            setSaveError('')
            const body = editScope === 'entry'
              ? { scope: 'entry', entryId: entry.entryId, zh: editZh, en: editEn }
              : { scope: 'module', moduleName: entry.moduleName, zh: editZh, en: editEn }
            postOverrides(body).then(() => {
              setSaving(false)
              setEditing(null)
              setRequest((value) => value + 1)
            }, (error) => {
              setSaving(false)
              setSaveError(String(error && error.message ? error.message : error))
            })
          }
          const restoreDefault = (entry) => {
            setSaving(true)
            setSaveError('')
            let body
            if (overrides !== null && overrides !== undefined && overrides.entries !== undefined && overrides.entries[entry.entryId] !== undefined) {
              body = { scope: 'entry', entryId: entry.entryId, delete: true }
            } else {
              body = { scope: 'module', moduleName: entry.moduleName, delete: true }
            }
            postOverrides(body).then(() => {
              setSaving(false)
              setEditing(null)
              setRequest((value) => value + 1)
            }, (error) => {
              setSaving(false)
              setSaveError(String(error && error.message ? error.message : error))
            })
          }
          return React.createElement('div', { className: 'pd-section', 'aria-busy': state.status === 'loading' },
            state.status === 'loading' ? React.createElement('p', { className: 'pd-status' }, t('loading')) : null,
            state.status === 'error' ? React.createElement('div', { className: 'pd-failure' },
              React.createElement('p', { role: 'alert' }, t('error')),
              React.createElement('button', { type: 'button', onClick: retry }, t('retry'))
            ) : null,
            state.status === 'ready' ? React.createElement('div', { className: 'pd-catalog' },
              React.createElement('label', { className: 'pd-search' },
                React.createElement('span', { className: 'pd-visuallyHidden' }, t('search')),
                React.createElement('input', { type: 'search', value: query, placeholder: t('search'), 'aria-label': t('search'), onChange: (event) => setQuery(event.currentTarget.value) })
              ),
              React.createElement('div', { className: 'pd-heading' },
                React.createElement('h3', null, t('catalog')),
                React.createElement('span', { 'data-plugin-count': filtered.length }, String(filtered.length))
              ),
              entries.length === 0 ? React.createElement('p', { className: 'pd-status' }, t('empty')) : null,
              entries.length > 0 && filtered.length === 0 ? React.createElement('p', { className: 'pd-status' }, t('emptySearch')) : null,
              filtered.length > 0 ? React.createElement('ul', { className: 'pd-cards' },
                filtered.map((entry) => {
                  const status = phaseLabel(entry.fiberPhase, t)
                  const title = shortName(entry.moduleName)
                  const configuration = entry.enabled ? t('enabled') : t('disabled')
                  const description = lang === 'en' ? String(entry.en || '') : String(entry.zh || '')
                  const open = expanded === entry.entryId
                  const isEditing = editing === entry.entryId
                  const detailId = 'pd-details-' + encodeURIComponent(String(entry.entryId))
                  return React.createElement('li', { key: entry.entryId, className: 'pd-card', 'data-plugin-entry': entry.entryId, 'data-open': open ? 'true' : undefined },
                    React.createElement('button', {
                      className: 'pd-cardContent',
                      type: 'button',
                      'aria-expanded': open,
                      'aria-controls': detailId,
                      onClick: () => setExpanded((current) => current === entry.entryId ? null : entry.entryId),
                    },
                      React.createElement('strong', { className: 'pd-cardTitle', title: String(entry.moduleName) }, title),
                      React.createElement('span', { className: description ? 'pd-desc' : 'pd-desc pd-descEmpty' }, description || t('noDescription')),
                      React.createElement('span', { className: 'pd-cardTrailing' },
                        entry.enabled ? React.createElement('span', { className: 'pd-statusDot', 'data-phase': entry.fiberPhase === null || entry.fiberPhase === undefined ? 'unobserved' : entry.fiberPhase, role: 'img', 'aria-label': status, title: status }) : null,
                        React.createElement('span', { className: 'pd-tag', 'data-enabled': entry.enabled ? 'true' : 'false' }, configuration),
                        entry.source === 'user' ? React.createElement('span', { className: 'pd-tag pd-tagUser' }, t('customized')) : null,
                        React.createElement(Chevron, { className: 'pd-chevron' })
                      )
                    ),
                    open ? React.createElement('div', { className: 'pd-cardDetails', id: detailId },
                      React.createElement('code', { className: 'pd-entryValue' }, String(entry.entryId)),
                      React.createElement('dl', { className: 'pd-details' },
                        React.createElement('div', null,
                          React.createElement('dt', null, t('configuration')),
                          React.createElement('dd', null, configuration)
                        ),
                        entry.enabled ? React.createElement('div', null,
                          React.createElement('dt', null, t('cordis')),
                          React.createElement('dd', null, status)
                        ) : null
                      ),
                      description ? React.createElement('p', { className: 'pd-descFull' }, description) : null,
                      isEditing ? React.createElement('div', { className: 'pd-edit' },
                        React.createElement('div', { className: 'pd-editRow' },
                          React.createElement('label', { className: 'pd-editLabel' }, t('zhLabel')),
                          React.createElement('textarea', { className: 'pd-editText', rows: 3, value: editZh, onChange: (event) => setEditZh(event.target.value) })
                        ),
                        React.createElement('div', { className: 'pd-editRow' },
                          React.createElement('label', { className: 'pd-editLabel' }, t('enLabel')),
                          React.createElement('textarea', { className: 'pd-editText', rows: 3, value: editEn, onChange: (event) => setEditEn(event.target.value) })
                        ),
                        React.createElement('label', { className: 'pd-editScope' },
                          React.createElement('input', { type: 'checkbox', checked: editScope === 'entry', onChange: (event) => setEditScope(event.target.checked ? 'entry' : 'module') }),
                          t('scopeEntry')
                        ),
                        saveError ? React.createElement('p', { className: 'pd-editError', role: 'alert' }, saveError) : null,
                        React.createElement('div', { className: 'pd-editActions' },
                          React.createElement('button', { type: 'button', className: 'pd-btn', onClick: () => setEditing(null) }, t('cancel')),
                          entry.source === 'user' ? React.createElement('button', { type: 'button', className: 'pd-btn', disabled: saving, onClick: () => restoreDefault(entry) }, t('restore')) : null,
                          React.createElement('button', { type: 'button', className: 'pd-btn pd-btnPrimary', disabled: saving, onClick: () => saveEdit(entry) }, t('save'))
                        )
                      ) : React.createElement('div', { className: 'pd-detailsActions' },
                        React.createElement('button', { type: 'button', className: 'pd-btn', onClick: () => beginEdit(entry) }, t('edit'))
                      )
                    ) : null
                  )
                })
              ) : null
            ) : null
          )
        }

        // 复用内置 "all" 标签单元格:静态内核要求同 id 用不同 priority 才能遮蔽(最低者渲染),
        // 因此显式声明 priority: -1;本条目自身的重复标签行 label 为空,由 button[role='tab']:empty 隐藏。
        slots.inject('settings.plugins.tab', () => slots.register({
          name: 'settings.plugins.tab',
          id: 'all',
          order: 10,
          priority: -1,
          label: () => '',
        }, PluginDescTab))
      },
    }
  },
})
