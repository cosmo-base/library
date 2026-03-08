let allDocuments = [];

document.addEventListener('DOMContentLoaded', () => {
    fetch('data.json')
        .then(response => response.json())
        .then(data => {
            allDocuments = data;
            initializeSite();
        })
        .catch(error => console.error('Error loading data:', error));
});

function initializeSite() {
    renderHeroCard(allDocuments);        // 上部の特大カード（最新1件）
    renderCards(allDocuments);           // 右側のすべての資料
    renderRanking(allDocuments);         // 左側のランキング
    renderNewArrivals(allDocuments);     // 左側の新着
    setupFilters();                      // 検索・絞り込み監視
}

// 絞り込みロジック
function applyFilters() {
    const searchText = document.getElementById('search-input').value.toLowerCase();
    const typeValue = document.getElementById('filter-type').value;
    const levelValue = document.getElementById('filter-level').value;
    const categoryValue = document.getElementById('filter-category').value;

    const filtered = allDocuments.filter(doc => {
        const matchText = doc.title.toLowerCase().includes(searchText) || doc.summary.toLowerCase().includes(searchText);
        const matchType = (typeValue === 'all') || (doc.type === typeValue);
        const matchLevel = (levelValue === 'all') || (doc.tags.level === levelValue);
        const matchCategory = (categoryValue === 'all') || (doc.tags.category === categoryValue);

        return matchText && matchType && matchLevel && matchCategory;
    });

    renderCards(filtered);
}

function setupFilters() {
    document.getElementById('search-input').addEventListener('input', applyFilters);
    document.getElementById('filter-type').addEventListener('change', applyFilters);
    document.getElementById('filter-level').addEventListener('change', applyFilters);
    document.getElementById('filter-category').addEventListener('change', applyFilters);
}

// タグHTML生成
function getTagsHTML(doc) {
    let html = `<span class="tag tag-level">${doc.tags.level}</span><span class="tag tag-category">${doc.tags.category}</span>`;
    if(doc.tags.others && doc.tags.others.length > 0) {
        doc.tags.others.forEach(t => html += `<span class="tag tag-other">${t}</span>`);
    }
    return html;
}

// 上部：最新資料1件を描画
function renderHeroCard(data) {
    const container = document.getElementById('hero-card-container');
    if(data.length === 0) return;
    
    // 日付で降順ソートして1件目を取得
    const latestDoc = [...data].sort((a, b) => new Date(b.date) - new Date(a.date))[0];
    
    container.innerHTML = `
        <div class="hero-card">
            <h3>${latestDoc.title}</h3>
            <div class="card-meta" style="font-size: 0.9rem;">📅 ${latestDoc.date} | 🏷️ ${latestDoc.type} | 👤 ${latestDoc.author}</div>
            <div class="card-tags">${getTagsHTML(latestDoc)}</div>
            <p class="card-summary">${latestDoc.summary}</p>
            <div class="card-link"><a href="${latestDoc.url}" target="_blank">この資料を開く</a></div>
        </div>
    `;
}

// 右下：資料一覧（絞り込み結果）
function renderCards(data) {
    const grid = document.getElementById('document-grid');
    const countSpan = document.getElementById('result-count');
    
    countSpan.textContent = `全 ${data.length} 件`;
    
    if(data.length === 0) {
        grid.innerHTML = '<p>該当する資料が見つかりません。</p>';
        return;
    }

    grid.innerHTML = data.map(doc => `
        <div class="card">
            <h3>${doc.title}</h3>
            <div class="card-meta">📅 ${doc.date} | 🏷️ ${doc.type} | 👤 ${doc.author}</div>
            <div class="card-tags">${getTagsHTML(doc)}</div>
            <p class="card-summary">${doc.summary}</p>
            <div class="card-link"><a href="${doc.url}" target="_blank">資料を開く</a></div>
        </div>
    `).join('');
}

// 左側：ランキング
function renderRanking(data) {
    const list = document.getElementById('ranking-list');
    const ranked = [...data].sort((a, b) => b.views - a.views).slice(0, 5);
    
    list.innerHTML = ranked.map((doc, i) => `
        <li>
            <span class="rank-badge">${i + 1}位</span>
            <a href="${doc.url}" target="_blank">${doc.title}</a>
        </li>
    `).join('');
}

// 左側：新着
function renderNewArrivals(data) {
    const list = document.getElementById('new-list');
    const sorted = [...data].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 5);
    
    list.innerHTML = sorted.map(doc => `
        <li>
            <span class="rank-badge" style="font-size:0.8rem;">New</span>
            <a href="${doc.url}" target="_blank">${doc.title}</a>
        </li>
    `).join('');
}