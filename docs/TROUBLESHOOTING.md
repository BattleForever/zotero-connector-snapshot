# CSP 日志与保存失败的区别

Chrome 扩展管理页将 CSP 安全日志也列入“错误”。它们不等同于 JavaScript 异常或附件保存失败。

## frame-ancestors 在 meta 中被忽略

原沙箱在 `<meta http-equiv="Content-Security-Policy">` 中写入 `frame-ancestors 'self'`。
浏览器规范明确要求忽略这种写法，Chrome 因此记录警告。
`0.2.0-rc.3` 移除这个原本不生效的声明，其他有效 CSP 指令和沙箱脚本清单保持不变。

## Applying inline style violates default-src 'none'

旧版本使用 DOMParser 解析论文 HTML，却没有单独的样式声明，style 标签和 style 属性继承 `default-src 'none'`，因此重复产生拦截记录。
`0.2.0-rc.6` 在不可见解析沙箱中明确添加 `style-src 'unsafe-inline'`，允许内联 CSS 作为文档数据解析。
这是对样式策略的有意调整，不是删除日志或忽略异常。其余指令保持原样；该声明没有允许任何外部 CSS 来源。
内联脚本、fetch、XHR、图片请求及外部 CSS 的浏览器检查仍应被阻止；原始题名、正文、JSON-LD、样式属性与 XPath 结果均须保持一致。
已有错误记录不会自动消失；重载扩展后清除旧记录，再刷新论文，检查是否产生同一条新增样式报告。
若仍出现其他错误或附件缺失，应按具体失败继续诊断，不能把所有问题都归因于样式日志。

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

## 旧论文页出现 runtime.sendMessage 为空

扩展重载会销毁旧内容脚本的扩展 API，已经打开的页面仍可能保留旧脚本的定时器或观察器。
rc.8 在消息入口识别这个生命周期结束状态，停止发送并显示一次本地刷新提示。
需要响应的请求以明确的 AbortError 取消，不执行响应解析，也不伪造保存成功；不需要响应的通知停止发送。
生命周期边界只消费本模块生成的取消对象，其他错误仍按原流程报告。它不会自动重试或重复保存。
更新后的保护只能在刷新后载入，无法追溯修改重载前注入的旧脚本；需要译文快照时，刷新后重新翻译再保存。

## No tab with id

后台识别或观察器的异步回调可能晚于标签页关闭。rc.8 对明确目标的 tabs.get 只处理浏览器返回的
`No tab with id: 数字.`：该消息不可送达，结束投递，不改发另一个活动标签页。
真实翻译错误和其他 Tabs API 错误继续传播；不改写通用消息协议或沙箱 RPC。

## base-uri 'none'

网页快照可能带有 base 标签。旧离线显示检查插入严格 CSP 后仍保留它，导致校验 iframe 报告基准地址被阻止。
rc.8 只在一次性的显示检查副本中移除 base，保留 `base-uri 'none'` 以及脚本、网络和表单限制。
实际传给 Zotero 的原始快照不变。回归需同时验证绝对、空值及 undefined 形式的 base，原文/译文可见，空白或隐藏输出仍被拒绝。

若调用栈是 `lib/SingleFile/single-file.js` 的解析方法，这是更早的一条路径。DOMParser 生成的文档已有当前基准地址，
旧 SingleFile 仍写入相同 base，或者将缺失参数写成字符串 undefined；在继承 `base-uri 'none'` 的环境中触发拦截。
rc.9 跳过缺失、空值及与文档现有基准地址完全相同的写入，保留已有 base 和必要的不同地址处理。
原生浏览器回归对实际捆绑函数施加 HTTP CSP：原实现产生当前地址及 undefined 报告，候选实现为零，且相对 PDF 地址解析一致。
该项与校验 iframe 的 base 清理是两个独立修复，不修改网站安全策略。

弹窗问题应独立核验：后台入库成功不能证明用户看到了分类选择。当前本机诊断只保留最近 40 条指定消息的投递阶段，
包括标签页编号、frame 编号、时间和是否有返回，不保存消息载荷或论文内容，不向外部发送。

## 清空错误记录后无弹窗

“全部清除”清理 Chrome 记录，本身不应成为保存的前提。不能凭操作先后推断它阻断了保存。
本机后台标签页自动化在 rc.3 就绪状态下没有观察到弹窗，但后续文库读回确认合成题录和快照实际已保存，不能把它记为完全保存失败。
rc.4 修复沙箱重连后重复初始化，以及按钮入口提前返回的问题；实际消息通道回归通过。
重载扩展并刷新论文页后，维护者确认 ScienceDirect 的原弹窗和分类选择正常；PDF 与已翻译网页快照已实际入库。
由于重载、刷新和代码修复同时参与恢复，现有证据不足以把用户遇到的无弹窗唯一归因于上述某个缺陷。
rc.7 进一步修复首次点击与页面监听器尚未就绪的竞争；真实首次点击流程已经维护者确认通过。

参考：

- CSP 规范：https://www.w3.org/TR/CSP3/#directive-frame-ancestors
- Chrome 同步注册监听器：https://developer.chrome.com/docs/extensions/develop/migrate/to-service-workers#register_listeners_synchronously
- base-uri 对 base 元素的限制：https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Content-Security-Policy/base-uri
