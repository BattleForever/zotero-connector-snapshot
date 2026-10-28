# 网页快照助手 · 适用于 Zotero Connector

保存论文时，同时保存 PDF 和浏览器当前显示的网页。

这是基于 **Zotero Connector 5.0.217** 的非官方修改版，目前支持 Chrome。
沿用原版弹窗选择文库和分类，PDF 与网页快照附在同一个文献条目下。
未翻译时保存原文网页，已翻译时保存当前译文页面，**不检测或强制要求翻译**。

当前预发布版本：**0.2.0-rc.10**（扩展数字版本 **5.0.217.12**）。
提供已经构建好的安装包，无需 Python、Node.js 或构建命令。仍属预发布版本，建议先保存一篇论文核对附件。

## 三步开始使用

1. **[下载安装包 ready.zip](https://github.com/BattleForever/zotero-connector-snapshot/releases/download/v0.2.0-rc.10/zotero-snapshot-v0.2.0-rc.10-ready.zip)**，完整解压到准备长期保留的位置，双击 **先看这里.html**。
2. 在 Chrome 地址栏输入 `chrome://extensions`，打开“开发者模式”，点“加载已解压的扩展程序”，选择解压后的 **extension** 文件夹。该文件夹内应有 `manifest.json`。
3. 打开 Zotero 桌面端，将新插件固定到工具栏，打开论文网页，点击插件，在原保存弹窗里选择文库或分类。需要译文时，先翻译，再保存。

已装其他 Connector 时，只启用一份，旧版可停用保留。首次安装或更新后刷新论文页。
安装文件夹不要删除或移动。详细步骤和常见问题见 [快速上手](docs/QUICK_START.md)。
**rc.9 已使用正常的用户无需为这次包装更新重装。** rc.10 的运行代码与验收过的 rc.9 一致，只更换名称、图标及安装说明。

安装包在 [Release 页面](https://github.com/BattleForever/zotero-connector-snapshot/releases/tag/v0.2.0-rc.10) 的 Assets 中。
不要把 GitHub 自动生成的“Source code”压缩包当成安装包。
开发者可下载同页的 **corresponding-source.zip**；其中包含完整对应源码、上游固定版本、依赖源码、许可与离线重建材料。

Windows/macOS 的普通一键安装需要另行发布到 Chrome Web Store；本项目当前使用 Chrome 官方支持的手动加载方式。
参见 [Chrome 加载说明](https://developer.chrome.com/docs/extensions/get-started/tutorial/hello-world#load-unpacked) 和 [分发方式](https://developer.chrome.com/docs/extensions/how-to/distribute)。

## 名称与文件名

| 对象 | 规则 |
| --- | --- |
| 扩展 | 网页快照助手 · 适用于 Zotero Connector（非官方） |
| 论文题录 | 保留原始题名，供检索与引用 |
| 网页附件 | 网页快照 · 论文题名（题名最多 120 个 Unicode 字符） |
| PDF 文件 | 第一作者 - 年份 - 论文题名.pdf（使用 Zotero 原生命名模板） |

PDF 磁盘名称由 Zotero 桌面端决定，见 [命名规则](docs/NAMING.md)。不会批量更改已有文献。

## 开发者构建

普通用户使用上面的安装包即可。以下步骤仅用于修改源码或复现构建。
完整对应源码包内包含已经校验的官方基线及上游源码；仓库 Git 主分支保存本项目修改和工具。
需要 Python 3.10+；离线定制构建不下载依赖、不访问网络、不写入文库。
在对应源码包的 `project` 文件夹运行：

```powershell
python tools/build_ready.py --base ../upstream-package --output ../rebuilt-ready
```

加载生成的 `rebuilt-ready/extension`。完整来源和上游构建路线见包内 `REBUILD.md`。
如自行提供官方打包基线，原核心补丁构建仍可使用：

1. 准备官方 **5.0.217** Chrome Connector 的完整解压目录，不使用修改版作为输入。
2. 运行以下命令，替换示例路径：

```powershell
python tools/build.py --base "PATH_TO_OFFICIAL_5.0.217" --output build/extension
```

3. 加载生成的 `build/extension`。这个底层构建保留 rc.9 核心元数据；生成 rc.10 安装包请使用 `build_ready.py`。
4. 固定本修改版到工具栏，刷新论文页后保存。只启用一份 Connector。

输入逐一核对 `baseline.lock.json`，版本或内容不符时停止；输出目录必须不存在。
不覆盖商店文件或已加载插件，不提供自动升级；上游更新后需重新适配。
当前构建仅接受这份锁定的官方 5.0.217 打包版本，不适用于任意新版 Connector 或直接检出的上游源码目录。

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

运行自动检查还需要 Node.js 18+；实际浏览器验收需 Chrome 与 Zotero 桌面端。

```powershell
node tests/naming.cjs
node tests/page_snapshot.cjs
node tests/quickstart_path.cjs
python tests/build_checks.py --base "PATH_TO_OFFICIAL_5.0.217"
python tests/ready_package.py --base "PATH_TO_OFFICIAL_5.0.217"
python tools/serve_fixture.py --extension build/extension
```

浏览器捕获回归入口：`http://127.0.0.1:18765/tests/browser_capture.html`。
该入口复用实际 ItemSaver 和 SingleFile，使用合成内容及 RPC 记录桩，不写入真实文库。
检查原文、译文、无翻译标记、空白输出和隐藏输出五类情况。
实际安装验收见 [验证说明](docs/VALIDATION.md)，实现见 [架构说明](docs/ARCHITECTURE.md)。
Chrome 扩展页的 CSP 日志与真实保存失败如何区分，见 [故障说明](docs/TROUBLESHOOTING.md)。

## 许可

修改源码和工具使用 **AGPL-3.0-or-later**，保留上游版权及第三方声明。
安装包内的 `LICENSES` 提供完整声明及对应源码地址；对应源码包与安装包同时发布，免费获取。
允许商业使用；分发衍生程序或提供适用的修改版网络服务时，须履行源码义务。
本项目不是 Zotero 官方发行版，源码许可不赋予商标权，也不改变论文和译文的版权。
详见 [LICENSE](LICENSE)、[NOTICE](NOTICE)、[许可说明](docs/LICENSING.md) 和 [隐私说明](PRIVACY.md)。
