// 在文件开头添加 DEBUG 常量
const DEBUG = false;  // 设置为 true 时会输出调试信息

// 声明并初始化全局状态对象
const state = {
  processedUrls: new Set(),
  validImages: [],
  dimensionGroups: {},
  currentTabId: null,
  hasNewImages: false,
  newImagesCount: 0,
  elements: {
    statusDot: null,
    statusText: null,
    newImagesBadge: null,
    statusIndicator: null,
    dimensionGroups: null,
    imageCount: null
  }
};

// 初始化状态指示器元素
function initializeStatusElements() {
  state.elements = {
    statusDot: document.getElementById('statusDot'),
    statusText: document.getElementById('statusText'),
    newImagesBadge: document.getElementById('newImagesBadge'),
    statusIndicator: document.getElementById('statusIndicator'),
    dimensionGroups: document.getElementById('dimensionGroups'),
    imageCount: document.querySelector('.image-count')
  };

  const { statusDot, statusText, statusIndicator, newImagesBadge, dimensionGroups } = state.elements;
  
  if (!statusDot || !statusText || !statusIndicator || !newImagesBadge || !dimensionGroups) {
    console.error('无法初始化状态指示器元素');
    return false;
  }

  // 初始化时立即更新一次状态
  updateStatusIndicator(false, true);
  return true;
}

// 更新状态指示器函数
function updateStatusIndicator(isScanning = false, forceUpdate = false) {
  const { statusDot, statusText, statusIndicator } = state.elements;
  if (!statusDot || !statusText || !statusIndicator) {
    console.error('状态指示器元素未初始化');
    return;
  }

  // 获取当前可见和总图片数量
  const totalImages = state.validImages.length;
  const visibleImages = document.querySelectorAll('.image-card:not(.hidden-card)').length;
  
  // 获取已选择的分辨率组数量
  const totalGroups = document.querySelectorAll('.dimension-checkbox').length;
  const selectedGroups = document.querySelectorAll('.dimension-checkbox:checked').length;

  // 计算图片大小总和（以像素为单位）
  let totalPixels = 0;
  document.querySelectorAll('.image-card:not(.hidden-card)').forEach(card => {
    const dimension = card.getAttribute('data-dimension');
    if (dimension) {
      const [width, height] = dimension.split('x').map(Number);
      totalPixels += width * height;
    }
  });
  
  // 转换为兆像素
  const totalMegapixels = (totalPixels / 1000000).toFixed(1);

  // 获取状态标签和计数元素
  const statusLabel = statusText.querySelector('.status-label');
  const statusCount = statusText.querySelector('.status-count');

  // 更新状态文本
  if (totalImages === 0) {
    // 没有图片时的状态
    statusLabel.textContent = '暂无图片';
    statusCount.textContent = '';
    statusIndicator.classList.add('idle');
    statusDot.classList.remove('scanning');
  } else if (isScanning && state.hasNewImages) {
    // 正在扫描且有新图片时的状态
    statusLabel.textContent = '正在扫描新图片...';
    statusCount.textContent = `已加载 ${totalImages}张 · 已选${selectedGroups}/${totalGroups}组 · 显示${visibleImages}张 · ${totalMegapixels}MP`;
    statusIndicator.classList.remove('idle');
    statusDot.classList.add('scanning');
  } else {
    // 正常监听状态
    statusLabel.textContent = '监听中';
    statusCount.textContent = `已加载 ${totalImages}张 · 已选${selectedGroups}/${totalGroups}组 · 显示${visibleImages}张 · ${totalMegapixels}MP`;
    statusIndicator.classList.remove('idle');
    statusDot.classList.remove('scanning');
  }

  // 添加调试日志
  console.log('状态更新:', {
    totalImages,
    visibleImages,
    selectedGroups,
    totalGroups,
    totalMegapixels,
    isScanning,
    hasNewImages: state.hasNewImages
  });
}

// 修改扫描状态更新函数
function updateScanningStatus(isScanning) {
  const { statusDot } = state.elements;
  if (!statusDot) {
    console.error('状态指示器未初始化');
    return;
  }
  
  const lastScanTime = statusDot.getAttribute('data-last-scan') || 0;
  const now = Date.now();
  
  if (isScanning) {
    if (now - lastScanTime < 2000) {
      return;
    }
    statusDot.setAttribute('data-last-scan', now);
    updateStatusIndicator(true);
  } else {
    setTimeout(() => {
      updateStatusIndicator(false, true);
    }, 800);
  }
}

// 确保在 DOM 加载完成后再执行初始化
document.addEventListener('DOMContentLoaded', () => {
  if (!initializeStatusElements()) {
    console.error('状态指示器初始化失败');
    return;
  }
  init();
});

