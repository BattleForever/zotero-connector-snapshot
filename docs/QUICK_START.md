# 小白快速上手

下载带 `ready.zip` 的安装包，完整解压，再双击 **先看这里.html**。无需 Python、Node.js 或构建命令。

1. 在 Chrome 地址栏输入 `chrome://extensions`，打开右上角“开发者模式”。
2. 点“加载已解压的扩展程序”，选择安装包里的 **extension** 文件夹。里面必须能看到 `manifest.json`。
3. 打开 Zotero 桌面端，把“网页快照助手 · 适用于 Zotero Connector”固定到工具栏，打开论文并点击保存。

已安装其他 Connector 时，只启用一份，旧版可停用保留。安装文件夹需要长期保留。
首次安装或更新后刷新论文页；需要保留译文时先翻译，再保存。之后沿用原弹窗选择文库与分类。

成功后，在同一文献下可看到 PDF 和“网页快照 · 论文题名”。Zotero 桌面端需启用自动附加 PDF 与自动网页快照。
直接保存 PDF 阅读器时，不额外添加论文网页。快照仅保存当前已经加载的页面。

## 常见问题

- **清单文件缺失**：选中了 ZIP、上层目录或 GitHub 的源码目录。请选择 ready 包解压后含 `manifest.json` 的 extension 文件夹。
- **无弹窗**：确认只启用一份 Connector；更新后刷新网页，需要译文时重新翻译。
- **只有 PDF**：确认当前是论文网页，并检查 Zotero 自动快照设置。
- **更新**：关闭 Chrome，将新包 extension 内的内容替换到原安装文件夹，保留路径，再在扩展页重新加载并刷新论文。
- **当前 rc.9 已使用正常**：本次主要改进安装包装，无需为此重装正在正常工作的本地版本。

Windows/macOS 的网上应用店一键安装需要另外完成 Chrome Web Store 发布；GitHub 下载包仍需要上面的手动加载步骤。
本项目不提供企业策略安装器，也不修改浏览器安全设置。

Chrome 官方操作说明：https://developer.chrome.com/docs/extensions/get-started/tutorial/hello-world#load-unpacked
