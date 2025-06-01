// 載入遊戲數據
let allGamesData = []; // 全域變數來儲存所有遊戲數據

async function loadGameData() {
    console.log('loadGameData() called.');
    try {
        console.log('Attempting to fetch /data.json...');
        const response = await fetch('/data.json');
        console.log('Fetch complete. Response:', response);

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        console.log('Attempting to parse response as JSON...');
        const data = await response.json();
        console.log('JSON parsed. Data:', data);

        if (!Array.isArray(data)) {
            console.error('Loaded data is not an array:', data);
            showError('載入的數據格式不正確，請確認 data.json 是有效的 JSON 陣列');
            return;
        }

        allGamesData = data; // 將載入的數據儲存到全域變數
        
        // 在數據載入後填充好評率篩選選項 (只需要執行一次)
        populateReviewFilter(allGamesData);

        // 初次顯示所有遊戲 (不過濾)
        displayGames(allGamesData);
        drawCharts(allGamesData); // 繪製圖表
        console.log('loadGameData finished. Data loaded.');
    } catch (error) {
        console.error('Error loading or processing game data:', error);
        showError(`無法載入或處理遊戲數據: ${error.message}`);
    }
}

// 填充好評率篩選下拉選單
function populateReviewFilter(games) {
     const reviewFilter = document.getElementById('reviewFilter');
    
    // 確保 reviewFilter 元素存在
    if (!reviewFilter) {
        console.error('Review filter element not found in populateReviewFilter.');
        return;
    }

    // 取得所有好評率摘要 (排除未知)
    const allSummaries = Array.from(new Set(games.map(g => g.好評率摘要))).filter(s => s && s !== '未知');
    
    // 定義好評率摘要的排序順序
    const summaryOrder = ['壓倒性好評', '極度好評', '大多好評', '好評', '褒貶不一', '大多負評', '負評如潮', '壓倒性負評'];
    
    // 根據定義的順序排序好評率摘要
    allSummaries.sort((a, b) => {
        const indexA = summaryOrder.indexOf(a);
        const indexB = summaryOrder.indexOf(b);
        // 如果某個分類不在 order 裡，把它排在後面
        if (indexA === -1 && indexB === -1) return 0;
        if (indexA === -1) return 1;
        if (indexB === -1) return -1;
        return indexA - indexB;
    });

    // 清空除了「全部」以外的選項
    reviewFilter.innerHTML = '<option value="全部">全部</option>';
    allSummaries.forEach(s => {
        const opt = document.createElement('option');
        opt.value = s;
        opt.textContent = s;
        reviewFilter.appendChild(opt);
    });
     console.log('Review filter populated.');
}

// 顯示遊戲列表（橫向排版+背景色）
function displayGames(games) {
    console.log('displayGames called.', games.length, 'games');
    const gameTable = document.getElementById('gameTable');
    
    // 確保 gameTable 元素存在
    if (!gameTable) {
        console.error('Game table element not found in displayGames.');
        return;
    }

    // 渲染遊戲列表
    gameTable.innerHTML = games.map(game => renderGameRow(game)).join('');
    console.log('displayGames finished.');
}

function renderGameRow(game) {
    console.log('Rendering game row for:', game.名稱, game); // 在渲染每個遊戲行時輸出數據
    // 決定背景色 class
    const summary = game.好評率摘要 || '未知';
    let bgClass = '';
    if (["壓倒性好評"].includes(summary)) bgClass = 'bg-review-壓倒性好評'; // 藍色
    else if (["極度好評"].includes(summary)) bgClass = 'bg-review-極度好評'; // 綠色
    else if (["大多好評","褒貶不一"].includes(summary)) bgClass = 'bg-review-大多好評'; // 黃色
    else if (["好評"].includes(summary)) bgClass = 'bg-review-好評'; // 橘色
    else if (["大多負評","負評如潮","壓倒性負評"].includes(summary)) bgClass = 'bg-review-大多負評'; // 紅色系
    else bgClass = 'bg-review-未知'; // 灰色
    // 價格、原價、折扣
    const price = game.價格 || '';
    const original = game.原價 ? `<span class='game-row-original'>${game.原價}</span>` : '';
    const discount = game.折扣 ? `<span class='game-row-discount'>${game.折扣}</span>` : '';
    // 好評百分比、評論數
    const posRate = game.好評百分比 ? `<span class='game-row-review'>👍${game.好評百分比}</span>` : '';
    const reviewCount = game.評論數 ? `<span class='game-row-review'>💬${game.評論數}</span>` : '';
    // 標題
    const title = `<a class='game-row-title' href='${game.連結}' target='_blank'>${game.名稱}</a>`;
    // 圖片
    const img = `<img class='game-row-img' src='${game.圖片}' alt='${game.名稱}'>`;
    // 顯示好評率摘要文字
    const summaryText = `<span class='game-row-more'>${summary}</span>`;

    return `<div class='game-row ${bgClass}'>
        ${img}
        <div class='game-row-info'>
            ${title}
            <div class='game-row-meta'>${discount}${original}<span class='game-row-price'>${price}</span>${posRate}${reviewCount}</div>
        </div>
        ${summaryText}
    </div>`;
}