// 将 updateImageCount 函数移到全局作用域
function updateImageCount(visibleCount = null, totalCount = null) {
  const imageCountElement = state.elements.imageCount;
  if (!imageCountElement) {
    console.error('找不到 image-count 元素');
    return;
  }

  console.log('更新图片计数:', { visibleCount, totalCount }); // 添加调试日志

  // 如果没有传入具体数值，则自动计算
  if (visibleCount === null || totalCount === null) {
    const visibleImages = document.querySelectorAll('.image-card:not(.hidden-card)').length;
    const totalImages = document.querySelectorAll('.image-card').length;
    const selectedGroups = document.querySelectorAll('.dimension-checkbox:checked').length;
    const totalGroups = document.querySelectorAll('.dimension-checkbox').length;
    
    // 计算已选择图片的总大小
    let selectedSize = 0;
    document.querySelectorAll('.image-card:not(.hidden-card)').forEach(card => {
      const dimension = card.getAttribute('data-dimension');
      if (dimension) {
        const [width, height] = dimension.split('x').map(Number);
        selectedSize += width * height;
      }
    });

    const selectedSizeMB = (selectedSize / (1024 * 1024)).toFixed(1);
    
    // 更新显示文本
    imageCountElement.textContent = `已选择 ${selectedGroups}/${totalGroups} 组 · ${visibleImages}/${totalImages} 张图片 · ${selectedSizeMB}MB`;
  } else {
    // 使用传入的具体数值
    const selectedGroups = document.querySelectorAll('.dimension-checkbox:checked').length;
    const totalGroups = document.querySelectorAll('.dimension-checkbox').length;
    
    // 计算已选择图片的总大小
    let selectedSize = 0;
    document.querySelectorAll('.image-card:not(.hidden-card)').forEach(card => {
      const dimension = card.getAttribute('data-dimension');
      if (dimension) {
        const [width, height] = dimension.split('x').map(Number);
        selectedSize += width * height;
      }
    });

    const selectedSizeMB = (selectedSize / (1024 * 1024)).toFixed(1);
    
    imageCountElement.textContent = `已选择 ${selectedGroups}/${totalGroups} 组 · ${visibleCount}/${totalCount} 张图片 · ${selectedSizeMB}MB`;
  }
}

// 更新状态指示器函数
function updateStatusIndicator(isScanning = false, forceUpdate = false) {
  if (!state.elements.statusDot || !state.elements.statusText || !state.elements.statusIndicator) {
    console.error('状态指示器元素未初始化');
    return;
  }

  const statusCount = document.createElement('span');
  statusCount.className = 'status-count';
  
  // 移除旧的计数
  const oldCount = state.elements.statusText.querySelector('.status-count');
  if (oldCount) {
    oldCount.remove();
  }

  // 添加图片计数
  statusCount.textContent = state.validImages.length > 0 
    ? `(加载 ${state.validImages.length} 张图片)` 
    : '';
  
  if (isScanning && state.hasNewImages) {
    // 只有在有新图片时才显示扫描动画
    state.elements.statusDot.classList.add('scanning');
    state.elements.statusText.textContent = '正在扫描新图片...';
    state.elements.statusIndicator.classList.remove('idle');
  } else {
    state.elements.statusDot.classList.remove('scanning');
    if (state.validImages.length === 0) {
      state.elements.statusText.textContent = '暂无图片';
      state.elements.statusIndicator.classList.add('idle');
    } else {
      state.elements.statusText.textContent = '监听中';
      state.elements.statusIndicator.classList.remove('idle');
    }
  }
  
  state.elements.statusText.appendChild(statusCount);
}

// 修改扫描状态更新函数
function updateScanningStatus(isScanning) {
  if (!state.elements.statusDot) {
    console.error('状态指示器未初始化');
    return;
  }
  
  const lastScanTime = state.elements.statusDot.getAttribute('data-last-scan') || 0;
  const now = Date.now();
  
  if (isScanning) {
    // 如果距离上次扫描不到2秒，不更新状态
    if (now - lastScanTime < 2000) {
      return;
    }
    state.elements.statusDot.setAttribute('data-last-scan', now);
    updateStatusIndicator(true);
  } else {
    // 添加延迟，使动画更平滑
    setTimeout(() => {
      updateStatusIndicator(false, true);
    }, 800);
  }
}

