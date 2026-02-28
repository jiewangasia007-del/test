// 全局状态
let dataColumns = 1; // 当前数据列数（不包括序号、姓名和总计）

// 数字转中文数字
function numberToChinese(num) {
    const chineseNums = ['', '一', '二', '三', '四', '五', '六', '七', '八', '九', '十',
                         '十一', '十二', '十三', '十四', '十五', '十六', '十七', '十八', '十九', '二十',
                         '二十一', '二十二', '二十三', '二十四', '二十五', '二十六', '二十七', '二十八', '二十九', '三十'];
    return chineseNums[num] || num.toString();
}

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', function() {
    loadFromLocalStorage();
    attachEventListeners();
    calculateAll();
});

// 添加行
function addRow() {
    const tbody = document.getElementById('tableBody');
    const newRowIndex = tbody.children.length;
    const row = document.createElement('tr');
    row.setAttribute('data-row-index', newRowIndex);

    let rowHTML = `<td class="col-index">${newRowIndex + 1}</td>`;
    rowHTML += `<td><input type="text" class="name-input" placeholder="姓名"></td>`;

    // 添加数据列和运算符列
    const headerRow = document.getElementById('headerRow');
    const headerCells = Array.from(headerRow.children);

    headerCells.forEach((th, index) => {
        if (th.classList.contains('col-data')) {
            rowHTML += `<td><input type="number" class="data-input" placeholder="0.00" step="0.01"></td>`;
        } else if (th.classList.contains('col-operator')) {
            const select = th.querySelector('.operator-select');
            const value = select.value;
            rowHTML += `<td class="col-operator">${getOperatorSymbol(value)}</td>`;
        } else if (th.classList.contains('col-equals')) {
            rowHTML += `<td class="col-equals">=</td>`;
        }
    });

    // 添加总计列
    rowHTML += `<td class="total-cell">0.00</td>`;

    row.innerHTML = rowHTML;
    tbody.appendChild(row);

    // 为新行的输入框添加事件监听
    row.querySelectorAll('input').forEach(input => {
        input.addEventListener('input', function() {
            calculateRow(row);
            calculateGrandTotal();
            saveToLocalStorage();
        });
    });

    updateRowNumbers();
    saveToLocalStorage();
}

