let allDocuments = [];
let currentFilteredData = []; // 子ページなどでベースとなるデータ

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
    const isSubPage = window.location.pathname.includes('sub.html');
    const urlParams = new URLSearchParams(window.location.search);

    // ヘッダーのカテゴリセレクトの挙動（選んだらsub.htmlへ飛ぶ）
    const headerSelect = document.getElementById('header-category-select');
    if (headerSelect) {
        headerSelect.addEventListener('change', (e) => {
            if(e.target.value) {
                window.location.href = `sub.html?category=${e.target.value}`;
            }
        });
    }

    if (isSubPage) {
        // === 子ページの場合 ===
        setupSubPage(urlParams);
    } else {
        // === トップページの場合 ===
        renderHeroCard(allDocuments);
        renderRanking(allDocuments);
        renderNewArrivals(allDocuments);
        currentFilteredData = [...allDocuments];
        const sorted = [...allDocuments].sort((a, b) => new Date(b.date) - new Date(a.date));
        renderCards(sorted);
    }
    
    setupFilters();
}

function setupSubPage(params) {
    const view = params.get('view');
    const category = params.get('category');
    const titleEl = document.getElementById('page-title');

    let baseData = [...allDocuments];

    if (view === 'new') {
        titleEl.textContent = 'NEW（新着順）';
    } else if (view === 'beginner') {
        titleEl.textContent = '初心者向け資料';
        baseData = baseData.filter(doc => doc.tags.level === '初心者');
    } else if (view === 'recommend') {
        titleEl.textContent = '運営のおすすめ資料';
        baseData = baseData.filter(doc => doc.isRecommend === true); // おすすめ抽出
    } else if (category) {
        titleEl.textContent = `カテゴリ：${category}`;
        baseData = baseData.filter(doc => doc.tags.category === category);
        const headerSelect = document.getElementById('header-category-select');
        if(headerSelect) headerSelect.value = category; // セレクトボックスの表示を同期
    } else {
        titleEl.textContent = '資料一覧';
    }

    // デフォルトで日付順にして保持
    currentFilteredData = baseData.sort((a, b) => new Date(b.date) - new Date(a.date));
    renderCards(currentFilteredData);
}

// 絞り込みロジック
function applyFilters() {
    const searchText = document.getElementById('search-input') ? document.getElementById('search-input').value.toLowerCase() : '';
    const typeValue = document.getElementById('filter-type') ? document.getElementById('filter-type').value : 'all';
    const levelValue = document.getElementById('filter-level') ? document.getElementById('filter-level').value : 'all';
    const categoryValue = document.getElementById('filter-category') ? document.getElementById('filter-category').value : 'all';

    // 全件からではなく、そのページのベースデータから絞り込む
    const filtered = currentFilteredData.filter(doc => {
        const matchText = doc.title.toLowerCase().includes(searchText) || doc.summary.toLowerCase().includes(searchText);
        const matchType = (typeValue === 'all') || (doc.type === typeValue);
        const matchLevel = (levelValue === 'all') || (doc.tags.level === levelValue);
        const matchCategory = (categoryValue === 'all') || (doc.tags.category === categoryValue);
        return matchText && matchType && matchLevel && matchCategory;
    });

    const sortedFiltered = filtered.sort((a, b) => new Date(b.date) - new Date(a.date));
    renderCards(sortedFiltered);
}

function setupFilters() {
    const searchInput = document.getElementById('search-input');
    const typeFilter = document.getElementById('filter-type');
    const levelFilter = document.getElementById('filter-level');
    const catFilter = document.getElementById('filter-category');
    const resetBtn = document.getElementById('reset-button');

    if(searchInput) searchInput.addEventListener('input', applyFilters);
    if(typeFilter) typeFilter.addEventListener('change', applyFilters);
    if(levelFilter) levelFilter.addEventListener('change', applyFilters);
    if(catFilter) catFilter.addEventListener('change', applyFilters);

    if(resetBtn) {
        resetBtn.addEventListener('click', () => {
            if(searchInput) searchInput.value = '';
            if(typeFilter) typeFilter.value = 'all';
            if(levelFilter) levelFilter.value = 'all';
            if(catFilter) catFilter.value = 'all';
            applyFilters();
        });
    }
}

// タグHTML生成
function getTagsHTML(doc) {
    let html = `<span class="tag tag-level">${doc.tags.level}</span><span class="tag tag-category">${doc.tags.category}</span>`;
    if(doc.tags.others && doc.tags.others.length > 0) {
        doc.tags.others.forEach(t => html += `<span class="tag tag-other">${t}</span>`);
    }
    return html;
}

function renderHeroCard(data) {
    const container = document.getElementById('hero-card-container');
    if(!container) return; // 子ページには存在しないのでスキップ
    if(data.length === 0) return;
    
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

function renderRanking(data) {
    const list = document.getElementById('ranking-list');
    if(!list) return; // 子ページには存在しないのでスキップ
    const ranked = [...data].sort((a, b) => b.views - a.views).slice(0, 5);
    list.innerHTML = ranked.map((doc, i) => `
        <li><span class="rank-badge">${i + 1}位</span><a href="${doc.url}" target="_blank">${doc.title}</a></li>
    `).join('');
}

function renderNewArrivals(data) {
    const list = document.getElementById('new-list');
    if(!list) return; // 子ページには存在しないのでスキップ
    const sorted = [...data].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 5);
    list.innerHTML = sorted.map(doc => `
        <li><span class="rank-badge" style="font-size:0.8rem;">New</span><a href="${doc.url}" target="_blank">${doc.title}</a></li>
    `).join('');
}

function renderCards(data) {
    const grid = document.getElementById('document-grid');
    const countSpan = document.getElementById('result-count');
    if(!grid) return;

    if(countSpan) countSpan.textContent = `全 ${data.length} 件`;
    
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