async function init() {
  try {
    console.log('开始初始化...');
    
    // 先初始化状态指示器
    if (!initializeStatusElements()) {
      throw new Error('状态指示器初始化失败');
    }

    // 显示进度条
    const progressContainer = document.getElementById('progressContainer');
    progressContainer.style.display = 'block';

    // 从 URL 参数中获取源标签页 ID
    const urlParams = new URLSearchParams(window.location.search);
    const sourceTabId = urlParams.get('sourceTabId');
    
    if (!sourceTabId) {
      throw new Error('未找到源标签页ID');
    }

    // 初始化当前标签页ID
    state.currentTabId = parseInt(sourceTabId);

    // 获取初始图片
    const initialImages = await getImages(sourceTabId);
    console.log('获取到初始图片:', initialImages.length);
    
    // 处理初始图片
    await processNewImages(initialImages);

    // 更新状态指示器
    updateStatusIndicator(false, true);

    // 在这里调用初始化计数，此时 DOM 已经准备好了
    updateImageCount(0, 0);

    // 监听标签页切换
    chrome.tabs.onActivated.addListener(async (activeInfo) => {
      try {
        // 获取当前激活的标签页
        const tab = await chrome.tabs.get(activeInfo.tabId);
        
        // 如果是同一个窗口的标签页切换
        if (tab.windowId === (await chrome.tabs.get(state.currentTabId)).windowId) {
          // 更新当前标签页ID
          state.currentTabId = activeInfo.tabId;
          
          // 清空已处理的图片集合
          state.processedUrls.clear();
          state.validImages = [];
          state.dimensionGroups = {};
          
          // 获取新标签页的图片
          const newImages = await getImages(state.currentTabId);
          processNewImages(newImages);
          
          // 更新状态文本
          state.elements.statusText.textContent = '已切换到新标签页';
          setTimeout(() => {
            state.elements.statusText.textContent = state.hasNewImages ? '正在监听新图片...' : '暂无新图片';
          }, 2000);
        }
      } catch (error) {
        console.error('标签页切换处理失败:', error);
      }
    });

    // 监听标签页更新
    chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
      // 只处理当前标签页的更新，且页面完全加载完成的情况
      if (tabId === state.currentTabId && changeInfo.status === 'complete') {
        // 清空已处理的图片集合
        state.processedUrls.clear();
        state.validImages = [];
        state.dimensionGroups = {};
        
        // 获取更新后的图片
        const newImages = await getImages(state.currentTabId);
        processNewImages(newImages);
      }
    });

    // 获取图片的函数
    async function getImages(tabId) {
      try {
        const images = await chrome.scripting.executeScript({
          target: { tabId: parseInt(tabId) },
          func: () => {
            const imgElements = document.getElementsByTagName('img');
            return Array.from(imgElements).map(img => ({
              src: img.src,
              alt: img.alt,
              width: img.naturalWidth || img.width,
              height: img.naturalHeight || img.height
            }));
          }
        });

        console.log('获取到图片:', images[0]?.result?.length || 0);
        return images[0]?.result || [];
      } catch (error) {
        console.error('获取图片失败:', error);
        return [];
      }
    }

    // 获取状态指示器元素
    const statusDot = document.getElementById('statusDot');
    const statusText = document.getElementById('statusText');
    const newImagesBadge = document.getElementById('newImagesBadge');
    const statusIndicator = document.getElementById('statusIndicator');
    let newImagesCount = 0;
    let hasNewImages = false;

    // 处理新图片函数更新
    function processNewImages(newImages) {
      if (DEBUG) {
        console.log('新获取的图片数量:', newImages.length);
      }
      
      const newValidImages = newImages.filter(img => {
        // 检查 URL 是否有效
        if (!img.src || !img.width || !img.height || 
            img.width <= 0 || img.height <= 0 || 
            state.processedUrls.has(img.src) ||
            img.src.startsWith('chrome://') ||
            img.src.startsWith('chrome-extension://') ||
            img.src.startsWith('data:') ||
            !isValidImageUrl(img.src)) {
          return false;
        }
        state.processedUrls.add(img.src);
        return true;
      });

      console.log('有效的新图片数量:', newValidImages.length);

      if (newValidImages.length > 0) {
        state.hasNewImages = true;
        state.dimensionGroups = {};
        state.validImages = [...state.validImages, ...newValidImages];
        
        console.log('总有效图片数量:', state.validImages.length);
        
        // 先对图片进行预排序
        const sortedImages = state.validImages.sort((a, b) => 
          (b.width * b.height) - (a.width * a.height)
        );
        
        // 重置分组
        state.dimensionGroups = {};
        
        // 重新分组
        sortedImages.forEach(img => {
          const dimension = `${img.width}x${img.height}`;
          if (!state.dimensionGroups[dimension]) {
            state.dimensionGroups[dimension] = [];
          }
          state.dimensionGroups[dimension].push(img);
        });

        // 更新UI
        updateDimensionGroups();
        renderImageGrid(sortImages(state.validImages, document.getElementById('sortSelect').value));
        
        // 确保更新状态指示器
        updateStatusIndicator(true, true);
        
        // 延迟重置扫描状态
        setTimeout(() => {
          state.hasNewImages = false;
          updateStatusIndicator(false, true);
        }, 2000);
      }
    }

    // 获取 DOM 元素
    const dimensionGroupsWrapper = document.querySelector('.dimension-groups-wrapper');
    const dimensionGroupsElement = document.getElementById('dimensionGroups');

    // 创建标题栏
    const dimensionHeader = document.createElement('div');
    dimensionHeader.className = 'dimension-header';
    dimensionHeader.innerHTML = `
      <div class="header-content">
        <div class="header-left">
          <div class="expand-button">
            <span>分辨率统计</span>
            <span class="expand-icon">▼</span>
          </div>
        </div>
        <div class="header-actions">
          <button class="filter-button" id="clearFilter">取消全选</button>
          <select class="sort-select" id="sortSelect">
            <option value="dimension-desc" selected>大尺寸优先</option>
            <option value="dimension-asc">小尺寸优先</option>
            <option value="width-desc">宽度优先</option>
            <option value="width-asc">窄幅优先</option>
            <option value="height-desc">高度优先</option>
            <option value="height-asc">矮幅优先</option>
          </select>
          <button class="reset-sort" id="resetSort">恢复默认排序</button>
          <button class="batch-download" id="batchDownload">批量下载</button>
        </div>
      </div>
    `;

    // 删除原有的工具栏
    document.querySelector('.toolbar')?.remove();

    // 清空并重建 dimensionGroupsWrapper 的内容
    dimensionGroupsWrapper.innerHTML = '';
    dimensionGroupsWrapper.appendChild(dimensionHeader);
    dimensionGroupsWrapper.appendChild(dimensionGroupsElement);

    // 添加展开/折叠事件监听
    const expandButton = dimensionHeader.querySelector('.expand-button');
    expandButton.addEventListener('click', () => {
      const dimensionGroups = document.getElementById('dimensionGroups');
      const isExpanded = dimensionGroups.classList.contains('expanded');
      dimensionGroups.classList.toggle('expanded');
      expandButton.querySelector('.expand-icon').textContent = isExpanded ? '▼' : '▲';
    });

    // 删除旧的全选按钮（如果存在）
    const oldClearButton = document.querySelector('.dimension-groups-wrapper button:not(#clearFilter)');
    if (oldClearButton) {
      oldClearButton.remove();
    }

    // 然后再设置新按钮的事件监听
    const clearButton = document.getElementById('clearFilter');
    if (clearButton) {  // 添加检查确保按钮存在
      // 创建按钮组容器
      const filterButtonGroup = document.createElement('div');
      filterButtonGroup.className = 'filter-button-group';
      clearButton.parentNode.replaceChild(filterButtonGroup, clearButton);

      // 创建全选/取消全选按钮
      const toggleAllButton = document.createElement('button');
      toggleAllButton.className = 'filter-button';
      toggleAllButton.id = 'toggleAll';
      toggleAllButton.textContent = '取消全选';

      // 创建反选按钮
      const invertButton = document.createElement('button');
      invertButton.className = 'filter-button';
      invertButton.id = 'invertSelection';
      invertButton.textContent = '反选';

      // 添加按钮到按钮组
      filterButtonGroup.appendChild(toggleAllButton);
      filterButtonGroup.appendChild(invertButton);

      // 全选/取消全选按钮事件
      toggleAllButton.onclick = () => {
        const checkboxes = document.querySelectorAll('.dimension-checkbox');
        const allChecked = Array.from(checkboxes).every(cb => cb.checked);
        const newState = !allChecked;
        
        checkboxes.forEach(cb => {
          cb.checked = newState;
        });
        
        toggleAllButton.textContent = newState ? '取消全选' : '全选';
        updateVisibility();
      };

      // 反选按钮事件
      invertButton.onclick = () => {
        const checkboxes = document.querySelectorAll('.dimension-checkbox');
        checkboxes.forEach(cb => {
          cb.checked = !cb.checked;
        });
        
        // 更新全选/取消全选按钮的状态
        const allChecked = Array.from(checkboxes).every(cb => cb.checked);
        toggleAllButton.textContent = allChecked ? '取消全选' : '全选';
        
        updateVisibility();
      };
    }

    // 添加排序相关事件监听
    const sortSelect = document.getElementById('sortSelect');
    sortSelect.addEventListener('change', (e) => {
      renderImageGrid(sortImages(state.validImages, e.target.value));
      updateStatusIndicator(false, true);
    });

    const batchDownloadBtn = document.getElementById('batchDownload');
    batchDownloadBtn.addEventListener('click', batchDownload);

    // 添加相应的样式
    const style = document.createElement('style');
    style.textContent += `
      .header-content {
        display: flex;
        justify-content: space-between;
        align-items: center;
        color: #ecf0f1;
        font-size: 14px;
        gap: 16px;
      }

      .header-left {
        display: flex;
        align-items: center;
        gap: 8px;
      }

      .header-actions {
        display: flex;
        align-items: center;
        gap: 8px;
      }

      .filter-button,
      .reset-sort {
        padding: 4px 8px;
        background-color: rgba(255, 255, 255, 0.08);
        border: 1px solid rgba(255, 255, 255, 0.15);
        border-radius: 4px;
        color: #ecf0f1;
        font-size: 13px;
        cursor: pointer;
        transition: all 0.2s ease;
      }

      .filter-button:hover,
      .reset-sort:hover {
        background-color: rgba(255, 255, 255, 0.12);
      }

      .sort-select {
        padding: 4px 24px 4px 8px;
        border: 1px solid rgba(255, 255, 255, 0.15);
        border-radius: 4px;
        font-size: 13px;
        color: #ecf0f1;
        background-color: rgba(255, 255, 255, 0.08);
        cursor: pointer;
        transition: all 0.2s ease;
      }

      .sort-select:hover {
        background-color: rgba(255, 255, 255, 0.12);
      }

      .batch-download {
        padding: 4px 8px;
        background: linear-gradient(135deg, #27ae60, #2ecc71);
        border: none;
        border-radius: 4px;
        color: #fff;
        font-size: 13px;
        cursor: pointer;
        transition: all 0.2s ease;
      }

      .batch-download:hover {
        transform: translateY(-1px);
        box-shadow: 0 2px 4px rgba(0,0,0,0.2);
      }

      .batch-download:disabled {
        opacity: 0.7;
        cursor: not-allowed;
        transform: none;
        box-shadow: none;
      }

      .dimension-groups {
        display: flex;
        flex-wrap: wrap;
        gap: 6px;
        max-height: 42px;
        overflow: hidden;
        transition: max-height 0.3s ease;
        padding: 10px;
      }

      .dimension-groups.expanded {
        max-height: 300px;
        overflow-y: auto;
      }

      .dimension-group {
        display: inline-flex;
        align-items: center;
        padding: 6px 12px;
        background: rgba(255, 255, 255, 0.12);
        border-radius: 6px;
        font-size: 13px;
        color: #ecf0f1;
        cursor: pointer;
        user-select: none;
        white-space: nowrap;
        border: 1px solid rgba(255, 255, 255, 0.2);
        transition: all 0.2s ease;
        backdrop-filter: blur(2px);
        -webkit-backdrop-filter: blur(2px);
        min-width: 110px;
        justify-content: space-between;
        flex-shrink: 0;
      }

      .dimension-group:hover {
        background: rgba(255, 255, 255, 0.2);
        border-color: rgba(255, 255, 255, 0.25);
        transform: translateY(-1px);
        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      }

      .dimension-checkbox {
        margin-right: 8px;
      }

      /* 滚动条样式 */
      .dimension-groups::-webkit-scrollbar {
        width: 6px;
      }

      .dimension-groups::-webkit-scrollbar-track {
        background: rgba(255, 255, 255, 0.05);
        border-radius: 3px;
      }

      .dimension-groups::-webkit-scrollbar-thumb {
        background: rgba(255, 255, 255, 0.2);
        border-radius: 3px;
      }

      .dimension-groups::-webkit-scrollbar-thumb:hover {
        background: rgba(255, 255, 255, 0.3);
      }

      .dimension-header {
        padding: 10px 15px;
        background: rgba(45, 74, 62, 0.95);
        border-radius: 8px 8px 0 0;
        border-bottom: 1px solid rgba(255, 255, 255, 0.1);
      }

      .expand-button {
        display: flex;
        align-items: center;
        gap: 8px;
        cursor: pointer;
        user-select: none;
        padding: 4px 8px;
        border-radius: 4px;
        transition: background-color 0.2s ease;
      }

      .expand-button:hover {
        background-color: rgba(255, 255, 255, 0.1);
      }

      .expand-icon {
        font-size: 12px;
        transition: transform 0.2s ease;
      }

      .dimension-groups {
        max-height: 42px;
        overflow: hidden;
        transition: max-height 0.3s ease;
      }

      .dimension-groups.expanded {
        max-height: 300px;
        overflow-y: auto;
      }

      .dimension-header {
        padding: 10px 15px;
        background: rgba(45, 74, 62, 0.95);
        border-radius: 8px 8px 0 0;
        border-bottom: 1px solid rgba(255, 255, 255, 0.1);
      }

      .dimension-groups-wrapper {
        position: relative;
        z-index: 100;
      }

      .dimension-groups {
        background: rgba(45, 74, 62, 0.95);
        padding: 10px;
        border-radius: 0 0 8px 8px;
        max-height: 42px;
        overflow: hidden;
        transition: max-height 0.3s ease;
      }

      .dimension-groups.expanded {
        max-height: 300px;
        overflow-y: auto;
      }

      .expand-button {
        display: flex;
        align-items: center;
        gap: 8px;
        cursor: pointer;
        user-select: none;
        padding: 4px 8px;
        border-radius: 4px;
        transition: background-color 0.2s ease;
      }

      .expand-button:hover {
        background-color: rgba(255, 255, 255, 0.1);
      }

      .header-actions {
        display: flex;
        align-items: center;
        gap: 8px;
      }

      /* 统一按钮样式 */
      .filter-button,
      .reset-sort,
      .sort-select,
      .batch-download {
        height: 28px;
        line-height: 28px;
        padding: 0 12px;
        font-size: 13px;
        border-radius: 4px;
      }

      .filter-button-group {
        display: flex;
        gap: 4px;
      }

      .filter-button {
        padding: 0 12px;
        height: 28px;
        background-color: rgba(255, 255, 255, 0.08);
        border: 1px solid rgba(255, 255, 255, 0.15);
        border-radius: 4px;
        color: #ecf0f1;
        font-size: 13px;
        cursor: pointer;
        transition: all 0.2s ease;
        white-space: nowrap;
      }

      .filter-button:hover {
        background-color: rgba(255, 255, 255, 0.12);
        border-color: rgba(255, 255, 255, 0.25);
        transform: translateY(-1px);
        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      }

      .filter-button:active {
        transform: translateY(0);
      }

      .status-count {
        margin-left: 8px;
        opacity: 0.8;
        font-size: 0.9em;
      }

      .status-indicator {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 8px 16px;
        background: rgba(45, 74, 62, 0.95);
        border-radius: 8px;
        font-size: 13px;
        backdrop-filter: blur(5px);
        -webkit-backdrop-filter: blur(5px);
        box-shadow: 0 2px 8px rgba(0,0,0,0.15);
        min-width: 280px;
        max-width: 360px;
        margin: 0 auto;
      }

      .status-text {
        display: flex;
        align-items: center;
        gap: 8px;
        color: #ecf0f1;
        flex: 1;
        min-width: 0;
      }

      .status-label {
        font-weight: 500;
        white-space: nowrap;
      }

      .status-count {
        color: rgba(236, 240, 241, 0.8);
        padding-left: 12px;
        border-left: 1px solid rgba(236, 240, 241, 0.2);
        white-space: nowrap;
        font-family: monospace;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .status-dot {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        background: #2ecc71;
        flex-shrink: 0;
      }

      .status-indicator.idle .status-dot {
        background: #95a5a6;
      }

      .status-dot.scanning {
        animation: scanning 1.5s ease-in-out infinite;
      }

      @keyframes scanning {
        0% { opacity: 0.5; }
        50% { opacity: 1; }
        100% { opacity: 0.5; }
      }
    `;
    document.head.appendChild(style);

    // 更新分组统计UI
    function updateDimensionGroups() {
      const dimensionGroupsElement = state.elements.dimensionGroups;
      if (!dimensionGroupsElement) {
        console.error('找不到 dimensionGroups 元素');
        return;
      }

      dimensionGroupsElement.innerHTML = '';
      
      // 按照分辨率大小对尺寸组进行排序
      const sortedDimensions = Object.entries(state.dimensionGroups)
        .sort((a, b) => {
          const [widthA, heightA] = a[0].split('x').map(Number);
          const [widthB, heightB] = b[0].split('x').map(Number);
          return (widthB * heightB) - (widthA * heightA);
        });

      // 显示尺寸统计
      sortedDimensions.forEach(([dimension, images]) => {
        const label = document.createElement('label');
        label.className = 'dimension-group';
        
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.className = 'dimension-checkbox';
        checkbox.checked = true;
        checkbox.setAttribute('data-dimension', dimension);
        
        checkbox.addEventListener('change', () => {
          updateVisibility();
        });
        
        label.appendChild(checkbox);
        label.appendChild(document.createTextNode(
          `${dimension} (${images.length}张)`
        ));
        
        dimensionGroupsElement.appendChild(label);
      });

      // 初始更新可见性和计数
      updateVisibility();
    }

    // 设置定期检查新图片
    setInterval(async () => {
      const lastScanTime = state.elements.statusDot.getAttribute('data-last-scan') || 0;
      const now = Date.now();
      
      // 如果距离上次扫描不到2秒，跳过本次扫描
      if (now - lastScanTime < 2000) {
        return;
      }
      
      const newImages = await getImages(state.currentTabId);
      const hasNewImagesInScan = newImages.some(img => !state.processedUrls.has(img.src));
      
      if (hasNewImagesInScan) {
        updateScanningStatus(true);
        await processNewImages(newImages);
      } else {
        updateStatusIndicator(false, true);
      }
    }, 3000); // 每3秒检查一次

    // 隐藏进度条
    setTimeout(() => {
      progressContainer.style.display = 'none';
    }, 1500);

  } catch (error) {
    progressContainer.style.display = 'none';
    console.error('错误：', error);
    document.body.innerHTML = `
      <div style="padding: 20px; color: #dc3545;">
        错误：${error.message}
      </div>
    `;
  }
}

