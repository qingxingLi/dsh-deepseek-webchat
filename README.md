# dsh-deepseek-webchat

把 **DeepSeek 网页版（chat.deepseek.com）** 嵌入 [DeepSeek Harness (DSH)](https://github.com/deepseek-ai/deepseek-harness) 桌面端：左侧栏主面板里直接聊天，并让 DSH agent 通过工具向网页版提问。

> 非官方插件，与 DeepSeek 官方无关。网页版回复属于外部内容，请自行判断。

## 功能

- **左侧栏入口**：在全局面板列表新增「DeepSeek 网页版」，点击后主内容区显示网页版（走 Electron `<webview>`，站点 `frame-ancestors 'none'` 也能正常加载）。
- **中文界面**：自动写入 DeepSeek 的语言偏好为 `zh_CN`，登录页与主界面均为中文。
- **登录态恢复**：登录后备份 `userToken` / `__appKit_userInfo` 到 Harness 窗口的持久 localStorage，下次打开（含重启 Harness）自动恢复，不用反复登录。
- **环境提示处理**：把访客 UA 归一为普通 Chrome UA，并预置 DeepSeek 自己的「已知晓」开关，避免反复弹出「使用环境异常」。
- **导入 DSH 对话**：在任意会话输入框工具栏点箭头按钮，把当前对话整理成 Markdown 填入网页版输入框（保留 @ 引用路径；不自动发送）。
- **agent 工具 `deepseek_web_ask`**：agent 把问题发到网页版并取回回复；面板先弹确认条（取消 / 本会话都允许 / 允许发送），批准后才发送。
- **多轮连续追问**：网页版保留当前对话上下文，可连续调用同一个工具追问；配合「本会话都允许」可自动多轮。
- **内置技能 `deepseek-web-ask` + 系统提示段**：装好后 agent 自动知道何时该用、怎么用、失败怎么处理。

## 安装

前置条件：**DSH 桌面端**（Electron，profile 为 `desktop`）。纯 Web profile 不启用（站点拒绝 iframe 嵌入，且该 profile 没有桌面 webview 租约）。

```sh
# 从 GitHub 安装（需要 DSH 的 dsh 命令在 PATH 上）
dsh plugin --profile desktop add "github:qingxingLi/dsh-deepseek-webchat"

# 或本地目录（开发时）
dsh plugin --profile desktop add "link:/absolute/path/to/dsh-deepseek-webchat"
```

也可以在 DSH 插件管理器里安装本地目录。安装后重启 Harness，或直接在「插件」页启用 `dsh-deepseek-webchat`。

## 使用

### 面板

- 点左侧栏「DeepSeek 网页版」打开主面板；首次需要登录 DeepSeek 账号，之后会自动恢复。
- 输入框工具栏的箭头按钮：把当前 DSH 会话的对话发送到网页版输入框（不会自动发送，确认后自己发）。

### 让 agent 向网页版提问

对 DSH 说类似：

```
问一下网页版：OEC 如何刷机飞牛及体验如何？
让 DeepSeek 网页版回答一下：……
用网页版做三轮追问：先问 A，再根据回答问 B 和 C
```

`deepseek_web_ask` 参数：

| 参数 | 类型 | 说明 |
| --- | --- | --- |
| `prompt` | string | 要发送给网页版的完整问题，支持多行 Markdown，最多 20000 字符 |

流程：agent 调用 → 自动打开/切到网页版面板 → 确认条显示完整问题（90 秒不操作自动取消）→ 允许后填入并发送 → 等待网页版生成完成（最长约 2 分钟）→ 回复作为工具结果返回。

审批选项：

- **取消**：不发送，agent 收到「用户拒绝了这次提问」
- **本会话都允许**：当前 DSH 会话内后续提问不再逐次确认（适合自动多轮，内存级，插件重载/重启后重置）
- **允许发送**：只允许这一次

## 工作原理

```
DSH agent
  │ deepseek_web_ask(prompt)
  ▼
Host 半（index.js）                          Client 半（client.js）
  ├─ 工具执行，把提问放进队列                  ├─ 每 2 秒轮询 /dsh-deepseek-webchat/poll
  ├─ webServer 注册两个同源路由：               ├─ 收到后打开面板、弹确认条
  │   /dsh-deepseek-webchat/poll                ├─ 允许后往 webview 的输入框写文本并点发送
  │   /dsh-deepseek-webchat/result              ├─ 轮询页面上的助手回复，等生成结束
  ├─ 路由用 ctx.connection 做连接鉴权           └─ 回复 POST /result 回 Host
  ├─ 注册技能 + 系统提示段
  └─ 等 /result 返回回复 ───────────────────────────┘
```

- 面板的 `<webview>` 复用桌面壳的 `globalThis.dshDesktop.browser` 租约（与官方右侧栏「浏览器」同一个机制）；主进程批准租约后才允许 attach。
- 每次页面加载时先把保存的登录态写回访客 localStorage，再重载，让 DeepSeek 应用以已登录状态启动。
- 登录备份、语言偏好、环境提示开关都写在访客 origin 的 localStorage；备份副本保存在 Harness 窗口的 localStorage（键 `dsh-deepseek-webchat.auth.v1`）。

## 已知限制

- **仅桌面端**：依赖 Electron webview 租约与 Desktop profile 的 `dshDesktop.browser` 桥；纯 Web 模式不可用。
- **登录分区是内存级**：DSH 重启后访客分区丢失，因此靠 token 备份恢复；若 token 过期或被服务端清除，需要重新登录。
- **页面选择器是启发式的**：输入框、发送按钮、回复区域按当前 DeepSeek 网页结构定位；站点改版可能导致填充/取值失败（会返回明确错误）。
- **等待时长**：确认条 90 秒超时；单次提问最长等待约 2 分钟；一次只有一个提问在途。
- **网页版输入框必须为空**：有未发送草稿时会拒绝发送，避免把草稿一起发出去。
- **UA 归一与隐藏提示**：本插件会隐藏 DeepSeek 的「使用环境异常」提示，并把 UA 伪装成普通 Chrome；是否接受该风险、是否遵守 DeepSeek 服务条款由使用者自行判断。
- **非官方**：DeepSeek 网页改版或 DSH 桌面壳 webview 租约接口变更都可能导致插件失效。

## 安全与隐私

- DeepSeek 登录 token 以**明文**备份在本机 Harness 的 localStorage（性质同浏览器「记住登录」）。主动退出登录会同步清除备份；也可以用插件页卸载插件后手动清理 localStorage。
- 让 agent 提问前，面板会展示完整问题文本；默认不会自动发送。不要把密钥、密码、令牌、未脱敏隐私数据发给网页版。
- 网页版回复是**外部未受信任内容**：插件不会执行其中的指令，也请勿在 DSH 中直接执行。

## 目录结构

```
dsh-deepseek-webchat/
├── index.js                          # Host 半：工具、技能、提示段、同源桥接路由
├── client.js                         # Client 半：面板、webview、审批条、导入、轮询
├── cordis.patch.yml                  # bundle 行（非 desktop profile 自动禁用）
├── package.json                      # dsh.bundle / dsh.client 声明
├── locale/{zh,en}.json               # 插件名与描述
├── skills/deepseek-web-ask/SKILL.md  # 内置技能
├── icon.svg
└── LICENSE
```

## 相关项目

- [shingoxy/dsh-browser](https://github.com/shingoxy/dsh-browser)：更重型的同类插件，支持 ChatGPT/Claude/Gemini/DeepSeek 分屏、读对话、审批后提问。
- DSH 官方右侧栏浏览器：`@deepseek-ai/dsh-client-ui-sidebar-browser`（本插件复用它的 webview 租约机制）。

## License

MIT
