// 保存当前打开的窗口ID
let currentWindowId = null;

chrome.action.onClicked.addListener(async (tab) => {
  try {
    // 检查标签页是否有效
    if (!tab || !tab.id) {
      console.error('无效的标签页');
      return;
    }

    // 如果已有窗口打开，就激活它
    if (currentWindowId !== null) {
      try {
        const existingWindow = await chrome.windows.get(currentWindowId);
        if (existingWindow) {
          await chrome.windows.update(currentWindowId, {
            focused: true,
            drawAttention: true
          });
          return;
        }
      } catch (e) {
        // 如果获取窗口失败，说明窗口已关闭，重置 currentWindowId
        currentWindowId = null;
      }
    }

    // 保存当前标签页ID
    const sourceTabId = tab.id;
    
    // 固定窗口大小
    const width = 1200;
    const height = 800;

    // 获取当前窗口以计算居中位置
    const currentWindow = await chrome.windows.getCurrent();
    const left = Math.round((currentWindow.width - width) / 2 + currentWindow.left);
    const top = Math.round((currentWindow.height - height) / 2 + currentWindow.top);
    
    // 创建新窗口
    const newWindow = await chrome.windows.create({
      url: `gallery.html?sourceTabId=${sourceTabId}`,
      type: 'popup',
      width: width,
      height: height,
      left: left,
      top: top
    });

    // 保存新窗口的ID
    currentWindowId = newWindow.id;

    // 监听窗口关闭事件
    chrome.windows.onRemoved.addListener(function onWindowClosed(windowId) {
      if (windowId === currentWindowId) {
        currentWindowId = null;
        chrome.windows.onRemoved.removeListener(onWindowClosed);
      }
    });

  } catch (error) {
    console.error('创建窗口时出错：', error);
    currentWindowId = null;
  }
}); 