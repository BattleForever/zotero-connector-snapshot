# CSP 日志与保存失败的区别

Chrome 扩展管理页将 CSP 安全日志也列入“错误”。它们不等同于 JavaScript 异常或附件保存失败。

## frame-ancestors 在 meta 中被忽略

原沙箱在 `<meta http-equiv="Content-Security-Policy">` 中写入 `frame-ancestors 'self'`。
浏览器规范明确要求忽略这种写法，Chrome 因此记录警告。
`0.2.0-rc.3` 移除这个原本不生效的声明，其他有效 CSP 指令和沙箱脚本清单保持不变。

## Applying inline style violates default-src 'none'

沙箱使用 DOMParser 解析论文 HTML；网页中的 style 标签或 style 属性会触发严格 CSP 的样式拦截日志。
本机合成复现中，题名、正文和 JSON-LD 仍能正确解析。
这些日志没有被隐藏，沙箱安全策略也未放宽，因此在含样式的页面上仍可能出现。
此结论不代表所有保存问题都可忽略。若题录、PDF 或网页附件没有保存，应继续检查对应的实际失败记录。

## 启动初期请求没有收到响应

原初始化方法先等待错误日志存储，再注册消息监听器。Manifest V3 后台刚唤醒时，
页面可能先发送 HTTP 代理请求；没有监听器就可能收到 undefined，继而在重建响应对象时抛出异常。
`0.2.0-rc.3` 在第一次 await 前同步注册监听器；请求继续通过原初始化屏障等待就绪后再执行。
回归执行实际 initGlobal 与消息接收代码，确认启动期间的请求会等待并得到完整响应。
这项代码回归不能替代用户重载后的实际启动验收。

## 重新验证

先保留需要的错误信息，重新加载扩展，刷新论文页，完成一次保存。无需清空错误才能保存。
新版本不会自动删除旧记录，旧的 CSP 警告也不会因更新代码自动消失。
分别核对题录、PDF 文件和独立打开的网页附件；报告新增错误时注明出现位置和是否实际保存失败。

## 清空错误记录后无弹窗

“全部清除”清理 Chrome 记录，本身不应成为保存的前提。不能凭操作先后推断它阻断了保存。
本机后台标签页自动化在 rc.3 就绪状态下没有观察到弹窗，但后续文库读回确认合成题录和快照实际已保存，不能把它记为完全保存失败。
rc.4 修复沙箱重连后重复初始化，以及按钮入口提前返回的问题；实际消息通道回归通过。
重载扩展并刷新论文页后，维护者确认 ScienceDirect 的原弹窗和分类选择正常；PDF 与已翻译网页快照已实际入库。
由于重载、刷新和代码修复同时参与恢复，现有证据不足以把用户遇到的无弹窗唯一归因于上述某个缺陷。

参考：

- CSP 规范：https://www.w3.org/TR/CSP3/#directive-frame-ancestors
- Chrome 同步注册监听器：https://developer.chrome.com/docs/extensions/develop/migrate/to-service-workers#register_listeners_synchronously
