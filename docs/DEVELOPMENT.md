# 开发文档

本页供修改源码、复现构建和维护发行包时使用。普通安装见 [快速上手](QUICK_START.md)。
以下命令从项目根目录运行。完整对应源码包与安装包在同一 GitHub Release 发布，
包含固定上游源码、依赖源码、许可证、构建输入和离线重建材料；完整来源见包内 REBUILD.md。

## 开发者构建

普通安装请使用 [快速上手](QUICK_START.md) 中的安装包。以下步骤用于修改源码或复现构建。
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

3. 加载生成的 `build/extension`。这个底层构建保留 rc.9 核心元数据；生成当前安装包请使用 `build_ready.py`。
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
实际安装验收见 [验证说明](VALIDATION.md)，实现见 [架构说明](ARCHITECTURE.md)。
Chrome 扩展页的 CSP 日志与真实保存失败如何区分，见 [故障说明](TROUBLESHOOTING.md)。