// 从URL中获取文件名和后缀
function getFileName(url) {
  try {
    const urlObj = new URL(url);
    let pathname = urlObj.pathname;
    
    // 处理必应图的特殊格式
    if (url.includes('bing.net/th/id/')) {
      const bingId = pathname.split('/').pop();
      return `bing_${bingId.replace(/[^a-zA-Z0-9]/g, '_')}.jpg`;
    }
    
    // 处理查询参数中的实际文件名
    const searchParams = new URLSearchParams(urlObj.search);
    if (searchParams.has('filename')) {
      pathname = searchParams.get('filename');
    }
    
    // 获取文件名
    let filename = pathname.substring(pathname.lastIndexOf('/') + 1);
    
    // 如果没有文件扩展名，尝试从 URL 或 Content-Type 推断
    if (!filename.includes('.')) {
      // 尝试从 URL 路径中获取扩展名
      const matches = url.match(/\.(jpg|jpeg|png|gif|webp|bmp|svg)/i);
      if (matches) {
        filename += '.' + matches[1].toLowerCase();
      } else {
        // 检查是否是 base64 图片
        if (url.startsWith('data:image/')) {
          const ext = url.substring(11).split(';')[0];
          filename += '.' + ext;
        } else {
          // 默认使用 .jpg
          filename += '.jpg';
        }
      }
    }
    
    // 清理文件名中的特殊字符
    filename = filename.replace(/[^a-zA-Z0-9._-]/g, '_');
    
    return filename || 'image.jpg';
  } catch {
    // 如果解析失败，生成一个带时间戳的文件名
    return `image_${Date.now()}.jpg`;
  }
}

