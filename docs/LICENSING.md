# 许可选择

本项目修改了使用 AGPL 的 Zotero Connector，选择 AGPL-3.0-or-later 与上游源码许可保持一致。
这是一种强 copyleft 许可：满足适用条件时，分发修改版需要提供对应源码；
修改版支持用户通过网络交互时，还需按第 13 条向这些用户提供获取对应源码的机会。
仅在本地使用的私人修改，不因此一律需要向公众发布。

AGPL 允许商业使用及收费分发。不能在这个衍生项目上再附加“禁止商用”、
“修改后必须经作者批准”等相冲突限制，也不能把上游代码重新标为专有许可。
本说明用于解释项目选用的协议，具体义务以 LICENSE 正文为准。

本仓库只发布修改源码、构建脚本和合成测试。上游 Connector 的完整打包文件、
SingleFile 等第三方库由使用者自行准备，不随仓库再分发；本地构建保留其原始声明。
SingleFile 解析器兼容补丁涉及的少量源代码改写已在 NOTICE 中注明来源与版权；其源文件同样允许按 AGPL 第 3 版或后续版本使用。
若将来发布包含上游打包库的完整扩展，应先核对所有第三方许可并准备对应版本的
完整对应源码与构建资料，不能仅用本补丁仓库替代这些义务。

Zotero、沉浸式翻译及其图标属于各自权利人。
本项目是非官方修改版，未获官方背书。源码许可不自动授予商标权，正式分发仍应遵守上游商标政策。
原始源码归属声明中的产品名称继续保留。

参考：

- 上游许可：https://www.zotero.org/support/licensing
- 上游 COPYING：https://github.com/zotero/zotero-connectors/blob/master/COPYING
- 商标说明：https://www.zotero.org/support/terms/trademark
- AGPL 正文：https://www.gnu.org/licenses/agpl-3.0.html
- SingleFile 源码许可声明：https://github.com/gildas-lormeau/single-file-core/blob/main/core/helper.js
