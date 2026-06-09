let allDocuments = [];
let currentFilteredData = [];

const CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTiWVQ_iCVoOVIzzsR28wnfaWqniBFolkDs3uOn_kMcquNmiVqg1ZVV_BGjlIfsyCQlRemOXeoL4Mhw/pub?gid=0&single=true&output=csv';

document.addEventListener('DOMContentLoaded', () => {
    fetch(CSV_URL)
        .then(response => response.text())
        .then(csvText => {
            allDocuments = parseCSV(csvText); // CSVをデータに変換
            initializeSite();
        })
        .catch(error => console.error('Error loading data:', error));
});

// CSVテキストをJavaScriptで使えるオブジェクト配列に変換する関数
function parseCSV(csv) {
    const lines = csv.split(/\r?\n/);
    const result = [];
    const headers = lines[0].split(',').map(header => header.replace(/"/g, '').trim());

    // 2行目以降のデータを処理
    for (let i = 1; i < lines.length; i++) {
        if (!lines[i].trim()) continue; // 完全な空行はスキップ
        
        const currentline = [];
        let currentVal = '';
        let insideQuotes = false;

        // 1文字ずつ確認して、カンマとダブルクォーテーションを正確に処理する
        for (let char of lines[i]) {
            if (char === '"' && !insideQuotes) {
                insideQuotes = true; // ダブルクォーテーションの始まり
            } else if (char === '"' && insideQuotes) {
                insideQuotes = false; // ダブルクォーテーションの終わり
            } else if (char === ',' && !insideQuotes) {
                currentline.push(currentVal); // カンマが来たら区切る
                currentVal = '';
            } else {
                currentVal += char;
            }
        }
        currentline.push(currentVal); // 最後の列を追加

        const obj = {};
        for (let j = 0; j < headers.length; j++) {
            obj[headers[j]] = currentline[j] ? currentline[j].trim() : "";
        }
        
        // idとtitleが両方とも空欄の場合は、幽霊データとみなして無視する
        if (!obj.id && !obj.title) continue;
        
        // JSONの時と同じデータ構造を作り直す
        result.push({
            id: obj.id,
            title: obj.title,
            image: obj.image,
            date: obj.date,
            author: obj.author,
            type: obj.type,
            summary: obj.summary,
            keywords: obj.keywords,
            url: obj.url,
            isRecommend: obj.isRecommend === "TRUE" || obj.isRecommend === "true",
            views: parseInt(obj.views) || 0,
            tags: {
                level: obj.level,
                category: obj.category,
                // othersはカンマ区切りの文字列を配列に変換
                others: obj.others ? obj.others.split(',').map(s => s.trim()).filter(s => s) : []
            }
        });
    }
    return result;
}

function initializeSite() {
    const isSubPage = window.location.pathname.includes('sub.html');
    const urlParams = new URLSearchParams(window.location.search);

    const headerSelect = document.getElementById('header-category-select');
    if (headerSelect) {
        headerSelect.addEventListener('change', (e) => {
            if(e.target.value) {
                window.location.href = `sub.html?category=${e.target.value}`;
            }
        });
    }

    if (isSubPage) {
        setupSubPage(urlParams);
    } else {
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
    let isRanking = false; 

    if (view === 'new') {
        titleEl.textContent = 'NEW（新着順）';
    } else if (view === 'ranking') {
        titleEl.textContent = 'ランキング（閲覧数順）';
        isRanking = true; 
    } else if (view === 'beginner') {
        titleEl.textContent = '初心者向け資料';
        baseData = baseData.filter(doc => doc.tags.level === '初心者');
    } else if (view === 'recommend') {
        titleEl.textContent = '運営のおすすめ資料';
        baseData = baseData.filter(doc => doc.isRecommend === true);
    } else if (category) {
        titleEl.textContent = `カテゴリ：${category}`;
        baseData = baseData.filter(doc => doc.tags.category === category);
        const headerSelect = document.getElementById('header-category-select');
        if(headerSelect) headerSelect.value = category; 
    } else {
        titleEl.textContent = '資料一覧';
    }

    if (isRanking) {
        currentFilteredData = baseData.sort((a, b) => b.views - a.views);
    } else {
        currentFilteredData = baseData.sort((a, b) => new Date(b.date) - new Date(a.date));
    }
    
    renderCards(currentFilteredData);
}

function applyFilters() {
    const searchText = document.getElementById('search-input') ? document.getElementById('search-input').value.toLowerCase() : '';
    const typeValue = document.getElementById('filter-type') ? document.getElementById('filter-type').value : 'all';
    const levelValue = document.getElementById('filter-level') ? document.getElementById('filter-level').value : 'all';
    const categoryValue = document.getElementById('filter-category') ? document.getElementById('filter-category').value : 'all';

    const filtered = currentFilteredData.filter(doc => {
        const matchText = doc.title.toLowerCase().includes(searchText) || 
                          doc.summary.toLowerCase().includes(searchText) || 
                          (doc.keywords && doc.keywords.toLowerCase().includes(searchText));
        const matchType = (typeValue === 'all') || (doc.type === typeValue);
        const matchLevel = (levelValue === 'all') || (doc.tags.level === levelValue);
        const matchCategory = (categoryValue === 'all') || (doc.tags.category === categoryValue);
        return matchText && matchType && matchLevel && matchCategory;
    });

    const urlParams = new URLSearchParams(window.location.search);
    const isRanking = urlParams.get('view') === 'ranking';
    
    const sortedFiltered = filtered.sort((a, b) => isRanking ? (b.views - a.views) : (new Date(b.date) - new Date(a.date)));
    
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

function getTagsHTML(doc) {
    let html = `<span class="tag tag-level">${doc.tags.level}</span><span class="tag tag-category">${doc.tags.category}</span>`;
    if(doc.tags.others && doc.tags.others.length > 0) {
        doc.tags.others.forEach(t => html += `<span class="tag tag-other">${t}</span>`);
    }
    return html;
}

function renderHeroCard(data) {
    const container = document.getElementById('hero-card-container');
    if(!container) return; 
    if(data.length === 0) return;
    
    const latestDoc = [...data].sort((a, b) => new Date(b.date) - new Date(a.date))[0];
    
    let imgSrc = 'CBlibDef.png';
    if (latestDoc.image) {
        imgSrc = `img/${latestDoc.image}`;
    } else if (latestDoc.type === '週刊ニュース') {
        imgSrc = 'img/CBnews.png';
    }
    
    container.innerHTML = `
        <div class="hero-card">
            <div class="hero-content-left">
                <h3>${latestDoc.title}</h3>
                <div class="card-meta" style="font-size: 0.9rem;">📅 ${latestDoc.date} | 🏷️ ${latestDoc.type} | 👤 ${latestDoc.author}</div>
                <div class="card-tags">${getTagsHTML(latestDoc)}</div>
                <p class="card-summary">${latestDoc.summary}</p>
            </div>
            
            <div class="hero-content-center">
                <img src="${imgSrc}" alt="${latestDoc.title}" class="hero-card-image">
            </div>
            
            <div class="hero-content-right">
                <div class="card-link"><a href="${latestDoc.url}" target="_blank">この資料を開く</a></div>
            </div>
        </div>
    `;
}

function renderRanking(data) {
    const list = document.getElementById('ranking-list');
    if(!list) return; 
    const ranked = [...data].sort((a, b) => b.views - a.views).slice(0, 5);
    list.innerHTML = ranked.map((doc, i) => `
        <li><span class="rank-badge">${i + 1}位</span><a href="${doc.url}" target="_blank">${doc.title}</a></li>
    `).join('');
}

function renderNewArrivals(data) {
    const list = document.getElementById('new-list');
    if(!list) return; 
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

    grid.innerHTML = data.map(doc => {
        let imgSrc = 'CBlibDef.png'; 
        if (doc.image) {
            imgSrc = `img/${doc.image}`;
        } else if (doc.type === '週刊ニュース') {
            imgSrc = 'img/CBnews.png';
        }
        
        return `
        <div class="card">
            <img src="${imgSrc}" alt="${doc.title}" class="card-image">
            <h3>${doc.title}</h3>
            <div class="card-meta">📅 ${doc.date} | 🏷️ ${doc.type} | 👤 ${doc.author}</div>
            <div class="card-tags">${getTagsHTML(doc)}</div>
            <p class="card-summary">${doc.summary}</p>
            <div class="card-link"><a href="${doc.url}" target="_blank">資料を開く</a></div>
        </div>
        `;
    }).join('');
}