// 添加列
function addColumn() {
    const headerRow = document.getElementById('headerRow');
    const tbody = document.getElementById('tableBody');
    const totalRow = document.getElementById('totalRow');

    // 找到等号列和总计列的位置
    const equalsHeader = headerRow.querySelector('.col-equals');
    const totalHeader = headerRow.querySelector('.col-total');

    // 如果当前只有一列数据，需要先在第一列后面添加运算符列
    if (dataColumns === 1) {
        // 在等号列之前插入运算符列
        const operatorHeader = document.createElement('th');
        operatorHeader.className = 'col-operator';
        operatorHeader.innerHTML = `
            <select class="operator-select">
                <option value="+">+</option>
                <option value="-">-</option>
                <option value="*">×</option>
                <option value="/">÷</option>
            </select>
        `;
        headerRow.insertBefore(operatorHeader, equalsHeader);

        // 为运算符选择器添加事件监听
        operatorHeader.querySelector('.operator-select').addEventListener('change', function() {
            updateOperatorSymbols();
            calculateAll();
            saveToLocalStorage();
        });

        // 在每一行的等号列之前插入运算符单元格
        Array.from(tbody.children).forEach(row => {
            const equalsCell = row.querySelector('.col-equals');
            const operatorCell = document.createElement('td');
            operatorCell.className = 'col-operator';
            operatorCell.textContent = '+';
            row.insertBefore(operatorCell, equalsCell);
        });

        // 在总计行的等号列之前插入运算符单元格
        const totalEqualsCell = totalRow.querySelector('.col-equals');
        const totalOperatorCell = document.createElement('td');
        totalOperatorCell.className = 'col-operator';
        totalOperatorCell.textContent = '+';
        totalRow.insertBefore(totalOperatorCell, totalEqualsCell);

        // 显示第一列的删除按钮
        const firstDataHeader = headerRow.querySelector('.col-data');
        const deleteBtn = firstDataHeader.querySelector('.delete-col-btn');
        if (deleteBtn) deleteBtn.style.display = 'inline-block';
    }

    // 只有在已有多列数据时，才先添加运算符列
    if (dataColumns > 1) {
        const newOperatorHeader = document.createElement('th');
        newOperatorHeader.className = 'col-operator';
        newOperatorHeader.innerHTML = `
            <select class="operator-select">
                <option value="+">+</option>
                <option value="-">-</option>
                <option value="*">×</option>
                <option value="/">÷</option>
            </select>
        `;
        headerRow.insertBefore(newOperatorHeader, equalsHeader);

        // 为运算符选择器添加事件监听
        newOperatorHeader.querySelector('.operator-select').addEventListener('change', function() {
            updateOperatorSymbols();
            calculateAll();
            saveToLocalStorage();
        });
    }

    // 添加新的数据列表头
    const newDataHeader = document.createElement('th');
    newDataHeader.className = 'col-data';
    newDataHeader.innerHTML = `
        <input type="text" class="header-input" placeholder="列标题" value="标题${numberToChinese(dataColumns + 1)}">
        <button class="delete-col-btn" onclick="deleteColumn(this)">删除</button>
    `;
    headerRow.insertBefore(newDataHeader, equalsHeader);

    // 为新表头添加事件监听
    newDataHeader.querySelector('.header-input').addEventListener('input', saveToLocalStorage);

    // 在每一行添加新的数据和运算符单元格
    Array.from(tbody.children).forEach(row => {
        const equalsCell = row.querySelector('.col-equals');

        // 只有在已有多列数据时，才先添加运算符单元格
        if (dataColumns > 1) {
            const newOperatorCell = document.createElement('td');
            newOperatorCell.className = 'col-operator';
            newOperatorCell.textContent = '+';
            row.insertBefore(newOperatorCell, equalsCell);
        }

        // 添加数据单元格
        const newDataCell = document.createElement('td');
        newDataCell.innerHTML = `<input type="number" class="data-input" placeholder="0.00" step="0.01">`;
        row.insertBefore(newDataCell, equalsCell);

        // 为新单元格的输入框添加事件监听
        newDataCell.querySelector('input').addEventListener('input', function() {
            calculateRow(row);
            calculateGrandTotal();
            saveToLocalStorage();
        });
    });

    // 在总计行添加新的运算符和列合计单元格
    const totalEqualsCell = totalRow.querySelector('.col-equals');

    // 只有在已有多列数据时，才先添加运算符单元格
    if (dataColumns > 1) {
        const totalOperatorCell = document.createElement('td');
        totalOperatorCell.className = 'col-operator';
        totalOperatorCell.textContent = '+';
        totalRow.insertBefore(totalOperatorCell, totalEqualsCell);
    }

    // 添加列合计单元格
    const columnTotalCell = document.createElement('td');
    columnTotalCell.className = 'column-total';
    columnTotalCell.textContent = '0.00';
    totalRow.insertBefore(columnTotalCell, totalEqualsCell);

    dataColumns++;
    calculateGrandTotal(); // 重新计算合计
    saveToLocalStorage();
}

