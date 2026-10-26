const translated = document.createElement('font');
translated.className='notranslate immersive-translate-target-wrapper';
const inner = document.createElement('font');
inner.className='notranslate immersive-translate-target-inner';
inner.textContent='这段中文由测试页面运行后插入，用来模拟沉浸式翻译已经完成的页面状态。验收需要确认原插件的保存弹窗正常出现，可以选择文库中的分类目录，并且译文快照附在同一个条目下。这些文字完全是合成测试材料，不包含真实科研内容。';
translated.appendChild(inner);
document.getElementById('translation').appendChild(translated);
