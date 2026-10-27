# 验证范围

- `tests/naming.cjs`：附件题名、中英文、控制字符、长文本和 Unicode 字符。
- `tests/page_snapshot.cjs`：原文、译文和短页面可保存；空白、隐藏及地址变化被拒绝。
- `tests/save_boundary.cjs`：实际 ItemSaver 调用处的新名称、父条目与 PDF 保留、失败后标签恢复。
- `tests/build_checks.py`：重复构建一致、基线未修改、权限未扩大、原 UI 保留、在线回退与防重复注入。
- `tests/startup_listener.cjs`：错误日志存储尚未返回时，实际 initGlobal 已注册监听器；提前到达的 HTTP 代理请求等待初始化后收到完整响应。
- `tests/sandbox_csp.cjs`：删除 meta 中无效的 frame-ancestors，不改变其他有效策略或脚本清单。
- `tests/browser_capture.html`：在浏览器中使用实际 ItemSaver、SingleFile 和离线渲染检查，验证原文、译文、无翻译标记、空白输出和隐藏输出；RPC 为记录桩，不写入真实文库。

运行 `python tools/serve_fixture.py --extension build/extension`，打开
`http://127.0.0.1:18765/tests/browser_capture.html`。
服务仅监听本机地址并提供白名单文件；结束后按 Ctrl+C 关闭。

`tests/live_extension.html` 用于已安装扩展验收，只有明确点击保存按钮后才会创建带 TEST 标题的 Zotero 条目，启动诊断不创建条目。

先前版本的真实论文验收不能替代本候选版验收，不将旧浏览器重放超时记为通过。
发布前仍需重载本地扩展，在真实论文页分别保存未翻译和已翻译网页，确认：

1. 原版弹窗、文库和分类选择正常。
2. PDF 与“网页快照 · 论文题名”属于同一父条目。
3. 快照独立打开可见；原文页不因缺少翻译报错，译文页保留当前已显示内容。
4. PDF 实际文件名符合桌面设置，失败重试不重复题录。
5. 维护者最终审核后再批准公开推送。