// 删除列
function deleteColumn(btn) {
    if (dataColumns <= 1) {
        alert('至少需要保留一列数据！');
        return;
    }

    if (!confirm('确定要删除这一列吗？')) {
        return;
    }

    const th = btn.parentElement;
    const headerRow = document.getElementById('headerRow');
    const colIndex = Array.from(headerRow.children).indexOf(th);

    // 删除数据列表头
    th.remove();

    // 找到并删除后面的运算符列（如果存在）
    const nextTh = headerRow.children[colIndex]; // 因为前一个已被删除，所以索引不变
    if (nextTh && nextTh.classList.contains('col-operator')) {
        nextTh.remove();
    }

    // 删除每一行对应的单元格
    const tbody = document.getElementById('tableBody');
    const totalRow = document.getElementById('totalRow');

    Array.from(tbody.children).forEach(row => {
        // 删除数据单元格
        if (row.children[colIndex]) {
            row.children[colIndex].remove();
        }
        // 删除运算符单元格
        if (row.children[colIndex]) {
            row.children[colIndex].remove();
        }
    });

    // 删除总计行对应的单元格
    if (totalRow.children[colIndex]) {
        totalRow.children[colIndex].remove();
    }
    if (totalRow.children[colIndex]) {
        totalRow.children[colIndex].remove();
    }

    dataColumns--;

    // 如果只剩一列，移除所有运算符列
    if (dataColumns === 1) {
        // 移除表头中的运算符列
        const operatorHeaders = headerRow.querySelectorAll('.col-operator');
        operatorHeaders.forEach(oh => oh.remove());

        // 移除每一行的运算符单元格
        Array.from(tbody.children).forEach(row => {
            const operatorCells = row.querySelectorAll('.col-operator');
            operatorCells.forEach(oc => oc.remove());
        });

        // 移除总计行的运算符单元格
        const totalOperatorCells = totalRow.querySelectorAll('.col-operator');
        totalOperatorCells.forEach(oc => oc.remove());

        // 隐藏第一列的删除按钮
        const firstDataHeader = headerRow.querySelector('.col-data');
        const deleteBtn = firstDataHeader.querySelector('.delete-col-btn');
        if (deleteBtn) deleteBtn.style.display = 'none';
    }

    calculateAll();
    saveToLocalStorage();
}

// 更新行中的运算符符号
function updateOperatorSymbols() {
    const headerRow = document.getElementById('headerRow');
    const tbody = document.getElementById('tableBody');
    const totalRow = document.getElementById('totalRow');

    const operatorSelects = headerRow.querySelectorAll('.operator-select');

    // 更新数据行的运算符
    Array.from(tbody.children).forEach(row => {
        const operatorCells = row.querySelectorAll('.col-operator');
        operatorCells.forEach((cell, index) => {
            if (operatorSelects[index]) {
                cell.textContent = getOperatorSymbol(operatorSelects[index].value);
            }
        });
    });

    // 更新总计行的运算符
    const totalOperatorCells = totalRow.querySelectorAll('.col-operator');
    totalOperatorCells.forEach((cell, index) => {
        if (operatorSelects[index]) {
            cell.textContent = getOperatorSymbol(operatorSelects[index].value);
        }
    });
}

// 获取运算符符号
function getOperatorSymbol(value) {
    const symbols = {
        '+': '+',
        '-': '-',
        '*': '×',
        '/': '÷'
    };
    return symbols[value] || '+';
}

// 计算单行总计
function calculateRow(row) {
    const dataInputs = row.querySelectorAll('.data-input');

    if (dataInputs.length === 0) {
        row.querySelector('.total-cell').textContent = '0.00';
        return;
    }

    // 如果只有一列数据，直接返回该值
    if (dataInputs.length === 1) {
        const value = parseFloat(dataInputs[0].value) || 0;
        row.querySelector('.total-cell').textContent = value.toFixed(2);
        return;
    }

    // 构建计算表达式
    const headerRow = document.getElementById('headerRow');
    const operatorSelects = headerRow.querySelectorAll('.operator-select');

    let expression = '';
    dataInputs.forEach((input, index) => {
        const value = parseFloat(input.value) || 0;

        if (index === 0) {
            expression = value.toString();
        } else {
            const operator = operatorSelects[index - 1].value;
            expression += operator + value.toString();
        }
    });

    // 计算结果
    let total = 0;
    try {
        total = evaluateExpression(expression);
    } catch (e) {
        total = 0;
    }

    row.querySelector('.total-cell').textContent = total.toFixed(2);
}

// 安全地计算数学表达式
function evaluateExpression(expr) {
    // 使用Function而不是eval，更安全
    return Function('"use strict"; return (' + expr + ')')();
}

