# Zotero Connector · PDF 与网页快照

保存论文时，同时保存 PDF 和浏览器当前显示的网页。

这是基于 **Zotero Connector 5.0.217** 的非官方修改版，目前支持 Chrome。
沿用原版弹窗选择文库和分类，PDF 与网页快照附在同一个文献条目下。
未翻译时保存原文网页，已翻译时保存当前译文页面，**不检测或强制要求翻译**。

## 名称与文件名

| 对象 | 规则 |
| --- | --- |
| 扩展 | Zotero Connector · PDF 与网页快照 |
| 论文题录 | 保留原始题名，供检索与引用 |
| 网页附件 | 网页快照 · 论文题名（题名最多 120 个 Unicode 字符） |
| PDF 文件 | 第一作者 - 年份 - 论文题名.pdf（使用 Zotero 原生命名模板） |

PDF 磁盘名称由 Zotero 桌面端决定，见 [命名规则](docs/NAMING.md)。不会批量更改已有文献。

## 构建和安装

仓库只包含补丁源码和构建工具，不附带上游打包库或个人论文。
需要 Python 3.10+；构建不下载依赖、不访问网络、不写入文库。

1. 准备官方 **5.0.217** Chrome Connector 的完整解压目录，不使用修改版作为输入。
2. 运行以下命令，替换示例路径：

```powershell
python tools/build.py --base "PATH_TO_OFFICIAL_5.0.217" --output build/extension
```

3. 在 Chrome 扩展管理页保留但停用原版，启用开发者模式，加载 `build/extension`。
4. 固定本修改版到工具栏，刷新论文页后保存。只启用一份 Connector。

输入逐一核对 `baseline.lock.json`，版本或内容不符时停止；输出目录必须不存在。
不覆盖商店文件或已加载插件，不提供自动升级；上游更新后需重新适配。

## 保存行为

- 捕获当前已加载的 DOM，不根据题录 URL 重新抓取正文。
- 原文、译文和其他语言网页均可保存，不要求翻译标记、译文字数、稳定等待或译文样本匹配。
- 保留无脚本离线显示检查：空白或隐藏输出不发送给 Zotero，PDF 流程继续。
- 同一会话再次点击可重试失败快照，不重复创建题录或保存 PDF。
- 保留原版弹窗、文库/分类选择、标签、PDF 流程和在线保存回退。

## 边界

新增流程针对单篇论文 HTML 页面，不为 PDF 阅读器或多篇结果追加网页。
桌面端应保持打开，并启用自动网页快照。在线回退保留，但新增快照的在线保存未实测。
只保存当前已加载的内容，不负责翻译、自动滚动或加载剩余全文。
空白检查只能判断是否有可见文本，不能保证文章完整或所有网站布局完全还原。
无可见文字的纯图片页面不适用于当前检查；跨域 iframe 和特殊阅读器可能无法完整保存。
SingleFile 仍可能请求网页引用的图片、样式和字体。

## 验证

```powershell
node tests/naming.cjs
node tests/page_snapshot.cjs
python tests/build_checks.py --base "PATH_TO_OFFICIAL_5.0.217"
python tools/serve_fixture.py --extension build/extension
```

浏览器捕获回归入口：`http://127.0.0.1:18765/tests/browser_capture.html`。
该入口复用实际 ItemSaver 和 SingleFile，使用合成内容及 RPC 记录桩，不写入真实文库。
检查原文、译文、无翻译标记、空白输出和隐藏输出五类情况。
实际安装验收见 [验证说明](docs/VALIDATION.md)，实现见 [架构说明](docs/ARCHITECTURE.md)。
Chrome 扩展页的 CSP 日志与真实保存失败如何区分，见 [故障说明](docs/TROUBLESHOOTING.md)。

## 许可

修改源码和工具使用 **AGPL-3.0-or-later**，保留上游版权及第三方声明。
允许商业使用；分发衍生程序或提供适用的修改版网络服务时，须履行源码义务。
本项目不是 Zotero 官方发行版，源码许可不赋予商标权，也不改变论文和译文的版权。
详见 [LICENSE](LICENSE)、[NOTICE](NOTICE)、[许可说明](docs/LICENSING.md) 和 [隐私说明](PRIVACY.md)。
