// 全局状态
let dataColumns = 1; // 当前数据列数（不包括序号、姓名、等号、总计）

function numberToChinese(num) {
  const chineseNums = ['', '一', '二', '三', '四', '五', '六', '七', '八', '九', '十',
    '十一', '十二', '十三', '十四', '十五', '十六', '十七', '十八', '十九', '二十',
    '二十一', '二十二', '二十三', '二十四', '二十五', '二十六', '二十七', '二十八', '二十九', '三十'];
  return chineseNums[num] || num.toString();
}

document.addEventListener('DOMContentLoaded', function () {
  loadFromLocalStorage();
  dataColumns = document.querySelectorAll('#headerRow .col-data').length || 1;

  attachEventListeners();
  calculateAll();
});

// 添加行：按表头顺序生成
function addRow() {
  const tbody = document.getElementById('tableBody');
  const headerRow = document.getElementById('headerRow');
  const headerCells = Array.from(headerRow.children);

  const newRowIndex = tbody.children.length;
  const row = document.createElement('tr');
  row.setAttribute('data-row-index', newRowIndex);

  let rowHTML = '';
  rowHTML += `<td class="col-index">${newRowIndex + 1}</td>`;
  rowHTML += `<td><input type="text" class="name-input" placeholder="姓名"></td>`;

  headerCells.forEach(th => {
    if (th.classList.contains('col-data')) {
      rowHTML += `<td><input type="number" class="data-input" placeholder="0.00" step="0.01"></td>`;
    } else if (th.classList.contains('col-operator')) {
      const select = th.querySelector('.operator-select');
      const value = select ? select.value : '+';
      rowHTML += `<td class="col-operator">${getOperatorSymbol(value)}</td>`;
    } else if (th.classList.contains('col-equals')) {
      rowHTML += `<td class="col-equals">=</td>`;
    } else if (th.classList.contains('col-total')) {
      rowHTML += `<td class="total-cell">0.00</td>`;
    }
  });

  row.innerHTML = rowHTML;
  tbody.appendChild(row);

  row.querySelectorAll('input').forEach(input => {
    input.addEventListener('input', function () {
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

  const equalsHeader = headerRow.querySelector('.col-equals');
  if (!equalsHeader) {
    alert('表格结构异常：缺少等号列（col-equals）。请刷新页面。');
    return;
  }

  // 只有1列 -> 先补一个运算符列（在等号前）
  if (dataColumns === 1) {
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

    operatorHeader.querySelector('.operator-select').addEventListener('change', function () {
      updateOperatorSymbols();
      calculateAll();
      saveToLocalStorage();
    });

    Array.from(tbody.children).forEach(row => {
      const eqCell = row.querySelector('.col-equals');
      const operatorCell = document.createElement('td');
      operatorCell.className = 'col-operator';
      operatorCell.textContent = '+';
      row.insertBefore(operatorCell, eqCell);
    });

    const totalEqCell = totalRow.querySelector('.col-equals');
    const totalOpCell = document.createElement('td');
    totalOpCell.className = 'col-operator';
    totalOpCell.textContent = '+';
    totalRow.insertBefore(totalOpCell, totalEqCell);

    // 显示第一列删除按钮
    const firstDataHeader = headerRow.querySelector('.col-data');
    if (firstDataHeader) {
      const deleteBtn = firstDataHeader.querySelector('.delete-col-btn');
      if (deleteBtn) deleteBtn.style.display = 'inline-block';
    }
  }

  // 已有>=2列 -> 新列前也插入一个运算符列
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

    newOperatorHeader.querySelector('.operator-select').addEventListener('change', function () {
      updateOperatorSymbols();
      calculateAll();
      saveToLocalStorage();
    });
  }

  const newDataHeader = document.createElement('th');
  newDataHeader.className = 'col-data';
  newDataHeader.innerHTML = `
    <input type="text" class="header-input" placeholder="列标题" value="标题${numberToChinese(dataColumns + 1)}">
    <button class="delete-col-btn">删除</button>
  `;
  headerRow.insertBefore(newDataHeader, equalsHeader);

  newDataHeader.querySelector('.header-input').addEventListener('input', saveToLocalStorage);

  Array.from(tbody.children).forEach(row => {
    const eqCell = row.querySelector('.col-equals');

    if (dataColumns > 1) {
      const newOperatorCell = document.createElement('td');
      newOperatorCell.className = 'col-operator';
      newOperatorCell.textContent = '+';
      row.insertBefore(newOperatorCell, eqCell);
    }

    const newDataCell = document.createElement('td');
    newDataCell.innerHTML = `<input type="number" class="data-input" placeholder="0.00" step="0.01">`;
    row.insertBefore(newDataCell, eqCell);

    newDataCell.querySelector('input').addEventListener('input', function () {
      calculateRow(row);
      calculateGrandTotal();
      saveToLocalStorage();
    });
  });

  const totalEqCell = totalRow.querySelector('.col-equals');

  if (dataColumns > 1) {
    const totalOperatorCell = document.createElement('td');
    totalOperatorCell.className = 'col-operator';
    totalOperatorCell.textContent = '+';
    totalRow.insertBefore(totalOperatorCell, totalEqCell);
  }

  const columnTotalCell = document.createElement('td');
  columnTotalCell.className = 'column-total';
  columnTotalCell.textContent = '0.00';
  totalRow.insertBefore(columnTotalCell, totalEqCell);

  dataColumns++;
  calculateGrandTotal();
  saveToLocalStorage();
}

// 删除列
function deleteColumn(btn) {
  if (dataColumns <= 1) {
    alert('至少需要保留一列数据！');
    return;
  }
  if (!confirm('确定要删除这一列吗？')) return;

  const headerRow = document.getElementById('headerRow');
  const tbody = document.getElementById('tableBody');
  const totalRow = document.getElementById('totalRow');

  const th = btn.parentElement;
  const colIndex = Array.from(headerRow.children).indexOf(th);

  th.remove();

  // 删除它后面紧跟的运算符表头（若存在）
  const nextTh = headerRow.children[colIndex];
  if (nextTh && nextTh.classList.contains('col-operator')) nextTh.remove();

  // 删除每行对应单元格
  Array.from(tbody.children).forEach(row => {
    if (row.children[colIndex]) row.children[colIndex].remove();
    if (row.children[colIndex] && row.children[colIndex].classList.contains('col-operator')) {
      row.children[colIndex].remove();
    }
  });

  // 删除总计行对应
  if (totalRow.children[colIndex]) totalRow.children[colIndex].remove();
  if (totalRow.children[colIndex] && totalRow.children[colIndex].classList.contains('col-operator')) {
    totalRow.children[colIndex].remove();
  }

  dataColumns--;

  // 剩1列：移除所有运算符列
  if (dataColumns === 1) {
    headerRow.querySelectorAll('.col-operator').forEach(x => x.remove());
    Array.from(tbody.children).forEach(row => row.querySelectorAll('.col-operator').forEach(x => x.remove()));
    totalRow.querySelectorAll('.col-operator').forEach(x => x.remove());

    const firstDataHeader = headerRow.querySelector('.col-data');
    if (firstDataHeader) {
      const deleteBtn = firstDataHeader.querySelector('.delete-col-btn');
      if (deleteBtn) deleteBtn.style.display = 'none';
    }
  }

  calculateAll();
  saveToLocalStorage();
}

function updateOperatorSymbols() {
  const headerRow = document.getElementById('headerRow');
  const tbody = document.getElementById('tableBody');
  const totalRow = document.getElementById('totalRow');

  const operatorSelects = headerRow.querySelectorAll('.operator-select');

  Array.from(tbody.children).forEach(row => {
    const operatorCells = row.querySelectorAll('.col-operator');
    operatorCells.forEach((cell, index) => {
      if (operatorSelects[index]) {
        cell.textContent = getOperatorSymbol(operatorSelects[index].value);
      }
    });
  });

  const totalOperatorCells = totalRow.querySelectorAll('.col-operator');
  totalOperatorCells.forEach((cell, index) => {
    if (operatorSelects[index]) {
      cell.textContent = getOperatorSymbol(operatorSelects[index].value);
    }
  });
}

function getOperatorSymbol(value) {
  const symbols = { '+': '+', '-': '-', '*': '×', '/': '÷' };
  return symbols[value] || '+';
}

function calculateRow(row) {
  const dataInputs = row.querySelectorAll('.data-input');
  const totalCell = row.querySelector('.total-cell');
  if (!totalCell) return;

  if (dataInputs.length === 0) {
    totalCell.textContent = '0.00';
    return;
  }

  if (dataInputs.length === 1) {
    const value = parseFloat(dataInputs[0].value) || 0;
    totalCell.textContent = value.toFixed(2);
    return;
  }

  const headerRow = document.getElementById('headerRow');
  const operatorSelects = headerRow.querySelectorAll('.operator-select');

  let expression = '';
  dataInputs.forEach((input, index) => {
    const value = parseFloat(input.value) || 0;
    if (index === 0) expression = value.toString();
    else {
      const operator = operatorSelects[index - 1]?.value || '+';
      expression += operator + value.toString();
    }
  });

  let total = 0;
  try {
    total = evaluateExpression(expression);
  } catch (e) {
    total = 0;
  }

  totalCell.textContent = Number.isFinite(total) ? total.toFixed(2) : '0.00';
}

function evaluateExpression(expr) {
  return Function('"use strict"; return (' + expr + ')')();
}

function calculateGrandTotal() {
  const tbody = document.getElementById('tableBody');
  const totalRow = document.getElementById('totalRow');

  let grandTotal = 0;

  const columnTotals = [];
  const firstRow = tbody.children[0];
  if (firstRow) {
    const dataInputCount = firstRow.querySelectorAll('.data-input').length;
    for (let i = 0; i < dataInputCount; i++) columnTotals.push(0);

    Array.from(tbody.children).forEach(row => {
      const dataInputs = row.querySelectorAll('.data-input');
      dataInputs.forEach((input, index) => {
        columnTotals[index] += parseFloat(input.value) || 0;
      });

      const total = parseFloat(row.querySelector('.total-cell')?.textContent) || 0;
      grandTotal += total;
    });
  }

  totalRow.querySelectorAll('.column-total').forEach((cell, index) => {
    if (columnTotals[index] !== undefined) cell.textContent = columnTotals[index].toFixed(2);
  });

  document.getElementById('grandTotal').textContent = grandTotal.toFixed(2);
}

function calculateAll() {
  const tbody = document.getElementById('tableBody');
  Array.from(tbody.children).forEach(row => calculateRow(row));
  calculateGrandTotal();
}

function updateRowNumbers() {
  const tbody = document.getElementById('tableBody');
  Array.from(tbody.children).forEach((row, index) => {
    row.setAttribute('data-row-index', index);
    row.querySelector('.col-index').textContent = index + 1;
  });
}

function saveToLocalStorage() {
  const data = { columns: [], rows: [] };

  const headerRow = document.getElementById('headerRow');
  const dataHeaders = headerRow.querySelectorAll('.col-data');
  const operatorSelects = headerRow.querySelectorAll('.operator-select');

  dataHeaders.forEach((th, index) => {
    const col = { title: th.querySelector('.header-input')?.value || '' };
    if (operatorSelects[index]) col.operator = operatorSelects[index].value;
    data.columns.push(col);
  });

  const tbody = document.getElementById('tableBody');
  Array.from(tbody.children).forEach(row => {
    const rowData = {
      name: row.querySelector('.name-input')?.value || '',
      values: []
    };
    row.querySelectorAll('.data-input').forEach(input => rowData.values.push(input.value));
    data.rows.push(rowData);
  });

  localStorage.setItem('settlementData', JSON.stringify(data));
}

function loadFromLocalStorage() {
  const savedData = localStorage.getItem('settlementData');
  if (!savedData) return;

  try {
    const data = JSON.parse(savedData);

    const headerRow = document.getElementById('headerRow');
    const tbody = document.getElementById('tableBody');

    tbody.innerHTML = '';

    headerRow.querySelectorAll('.col-data, .col-operator, .col-equals').forEach(x => x.remove());
    const totalHeader = headerRow.querySelector('.col-total');

    dataColumns = data.columns.length || 1;

    data.columns.forEach((col, index) => {
      const newDataHeader = document.createElement('th');
      newDataHeader.className = 'col-data';

      const showDeleteBtn = dataColumns > 1 ? '' : 'style="display:none;"';
      newDataHeader.innerHTML = `
        <input type="text" class="header-input" placeholder="列标题" value="${escapeHtml(col.title || '')}">
        <button class="delete-col-btn" ${showDeleteBtn}>删除</button>
      `;
      headerRow.insertBefore(newDataHeader, totalHeader);

      newDataHeader.querySelector('.header-input').addEventListener('input', saveToLocalStorage);

      if (index < data.columns.length - 1) {
        const op = col.operator || '+';
        const newOperatorHeader = document.createElement('th');
        newOperatorHeader.className = 'col-operator';
        newOperatorHeader.innerHTML = `
          <select class="operator-select">
            <option value="+" ${op === '+' ? 'selected' : ''}>+</option>
            <option value="-" ${op === '-' ? 'selected' : ''}>-</option>
            <option value="*" ${op === '*' ? 'selected' : ''}>×</option>
            <option value="/" ${op === '/' ? 'selected' : ''}>÷</option>
          </select>
        `;
        headerRow.insertBefore(newOperatorHeader, totalHeader);

        newOperatorHeader.querySelector('.operator-select').addEventListener('change', function () {
          updateOperatorSymbols();
          calculateAll();
          saveToLocalStorage();
        });
      }
    });

    const equalsHeader = document.createElement('th');
    equalsHeader.className = 'col-equals';
    equalsHeader.textContent = '=';
    headerRow.insertBefore(equalsHeader, totalHeader);

    data.rows.forEach((rowData, rowIndex) => {
      const row = document.createElement('tr');
      row.setAttribute('data-row-index', rowIndex);

      let rowHTML = `<td class="col-index">${rowIndex + 1}</td>`;
      rowHTML += `<td><input type="text" class="name-input" placeholder="姓名" value="${escapeHtml(rowData.name || '')}"></td>`;

      rowData.values.forEach((value, index) => {
        rowHTML += `<td><input type="number" class="data-input" placeholder="0.00" step="0.01" value="${escapeHtml(value || '')}"></td>`;
        if (index < rowData.values.length - 1) {
          const op = data.columns[index]?.operator || '+';
          rowHTML += `<td class="col-operator">${getOperatorSymbol(op)}</td>`;
        }
      });

      rowHTML += `<td class="col-equals">=</td>`;
      rowHTML += `<td class="total-cell">0.00</td>`;

      row.innerHTML = rowHTML;
      tbody.appendChild(row);

      row.querySelectorAll('input').forEach(input => {
        input.addEventListener('input', function () {
          calculateRow(row);
          calculateGrandTotal();
          saveToLocalStorage();
        });
      });
    });

    rebuildTotalRow(data);
    calculateAll();
  } catch (e) {
    console.error('加载数据失败:', e);
  }
}

function rebuildTotalRow(data) {
  const totalRow = document.getElementById('totalRow');
  totalRow.innerHTML = '';

  totalRow.innerHTML = '<td class="total-label">总计</td><td class="total-label">金额</td>';

  data.columns.forEach((col, index) => {
    const columnTotalCell = document.createElement('td');
    columnTotalCell.className = 'column-total';
    columnTotalCell.textContent = '0.00';
    totalRow.appendChild(columnTotalCell);

    if (index < data.columns.length - 1) {
      const op = col.operator || '+';
      const operatorCell = document.createElement('td');
      operatorCell.className = 'col-operator';
      operatorCell.textContent = getOperatorSymbol(op);
      totalRow.appendChild(operatorCell);
    }
  });

  const equalsCell = document.createElement('td');
  equalsCell.className = 'col-equals';
  equalsCell.textContent = '=';
  totalRow.appendChild(equalsCell);

  const grandTotalCell = document.createElement('td');
  grandTotalCell.id = 'grandTotal';
  grandTotalCell.className = 'grand-total';
  grandTotalCell.textContent = '0.00';
  totalRow.appendChild(grandTotalCell);
}

// 清空数据：不依赖 reload，移动端更稳定
function clearAllData() {
  const ok = window.confirm('确定要清空所有数据吗？此操作不可恢复！');
  if (!ok) return;

  try {
    localStorage.removeItem('settlementData');
  } catch (e) {
    console.error(e);
  }

  dataColumns = 1;

  // 重建表头
  const headerRow = document.getElementById('headerRow');
  headerRow.querySelectorAll('.col-data, .col-operator, .col-equals').forEach(x => x.remove());
  const totalHeader = headerRow.querySelector('.col-total');

  const dataTh = document.createElement('th');
  dataTh.className = 'col-data';
  dataTh.innerHTML = `
    <input type="text" class="header-input" placeholder="列标题" value="标题一">
    <button class="delete-col-btn" style="display:none;">删除</button>
  `;
  headerRow.insertBefore(dataTh, totalHeader);
  dataTh.querySelector('.header-input').addEventListener('input', saveToLocalStorage);

  const eqTh = document.createElement('th');
  eqTh.className = 'col-equals';
  eqTh.textContent = '=';
  headerRow.insertBefore(eqTh, totalHeader);

  // 重建tbody
  const tbody = document.getElementById('tableBody');
  tbody.innerHTML = `
    <tr data-row-index="0">
      <td class="col-index">1</td>
      <td><input type="text" class="name-input" placeholder="姓名"></td>
      <td><input type="number" class="data-input" placeholder="0.00" step="0.01"></td>
      <td class="col-equals">=</td>
      <td class="total-cell">0.00</td>
    </tr>
  `;

  // 绑定初始行事件
  Array.from(tbody.children).forEach(row => {
    row.querySelectorAll('input').forEach(input => {
      input.addEventListener('input', function () {
        calculateRow(row);
        calculateGrandTotal();
        saveToLocalStorage();
      });
    });
  });

  // 重建tfoot
  const totalRow = document.getElementById('totalRow');
  totalRow.innerHTML = `
    <td class="total-label">总计</td>
    <td class="total-label">金额</td>
    <td class="column-total">0.00</td>
    <td class="col-equals">=</td>
    <td id="grandTotal" class="grand-total">0.00</td>
  `;

  calculateAll();
}

// 导出Excel
function exportToExcel() {
  const wb = XLSX.utils.book_new();
  const data = [];

  const headers = ['序号', '姓名'];
  const headerRow = document.getElementById('headerRow');
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

  const tbody = document.getElementById('tableBody');
  Array.from(tbody.children).forEach(row => {
    const rowData = [];
    rowData.push(row.querySelector('.col-index').textContent);
    rowData.push(row.querySelector('.name-input').value);

    Array.from(row.children).forEach(cell => {
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

  const totalRow = document.getElementById('totalRow');
  const totalRowData = [];
  Array.from(totalRow.children).forEach(cell => {
    if (cell.classList.contains('total-label')) totalRowData.push(cell.textContent);
    else if (cell.classList.contains('column-total')) totalRowData.push(parseFloat(cell.textContent) || 0);
    else if (cell.classList.contains('col-operator')) totalRowData.push(cell.textContent);
    else if (cell.classList.contains('col-equals')) totalRowData.push('=');
    else if (cell.classList.contains('grand-total')) totalRowData.push(parseFloat(cell.textContent) || 0);
  });
  data.push(totalRowData);

  const ws = XLSX.utils.aoa_to_sheet(data);

  ws['!cols'] = [{ wch: 8 }];
  for (let i = 1; i < headers.length; i++) ws['!cols'].push({ wch: 12 });

  XLSX.utils.book_append_sheet(wb, ws, '工程结算');
  const fileName = `工程结算_${new Date().toISOString().slice(0, 10)}.xlsx`;
  XLSX.writeFile(wb, fileName);
}

// 导出PDF
function exportToPDF() {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF('l');

  doc.setFontSize(18);
  doc.text('Engineering Settlement Report', 14, 20);

  const headers = [['No.', 'Name']];
  const headerRow = document.getElementById('headerRow');
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

  const body = [];
  const tbody = document.getElementById('tableBody');
  Array.from(tbody.children).forEach(row => {
    const rowData = [];
    rowData.push(row.querySelector('.col-index').textContent);
    rowData.push(row.querySelector('.name-input').value || '-');

    Array.from(row.children).forEach(cell => {
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

    body.push(rowData);
  });

  const totalRow = document.getElementById('totalRow');
  const totalRowData = [];
  Array.from(totalRow.children).forEach(cell => {
    if (cell.classList.contains('total-label')) totalRowData.push(cell.textContent);
    else if (cell.classList.contains('column-total')) totalRowData.push((parseFloat(cell.textContent) || 0).toFixed(2));
    else if (cell.classList.contains('col-operator')) totalRowData.push(cell.textContent);
    else if (cell.classList.contains('col-equals')) totalRowData.push('=');
    else if (cell.classList.contains('grand-total')) totalRowData.push(cell.textContent);
  });
  body.push(totalRowData);

  doc.autoTable({
    head: headers,
    body,
    startY: 30,
    theme: 'grid',
    headStyles: { fillColor: [102, 126, 234], fontSize: 9, fontStyle: 'bold' },
    styles: { fontSize: 8, cellPadding: 2 },
    columnStyles: {
      0: { halign: 'center', cellWidth: 15 },
      [headers[0].length - 1]: { halign: 'right', fontStyle: 'bold' }
    },
    didDrawPage: function () {
      doc.setFontSize(8);
      doc.text(`Generated on ${new Date().toLocaleString()}`, 14, doc.internal.pageSize.height - 10);
    }
  });

  const fileName = `settlement_${new Date().toISOString().slice(0, 10)}.pdf`;
  doc.save(fileName);
}

function attachEventListeners() {
  document.getElementById('addRowBtn').addEventListener('click', addRow);
  document.getElementById('addColBtn').addEventListener('click', addColumn);
  document.getElementById('clearBtn').addEventListener('click', clearAllData);
  document.getElementById('exportExcelBtn').addEventListener('click', exportToExcel);
  document.getElementById('exportPdfBtn').addEventListener('click', exportToPDF);

  // 表头输入
  const headerRow = document.getElementById('headerRow');
  headerRow.querySelectorAll('.header-input').forEach(input => input.addEventListener('input', saveToLocalStorage));
  headerRow.querySelectorAll('.operator-select').forEach(select => {
    select.addEventListener('change', function () {
      updateOperatorSymbols();
      calculateAll();
      saveToLocalStorage();
    });
  });

  // 删除列：事件委托（替代 inline onclick，移动端更稳定）
  headerRow.addEventListener('click', function (e) {
    const btn = e.target.closest('.delete-col-btn');
    if (!btn) return;
    deleteColumn(btn);
  });

  // 初始行输入
  const tbody = document.getElementById('tableBody');
  Array.from(tbody.children).forEach(row => {
    row.querySelectorAll('input').forEach(input => {
      input.addEventListener('input', function () {
        calculateRow(row);
        calculateGrandTotal();
        saveToLocalStorage();
      });
    });
  });
}

function escapeHtml(str) {
  return String(str)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}