// 计算总计金额和各列合计
function calculateGrandTotal() {
    const tbody = document.getElementById('tableBody');
    const totalRow = document.getElementById('totalRow');

    let grandTotal = 0;

    // 计算每列的合计
    const columnTotals = [];
    const firstRow = tbody.children[0];
    if (firstRow) {
        const dataInputCount = firstRow.querySelectorAll('.data-input').length;

        // 初始化列合计数组
        for (let i = 0; i < dataInputCount; i++) {
            columnTotals.push(0);
        }

        // 累加每一行的数据
        Array.from(tbody.children).forEach(row => {
            const dataInputs = row.querySelectorAll('.data-input');
            dataInputs.forEach((input, index) => {
                columnTotals[index] += parseFloat(input.value) || 0;
            });

            // 累加行总计
            const totalCell = row.querySelector('.total-cell');
            const total = parseFloat(totalCell.textContent) || 0;
            grandTotal += total;
        });
    }

    // 更新总计行的各列合计
    const columnTotalCells = totalRow.querySelectorAll('.column-total');
    columnTotalCells.forEach((cell, index) => {
        if (columnTotals[index] !== undefined) {
            cell.textContent = columnTotals[index].toFixed(2);
        }
    });

    // 更新总金额
    document.getElementById('grandTotal').textContent = grandTotal.toFixed(2);
}

// 计算所有行
function calculateAll() {
    const tbody = document.getElementById('tableBody');
    Array.from(tbody.children).forEach(row => {
        calculateRow(row);
    });
    calculateGrandTotal();
}

// 更新行号
function updateRowNumbers() {
    const tbody = document.getElementById('tableBody');
    Array.from(tbody.children).forEach((row, index) => {
        row.setAttribute('data-row-index', index);
        row.querySelector('.col-index').textContent = index + 1;
    });
}

// 保存到LocalStorage
function saveToLocalStorage() {
    const data = {
        columns: [],
        rows: []
    };

    // 保存列标题和运算符
    const headerRow = document.getElementById('headerRow');
    const dataHeaders = headerRow.querySelectorAll('.col-data');
    const operatorSelects = headerRow.querySelectorAll('.operator-select');

    dataHeaders.forEach((th, index) => {
        const col = {
            title: th.querySelector('.header-input').value
        };
        if (operatorSelects[index]) {
            col.operator = operatorSelects[index].value;
        }
        data.columns.push(col);
    });

    // 保存行数据
    const tbody = document.getElementById('tableBody');
    Array.from(tbody.children).forEach(row => {
        const rowData = {
            name: row.querySelector('.name-input').value,
            values: []
        };

        row.querySelectorAll('.data-input').forEach(input => {
            rowData.values.push(input.value);
        });

        data.rows.push(rowData);
    });

    localStorage.setItem('settlementData', JSON.stringify(data));
}

