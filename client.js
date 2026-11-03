window.__ModuleLoader__.load({
  id: 'dsh-deepseek-webchat',
  factory(require) {
    const React = require('react');
    const h = React.createElement;

    /** Locale namespace, the main-panel id (shared with its sidebar entry), and the page it shows. */
    const NS = 'dsh-deepseek-webchat';
    const PANEL_ID = 'deepseek-webchat';
    const CHAT_URL = 'https://chat.deepseek.com/';
    /**
     * Guest storage account handed to the desktop browser bridge. The shell keeps one
     * in-memory session partition per account for this process, so guest storage is lost
     * on app restart; the helpers below carry the DeepSeek sign-in and the UI language
     * across that boundary through this window's own persistent localStorage.
     */
    const WORKSPACE_KEY = 'panel:deepseek-webchat';
    const AUTH_KEY = 'dsh-deepseek-webchat.auth.v1';
    /** DeepSeek's own preference keys and the shape of the values it writes. */
    const LOCALE_KEY = '__appKit_@deepseek/chat_localePreference';
    const PREFERRED_LOCALE = 'zh_CN';
    const WARN_KEY = 'closeUnsafeEnvWarn';
    /** Transcript bounds for one import into the web composer. */
    const TRANSCRIPT_MAX_CHARS = 8000;
    const TRANSCRIPT_MAX_MESSAGES = 60;
    /** Host bridge for agent-initiated questions: same-origin routes on the Host web server. */
    const BRIDGE_POLL_PATH = '/dsh-deepseek-webchat/poll';
    const BRIDGE_RESULT_PATH = '/dsh-deepseek-webchat/result';
    const ASK_WAIT_MS = 120000;
    const ASK_PANEL_WAIT_MS = 30000;

    /** Chinese is the key-set source of truth; English mirrors it key for key. */
    const zh = {
      'panel.label': 'DeepSeek 网页版',
      'panel.loading': '正在打开 DeepSeek 网页版…',
      'panel.error.title': '暂时无法显示 DeepSeek 网页版',
      'panel.error.start': '浏览器面板启动失败，可以重试或在系统浏览器中打开。',
      'panel.error.load': '页面加载失败，可以重试或在系统浏览器中打开。',
      'panel.error.desktop': '这个面板需要在 DeepSeek Harness 桌面应用内使用。',
      'action.retry': '重试',
      'action.external': '在系统浏览器中打开',
      'action.send': '发送到 DeepSeek 网页版',
      'notice.filled': '已填入 DeepSeek 网页版输入框，请检查后发送',
      'notice.noComposer': '网页版还没有显示输入框：请先完成登录，再点一次',
      'notice.failed': '填入失败，请重试',
      'transcript.title': 'DSH 会话',
      'transcript.untitled': '未命名会话',
      'transcript.note': '以下内容由 DeepSeek Harness 从当前会话导入，供参考。',
      'transcript.user': '用户',
      'transcript.assistant': '助手',
      'transcript.steering': '用户（中途引导）',
      'transcript.truncated': '（较早内容已省略）',
      'ask.title': 'DSH agent 想向 DeepSeek 网页版提问',
      'ask.allow': '允许发送',
      'ask.cancel': '取消',
      'ask.sending': '正在发送到网页版…',
      'ask.waiting': '已发送，等待网页版回复…',
      'ask.always': '本会话都允许',
    };
    const en = {
      'panel.label': 'DeepSeek Web',
      'panel.loading': 'Opening DeepSeek web chat…',
      'panel.error.title': 'DeepSeek web chat is unavailable',
      'panel.error.start': 'The browser panel could not start. Retry or open it in your browser.',
      'panel.error.load': 'The page failed to load. Retry or open it in your browser.',
      'panel.error.desktop': 'This panel only works inside the DeepSeek Harness desktop app.',
      'action.retry': 'Retry',
      'action.external': 'Open in browser',
      'action.send': 'Send to DeepSeek web chat',
      'notice.filled': 'Imported into the DeepSeek web composer; review it before sending',
      'notice.noComposer': 'The web composer is not available yet; finish signing in and try again',
      'notice.failed': 'Import failed; try again',
      'transcript.title': 'DSH session',
      'transcript.untitled': 'Untitled session',
      'transcript.note': 'Imported from the current DeepSeek Harness session for reference.',
      'transcript.user': 'User',
      'transcript.assistant': 'Assistant',
      'transcript.steering': 'User (steering)',
      'transcript.truncated': '(earlier content omitted)',
      'ask.title': 'The DSH agent wants to ask the DeepSeek web chat',
      'ask.allow': 'Allow sending',
      'ask.cancel': 'Cancel',
      'ask.sending': 'Sending to the web chat…',
      'ask.waiting': 'Sent; waiting for the web chat reply…',
      'ask.always': 'Allow for this session',
    };

    const CSS = [
      '.dsw-deepseek-webchat-panel{position:relative;display:flex;flex-direction:column;flex:1 1 auto;min-width:0;min-height:0;overflow:hidden;background:var(--dsw-alias-bg-base)}',
      '.dsw-deepseek-webchat-stage{display:flex;flex:1 1 auto;min-width:0;min-height:0}',
      '.dsw-deepseek-webchat-overlay{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px;padding:24px;text-align:center;background:var(--dsw-alias-bg-base);color:var(--dsw-alias-label-secondary);font:var(--dsw-font-xs-13);pointer-events:none}',
      '.dsw-deepseek-webchat-overlay[data-interactive="true"]{pointer-events:auto}',
      '.dsw-deepseek-webchat-title{margin:0;color:var(--dsw-alias-label-primary);font:var(--dsw-font-xs-13);font-weight:600}',
      '.dsw-deepseek-webchat-detail{margin:0;max-width:420px;color:var(--dsw-alias-label-tertiary);font:var(--dsw-font-xxs-12)}',
      '.dsw-deepseek-webchat-actions{display:flex;gap:8px;margin-top:4px}',
      '.dsw-deepseek-webchat-button{height:28px;padding:0 12px;border:0.5px solid var(--dsw-alias-border-l2);border-radius:var(--dsw-radius-sm,6px);background:var(--dsw-alias-bg-layer-1);color:var(--dsw-alias-label-primary);font:var(--dsw-font-xxs-12);cursor:pointer}',
      '.dsw-deepseek-webchat-button:hover{background:var(--dsw-alias-interactive-bg-hover,var(--dsw-alias-bg-layer-2))}',
      '.dsw-deepseek-webchat-button:focus-visible{outline:2px solid var(--dsw-alias-brand-primary);outline-offset:2px}',
      '.dsw-deepseek-webchat-webview{flex:1 1 auto;width:100%;height:100%;min-width:0;min-height:0;border:0;display:flex;background:var(--dsw-alias-bg-base)}',
      '.dsw-deepseek-webchat-send{width:26px;height:26px;padding:0;border:0;border-radius:var(--dsw-radius-sm,6px);display:inline-flex;align-items:center;justify-content:center;background:transparent;color:var(--dsw-alias-label-secondary);cursor:pointer}',
      '.dsw-deepseek-webchat-send:hover:not(:disabled){color:var(--dsw-alias-label-primary);background:var(--dsw-alias-interactive-bg-hover,transparent)}',
      '.dsw-deepseek-webchat-send:disabled{color:var(--dsw-alias-label-quaternary);cursor:default}',
      '.dsw-deepseek-webchat-send:focus-visible{outline:2px solid var(--dsw-alias-brand-primary);outline-offset:2px}',
      '.dsw-deepseek-webchat-notice{position:absolute;left:50%;bottom:16px;transform:translateX(-50%);max-width:min(80%,560px);padding:6px 14px;border-radius:999px;background:var(--dsw-alias-bg-overlay);border:0.5px solid var(--dsw-alias-border-l1);color:var(--dsw-alias-label-primary);font:var(--dsw-font-xxs-12);box-shadow:0 4px 16px rgb(0 0 0 / 12%);pointer-events:none}',
      '.dsw-deepseek-webchat-ask{position:absolute;left:0;right:0;bottom:0;display:flex;flex-direction:column;gap:8px;padding:12px 16px;background:var(--dsw-alias-bg-overlay);border-top:0.5px solid var(--dsw-alias-border-l1);color:var(--dsw-alias-label-primary);font:var(--dsw-font-xxs-12);box-shadow:0 -4px 16px rgb(0 0 0 / 10%)}',
      '.dsw-deepseek-webchat-ask-title{font-weight:600}',
      '.dsw-deepseek-webchat-ask-prompt{max-height:96px;overflow:auto;white-space:pre-wrap;color:var(--dsw-alias-label-secondary)}',
      '.dsw-deepseek-webchat-ask-actions{display:flex;gap:8px;justify-content:flex-end}',
    ].join('');

    const ICON_PATH = 'M6.2 4h11.6A2.2 2.2 0 0 1 20 6.2v7.6a2.2 2.2 0 0 1-2.2 2.2H9.8L5 19.5V16h1.2A2.2 2.2 0 0 1 4 13.8V6.2A2.2 2.2 0 0 1 6.2 4Z';
    const SEND_ICON_PATH = 'M7 17 17 7M9 7h8v8';

    /**
     * DeepSeek's web UI shows its "使用环境异常" notice when the UA contains an
     * Electron (or Tauri) token. This window's own UA is that Electron UA, so strip
     * the embedder tokens and keep the Chromium part for guest navigations.
     */
    function browserUserAgent() {
      const raw = navigator.userAgent;
      const keep = new Set(['Mozilla', 'AppleWebKit', 'Gecko', 'Chrome', 'Safari', 'Chromium', 'Version', 'Mobile', 'Edg', 'OPR']);
      const stripped = raw.replace(/\s(?:Electron|DeepSeek Harness|DeepSeekHarness|dsh-desktop)\/[\w.\-]+/gi, '');
      const parts = stripped.split(' ').filter((part) => {
        const slash = part.indexOf('/');
        if (slash <= 0) return true;
        return keep.has(part.slice(0, slash)) || part.startsWith('Not');
      });
      const cleaned = parts.join(' ').replace(/\s{2,}/g, ' ').trim();
      return cleaned === raw ? undefined : cleaned;
    }
    const VIEW_USER_AGENT = browserUserAgent();

    /** Load the chat page with the Chromium-shaped UA; a plain reload would restore the Electron UA. */
    function loadChat(view) {
      return view.loadURL(CHAT_URL, VIEW_USER_AGENT === undefined ? {} : { userAgent: VIEW_USER_AGENT });
    }

    /** Serialized guest state the panel reads after each committed navigation. */
    const GUEST_READ = `(() => {
  const read = (key) => { try { return localStorage.getItem(key); } catch (error) { return null; } };
  const valueOf = (raw) => {
    if (raw === null) return null;
    try {
      const parsed = JSON.parse(raw);
      return parsed !== null && typeof parsed === 'object' && 'value' in parsed ? parsed.value : parsed;
    } catch (error) { return raw; }
  };
  const tokenRaw = read('userToken');
  const userInfoRaw = read('__appKit_userInfo');
  const warn = valueOf(read(${JSON.stringify(WARN_KEY)}));
  const locale = valueOf(read(${JSON.stringify(LOCALE_KEY)}));
  return JSON.stringify({ token: valueOf(tokenRaw), tokenRaw, userInfoRaw, locale, warnDismissed: warn === true });
})()`;

    /** Build a script that writes the given raw storage values into the guest origin. */
    function guestWrite(entries) {
      const writes = entries.map(([key, value]) => (
        `try { localStorage.setItem(${JSON.stringify(key)}, ${JSON.stringify(value)}); } catch (error) {}`
      ));
      return `(() => { ${writes.join(' ')} return true; })()`;
    }

    /**
     * Fill the visible DeepSeek composer with imported text. Textarea and
     * contenteditable variants are both handled; an existing draft is kept and the
     * import is appended after it instead of replacing it.
     */
    function fillComposerScript(text) {
      return `(() => {
  const incoming = ${JSON.stringify(text)};
  const separator = String.fromCharCode(10, 10);
  const textarea = document.querySelector('textarea[placeholder*="DeepSeek"]') || document.querySelector('textarea');
  if (textarea !== null) {
    const descriptor = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value');
    if (descriptor === undefined || typeof descriptor.set !== 'function') return false;
    const existing = typeof textarea.value === 'string' ? textarea.value : '';
    descriptor.set.call(textarea, existing.trim() === '' ? incoming : existing + separator + incoming);
    textarea.dispatchEvent(new Event('input', { bubbles: true }));
    textarea.dispatchEvent(new Event('change', { bubbles: true }));
    textarea.focus();
    return true;
  }
  const editable = document.querySelector('[contenteditable="true"]');
  if (editable !== null) {
    editable.focus();
    const existing = typeof editable.textContent === 'string' ? editable.textContent : '';
    editable.textContent = existing.trim() === '' ? incoming : existing + separator + incoming;
    editable.dispatchEvent(new InputEvent('input', { bubbles: true, inputType: 'insertText', data: incoming }));
    return true;
  }
  return false;
})()`;
    }

    /**
     * Agent-initiated question scripts. They run inside the guest page: fill the
     * composer only when it is empty, submit, then report reply progress. The caller
     * polls the reply script until the assistant answer appears and stops growing.
     */
    function askFillScript(prompt) {
      return `(() => {
  const prompt = ${JSON.stringify(prompt)};
  const textarea = document.querySelector('textarea[placeholder*="DeepSeek"]') || document.querySelector('textarea');
  if (textarea === null) return JSON.stringify({ ok: false, reason: 'no-composer' });
  if (typeof textarea.value === 'string' && textarea.value.trim() !== '') return JSON.stringify({ ok: false, reason: 'draft-exists' });
  const descriptor = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value');
  if (descriptor === undefined || typeof descriptor.set !== 'function') return JSON.stringify({ ok: false, reason: 'no-composer' });
  descriptor.set.call(textarea, prompt);
  textarea.dispatchEvent(new Event('input', { bubbles: true }));
  textarea.dispatchEvent(new Event('change', { bubbles: true }));
  textarea.focus();
  const nodes = document.querySelectorAll('.ds-assistant-message-main-content');
  return JSON.stringify({ ok: true, baseline: nodes.length });
})()`;
    }

    function askSendScript() {
      return `(() => {
  const button = document.querySelector('div.ds-button--primary') || document.querySelector('button[type="submit"]');
  if (button !== null && button.disabled !== true) {
    button.click();
    return JSON.stringify({ ok: true, via: 'click' });
  }
  const textarea = document.querySelector('textarea[placeholder*="DeepSeek"]') || document.querySelector('textarea');
  if (textarea === null) return JSON.stringify({ ok: false, reason: 'no-composer' });
  for (const type of ['keydown', 'keyup']) {
    textarea.dispatchEvent(new KeyboardEvent(type, { key: 'Enter', code: 'Enter', keyCode: 13, which: 13, bubbles: true, cancelable: true }));
  }
  return JSON.stringify({ ok: true, via: 'enter' });
})()`;
    }

    function askComposerStateScript() {
      return `(() => {
  const textarea = document.querySelector('textarea[placeholder*="DeepSeek"]') || document.querySelector('textarea');
  const nodes = document.querySelectorAll('.ds-assistant-message-main-content');
  const value = textarea !== null && typeof textarea.value === 'string' ? textarea.value : '';
  return JSON.stringify({ composerEmpty: value.trim() === '', count: nodes.length });
})()`;
    }

    function askReplyScript() {
      return `(() => {
  const selectors = ['.ds-assistant-message-main-content', '[class*="assistant-message-main-content"]', '[class*="assistant-message"]', '.ds-markdown'];
  let nodes = [];
  for (const selector of selectors) {
    const found = document.querySelectorAll(selector);
    if (found.length > 0) { nodes = found; break; }
  }
  const last = nodes.length > 0 && typeof nodes[nodes.length - 1].innerText === 'string' ? nodes[nodes.length - 1].innerText.trim() : '';
  const generating = document.querySelector('div[class*="stop"]') !== null;
  return JSON.stringify({ count: nodes.length, last, generating });
})()`;
    }

    /** DSH sessions whose user chose "allow everything for this session". */
    const allowedAskSessions = new Set();
    /** The mounted panel publishes its ask handler here while its guest is ready. */
    const panelApi = { ask: null };
    const delay = (ms) => new Promise((resolve) => {
      window.setTimeout(resolve, ms);
    });
    function parseScriptValue(raw) {
      if (typeof raw !== 'string') return null;
      try {
        return JSON.parse(raw);
      } catch (error) {
        return null;
      }
    }

    /**
     * Saved sign-in lives in this Harness window's persistent storage. DeepSeek wraps
     * every localStorage value in a `{value, __version}` record, so unwrap only for the
     * validity check and keep the raw record for writing back verbatim.
     */
    function unwrapStoredValue(raw) {
      if (typeof raw !== 'string') return null;
      try {
        const parsed = JSON.parse(raw);
        return parsed !== null && typeof parsed === 'object' && 'value' in parsed ? parsed.value : parsed;
      } catch (error) {
        return raw;
      }
    }
    function readSavedAuth() {
      try {
        const raw = window.localStorage.getItem(AUTH_KEY);
        if (raw === null) return null;
        const parsed = JSON.parse(raw);
        if (parsed === null || typeof parsed !== 'object') return null;
        const tokenRaw = parsed.tokenRaw ?? parsed.token;
        if (typeof tokenRaw !== 'string') return null;
        const token = unwrapStoredValue(tokenRaw);
        if (typeof token !== 'string' || token.length === 0) return null;
        const userInfoRaw = parsed.userInfoRaw ?? parsed.userInfo;
        return {
          tokenRaw,
          userInfoRaw: typeof userInfoRaw === 'string' ? userInfoRaw : undefined,
        };
      } catch (error) {
        return null;
      }
    }
    function saveAuth(tokenRaw, userInfoRaw) {
      try {
        window.localStorage.setItem(AUTH_KEY, JSON.stringify({ tokenRaw, userInfoRaw, savedAt: Date.now() }));
      } catch (error) {}
    }
    function forgetAuth() {
      try {
        window.localStorage.removeItem(AUTH_KEY);
      } catch (error) {}
    }

    /**
     * One-way channel from the DSH composer action to the panel's guest page. The
     * action may run while the panel is closed or still starting, so the request is
     * kept until a mounted panel reports that its webview is ready.
     */
    const fillRequests = { pending: null, listeners: new Set() };
    function requestFill(text) {
      fillRequests.pending = text;
      for (const listener of [...fillRequests.listeners]) {
        try { listener(text); } catch (error) { console.warn('[deepseek-webchat] fill listener failed', error); }
      }
    }

    /** Text blocks of one user (or steering) message; attachments become bracketed names. */
    function textOfUserContent(content) {
      if (typeof content === 'string') return content.trim();
      if (!Array.isArray(content)) return '';
      const parts = [];
      for (const block of content) {
        if (block === null || typeof block !== 'object') continue;
        if (block.type === 'text' && typeof block.text === 'string') parts.push(block.text);
        else if ((block.type === 'image' || block.type === 'file') && block.attachment !== undefined && typeof block.attachment.name === 'string') {
          parts.push('[' + block.attachment.name + ']');
        }
      }
      return parts.join('').trim();
    }

    /** Answer text of one finalized assistant step; reasoning and tool calls are skipped. */
    function textOfAssistantBlocks(blocks) {
      if (!Array.isArray(blocks)) return '';
      const parts = [];
      for (const block of blocks) {
        if (block === null || typeof block !== 'object') continue;
        if (block.kind === 'text' && typeof block.text === 'string') parts.push(block.text);
      }
      return parts.join('').trim();
    }

    /** Walk the Chat projection in display order and collect the human-visible messages. */
    function collectTranscript(order, nodes) {
      const messages = [];
      if (!Array.isArray(order) || nodes === null || typeof nodes !== 'object') return messages;
      const get = typeof nodes.get === 'function' ? (key) => nodes.get(key) : (key) => nodes[key];
      for (const key of order) {
        const node = get(key);
        if (node === null || typeof node !== 'object' || node.data === null || typeof node.data !== 'object') continue;
        if (node.kind === 'user' || node.kind === 'steering') {
          const text = textOfUserContent(node.data.content);
          if (text !== '') messages.push({ role: node.kind === 'steering' ? 'steering' : 'user', text });
        } else if (node.kind === 'assistant-step') {
          const text = textOfAssistantBlocks(node.data.blocks);
          if (text !== '') messages.push({ role: 'assistant', text });
        }
      }
      return messages.slice(-TRANSCRIPT_MAX_MESSAGES);
    }

    /** Render the collected messages as Markdown for the web chat composer. */
    function buildTranscript(messages, labels) {
      const body = messages.map((message) => {
        const heading = message.role === 'user' ? labels.user : message.role === 'steering' ? labels.steering : labels.assistant;
        return '## ' + heading + '\n\n' + message.text;
      }).join('\n\n');
      const clipped = body.length > TRANSCRIPT_MAX_CHARS
        ? labels.truncated + '\n\n' + body.slice(-TRANSCRIPT_MAX_CHARS)
        : body;
      return ['# ' + labels.title, '', '> ' + labels.note, '', clipped, ''].join('\n');
    }

    /** Sidebar row glyph; the sidebar owns the button and asks for a square edge. */
    function PanelIcon(props) {
      const size = typeof props.size === 'number' ? props.size : 16;
      return h('svg', {
        width: size,
        height: size,
        viewBox: '0 0 24 24',
        fill: 'none',
        stroke: 'currentColor',
        strokeWidth: 1.8,
        strokeLinecap: 'round',
        strokeLinejoin: 'round',
        'aria-hidden': true,
      }, h('path', { d: ICON_PATH }));
    }

    /** Composer-row glyph for "send this conversation to the web chat". */
    function SendIcon() {
      return h('svg', {
        width: 16,
        height: 16,
        viewBox: '0 0 24 24',
        fill: 'none',
        stroke: 'currentColor',
        strokeWidth: 1.8,
        strokeLinecap: 'round',
        strokeLinejoin: 'round',
        'aria-hidden': true,
      }, h('path', { d: SEND_ICON_PATH }));
    }

    return {
      inject: ['slots', 'locale', 'layout'],
      apply(ctx) {
        ctx.effect(() => ctx.locale.register(NS, { zh, en }), 'deepseek-webchat: dictionaries');

        let translate;
        try {
          translate = ctx.locale.bind(NS);
        } catch {}
        const copy = (key) => {
          const text = translate?.(key);
          return typeof text === 'string' && text.length > 0 ? text : (zh[key] ?? key);
        };

        ctx.effect(() => {
          const style = document.createElement('style');
          style.textContent = CSS;
          document.head.appendChild(style);
          return () => style.remove();
        }, 'deepseek-webchat: styles');

        /**
         * The guest webview is created imperatively, never through React: the desktop
         * shell approves a lease in the main process, and only then may the tag attach.
         * After each commit the panel restores the saved sign-in into guest storage,
         * pins the UI language to Chinese, and flushes any transcript import.
         */
        function Panel() {
          const stage = React.useRef(null);
          const askResolver = React.useRef(null);
          const approvalTimer = React.useRef(null);
          const [status, setStatus] = React.useState('loading');
          const [attempt, setAttempt] = React.useState(0);
          const [notice, setNotice] = React.useState(null);
          const [ask, setAsk] = React.useState(null);

          React.useEffect(() => {
            const stageElement = stage.current;
            if (stageElement === null) return undefined;
            const bridge = globalThis.dshDesktop;
            const browser = bridge !== undefined && bridge.protocolVersion === 1 ? bridge.browser : undefined;
            if (browser === undefined || typeof browser.acquire !== 'function' || typeof browser.release !== 'function') {
              setStatus('unavailable');
              return undefined;
            }

            let disposed = false;
            let lease;
            let element;
            let ready = false;
            let initialized = false;
            let reloaded = false;
            let sawToken = false;
            let syncing = false;
            let timer;
            let poll;
            let pendingFill = null;
            let noticeTimer;
            const lifetime = new AbortController();
            setStatus('loading');

            const showNotice = (text) => {
              if (disposed) return;
              setNotice(text);
              window.clearTimeout(noticeTimer);
              noticeTimer = window.setTimeout(() => {
                if (!disposed) setNotice(null);
              }, 4000);
            };

            /** Wait for the user's verdict on one agent question; deny on timeout/unmount. */
            const askApproval = (prompt, sessionId) => new Promise((resolve) => {
              askResolver.current = resolve;
              setAsk({ phase: 'approval', prompt, allowAlways: typeof sessionId === 'string' && sessionId.length > 0 });
              window.clearTimeout(approvalTimer.current);
              approvalTimer.current = window.setTimeout(() => {
                if (askResolver.current !== resolve) return;
                askResolver.current = null;
                resolve('timeout');
              }, 90000);
            });

            /**
             * Answer one agent question through the guest page: fill the (empty) composer,
             * submit, then poll the assistant answer until it stops growing. Approval is per
             * session; choosing "本会话都允许" skips the bar for the later asks.
             */
            const askWebChat = async (prompt, sessionId) => {
              if (disposed || !ready || element === undefined) return { ok: false, error: 'panel-not-ready' };
              const sessionAllowed = typeof sessionId === 'string' && sessionId.length > 0 && allowedAskSessions.has(sessionId);
              let verdict = 'allow';
              if (!sessionAllowed) verdict = await askApproval(prompt, sessionId);
              if (disposed || element === undefined) return { ok: false, error: 'closed' };
              if (verdict === 'always' && typeof sessionId === 'string' && sessionId.length > 0) {
                allowedAskSessions.add(sessionId);
              } else if (verdict !== 'allow') {
                setAsk(null);
                return { ok: false, error: 'denied' };
              }
              setAsk({ phase: 'sending', prompt });
              try {
                const fill = parseScriptValue(await element.executeJavaScript(askFillScript(prompt), false));
                if (fill === null || fill.ok !== true) {
                  return { ok: false, error: fill !== null && typeof fill.reason === 'string' ? fill.reason : 'no-composer' };
                }
                await delay(400);
                const send = parseScriptValue(await element.executeJavaScript(askSendScript(), false));
                if (send === null || send.ok !== true) {
                  return { ok: false, error: send !== null && typeof send.reason === 'string' ? send.reason : 'send-failed' };
                }
                await delay(1200);
                const afterSend = parseScriptValue(await element.executeJavaScript(askComposerStateScript(), false));
                if (afterSend !== null && afterSend.composerEmpty !== true && afterSend.count <= fill.baseline) {
                  await element.executeJavaScript(askSendScript(), false);
                  await delay(1200);
                }
                if (!disposed) setAsk({ phase: 'waiting', prompt });
                const deadline = Date.now() + ASK_WAIT_MS;
                let last = '';
                let stable = 0;
                let hasNew = false;
                while (Date.now() < deadline) {
                  if (disposed || element === undefined) return { ok: false, error: 'closed' };
                  await delay(900);
                  const state = parseScriptValue(await element.executeJavaScript(askReplyScript(), false));
                  if (state === null) continue;
                  const reply = typeof state.last === 'string' ? state.last : '';
                  if (state.count > fill.baseline || (reply !== '' && reply !== last)) hasNew = true;
                  if (hasNew && reply !== '' && reply === last && state.generating !== true) {
                    stable += 1;
                    if (stable >= 1) return { ok: true, reply };
                  } else {
                    stable = 0;
                  }
                  last = reply;
                }
                return { ok: false, error: 'reply-timeout' };
              } catch (error) {
                console.warn('[deepseek-webchat] agent ask failed', error);
                return { ok: false, error: 'client-error' };
              } finally {
                if (!disposed) setAsk(null);
              }
            };

            const finish = () => {
              if (disposed || ready) return;
              ready = true;
              panelApi.ask = askWebChat;
              window.clearTimeout(timer);
              setStatus('ready');
              flushFill();
            };

            const flushFill = () => {
              if (pendingFill === null || element === undefined || !ready) return;
              const text = pendingFill;
              pendingFill = null;
              element.executeJavaScript(fillComposerScript(text), false).then((written) => {
                if (disposed) return;
                showNotice(written === true ? copy('notice.filled') : copy('notice.noComposer'));
              }).catch((error) => {
                console.warn('[deepseek-webchat] could not import the conversation', error);
                if (!disposed) showNotice(copy('notice.failed'));
              });
            };

            const receiveFill = (text) => {
              if (disposed) return;
              fillRequests.pending = null;
              pendingFill = text;
              flushFill();
            };
            fillRequests.listeners.add(receiveFill);
            if (fillRequests.pending !== null) {
              const queued = fillRequests.pending;
              fillRequests.pending = null;
              receiveFill(queued);
            }

            const release = () => {
              if (lease === undefined) return;
              const owned = lease;
              lease = undefined;
              void browser.release(owned).catch((error) => {
                console.warn('[deepseek-webchat] guest release failed', error);
              });
            };

            const readGuest = async () => {
              if (element === undefined) return null;
              const raw = await element.executeJavaScript(GUEST_READ, false);
              if (typeof raw !== 'string') return null;
              return JSON.parse(raw);
            };

            /**
             * Persist a refreshed token; forget it once the guest really signed out.
             * The guest initialises `userToken` to a `{value:null}` record before login,
             * which is NOT a token: only an unwrapped non-empty string may overwrite the
             * saved sign-in.
             */
            const syncAuth = async (state) => {
              const token = state.token;
              if (typeof token === 'string' && token.length > 0 && typeof state.tokenRaw === 'string') {
                sawToken = true;
                saveAuth(state.tokenRaw, typeof state.userInfoRaw === 'string' ? state.userInfoRaw : undefined);
              } else if (initialized && sawToken) {
                sawToken = false;
                forgetAuth();
              }
            };

            /**
             * Restore once per mount: saved sign-in, the Chinese locale and the dismissed
             * environment notice are written before one reload, so the app boots with all
             * of them already in place.
             */
            const restore = async (state) => {
              const saved = readSavedAuth();
              const needsRestore = !sawToken && saved !== null;
              const needsLocale = state.locale === null || state.locale === 'system';
              const needsWarning = state.warnDismissed !== true;
              if ((!needsRestore && !needsLocale && !needsWarning) || initialized || reloaded) {
                initialized = true;
                if (!sawToken && saved !== null) forgetAuth();
                finish();
                return;
              }
              reloaded = true;
              const entries = [];
              if (needsRestore) {
                entries.push(['userToken', saved.tokenRaw]);
                if (saved.userInfoRaw !== undefined) entries.push(['__appKit_userInfo', saved.userInfoRaw]);
              }
              if (needsLocale) {
                entries.push([LOCALE_KEY, JSON.stringify({ value: PREFERRED_LOCALE, __version: '0' })]);
              }
              if (needsWarning) {
                entries.push([WARN_KEY, JSON.stringify({ value: true, __version: '0' })]);
              }
              try {
                await element.executeJavaScript(guestWrite(entries), false);
              } catch (error) {
                console.warn('[deepseek-webchat] could not seed guest storage', error);
              }
              initialized = true;
              loadChat(element).catch((error) => {
                if (disposed) return;
                console.warn('[deepseek-webchat] reload failed', error);
                setStatus('error');
              });
            };

            const onCommitted = async () => {
              if (disposed || syncing) return;
              syncing = true;
              try {
                const state = await readGuest();
                if (state === null) {
                  finish();
                  return;
                }
                await syncAuth(state);
                if (!initialized) {
                  await restore(state);
                } else {
                  // A restore that came back without a token was rejected; do not keep
                  // handing the same dead token to every later mount.
                  if (!sawToken && readSavedAuth() !== null) forgetAuth();
                  finish();
                }
              } catch (error) {
                console.warn('[deepseek-webchat] could not inspect the DeepSeek session', error);
                finish();
              } finally {
                syncing = false;
              }
            };

            /** Light sync for in-page navigation and the periodic poll: no reload. */
            const syncQuietly = async () => {
              if (disposed || syncing || !initialized) return;
              syncing = true;
              try {
                const state = await readGuest();
                if (state !== null) await syncAuth(state);
              } catch (error) {} finally {
                syncing = false;
              }
            };

            (async () => {
              try {
                const reservation = await browser.acquire(WORKSPACE_KEY);
                if (disposed) {
                  void browser.release(reservation.lease).catch(() => {});
                  return;
                }
                lease = reservation.lease;
                const view = document.createElement('webview');
                element = view;
                view.className = 'dsw-deepseek-webchat-webview';
                view.setAttribute('name', reservation.lease);
                view.setAttribute('partition', reservation.partition);
                view.setAttribute('src', 'about:blank#' + reservation.lease);
                view.addEventListener('dom-ready', () => {
                  if (disposed) return;
                  loadChat(view).catch((error) => {
                    if (disposed || ready) return;
                    console.warn('[deepseek-webchat] navigation failed', error);
                    setStatus('error');
                  });
                }, { once: true, signal: lifetime.signal });
                view.addEventListener('did-navigate', (event) => {
                  if (disposed || event.url.startsWith('about:') === true) return;
                  void onCommitted();
                }, { signal: lifetime.signal });
                view.addEventListener('did-navigate-in-page', () => {
                  void syncQuietly();
                }, { signal: lifetime.signal });
                view.addEventListener('did-fail-load', (event) => {
                  if (disposed || ready || event.isMainFrame !== true || event.errorCode === -3) return;
                  console.warn('[deepseek-webchat] page failed to load', event.errorCode, event.errorDescription);
                  setStatus('error');
                }, { signal: lifetime.signal });
                view.addEventListener('render-process-gone', () => {
                  if (disposed || ready) return;
                  setStatus('error');
                }, { signal: lifetime.signal });
                timer = window.setTimeout(() => {
                  if (!disposed && !ready) setStatus('error');
                }, 30000);
                poll = window.setInterval(() => {
                  void syncQuietly();
                }, 8000);
                stageElement.appendChild(view);
              } catch (error) {
                console.warn('[deepseek-webchat] cannot start the desktop browser guest', error);
                if (!disposed) setStatus('error');
              }
            })();

            return () => {
              disposed = true;
              lifetime.abort();
              fillRequests.listeners.delete(receiveFill);
              if (panelApi.ask === askWebChat) panelApi.ask = null;
              window.clearTimeout(timer);
              window.clearTimeout(noticeTimer);
              window.clearTimeout(approvalTimer.current);
              const resolveAsk = askResolver.current;
              askResolver.current = null;
              if (resolveAsk !== null) resolveAsk('deny');
              window.clearInterval(poll);
              if (element !== undefined) element.remove();
              release();
            };
          }, [attempt]);

          const openExternal = () => {
            window.open(CHAT_URL, '_blank', 'noopener');
          };

          let overlay;
          if (status === 'loading') {
            overlay = h('div', { className: 'dsw-deepseek-webchat-overlay' }, copy('panel.loading'));
          } else if (status === 'unavailable') {
            overlay = h('div', { className: 'dsw-deepseek-webchat-overlay', 'data-interactive': 'true' },
              h('p', { className: 'dsw-deepseek-webchat-title' }, copy('panel.error.title')),
              h('p', { className: 'dsw-deepseek-webchat-detail' }, copy('panel.error.desktop')),
              h('div', { className: 'dsw-deepseek-webchat-actions' },
                h('button', { type: 'button', className: 'dsw-deepseek-webchat-button', onClick: openExternal }, copy('action.external'))));
          } else if (status === 'error') {
            overlay = h('div', { className: 'dsw-deepseek-webchat-overlay', 'data-interactive': 'true' },
              h('p', { className: 'dsw-deepseek-webchat-title' }, copy('panel.error.title')),
              h('p', { className: 'dsw-deepseek-webchat-detail' }, copy('panel.error.load')),
              h('div', { className: 'dsw-deepseek-webchat-actions' },
                h('button', { type: 'button', className: 'dsw-deepseek-webchat-button', onClick: () => setAttempt((value) => value + 1) }, copy('action.retry')),
                h('button', { type: 'button', className: 'dsw-deepseek-webchat-button', onClick: openExternal }, copy('action.external'))));
          }

          const answerAsk = (verdict) => {
            const resolve = askResolver.current;
            if (resolve === null) return;
            askResolver.current = null;
            window.clearTimeout(approvalTimer.current);
            resolve(verdict);
          };

          let askBar = null;
          if (ask !== null) {
            askBar = h('div', { className: 'dsw-deepseek-webchat-ask' },
              h('div', { className: 'dsw-deepseek-webchat-ask-title' }, copy('ask.title')),
              ask.phase === 'approval'
                ? h('div', { className: 'dsw-deepseek-webchat-ask-prompt' }, ask.prompt)
                : h('div', { className: 'dsw-deepseek-webchat-ask-prompt' }, ask.phase === 'sending' ? copy('ask.sending') : copy('ask.waiting')),
              ask.phase === 'approval'
                ? h('div', { className: 'dsw-deepseek-webchat-ask-actions' },
                  h('button', { type: 'button', className: 'dsw-deepseek-webchat-button', onClick: () => answerAsk('deny') }, copy('ask.cancel')),
                  ask.allowAlways === true
                    ? h('button', { type: 'button', className: 'dsw-deepseek-webchat-button', onClick: () => answerAsk('always') }, copy('ask.always'))
                    : null,
                  h('button', { type: 'button', className: 'dsw-deepseek-webchat-button', onClick: () => answerAsk('allow') }, copy('ask.allow')))
                : null);
          }

          return h('div', { className: 'dsw-deepseek-webchat-panel' },
            h('div', { className: 'dsw-deepseek-webchat-stage', ref: stage }),
            overlay,
            notice === null ? null : h('div', { className: 'dsw-deepseek-webchat-notice' }, notice),
            askBar);
        }

        /**
         * Session-scoped composer action: read the Chat projection, render the visible
         * transcript as Markdown, and hand it to the web-chat panel (which opens and
         * fills its composer). Nothing is sent to DeepSeek automatically.
         */
        function SendToWebChat(props) {
          const sessionId = props.sessionId;
          const useChat = props.useChat;
          const useSessions = props.useSessions;
          const order = useChat((snapshot) => snapshot.order);
          const nodes = useChat((snapshot) => snapshot.nodes);
          const title = useSessions((snapshot) => snapshot.byId[sessionId]?.title);
          const messages = React.useMemo(() => collectTranscript(order, nodes), [order, nodes]);
          const disabled = messages.length === 0;
          const send = () => {
            const sessionTitle = typeof title === 'string' && title.length > 0 ? title : copy('transcript.untitled');
            requestFill(buildTranscript(messages, {
              title: copy('transcript.title') + ' · ' + sessionTitle,
              note: copy('transcript.note'),
              user: copy('transcript.user'),
              assistant: copy('transcript.assistant'),
              steering: copy('transcript.steering'),
              truncated: copy('transcript.truncated'),
            }));
            ctx.layout.selectPanel(PANEL_ID);
          };
          return h('button', {
            type: 'button',
            className: 'dsw-deepseek-webchat-send',
            title: copy('action.send'),
            'aria-label': copy('action.send'),
            disabled,
            onClick: send,
          }, SendIcon());
        }

        /** Open the panel if needed, wait until its guest is ready, then run the question. */
        const runAgentAsk = async (prompt, sessionId) => {
          try {
            ctx.layout.selectPanel(PANEL_ID);
          } catch (error) {
            console.warn('[deepseek-webchat] could not open the panel', error);
          }
          const deadline = Date.now() + ASK_PANEL_WAIT_MS;
          while (Date.now() < deadline) {
            if (panelApi.ask !== null) break;
            await delay(300);
          }
          if (panelApi.ask === null) return { ok: false, error: 'panel-not-ready' };
          return await panelApi.ask(prompt, sessionId);
        };

        /**
         * Agent bridge poller: the Host tool queues one question, this side picks it up,
         * runs it through the panel, and posts the answer back. Requests are authenticated
         * by the Host connection, not by a plugin secret.
         */
        ctx.effect(() => {
          const bridge = globalThis.dshDesktop;
          if (bridge === undefined || bridge.protocolVersion !== 1) return undefined;
          let asking = false;
          let stopped = false;
          const postResult = async (id, result) => {
            const response = await fetch(BRIDGE_RESULT_PATH, {
              method: 'POST',
              headers: { 'content-type': 'application/json' },
              body: JSON.stringify({
                id,
                ok: result.ok === true,
                reply: result.ok === true ? result.reply : undefined,
                error: result.ok === true ? undefined : result.error,
              }),
            });
            if (!response.ok) throw new Error('result rejected with ' + String(response.status));
          };
          const poll = async () => {
            if (asking || stopped) return;
            let command = null;
            try {
              const response = await fetch(BRIDGE_POLL_PATH, {
                method: 'POST',
                headers: { 'content-type': 'application/json' },
                body: '{}',
              });
              if (!response.ok) return;
              const data = await response.json();
              command = data !== null && typeof data === 'object' ? data.command : null;
            } catch (error) {
              return;
            }
            if (command === null || stopped || typeof command.id !== 'string' || typeof command.prompt !== 'string') return;
            asking = true;
            try {
              const result = await runAgentAsk(command.prompt, typeof command.sessionId === 'string' ? command.sessionId : undefined);
              await postResult(command.id, result);
            } catch (error) {
              console.warn('[deepseek-webchat] agent bridge failed', error);
              try {
                await postResult(command.id, { ok: false, error: 'client-error' });
              } catch (postError) {
                console.warn('[deepseek-webchat] could not post the agent result', postError);
              }
            } finally {
              asking = false;
            }
          };
          const timer = window.setInterval(() => {
            void poll();
          }, 2000);
          void poll();
          return () => {
            stopped = true;
            window.clearInterval(timer);
          };
        }, 'deepseek-webchat: agent bridge');

        ctx.slots.inject('main', () => ctx.slots.register({
          name: 'main',
          key: PANEL_ID,
        }, Panel));

        ctx.slots.inject('sidebar.panellist', () => ctx.slots.register({
          name: 'sidebar.panellist',
          id: PANEL_ID,
          order: 35,
          label: () => copy('panel.label'),
        }, PanelIcon));

        ctx.slots.inject('conversation.input.left', () => ctx.slots.register({
          name: 'conversation.input.left',
          id: 'deepseek-webchat-send',
          order: 20,
          label: () => copy('action.send'),
        }, SendToWebChat));
      },
    };
  },
});