// 顯示錯誤信息
function showError(message) {
    const gameList = document.getElementById('gameList');
    gameList.innerHTML = `
        <div class="col-12 text-center">
            <div class="alert alert-danger" role="alert">
                <i class="fas fa-exclamation-circle"></i> ${message}
            </div>
        </div>
    `;
}

// 篩選遊戲
function filterGames() {
    const reviewFilter = document.getElementById('reviewFilter');
    const priceFilter = document.getElementById('priceFilter');
    const discountFilter = document.getElementById('discountFilter');

    // 確保所有篩選器元素都存在
    if (!reviewFilter || !priceFilter || !discountFilter) {
        console.error('One or more filter elements not found');
        return;
    }

    const filteredGames = allGamesData.filter(game => {
        // 好評率篩選
        if (reviewFilter.value !== '全部' && game.好評率摘要 !== reviewFilter.value) {
            return false;
        }

        // 價格篩選
        if (priceFilter.value !== '全部') {
            const price = parseFloat(game.價格.replace('NT$', '').replace(/,/g, ''));
            if (isNaN(price)) return false;

            switch (priceFilter.value) {
                case '0-100':
                    if (price > 100) return false;
                    break;
                case '100-300':
                    if (price < 100 || price > 300) return false;
                    break;
                case '300-500':
                    if (price < 300 || price > 500) return false;
                    break;
                case '500-1000':
                    if (price < 500 || price > 1000) return false;
                    break;
                case '1000+':
                    if (price < 1000) return false;
                    break;
            }
        }

        // 折扣篩選
        if (discountFilter.value !== '全部') {
            const discount = parseInt(game.折扣.replace('%', '').replace('-', ''));
            if (isNaN(discount)) return false;

            switch (discountFilter.value) {
                case '0-20':
                    if (discount > 20) return false;
                    break;
                case '20-40':
                    if (discount < 20 || discount > 40) return false;
                    break;
                case '40-60':
                    if (discount < 40 || discount > 60) return false;
                    break;
                case '60-80':
                    if (discount < 60 || discount > 80) return false;
                    break;
                case '80+':
                    if (discount < 80) return false;
                    break;
            }
        }

        return true;
    });

    displayGames(filteredGames);
    drawCharts(filteredGames);
}

// 頁面載入時執行
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOMContentLoaded fired.');
    
    // 添加篩選器的事件監聽器
    // 不需要移除舊的事件監聽器或 cloneNode，DOMContentLoaded 只會執行一次
    const reviewFilter = document.getElementById('reviewFilter');
    const priceFilter = document.getElementById('priceFilter');
    const discountFilter = document.getElementById('discountFilter');

    if (reviewFilter) {
        reviewFilter.addEventListener('change', filterGames);
    }

    if (priceFilter) {
        priceFilter.addEventListener('change', filterGames);
    }

    if (discountFilter) {
        discountFilter.addEventListener('change', filterGames);
    }
    
    // 載入遊戲數據 (這會觸發 populateReviewFilter 和 displayGames)
    loadGameData();
});