// 从LocalStorage加载
function loadFromLocalStorage() {
    const savedData = localStorage.getItem('settlementData');
    if (!savedData) return;

    try {
        const data = JSON.parse(savedData);

        // 清空现有表格
        const tbody = document.getElementById('tableBody');
        tbody.innerHTML = '';

        const headerRow = document.getElementById('headerRow');

        // 删除所有数据列、运算符列和等号列
        const colsToRemove = headerRow.querySelectorAll('.col-data, .col-operator, .col-equals');
        colsToRemove.forEach(col => col.remove());

        // 恢复列
        dataColumns = data.columns.length;
        const totalHeader = headerRow.querySelector('.col-total');

        data.columns.forEach((col, index) => {
            // 添加数据列
            const newDataHeader = document.createElement('th');
            newDataHeader.className = 'col-data';
            const showDeleteBtn = dataColumns > 1 ? '' : 'style="display: none;"';
            newDataHeader.innerHTML = `
                <input type="text" class="header-input" placeholder="列标题" value="${col.title}">
                <button class="delete-col-btn" onclick="deleteColumn(this)" ${showDeleteBtn}>删除</button>
            `;
            headerRow.insertBefore(newDataHeader, totalHeader);

            // 如果不是最后一列，添加运算符列
            if (index < data.columns.length - 1 && col.operator) {
                const newOperatorHeader = document.createElement('th');
                newOperatorHeader.className = 'col-operator';
                newOperatorHeader.innerHTML = `
                    <select class="operator-select">
                        <option value="+" ${col.operator === '+' ? 'selected' : ''}>+</option>
                        <option value="-" ${col.operator === '-' ? 'selected' : ''}>-</option>
                        <option value="*" ${col.operator === '*' ? 'selected' : ''}>×</option>
                        <option value="/" ${col.operator === '/' ? 'selected' : ''}>÷</option>
                    </select>
                `;
                headerRow.insertBefore(newOperatorHeader, totalHeader);

                // 添加事件监听
                newOperatorHeader.querySelector('.operator-select').addEventListener('change', function() {
                    updateOperatorSymbols();
                    calculateAll();
                    saveToLocalStorage();
                });
            }

            // 添加事件监听
            newDataHeader.querySelector('.header-input').addEventListener('input', saveToLocalStorage);
        });

        // 添加等号列（如果有多列）
        if (dataColumns > 1) {
            const equalsHeader = document.createElement('th');
            equalsHeader.className = 'col-equals';
            equalsHeader.textContent = '=';
            headerRow.insertBefore(equalsHeader, totalHeader);
        }

        // 恢复行
        data.rows.forEach((rowData, rowIndex) => {
            const row = document.createElement('tr');
            row.setAttribute('data-row-index', rowIndex);

            let rowHTML = `<td class="col-index">${rowIndex + 1}</td>`;
            rowHTML += `<td><input type="text" class="name-input" placeholder="姓名" value="${rowData.name}"></td>`;

            // 添加数据和运算符单元格
            rowData.values.forEach((value, index) => {
                rowHTML += `<td><input type="number" class="data-input" placeholder="0.00" step="0.01" value="${value}"></td>`;

                // 如果不是最后一列且有多列，添加运算符
                if (index < rowData.values.length - 1 && data.columns[index] && data.columns[index].operator) {
                    const operatorSymbol = getOperatorSymbol(data.columns[index].operator);
                    rowHTML += `<td class="col-operator">${operatorSymbol}</td>`;
                }
            });

            // 添加等号列（如果有多列）
            if (dataColumns > 1) {
                rowHTML += `<td class="col-equals">=</td>`;
            }

            rowHTML += `<td class="total-cell">0.00</td>`;

            row.innerHTML = rowHTML;
            tbody.appendChild(row);

            // 为行的输入框添加事件监听
            row.querySelectorAll('input').forEach(input => {
                input.addEventListener('input', function() {
                    calculateRow(row);
                    calculateGrandTotal();
                    saveToLocalStorage();
                });
            });
        });

        // 重建总计行结构
        const totalRow = document.getElementById('totalRow');
        totalRow.innerHTML = ''; // 清空totalRow

        // 添加"总计"和"金额"标签
        totalRow.innerHTML = '<td class="total-label">总计</td><td class="total-label">金额</td>';

        // 添加各列合计单元格
        data.columns.forEach((col, index) => {
            const columnTotalCell = document.createElement('td');
            columnTotalCell.className = 'column-total';
            columnTotalCell.textContent = '0.00';
            totalRow.appendChild(columnTotalCell);

            // 如果不是最后一列，添加运算符
            if (index < data.columns.length - 1 && col.operator) {
                const operatorCell = document.createElement('td');
                operatorCell.className = 'col-operator';
                operatorCell.textContent = getOperatorSymbol(col.operator);
                totalRow.appendChild(operatorCell);
            }
        });

        // 添加等号列（如果有多列）
        if (dataColumns > 1) {
            const equalsCell = document.createElement('td');
            equalsCell.className = 'col-equals';
            equalsCell.textContent = '=';
            totalRow.appendChild(equalsCell);
        }

        // 添加总金额列
        const grandTotalCell = document.createElement('td');
        grandTotalCell.id = 'grandTotal';
        grandTotalCell.className = 'grand-total';
        grandTotalCell.textContent = '0.00';
        totalRow.appendChild(grandTotalCell);

        // 计算所有值
        calculateAll();

    } catch (e) {
        console.error('加载数据失败:', e);
    }
}

