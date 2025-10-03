// Market Basket Analysis Module
class MarketBasketAnalyzer {
    constructor() {
        this.rawData = [];
        this.cleanedData = [];
        this.analysisResults = {};
        this.threshold = 0.05; // 5% праг
        
        // Initialize drag & drop functionality
        this.initializeDragDrop();
    }

    // Initialize drag and drop for file upload
    initializeDragDrop() {
        const uploadArea = document.getElementById('xlsxFileInput');
        if (!uploadArea) return;

        const container = uploadArea.parentElement;
        
        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            container.addEventListener(eventName, this.preventDefaults, false);
        });

        ['dragenter', 'dragover'].forEach(eventName => {
            container.addEventListener(eventName, () => container.classList.add('drag-over'), false);
        });

        ['dragleave', 'drop'].forEach(eventName => {
            container.addEventListener(eventName, () => container.classList.remove('drag-over'), false);
        });

        container.addEventListener('drop', (e) => {
            const files = e.dataTransfer.files;
            if (files.length > 0) {
                document.getElementById('xlsxFileInput').files = files;
                this.handleFileUpload(files[0]);
            }
        }, false);
    }

    preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }

    // Handle XLSX file upload and parsing
    async handleFileUpload(file) {
        if (!file) {
            this.showStatus('Моля изберете файл', 'error');
            return;
        }

        if (!file.name.match(/\.(xlsx|xls)$/)) {
            this.showStatus('Моля изберете XLSX или XLS файл', 'error');
            return;
        }

        this.showStatus('Качване и парсиране на файла...', 'info');

        try {
            const data = await this.parseXLSXFile(file);
            this.rawData = data;
            this.showDataPreview(data);
            this.showStatus(`Успешно заредени ${data.length} записа`, 'success');
        } catch (error) {
            console.error('Грешка при парсиране:', error);
            this.showStatus('Грешка при парсиране на файла: ' + error.message, 'error');
        }
    }

    // Parse XLSX file using SheetJS (would need to include the library)
    async parseXLSXFile(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            
            reader.onload = (e) => {
                try {
                    // For now, simulate XLSX parsing
                    // In production, would use SheetJS library
                    const text = e.target.result;
                    const data = this.parseCSVLikeData(text);
                    resolve(data);
                } catch (error) {
                    reject(error);
                }
            };
            
            reader.onerror = () => reject(new Error('Грешка при четене на файла'));
            reader.readAsText(file); // Simplified for demo
        });
    }

    // Simplified CSV-like data parsing (placeholder for real XLSX parsing)
    parseCSVLikeData(text) {
        const lines = text.split('\n').filter(line => line.trim());
        const headers = lines[0].split(',').map(h => h.trim());
        const data = [];

        for (let i = 1; i < lines.length; i++) {
            const values = lines[i].split(',').map(v => v.trim());
            if (values.length >= headers.length) {
                const record = {};
                headers.forEach((header, index) => {
                    record[header] = values[index] || '';
                });
                data.push(record);
            }
        }

        return data;
    }

    // Show data preview
    showDataPreview(data) {
        const previewSection = document.getElementById('dataPreviewSection');
        const previewDiv = document.getElementById('dataPreview');
        
        if (data.length === 0) {
            previewDiv.innerHTML = '<p>Няма данни за показване</p>';
            return;
        }

        // Show first 5 records
        const headers = Object.keys(data[0]);
        let html = '<table class="combinations-table">';
        html += '<thead><tr>';
        headers.forEach(header => {
            html += `<th>${header}</th>`;
        });
        html += '</tr></thead><tbody>';

        for (let i = 0; i < Math.min(5, data.length); i++) {
            html += '<tr>';
            headers.forEach(header => {
                html += `<td>${data[i][header]}</td>`;
            });
            html += '</tr>';
        }
        
        html += '</tbody></table>';
        html += `<p style="margin-top: 10px;"><strong>Показани първите 5 от общо ${data.length} записа</strong></p>`;
        
        previewDiv.innerHTML = html;
        previewSection.style.display = 'block';
    }

    // Clean and normalize data
    cleanData(data) {
        this.showStatus('Почистване на данните...', 'info');
        
        const cleaned = data
            .filter(record => {
                // Remove empty records
                return Object.values(record).some(value => value && value.toString().trim());
            })
            .map(record => {
                const cleanRecord = {};
                Object.keys(record).forEach(key => {
                    // Normalize text - remove extra spaces, standardize case
                    let value = record[key];
                    if (typeof value === 'string') {
                        value = value.trim().toLowerCase();
                        // Remove common inconsistencies
                        value = value.replace(/\s+/g, ' ');
                        value = value.replace(/['"]/g, '');
                    }
                    cleanRecord[key] = value;
                });
                return cleanRecord;
            });

        // Remove duplicates
        const unique = this.removeDuplicates(cleaned);
        
        this.cleanedData = unique;
        this.showStatus(`Данните са почистени: ${data.length} → ${unique.length} записа`, 'success');
        return unique;
    }

    // Remove duplicate records
    removeDuplicates(data) {
        const seen = new Set();
        return data.filter(record => {
            const key = JSON.stringify(record);
            if (seen.has(key)) {
                return false;
            }
            seen.add(key);
            return true;
        });
    }

    // Perform market basket analysis
    performAnalysis() {
        this.showStatus('Извършване на Market Basket Analysis...', 'info');
        
        const cleanData = this.cleanData(this.rawData);
        
        // Group by date to find combinations
        const dailyTransactions = this.groupByDate(cleanData);
        
        // Find product combinations
        const combinations = this.findCombinations(dailyTransactions);
        
        // Calculate frequencies
        const combinationFrequencies = this.calculateFrequencies(combinations, dailyTransactions.length);
        
        // Filter by threshold (5%)
        const significantCombinations = combinationFrequencies.filter(c => c.frequency >= this.threshold);
        
        // Get product statistics
        const productStats = this.getProductStatistics(cleanData);
        
        this.analysisResults = {
            totalRecords: cleanData.length,
            uniqueProducts: new Set(cleanData.map(r => this.getProductFromRecord(r))).size,
            analyzedDays: dailyTransactions.length,
            combinations: significantCombinations,
            productStats: productStats,
            topCombinations: significantCombinations.length
        };

        this.displayResults();
        this.showStatus('Анализът е завършен успешно!', 'success');
    }

    // Group data by date
    groupByDate(data) {
        const grouped = {};
        
        data.forEach(record => {
            const date = this.getDateFromRecord(record);
            if (!grouped[date]) {
                grouped[date] = [];
            }
            grouped[date].push(record);
        });

        return Object.values(grouped);
    }

    // Extract date from record (assumes date column exists)
    getDateFromRecord(record) {
        // Look for common date column names
        const dateFields = ['date', 'дата', 'Date', 'DATE', 'datum', 'fecha'];
        for (const field of dateFields) {
            if (record[field]) {
                return record[field];
            }
        }
        // Default to today if no date found
        return new Date().toISOString().split('T')[0];
    }

    // Extract product name from record
    getProductFromRecord(record) {
        // Look for common product column names
        const productFields = ['product', 'продукт', 'Product', 'PRODUCT', 'item', 'артикул', 'name', 'име'];
        for (const field of productFields) {
            if (record[field]) {
                return record[field];
            }
        }
        // Return first non-date field
        const keys = Object.keys(record);
        return record[keys[0]] || 'Unknown';
    }

    // Find product combinations within same day
    findCombinations(dailyTransactions) {
        const combinations = [];
        
        dailyTransactions.forEach(dayTransactions => {
            const products = dayTransactions.map(t => this.getProductFromRecord(t));
            
            // Generate all 2-product combinations for this day
            for (let i = 0; i < products.length; i++) {
                for (let j = i + 1; j < products.length; j++) {
                    const combo = [products[i], products[j]].sort();
                    combinations.push(combo.join(' + '));
                }
            }
        });

        return combinations;
    }

    // Calculate combination frequencies
    calculateFrequencies(combinations, totalDays) {
        const counts = {};
        
        combinations.forEach(combo => {
            counts[combo] = (counts[combo] || 0) + 1;
        });

        return Object.entries(counts)
            .map(([combo, count]) => ({
                combination: combo,
                count: count,
                frequency: count / totalDays,
                percentage: ((count / totalDays) * 100).toFixed(1)
            }))
            .sort((a, b) => b.frequency - a.frequency);
    }

    // Get product statistics
    getProductStatistics(data) {
        const productCounts = {};
        
        data.forEach(record => {
            const product = this.getProductFromRecord(record);
            productCounts[product] = (productCounts[product] || 0) + 1;
        });

        return Object.entries(productCounts)
            .map(([product, count]) => ({ product, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 10); // Top 10
    }

    // Display analysis results
    displayResults() {
        const resultsSection = document.getElementById('analysisResultsSection');
        
        // Update stats
        document.getElementById('totalRecords').textContent = this.analysisResults.totalRecords;
        document.getElementById('uniqueProducts').textContent = this.analysisResults.uniqueProducts;
        document.getElementById('topCombinations').textContent = this.analysisResults.topCombinations;
        document.getElementById('analyzedDays').textContent = this.analysisResults.analyzedDays;

        // Show combinations table
        this.displayCombinationsTable();
        
        // Show products chart
        this.displayProductsChart();
        
        resultsSection.style.display = 'block';
    }

    // Display combinations table
    displayCombinationsTable() {
        const tableDiv = document.getElementById('combinationsTable');
        const combinations = this.analysisResults.combinations;

        if (combinations.length === 0) {
            tableDiv.innerHTML = '<p>Няма открити комбинации над 5% праг</p>';
            return;
        }

        let html = '<table class="combinations-table">';
        html += '<thead><tr><th>Комбинация</th><th>Брой</th><th>Честота</th><th>Процент</th></tr></thead><tbody>';

        combinations.forEach(combo => {
            const barWidth = Math.max(30, combo.frequency * 200);
            html += `<tr>
                <td><strong>${combo.combination}</strong></td>
                <td>${combo.count}</td>
                <td><div class="frequency-bar" style="width: ${barWidth}px;">${combo.frequency.toFixed(3)}</div></td>
                <td>${combo.percentage}%</td>
            </tr>`;
        });

        html += '</tbody></table>';
        tableDiv.innerHTML = html;
    }

    // Display products chart (simplified)
    displayProductsChart() {
        const chartDiv = document.getElementById('productsChart');
        const products = this.analysisResults.productStats;

        let html = '<div style="max-height: 400px; overflow-y: auto;">';
        html += '<table class="combinations-table">';
        html += '<thead><tr><th>Продукт</th><th>Брой продажби</th><th>График</th></tr></thead><tbody>';

        const maxCount = Math.max(...products.map(p => p.count));

        products.forEach(product => {
            const barWidth = (product.count / maxCount) * 200;
            html += `<tr>
                <td><strong>${product.product}</strong></td>
                <td>${product.count}</td>
                <td><div class="frequency-bar" style="width: ${barWidth}px;">${product.count}</div></td>
            </tr>`;
        });

        html += '</tbody></table></div>';
        chartDiv.innerHTML = html;
    }

    // Show status message
    showStatus(message, type) {
        const statusDiv = document.getElementById('uploadStatus');
        statusDiv.className = `status-${type}`;
        statusDiv.textContent = message;
        statusDiv.style.display = 'block';

        if (type === 'success') {
            setTimeout(() => {
                statusDiv.style.display = 'none';
            }, 3000);
        }
    }

    // Export results
    exportResults(format) {
        if (!this.analysisResults.combinations) {
            alert('Няма данни за експорт. Моля първо направете анализ.');
            return;
        }

        switch (format) {
            case 'json':
                this.exportJSON();
                break;
            case 'csv':
                this.exportCSV();
                break;
            case 'pdf':
                this.exportPDF();
                break;
        }
    }

    exportJSON() {
        const data = JSON.stringify(this.analysisResults, null, 2);
        this.downloadFile(data, 'market-basket-analysis.json', 'application/json');
    }

    exportCSV() {
        let csv = 'Комбинация,Брой,Честота,Процент\n';
        this.analysisResults.combinations.forEach(combo => {
            csv += `"${combo.combination}",${combo.count},${combo.frequency},${combo.percentage}%\n`;
        });
        this.downloadFile(csv, 'market-basket-analysis.csv', 'text/csv');
    }

    exportPDF() {
        // Simplified PDF export
        alert('PDF експорт ще бъде добавен в следваща версия');
    }

    downloadFile(content, filename, contentType) {
        const blob = new Blob([content], { type: contentType });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }
}

// Global functions for HTML onclick events
let marketBasketAnalyzer = null;

function uploadAndAnalyzeXLSX() {
    if (!marketBasketAnalyzer) {
        marketBasketAnalyzer = new MarketBasketAnalyzer();
    }
    
    const fileInput = document.getElementById('xlsxFileInput');
    const file = fileInput.files[0];
    
    if (file) {
        marketBasketAnalyzer.handleFileUpload(file);
    } else {
        alert('Моля изберете XLSX файл');
    }
}

function startAnalysis() {
    if (!marketBasketAnalyzer || !marketBasketAnalyzer.rawData.length) {
        alert('Моля първо качете данни');
        return;
    }
    
    marketBasketAnalyzer.performAnalysis();
}

function showAnalysisTab(tabName) {
    // Hide all tabs
    document.querySelectorAll('.analysis-tab').forEach(tab => {
        tab.style.display = 'none';
    });
    
    // Remove active class from all buttons
    document.querySelectorAll('#analysisResultsSection .nav-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    // Show selected tab
    document.getElementById(tabName + 'Tab').style.display = 'block';
    
    // Add active class to clicked button
    event.target.classList.add('active');
}

function exportResults(format) {
    if (marketBasketAnalyzer) {
        marketBasketAnalyzer.exportResults(format);
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Initialize file input change handler
    const fileInput = document.getElementById('xlsxFileInput');
    if (fileInput) {
        fileInput.addEventListener('change', function() {
            uploadAndAnalyzeXLSX();
        });
    }
});