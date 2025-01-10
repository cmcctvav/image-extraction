document.getElementById('collectImages').addEventListener('click', async () => {
  try {
    // 获取当前活动标签页
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    if (!tab) {
      console.error('没有找到活动标签页');
      return;
    }

    // 在页面中执行脚本收集图片
    const images = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: () => {
        const imgElements = document.getElementsByTagName('img');
        return Array.from(imgElements).map(img => {
          return {
            src: img.src,
            alt: img.alt
          };
        });
      }
    });

    // 显示结果
    const tableBody = document.getElementById('tableBody');
    tableBody.innerHTML = '';
    
    if (images && images[0] && images[0].result) {
      images[0].result.forEach((img, index) => {
        const row = document.createElement('tr');
        const buttonId = `copy-btn-${img.src.replace(/[^\w]/g, '')}`;
        row.innerHTML = `
          <td>
            <div class="image-container">
              <img class="thumbnail" 
                   src="${img.src}" 
                   alt="${img.alt}"
                   onmouseover="showPreview(event, this)" 
                   onmouseout="hidePreview(event)"
                   onmousemove="movePreview(event)">
            </div>
          </td>
          <td>
            <div class="url-container">
              <div class="url-text">
                <a href="${img.src}" target="_blank">${img.src}</a>
              </div>
              <button class="copy-button" id="${buttonId}">
                复制链接
              </button>
            </div>
          </td>
        `;
        
        // 添加事件监听器
        tableBody.appendChild(row);
        const copyButton = row.querySelector(`#${buttonId}`);
        copyButton.addEventListener('click', () => copyUrl(img.src));
      });

      // 添加预览容器到 body
      if (!document.getElementById('preview-container')) {
        const previewContainer = document.createElement('div');
        previewContainer.id = 'preview-container';
        previewContainer.className = 'preview-image';
        previewContainer.innerHTML = '<img src="" alt="">';
        document.body.appendChild(previewContainer);
      }
    } else {
      tableBody.innerHTML = `
        <tr>
          <td colspan="2">
            <div class="error-message">未找到任何图片</div>
          </td>
        </tr>`;
    }
  } catch (error) {
    console.error('发生错误：', error);
    document.getElementById('tableBody').innerHTML = `
      <tr>
        <td colspan="2">
          <div class="error-message">错误：${error.message}</div>
        </td>
      </tr>`;
  }
});

// 添加复制功能
async function copyUrl(url) {
  try {
    // 使用 Clipboard API 复制文本
    await navigator.clipboard.writeText(url);
    
    // 创建一个临时的提示元素
    const toast = document.createElement('div');
    toast.style.cssText = `
      position: fixed;
      top: 20px;
      left: 50%;
      transform: translateX(-50%);
      background-color: #28a745;
      color: white;
      padding: 8px 16px;
      border-radius: 4px;
      z-index: 2000;
      font-size: 14px;
      box-shadow: 0 2px 12px rgba(0,0,0,0.15);
    `;
    toast.textContent = '复制成功';
    document.body.appendChild(toast);

    // 1.5秒后移除提示
    setTimeout(() => {
      document.body.removeChild(toast);
    }, 1500);

    // 更新按钮状态
    const button = document.getElementById(`copy-btn-${url.replace(/[^\w]/g, '')}`);
    if (button) {
      const originalText = button.textContent;
      button.textContent = '已复制';
      button.style.backgroundColor = '#28a745';
      button.style.color = 'white';
      
      setTimeout(() => {
        button.textContent = originalText;
        button.style.backgroundColor = '';
        button.style.color = '';
      }, 1000);
    }
  } catch (err) {
    console.error('复制失败:', err);
    // 显示错误提示
    const toast = document.createElement('div');
    toast.style.cssText = `
      position: fixed;
      top: 20px;
      left: 50%;
      transform: translateX(-50%);
      background-color: #dc3545;
      color: white;
      padding: 8px 16px;
      border-radius: 4px;
      z-index: 2000;
      font-size: 14px;
      box-shadow: 0 2px 12px rgba(0,0,0,0.15);
    `;
    toast.textContent = '复制失败';
    document.body.appendChild(toast);

    setTimeout(() => {
      document.body.removeChild(toast);
    }, 1500);
  }
}

// 添加预览相关函数
function showPreview(event, img) {
  const preview = document.getElementById('preview-container');
  preview.querySelector('img').src = img.src;
  preview.style.display = 'block';
  movePreview(event);
}

function hidePreview(event) {
  const preview = document.getElementById('preview-container');
  preview.style.display = 'none';
}

function movePreview(event) {
  const preview = document.getElementById('preview-container');
  if (preview.style.display === 'block') {
    const x = event.clientX + 20;
    const y = event.clientY + 20;
    
    // 确保预览图不会超出窗口
    const previewRect = preview.getBoundingClientRect();
    const maxX = window.innerWidth - previewRect.width - 20;
    const maxY = window.innerHeight - previewRect.height - 20;
    
    preview.style.left = `${Math.min(x, maxX)}px`;
    preview.style.top = `${Math.min(y, maxY)}px`;
  }
} 