// --- 圖表與排行榜 ---
function drawCharts(games) {
    // 1. 散點圖：折扣價格 vs. 好評率 (點的大小表示評論數)
    const pricePositiveRateData = [];
    games.forEach(game => {
        // 價格轉數字
        let price = 0;
        if (game.價格 && typeof game.價格 === 'string') {
            price = parseFloat(game.價格.replace('NT$', '').replace(/,/g, ''));
        }
        // 好評率轉數字
        let positiveRate = 0;
        if (game.好評百分比 && typeof game.好評百分比 === 'string') {
            positiveRate = parseFloat(game.好評百分比.replace('%', ''));
        }
        // 評論數轉數字
        let reviewCount = 0;
        if (game.評論數 && typeof game.評論數 === 'string') {
            reviewCount = parseInt(game.評論數.replace(/,/g, ''));
        }

        // 只包含價格和好評率都大於 0 的遊戲
        if (price > 0 && positiveRate > 0) {
            // 計算點的半徑，使用log縮放評論數
            let reviewCountNum = parseInt(game.評論數.replace(/,/g, '')); // 確保評論數是數字
            if (isNaN(reviewCountNum)) reviewCountNum = 0;
            const pointSize = reviewCountNum > 0 ? Math.max(3, Math.log(reviewCountNum + 1) * 2) : 3; // 最小點半徑為3
            console.log(`Game: ${game.名稱}, Reviews: ${reviewCountNum}, Point Size: ${pointSize}`); // 添加log輸出
            pricePositiveRateData.push({
                x: price, // X軸是折扣價格
                y: positiveRate, // Y軸是好評率
                label: game.名稱, // Tooltip 顯示遊戲名稱
                reviewCount: game.評論數, // 用於tooltip顯示
                r: pointSize // 設定點的半徑
            });
        }
    });

    if(window.barChartObj) window.barChartObj.destroy();
    const scatter1Ctx = document.getElementById('barChart').getContext('2d');
    window.barChartObj = new Chart(scatter1Ctx, {
        type: 'scatter',
        data: {
            datasets: [{
                label: '遊戲折扣價格 vs. 好評率 (點的大小表示評論數)',
                data: pricePositiveRateData,
                backgroundColor: 'rgba(13,110,253,0.5)',
                borderColor: '#0d6efd',
                // pointRadius: 3, // 這裡不再使用固定的 pointRadius
            }]
        },
        options: {
            responsive: true,
            plugins: {
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const d = context.raw;
                            return `${d.label}\n價格: NT$${d.x}\n好評率: ${d.y}%\n評論數: ${d.reviewCount}`;
                        }
                    }
                },
                legend: { display: false }
            },
            scales: {
                x: { 
                    title: { display: true, text: '折扣價格(NT$)' },
                    type: 'linear'
                },
                y: { 
                    title: { display: true, text: '好評率(%)' },
                    type: 'linear',
                    beginAtZero: true,
                    max: 100
                }
            }
        }
    });

    // 2. 散點圖：折扣價格 vs. 評論數
    const priceReviewScatterData = [];
    games.forEach(game => {
        // 價格轉數字
        let price = 0;
        if (game.價格 && typeof game.價格 === 'string') {
            price = parseFloat(game.價格.replace('NT$', '').replace(/,/g, ''));
        }
        // 評論數轉數字
        let reviewCount = 0;
        if (game.評論數 && typeof game.評論數 === 'string') {
            reviewCount = parseInt(game.評論數.replace(/,/g, ''));
        }
        // 只包含價格和評論數都大於 0 的遊戲
        if (price > 0 && reviewCount > 0) {
            priceReviewScatterData.push({
                x: price,
                y: reviewCount,
                label: game.名稱,
                positiveRate: game.好評百分比
            });
        }
    });

    if(window.scatterChartObj) window.scatterChartObj.destroy();
    const scatter2Ctx = document.getElementById('scatterChart').getContext('2d');
    window.scatterChartObj = new Chart(scatter2Ctx, {
        type: 'scatter',
        data: {
            datasets: [{
                label: '遊戲折扣價格 vs. 評論數',
                data: priceReviewScatterData,
                backgroundColor: 'rgba(255,193,7,0.5)',
                borderColor: '#ffc107',
                pointRadius: 3,
            }]
        },
        options: {
            plugins: {
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const d = context.raw;
                            return `${d.label}\n價格: NT$${d.x}\n評論數: ${d.y.toLocaleString()}\n好評率: ${d.positiveRate}`;
                        }
                    }
                },
                legend: { display: false }
            },
            scales: {
                x: { title: { display: true, text: '折扣價格(NT$)' }, type: 'linear' },
                y: { title: { display: true, text: '評論數' }, type: 'linear', beginAtZero: true, max: 200000 }
            }
        }
    });

    // 3. CP值排行榜
    // CP值 = (好評率 * log(評論數+1)) / 折扣價格
    const cpArr = games.map(game => {
        let price = 0;
        if (game.價格 && typeof game.價格 === 'string') {
            price = parseFloat(game.價格.replace('NT$', '').replace(/,/g, ''));
        }
        let posRate = 0;
        if (game.好評百分比 && typeof game.好評百分比 === 'string') {
            posRate = parseFloat(game.好評百分比.replace('%', ''));
        }
        let reviewCount = 0;
        if (game.評論數 && typeof game.評論數 === 'string') {
            reviewCount = parseInt(game.評論數.replace(/,/g, ''));
        }
        let cp = 0;
        if (price > 0 && posRate > 0 && reviewCount > 0) {
            // 使用對數來平衡評論數的影響，避免評論數過多的遊戲佔據所有高CP值位置
            cp = (posRate * Math.log(reviewCount + 1)) / price;
        }
        return { ...game, cp };
    });
    cpArr.sort((a,b) => b.cp - a.cp);
    const top50 = cpArr.slice(0,50);
    // 顯示排行榜
    const cpRankDiv = document.getElementById('cpRank');
    cpRankDiv.innerHTML = `<ol class="list-group list-group-numbered">${top50.map(game => `
        <li class="list-group-item d-flex justify-content-between align-items-center">
            <span><a href="${game.連結}" target="_blank">${game.名稱}</a></span>
            <span class="badge bg-success rounded-pill">CP值: ${game.cp.toFixed(2)}</span>
        </li>
    `).join('')}</ol>`;
} 