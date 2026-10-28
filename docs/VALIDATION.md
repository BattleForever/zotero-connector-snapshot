# 验证范围

- `tests/quickstart_path.cjs`：安装引导页的 Windows、中文/空格、macOS/Linux 路径与 HTTP 预览回退。
- `tests/ready_package.py`：可加载目录、元数据、主图标尺寸、许可文件、权限及运行代码与 rc.9 一致。
- `tests/release_archives.py`：直接从发布源码包提取项目及基线，在含中文和空格的新目录离线重建，并与安装 ZIP 全部文件逐一比较；同时检查固定上游源码及依赖归档。
- `tests/naming.cjs`：附件题名、中英文、控制字符、长文本和 Unicode 字符。
- `tests/page_snapshot.cjs`：原文、译文和短页面可保存；空白、隐藏及地址变化被拒绝。
- `tests/save_boundary.cjs`：实际 ItemSaver 调用处的新名称、父条目与 PDF 保留、失败后标签恢复。
- `tests/build_checks.py`：重复构建一致、基线未修改、权限未扩大、原 UI 保留、在线回退与防重复注入。
- `tests/startup_listener.cjs`：错误日志存储尚未返回时，实际 initGlobal 已注册监听器；提前到达的 HTTP 代理请求等待初始化后收到完整响应。
- `tests/offscreen_reconnect.cjs`：真实 MessageChannel 连接实际沙箱、后台管理器和消息实现；冷启动及三次后台重启的第一条译码请求均获响应，日期/偏好初始化只执行一次。
- `tests/save_action.cjs`：实际按钮入口保留文献/PDF/网页分支，调用方等待原保存结果。
- `tests/first_save_ready.cjs`：实际 Inject.init 延迟初始化及识别时，首次按钮请求等待并仅沿原文献分支保存一次。
- `tests/context_lifecycle.cjs`：实际内容 RPC 在 runtime 被移除后取消请求；普通错误仍传播，只有当前模块生成的销毁取消可被生命周期边界消费。
- `tests/tab_message_lifecycle.cjs`：实际沙箱 RPC 调用后台消息发送器；已关闭目标不投递、不改发当前页，真实翻译与 Tabs API 错误仍返回调用方。
- `tests/snapshot_rendering.html`：实际离线校验 iframe；三种 base 标签只从检查副本移除，保存 HTML 不变，空白/隐藏输出仍被拦截。
- `tests/singlefile_base.cjs`：实际捆绑解析函数跳过相同/空/缺失基准地址，保留既有及必要的不同地址处理。
- `tests/singlefile_base_browser.html`：实际捆绑解析函数置于 HTTP `base-uri 'none'` 策略下；原生报告由原实现的两条降为零，相对链接和中英文正文保留。
- `tests/sandbox_csp.cjs`：只增加内联 CSS 的解析声明；其他指令及沙箱脚本清单不变，不允许外部 CSS 来源。
- `tests/csp_browser.html`：调用实际 Translate.setDocument，比较旧策略与候选策略的原生 CSP 报告、DOM 数据和 XPath；另验证内联脚本、fetch、XHR、图片与外部 CSS 仍被拦截。
- `tests/browser_capture.html`：在浏览器中使用实际 ItemSaver、SingleFile 和离线渲染检查，验证原文、译文、无翻译标记、空白输出和隐藏输出；RPC 为记录桩，不写入真实文库。

运行 `python tools/serve_fixture.py --extension build/extension`，打开
`http://127.0.0.1:18765/tests/browser_capture.html`。
服务仅监听本机地址并提供白名单文件；结束后按 Ctrl+C 关闭。

`tests/live_extension.html` 用于已安装扩展验收，只有明确点击保存按钮后才会创建带 TEST 标题的 Zotero 条目，启动诊断不创建条目。
本机合成验收页显示有限启动与投递状态；不上传诊断内容，保存入口沿用原 Connector。

原生 CSP 回归另运行：

```powershell
python tools/serve_csp_test.py --base "PATH_TO_OFFICIAL_5.0.217" --extension build/extension --output build/csp-browser-result.json
```

打开 `http://127.0.0.1:18768/tests/csp_browser.html`，依次点击 Start、两个 Continue 和 Show results；各用例在顶层页面运行，避免隐藏 iframe 的事件节流。
正常解析应从两条样式报告降为零；边界测试主动触发的拦截属于预期结果，服务器不应收到任何 `/network-*` 请求。
该测试使用合成文本，不读写文库，不引用真实论文或译文。

离线校验回归另运行：

```powershell
python tools/serve_rendering_test.py --extension build/extension --output build/rendering-result.json
```

打开 `http://127.0.0.1:18769/`，五项应全部通过。测试调用实际校验实现但不写入文库。

SingleFile 继承策略回归另运行：

```powershell
python tools/serve_singlefile_base_test.py --extension build/extension --output build/singlefile-base-result.json
```

打开 `http://127.0.0.1:18770/`，三种解析输入均不应新增 base；服务器原生 CSP 报告应为空。
同一用例在原捆绑实现上出现当前地址与 undefined 的 base-uri 报告。测试只服务合成内容，不写入文库。

## 当前实测范围

rc.10 是安装包装更新。原核心自动回归继续通过；新增安装路径与包装检查通过。
中文离线引导页在 Chrome 的本机 HTTP 预览中核对排版，地址复制按钮显示成功。
安装包与源码包另做源码单独提取的离线重建及逐文件校验，记录保留在维护者本机。
本轮未重载或替换使用者正在使用的 rc.9，也未新增真实文献保存试验；功能依据是代码逐文件相同及以下 rc.9 验收。

2026-10-27，rc.9 在真实 MDPI 论文页完成重载、刷新、清除旧错误后首次保存。
使用者确认原弹窗和分类选择正常、无新增所测 base-uri 报告；随后只读核验新增 PDF 和网页快照属于同一父条目，PDF 文件头与快照版本标记正确。
Chrome 内部错误页未被自动读取，无新增报错以该次使用者反馈为依据。

此前版本在真实 ScienceDirect 译文页面核验过原弹窗、分类与同父条目的 PDF/网页附件，离线 HTML 可显示中英文。
合成浏览器回归进一步覆盖原文、译文和没有翻译标记的页面；这些结果不等于所有网站都已通过真实试用。
详细文库记录、实际论文、译文与本机日志均不进入公开仓库。

本版本作为预发布候选提供。在线回退的新增快照、特殊阅读器、跨域 iframe 与其他站点仍需分别验证。
PDF 磁盘文件名由桌面设置及其他重命名插件决定；本仓库提供模板，不自动应用模板或批量改名。