// 清空所有数据
function clearAllData() {
    if (!confirm('确定要清空所有数据吗？此操作不可恢复！')) {
        return;
    }

    localStorage.removeItem('settlementData');
    location.reload();
}

// 导出Excel
function exportToExcel() {
    const wb = XLSX.utils.book_new();

    // 准备数据
    const data = [];

    // 添加表头
    const headers = ['序号', '姓名'];
    const headerRow = document.getElementById('headerRow');

    // 按顺序添加列标题和运算符
    const headerCells = Array.from(headerRow.children);
    headerCells.forEach(th => {
        if (th.classList.contains('col-data')) {
            headers.push(th.querySelector('.header-input').value);
        } else if (th.classList.contains('col-operator')) {
            const select = th.querySelector('.operator-select');
            headers.push(getOperatorSymbol(select.value));
        } else if (th.classList.contains('col-equals')) {
            headers.push('=');
        } else if (th.classList.contains('col-total')) {
            headers.push('总计');
        }
    });

    data.push(headers);

    // 添加数据行
    const tbody = document.getElementById('tableBody');
    Array.from(tbody.children).forEach(row => {
        const rowData = [];
        rowData.push(row.querySelector('.col-index').textContent);
        rowData.push(row.querySelector('.name-input').value);

        // 按顺序添加数据和运算符
        const cells = Array.from(row.children);
        cells.forEach(cell => {
            if (cell.querySelector('.data-input')) {
                rowData.push(parseFloat(cell.querySelector('.data-input').value) || 0);
            } else if (cell.classList.contains('col-operator')) {
                rowData.push(cell.textContent);
            } else if (cell.classList.contains('col-equals')) {
                rowData.push('=');
            } else if (cell.classList.contains('total-cell')) {
                rowData.push(parseFloat(cell.textContent) || 0);
            }
        });

        data.push(rowData);
    });

    // 添加总计行
    const totalRow = document.getElementById('totalRow');
    const totalRowData = [];

    Array.from(totalRow.children).forEach(cell => {
        if (cell.classList.contains('total-label')) {
            totalRowData.push(cell.textContent);
        } else if (cell.classList.contains('column-total')) {
            totalRowData.push(parseFloat(cell.textContent) || 0);
        } else if (cell.classList.contains('col-operator')) {
            totalRowData.push(cell.textContent);
        } else if (cell.classList.contains('col-equals')) {
            totalRowData.push('=');
        } else if (cell.classList.contains('grand-total')) {
            totalRowData.push(parseFloat(cell.textContent) || 0);
        }
    });

    data.push(totalRowData);

    // 创建工作表
    const ws = XLSX.utils.aoa_to_sheet(data);

    // 设置列宽
    ws['!cols'] = [{ wch: 8 }]; // 序号
    for (let i = 1; i < headers.length; i++) {
        ws['!cols'].push({ wch: 12 });
    }

    XLSX.utils.book_append_sheet(wb, ws, '工程结算');

    // 生成文件名
    const fileName = `工程结算_${new Date().toISOString().slice(0, 10)}.xlsx`;

    // 导出
    XLSX.writeFile(wb, fileName);
}