// 下载功能
async function downloadImage(url, filename) {
  try {
    // 检查 URL 是否有效
    if (!isValidImageUrl(url)) {
      throw new Error('不支持的图片URL格式');
    }

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    // 获取实际的 Content-Type
    const contentType = response.headers.get('content-type');
    if (!contentType?.startsWith('image/')) {
      throw new Error('不是有效的图片格式');
    }
    
    // 如果文件名没有扩展名，根据 Content-Type 添加
    if (!filename.includes('.')) {
      const ext = contentType.split('/')[1];
      if (ext) {
        filename += '.' + ext.split('+')[0].split(';')[0];
      } else {
        filename += '.jpg';
      }
    }
    
    const blob = await response.blob();
    const objectUrl = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = objectUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    setTimeout(() => URL.revokeObjectURL(objectUrl), 100);
    showToast('开始下载');
  } catch (error) {
    console.error('下载失败:', error);
    showToast(`下载失败: ${error.message}`, true);
  }
}

// 显示原图功能
function showOriginal(src) {
  const viewer = document.createElement('div');
  viewer.className = 'original-viewer';
  viewer.innerHTML = `
    <img src="${src}" alt="原图">
    <div class="viewer-tip">点击任意位置关闭</div>
  `;
  
  viewer.onclick = () => {
    document.body.removeChild(viewer);
  };
  
  const handleEsc = (e) => {
    if (e.key === 'Escape') {
      document.body.removeChild(viewer);
      document.removeEventListener('keydown', handleEsc);
    }
  };
  document.addEventListener('keydown', handleEsc);
  
  document.body.appendChild(viewer);
  viewer.style.display = 'block';
}

