# 许可选择

本项目修改了使用 AGPL 的 Zotero Connector，选择 AGPL-3.0-or-later 与上游源码许可保持一致。
这是一种强 copyleft 许可：满足适用条件时，分发修改版需要提供对应源码；
修改版支持用户通过网络交互时，还需按第 13 条向这些用户提供获取对应源码的机会。
仅在本地使用的私人修改，不因此一律需要向公众发布。

AGPL 允许商业使用及收费分发。不能在这个衍生项目上再附加“禁止商用”、
“修改后必须经作者批准”等相冲突限制，也不能把上游代码重新标为专有许可。
本说明用于解释项目选用的协议，具体义务以 LICENSE 正文为准。

Git 主分支保存修改源码、构建脚本、安装引导、原创图标、许可及合成测试。
从 rc.10 开始，Release 另提供已构建安装包和同版本的完整对应源码包，同时发布并免费获取。
源码包包含官方 5.0.217 源码、五个固定顶层子模块、运行依赖源码、原始锁定打包输入和离线重建工具；
其中 React、Bluebird、DOMPurify 另提供首选源码发行包，SingleFile 的原始 JS 和 vendor 源码包含在其 npm 包中。
完整来源见包内 SOURCE_PROVENANCE.json，重建说明见 REBUILD.md。
SingleFile 解析器兼容补丁涉及的少量源代码改写已在 NOTICE 中注明来源与版权；其源文件同样允许按 AGPL 第 3 版或后续版本使用。
安装包的 LICENSES 文件夹保留 AGPL、MIT、MPL 等适用声明和完整对应源码下载地址。
第三方文件继续适用其原有许可，不能把这些文件的归属改写为本项目。
再次分发安装包时，也需要履行适用的许可及对应源码义务，不能只附本补丁仓库链接。

Zotero、沉浸式翻译及其图标属于各自权利人。
安装包使用独立的“网页快照助手”名称和原创主图标，以“适用于 Zotero Connector”说明兼容对象。
本项目是非官方修改版，未获官方背书。源码许可不自动授予商标权，分发仍应遵守上游商标政策。
原始源码归属声明中的产品名称继续保留。

参考：

- 上游许可：https://www.zotero.org/support/licensing
- 上游 COPYING：https://github.com/zotero/zotero-connectors/blob/master/COPYING
- 商标说明：https://www.zotero.org/support/terms/trademark
- AGPL 正文：https://www.gnu.org/licenses/agpl-3.0.html
- SingleFile 源码许可声明：https://github.com/gildas-lormeau/single-file-core/blob/main/core/helper.js