// 导出PDF
function exportToPDF() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF('l'); // 横向

    // 标题
    doc.setFontSize(18);
    doc.text('Engineering Settlement Report', 14, 20);

    // 准备表格数据
    const headers = [['No.', 'Name']];
    const headerRow = document.getElementById('headerRow');

    // 按顺序添加列标题和运算符
    const headerCells = Array.from(headerRow.children);
    headerCells.forEach(th => {
        if (th.classList.contains('col-data')) {
            headers[0].push(th.querySelector('.header-input').value);
        } else if (th.classList.contains('col-operator')) {
            const select = th.querySelector('.operator-select');
            headers[0].push(getOperatorSymbol(select.value));
        } else if (th.classList.contains('col-equals')) {
            headers[0].push('=');
        } else if (th.classList.contains('col-total')) {
            headers[0].push('Total');
        }
    });

    const data = [];
    const tbody = document.getElementById('tableBody');
    Array.from(tbody.children).forEach(row => {
        const rowData = [];
        rowData.push(row.querySelector('.col-index').textContent);
        rowData.push(row.querySelector('.name-input').value || '-');

        // 按顺序添加数据和运算符
        const cells = Array.from(row.children);
        cells.forEach(cell => {
            if (cell.querySelector('.data-input')) {
                rowData.push((parseFloat(cell.querySelector('.data-input').value) || 0).toFixed(2));
            } else if (cell.classList.contains('col-operator')) {
                rowData.push(cell.textContent);
            } else if (cell.classList.contains('col-equals')) {
                rowData.push('=');
            } else if (cell.classList.contains('total-cell')) {
                rowData.push(cell.textContent);
            }
        });

        data.push(rowData);
    });

    // 添加总计行
    const totalRow = document.getElementById('totalRow');
    const totalRowData = [];

    Array.from(totalRow.children).forEach(cell => {
        if (cell.classList.contains('total-label')) {
            totalRowData.push(cell.textContent);
        } else if (cell.classList.contains('column-total')) {
            totalRowData.push(parseFloat(cell.textContent).toFixed(2));
        } else if (cell.classList.contains('col-operator')) {
            totalRowData.push(cell.textContent);
        } else if (cell.classList.contains('col-equals')) {
            totalRowData.push('=');
        } else if (cell.classList.contains('grand-total')) {
            totalRowData.push(cell.textContent);
        }
    });

    data.push(totalRowData);

    // 生成表格
    doc.autoTable({
        head: headers,
        body: data,
        startY: 30,
        theme: 'grid',
        headStyles: {
            fillColor: [102, 126, 234],
            fontSize: 9,
            fontStyle: 'bold'
        },
        styles: {
            fontSize: 8,
            cellPadding: 2
        },
        columnStyles: {
            0: { halign: 'center', cellWidth: 15 },
            [headers[0].length - 1]: { halign: 'right', fontStyle: 'bold' }
        },
        didDrawPage: function(data) {
            // 页脚
            doc.setFontSize(8);
            doc.text(
                `Generated on ${new Date().toLocaleString()}`,
                14,
                doc.internal.pageSize.height - 10
            );
        }
    });

    // 生成文件名
    const fileName = `settlement_${new Date().toISOString().slice(0, 10)}.pdf`;

    // 保存
    doc.save(fileName);
}

// 绑定事件监听器
function attachEventListeners() {
    // 添加行按钮
    document.getElementById('addRowBtn').addEventListener('click', addRow);

    // 添加列按钮
    document.getElementById('addColBtn').addEventListener('click', addColumn);

    // 清空按钮
    document.getElementById('clearBtn').addEventListener('click', clearAllData);

    // 导出Excel按钮
    document.getElementById('exportExcelBtn').addEventListener('click', exportToExcel);

    // 导出PDF按钮
    document.getElementById('exportPdfBtn').addEventListener('click', exportToPDF);

    // 为初始表头添加事件监听
    const headerRow = document.getElementById('headerRow');
    const headerInputs = headerRow.querySelectorAll('.header-input');
    headerInputs.forEach(input => {
        input.addEventListener('input', saveToLocalStorage);
    });

    const operatorSelects = headerRow.querySelectorAll('.operator-select');
    operatorSelects.forEach(select => {
        select.addEventListener('change', function() {
            updateOperatorSymbols();
            calculateAll();
            saveToLocalStorage();
        });
    });

    // 为初始行添加事件监听
    const tbody = document.getElementById('tableBody');
    Array.from(tbody.children).forEach(row => {
        row.querySelectorAll('input').forEach(input => {
            input.addEventListener('input', function() {
                calculateRow(row);
                calculateGrandTotal();
                saveToLocalStorage();
            });
        });
    });
}
