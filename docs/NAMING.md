# 命名规则

扩展名称：**Zotero Connector · PDF 与网页快照**。
版本：`0.2.0-rc.3`；Chrome 数字版本：`5.0.217.5`；兼容基线：Connector `5.0.217`。
简介和发行说明标明是非官方修改版。

论文题录保留原题名，网页附件显示为“网页快照 · 论文题名”。
仅为附件标签去除常见排版标签、控制字符和多余空白，不改写父条目。
过长标签保留 119 个 Unicode 字符加省略号；空题名回退为“网页快照”。
失败显示“网页快照未保存”，原因显示在原保存进度及通知中。

PDF 的磁盘名称与列表中的附件标题是不同字段，最终文件名由 Zotero 桌面端生成。
在“设置 → 常规 → 文件重命名 → 自定义文件名格式”使用：

```text
{{ authors max="1" name="family" suffix=" - " }}{{ year suffix=" - " }}{{ title truncate="120" }}
```

例如：`Li - 2026 - Acoustic sensor for temperature monitoring.pdf`。
使用第一作者姓氏，缺少作者或年份时省略对应片段，题名最多 120 字符。
非法字符、同名冲突及最终路径由 Zotero 自身处理。
其他附件移动或重命名插件应沿用 Zotero 文件名，或使用相同模板。
模板文件：`config/zotero-filename-template.txt`；构建不会更改桌面设置或批量改名。

官方说明：https://www.zotero.org/support/file_renaming
