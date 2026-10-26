# 实现与构建

`src/translated_snapshot.js` 提供当前 DOM 的译文检测、稳定等待、输出校验和附件标签。
`tools/patch_connector.py` 将该代码加入 ItemSaver，复用原来的 SingleFile 和保存会话。
它同时保留已修复的所有 frame ping 防重复注入，以及原版在线回退。
两个启动诊断文件只做本机状态读取；诊断页面限定在本机合成验收 URL。

`tools/build.py` 只接受锁定的官方基线文件；在临时目录内完成补丁、权限和资源检查，
成功后才输出完整目录。构建不联网、不修改输入、不读取浏览器配置或 Zotero 文库。
除锁定清单中的原版文件和明确加入的两个诊断文件外，不复制任何额外文件。

命名改动独立于捕获判断；父题录、PDF 下载路径、保存目标和原版目录选择 UI 不被替换。
PDF 命名使用桌面原生模板，涵盖 Connector 下载和 Zotero 自己找到的 PDF。