function showToast(message, isError = false) {
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.textContent = message;
  if (isError) {
    toast.style.backgroundColor = '#dc3545';
  } else {
    toast.style.backgroundColor = '#28a745';
  }
  document.body.appendChild(toast);
  
  // 添加动画效果
  requestAnimationFrame(() => {
    toast.style.opacity = '1';
    toast.style.transform = 'translateY(0)';
  });

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(-20px)';
    setTimeout(() => {
      document.body.removeChild(toast);
    }, 300);
  }, 2000);
}

// 渲染图片网格
function renderImageGrid(images) {
  const imageGrid = document.getElementById('imageGrid');
  imageGrid.innerHTML = '';
  
  if (DEBUG) {
    console.log('准备渲染的图片数量:', images.length);
  }
  
  let renderedCount = 0;
  
  images.forEach(img => {
    if (!img.src || !img.width || !img.height) {
      if (DEBUG) {
        console.log('跳过无效图片:', img);
      }
      return;
    }

    renderedCount++;
    const dimension = `${img.width}x${img.height}`;
    const card = document.createElement('div');
    card.className = 'image-card';
    card.setAttribute('data-dimension', dimension);
    
    // 创建图片容器
    const container = document.createElement('div');
    container.className = 'image-container';
    
    // 创建图片元素
    const imgElement = document.createElement('img');
    imgElement.src = img.src;
    imgElement.alt = img.alt;
    
    // 创建查看原图按钮
    const viewButton = document.createElement('button');
    viewButton.className = 'view-original';
    viewButton.textContent = '查看原图';
    viewButton.onclick = () => showOriginal(img.src);
    
    // 组装图片容器
    container.appendChild(imgElement);
    container.appendChild(viewButton);
    
    // 创建信息区域
    const infoDiv = document.createElement('div');
    infoDiv.className = 'image-info';
    infoDiv.innerHTML = `
      <div class="dimension-info">${img.width} x ${img.height}</div>
      <div class="image-actions">
        <button class="copy-button" data-url="${img.src}">复制链接</button>
        <button class="download-button" data-url="${img.src}" data-filename="${getFileName(img.src)}">下载</button>
      </div>
    `;
    
    // 添加复制按钮事件监听器
    const copyButton = infoDiv.querySelector('.copy-button');
    copyButton.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(img.src);
        showToast('已复制图片链接');
      } catch (err) {
        console.error('复制失败:', err);
        showToast('复制失败', true);
      }
    });

    // 添加下载按钮事件监听器
    const downloadButton = infoDiv.querySelector('.download-button');
    downloadButton.addEventListener('click', () => {
      downloadImage(img.src, getFileName(img.src));
    });
    
    // 组装卡片
    card.appendChild(container);
    card.appendChild(infoDiv);
    
    imageGrid.appendChild(card);
  });

  if (DEBUG) {
    console.log('实际渲染的图片数量:', renderedCount);
  }

  // 确保在渲染完图片后更新可见性和计数
  updateVisibility();
}

