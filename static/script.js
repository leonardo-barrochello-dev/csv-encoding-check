const form = document.getElementById('checkForm');
const loading = document.getElementById('loading');
const error = document.getElementById('error');
const results = document.getElementById('results');
const summary = document.getElementById('summary');
const violationsTable = document.getElementById('violationsTable');
const submitBtn = document.getElementById('submitBtn');

let currentData = null;
let currentPage = 1;
let pageSize = 20;

form.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const fileInput = document.getElementById('file');
    const encoding = document.getElementById('encoding').value;
    
    if (!fileInput.files[0]) {
        showError('Selecione um arquivo CSV');
        return;
    }
    
    const formData = new FormData();
    formData.append('file', fileInput.files[0]);
    formData.append('encoding', encoding);
    
    submitBtn.disabled = true;
    loading.classList.add('show');
    results.classList.remove('show');
    error.classList.remove('show');
    
    try {
        const response = await fetch('/check', {
            method: 'POST',
            body: formData
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || 'Erro ao processar arquivo');
        }
        
        currentData = data;
        currentPage = 1;
        displayResults(data);
    } catch (err) {
        showError(err.message);
    } finally {
        submitBtn.disabled = false;
        loading.classList.remove('show');
    }
});

function showError(message) {
    error.textContent = message;
    error.classList.add('show');
    setTimeout(() => error.classList.remove('show'), 5000);
}

function displayResults(data) {
    summary.innerHTML = `
        <h2>Resultado da Análise</h2>
        <div class="stats">
            <div class="stat">
                <div class="stat-label">Arquivo</div>
                <div class="stat-value">${data.filename}</div>
            </div>
            <div class="stat">
                <div class="stat-label">Encoding Detectado</div>
                <div class="stat-value">${data.source_encoding}</div>
            </div>
            <div class="stat">
                <div class="stat-label">Separador Detectado</div>
                <div class="stat-value">${data.separator}</div>
            </div>
            <div class="stat">
                <div class="stat-label">Encoding Alvo</div>
                <div class="stat-value">${data.target_encoding}</div>
            </div>
            <div class="stat">
                <div class="stat-label">Violações</div>
                <div class="stat-value">${data.total_violations}</div>
            </div>
        </div>
    `;
    
    if (data.total_violations === 0) {
        violationsTable.innerHTML = '<div class="no-violations">✓ Nenhum caractere incompatível encontrado!</div>';
    } else {
        renderTable();
    }
    
    results.classList.add('show');
}

function renderTable() {
    const violations = currentData.violations;
    const totalPages = Math.ceil(violations.length / pageSize);
    
    if (currentPage > totalPages) currentPage = totalPages;
    if (currentPage < 1) currentPage = 1;
    
    const start = (currentPage - 1) * pageSize;
    const end = Math.min(start + pageSize, violations.length);
    const pageViolations = violations.slice(start, end);
    
    let html = `
        <div class="table-header">
            <div class="page-size-control">
                <span>Exibir</span>
                <select id="pageSizeSelect">
                    <option value="10" ${pageSize === 10 ? 'selected' : ''}>10</option>
                    <option value="20" ${pageSize === 20 ? 'selected' : ''}>20</option>
                    <option value="50" ${pageSize === 50 ? 'selected' : ''}>50</option>
                    <option value="100" ${pageSize === 100 ? 'selected' : ''}>100</option>
                </select>
                <span>por página</span>
            </div>
            <button class="export-btn" id="exportBtn">⬇ Exportar CSV</button>
        </div>
        <table>
            <thead>
                <tr>
                    <th>Linha</th>
                    <th>Campo</th>
                    <th>Coluna</th>
                    <th>Caractere</th>
                    <th>Código Unicode</th>
                    <th>Nome Unicode</th>
                    <th>Posição</th>
                    <th>Valor da Célula</th>
                </tr>
            </thead>
            <tbody>
    `;
    
    pageViolations.forEach(v => {
        html += `
            <tr>
                <td>${v.line}</td>
                <td><strong>${escapeHtml(v.field)}</strong></td>
                <td>${v.column}</td>
                <td><span class="char-display">${escapeHtml(v.character)}</span></td>
                <td><span class="unicode-code">${v.unicode_code}</span></td>
                <td>${escapeHtml(v.unicode_name)}</td>
                <td>${v.position_in_cell}</td>
                <td>${escapeHtml(v.cell_value)}</td>
            </tr>
        `;
    });
    
    html += '</tbody></table>';
    html += renderPagination(totalPages, violations.length, start + 1, end);
    
    violationsTable.innerHTML = html;
    
    document.getElementById('pageSizeSelect').addEventListener('change', (e) => {
        pageSize = parseInt(e.target.value);
        currentPage = 1;
        renderTable();
    });
    
    document.getElementById('exportBtn').addEventListener('click', exportCSV);
    
    document.querySelectorAll('.pagination .page-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            currentPage = parseInt(btn.dataset.page);
            renderTable();
        });
    });
}

function renderPagination(totalPages, totalItems, from, to) {
    let html = '<div class="pagination">';
    
    html += `<span class="pagination-info">${from}-${to} de ${totalItems}</span>`;
    
    html += `<button class="page-btn" data-page="1" ${currentPage === 1 ? 'disabled' : ''}>«</button>`;
    html += `<button class="page-btn" data-page="${currentPage - 1}" ${currentPage === 1 ? 'disabled' : ''}>‹</button>`;
    
    let startPage = Math.max(1, currentPage - 2);
    let endPage = Math.min(totalPages, currentPage + 2);
    
    if (startPage > 1) {
        html += `<button class="page-btn" data-page="1">1</button>`;
        if (startPage > 2) html += `<span class="pagination-info">...</span>`;
    }
    
    for (let i = startPage; i <= endPage; i++) {
        html += `<button class="page-btn ${i === currentPage ? 'active' : ''}" data-page="${i}">${i}</button>`;
    }
    
    if (endPage < totalPages) {
        if (endPage < totalPages - 1) html += `<span class="pagination-info">...</span>`;
        html += `<button class="page-btn" data-page="${totalPages}">${totalPages}</button>`;
    }
    
    html += `<button class="page-btn" data-page="${currentPage + 1}" ${currentPage === totalPages ? 'disabled' : ''}>›</button>`;
    html += `<button class="page-btn" data-page="${totalPages}" ${currentPage === totalPages ? 'disabled' : ''}>»</button>`;
    
    html += '</div>';
    return html;
}

function exportCSV() {
    const violations = currentData.violations;
    const headers = ['Linha', 'Campo', 'Coluna', 'Caractere', 'Código Unicode', 'Nome Unicode', 'Posição na Célula', 'Valor da Célula'];
    
    const rows = violations.map(v => [
        v.line,
        v.field,
        v.column,
        v.character,
        v.unicode_code,
        v.unicode_name,
        v.position_in_cell,
        v.cell_value
    ]);
    
    let csvContent = '\uFEFF';
    csvContent += headers.map(h => `"${h}"`).join(',') + '\n';
    rows.forEach(row => {
        csvContent += row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',') + '\n';
    });
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const baseName = currentData.filename.replace(/\.csv$/i, '');
    link.href = url;
    link.download = `${baseName}_violacoes_${currentData.target_encoding.replace(/[^a-zA-Z0-9]/g, '_')}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
