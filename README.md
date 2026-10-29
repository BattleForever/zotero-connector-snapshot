# 网页快照助手 · 适用于 Zotero Connector

保存论文时，同时保存 PDF 和浏览器当前显示的网页，沿用原有的文库、分类和标签功能。

这是 Zotero Connector 的非官方修改版，适用于 **Chrome**，需配合 **Zotero 桌面端**使用。

## 下载与安装

**[下载安装包 ready.zip](https://github.com/BattleForever/zotero-connector-snapshot/releases/download/v0.2.0-rc.12/zotero-snapshot-v0.2.0-rc.12-ready.zip)**（约 1.3 MB，预发布版）

1. **完整解压**到准备长期保留的位置，双击 **先看这里.html**。
2. 在 **Chrome 地址栏**输入 `chrome://extensions`，打开“开发者模式”，点击“加载已解压的扩展程序”，选择解压后的 **extension** 文件夹。安装后可将扩展固定到 **Chrome 工具栏**。
3. **保持 Zotero 桌面端打开，回到 Chrome 的论文网页，点击 Chrome 工具栏中的“网页快照助手”图标**，在弹窗中选择文库或分类。

已安装其他 Connector 时，只启用一份，旧版可停用保留。安装文件夹不要删除或移动；首次安装或更新后刷新论文页。

## 保存结果

展开 Zotero 中的文献条目，可看到 PDF 和 **“网页快照 · 论文题名”** 附件。PDF 能否下载取决于页面是否提供可获取的文件；网页快照保存当前已经加载的页面内容。

## 常见问题

- **提示“清单文件缺失”**：请选择解压后含 `manifest.json` 的 **extension** 文件夹。下载时选择 **ready.zip**。
- **点击没有反应**：确认 Zotero 桌面端已打开、只启用一份 Connector，并刷新论文网页后重试。
- **只有 PDF**：确认是在论文网页保存，并在 Zotero 设置中启用自动网页快照。直接在 PDF 阅读器保存时，不额外添加论文网页。
- **如何更新或排查其他问题**：查看 [快速上手](docs/QUICK_START.md)。

## 许可与说明

采用 [AGPL-3.0-or-later](LICENSE)，保留上游及第三方版权声明。本项目独立于 Zotero 官方。

[文件命名设置](docs/NAMING.md) · [隐私说明](PRIVACY.md) · [版权声明](NOTICE) · [问题反馈](https://github.com/BattleForever/zotero-connector-snapshot/issues) · [开发文档](docs/DEVELOPMENT.md)