// 排序函数
function sortImages(images, sortType) {
  return [...images].sort((a, b) => {
    switch (sortType) {
      case 'dimension-desc':
        return (b.width * b.height) - (a.width * a.height);
      case 'dimension-asc':
        return (a.width * a.height) - (b.width * b.height);
      case 'width-desc':
        return b.width - a.width;
      case 'width-asc':
        return a.width - b.width;
      case 'height-desc':
        return b.height - a.height;
      case 'height-asc':
        return a.height - b.height;
      default:
        return 0;
    }
  });
}

// 更新可见性函数
function updateVisibility() {
  const checkedDimensions = Array.from(document.querySelectorAll('.dimension-checkbox:checked'))
    .map(cb => cb.getAttribute('data-dimension'));
  
  let visibleCount = 0;
  const totalCount = document.querySelectorAll('.image-card').length;

  // 遍历所有图片卡片，更新可见性
  document.querySelectorAll('.image-card').forEach(card => {
    const cardDimension = card.getAttribute('data-dimension');
    if (!cardDimension) return;

    const [cardW, cardH] = cardDimension.split('x').map(Number);
    let shouldShow = checkedDimensions.length === 0 ? true : false;
    
    if (!shouldShow) {
      for (const dimension of checkedDimensions) {
        const [targetW, targetH] = dimension.split('x').map(Number);
        if (Math.abs(targetW - cardW) <= 10 && Math.abs(targetH - cardH) <= 10) {
          shouldShow = true;
          break;
        }
      }
    }
    
    if (shouldShow) {
      card.classList.remove('hidden-card');
      visibleCount++;
    } else {
      card.classList.add('hidden-card');
    }
  });

  // 更新全选按钮状态
  const toggleAllButton = document.getElementById('toggleAll');
  if (toggleAllButton) {
    const allCheckboxes = document.querySelectorAll('.dimension-checkbox');
    const allChecked = Array.from(allCheckboxes).every(cb => cb.checked);
    toggleAllButton.textContent = allChecked ? '取消全选' : '全选';
  }

  // 更新图片计数显示
  const imageCountElement = document.querySelector('.image-count');
  if (imageCountElement) {
    imageCountElement.textContent = `${visibleCount}/${totalCount}张图片`;
  }

  // 更新状态指示器
  updateStatusIndicator(false, true);

  // 添加调试日志
  console.log('可见性更新:', {
    totalCount,
    visibleCount,
    checkedDimensions: checkedDimensions.length
  });
}

// 在 init 函数中调用
// initFilterButton();

// 确保在页面加载完成后初始化
document.addEventListener('DOMContentLoaded', init); 

// 在 init 函数外部添加 batchDownload 函数
async function batchDownload() {
  if (typeof JSZip === 'undefined') {
    showToast('JSZip 库加载失败', true);
    return;
  }
  
  const downloadButton = document.getElementById('batchDownload');
  const zip = new JSZip();
  const visibleImages = Array.from(document.querySelectorAll('.image-card:not(.hidden-card)'));
  
  if (visibleImages.length === 0) {
    showToast('没有可下载的图片');
    return;
  }

  try {
    downloadButton.disabled = true;
    downloadButton.textContent = '打包中...';
    
    let totalSize = 0;
    const failedImages = [];
    
    // 添加一个 README.txt 文件，包含下载信息
    const now = new Date();
    const dateStr = now.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
    
    let readme = `下载时间: ${dateStr}\n`;
    readme += `总图片数: ${visibleImages.length}张\n`;
    readme += '分辨率分布:\n';
    
    // 统计分辨率分布
    const resolutionStats = {};
    visibleImages.forEach(card => {
      const dimension = card.getAttribute('data-dimension');
      resolutionStats[dimension] = (resolutionStats[dimension] || 0) + 1;
    });
    
    Object.entries(resolutionStats).forEach(([dimension, count]) => {
      readme += `${dimension}: ${count}张\n`;
    });
    
    zip.file('README.txt', readme);
    
    showToast(`开始下载 ${visibleImages.length} 张图片...`);
    
    // 下载所有图片
    for (let i = 0; i < visibleImages.length; i++) {
      const img = visibleImages[i].querySelector('img');
      const downloadBtn = visibleImages[i].querySelector('.download-button');
      const url = img.src;
      const filename = downloadBtn.dataset.filename;
      
      // 检查 URL 是否有效
      if (!isValidImageUrl(url)) {
        console.warn(`跳过无效URL: ${url}`);
        failedImages.push(`${downloadBtn.dataset.filename} (无效URL)`);
        continue;
      }

      try {
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const blob = await response.blob();
        totalSize += blob.size;
        zip.file(filename, blob);
      } catch (error) {
        console.error(`下载图片失败: ${filename}`, error);
        failedImages.push(filename);
      }
      
      // 更新下载按钮文本显示进度
      downloadButton.textContent = `打包中 ${Math.round((i + 1) / visibleImages.length * 100)}%`;
    }
    
    // 更新 README 文件添加大小信息
    const sizeInfo = `总大小: ${formatFileSize(totalSize)}\n`;
    if (failedImages.length > 0) {
      readme += '\n下载失败的图片:\n' + failedImages.join('\n');
    }
    zip.file('README.txt', sizeInfo + readme);
    
    const content = await zip.generateAsync({type: 'blob'});
    const zipUrl = URL.createObjectURL(content);
    
    // 生成包含信息的文件名
    const successCount = visibleImages.length - failedImages.length;
    const zipName = `images_${successCount}张_${formatFileSize(totalSize)}_${formatDate(now)}.zip`;
    
    const link = document.createElement('a');
    link.href = zipUrl;
    link.download = zipName;
    
    // 添加下载完成或取消的监听
    const cleanup = () => {
      URL.revokeObjectURL(zipUrl);
      downloadButton.disabled = false;
      downloadButton.textContent = '批量下载';
      // 移除监听器
      link.removeEventListener('click', handleClick);
    };
    
    const handleClick = (event) => {
      // 延迟执行清理，确保下载对话框已经显示
      setTimeout(() => {
        // 检查是否真的开始下载
        const downloading = document.visibilityState === 'hidden' || event.type === 'click';
        if (!downloading) {
          cleanup();
          showToast('下载已取消');
        } else {
          showToast(`打包完成 (${successCount}张图片, ${formatFileSize(totalSize)})`);
          cleanup();
        }
      }, 1000);
    };
    
    link.addEventListener('click', handleClick);
    
    // 触发下载
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
  } catch (error) {
    console.error('批量下载失败:', error);
    showToast('批量下载失败', true);
    downloadButton.disabled = false;
    downloadButton.textContent = '批量下载';
  }
}

// 格式化文件大小
function formatFileSize(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// 格式化日期为文件名友好格式
function formatDate(date) {
  return date.toISOString()
    .replace(/[:.]/g, '-')
    .replace('T', '_')
    .split('.')[0];
}

// 添加 URL 验证函数
function isValidImageUrl(url) {
  try {
    const urlObj = new URL(url);
    // 检查是否是受支持的协议
    return urlObj.protocol === 'http:' || urlObj.protocol === 'https:';
  } catch (e) {
    return false;
  }
}
 