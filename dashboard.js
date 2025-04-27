// Check if user is logged in
if (!localStorage.getItem('isLoggedIn')) {
    window.location.href = 'index.html';
}

// Initialize user data if not exists
if (!localStorage.getItem('userData')) {
    const initialUserData = {
        checkingBalance: 0,
        savingsBalance: 0,
        transactions: []
    };
    localStorage.setItem('userData', JSON.stringify(initialUserData));
}

// Get user data
let userData = JSON.parse(localStorage.getItem('userData'));

// Update UI with user data
function updateUI() {
    document.getElementById('checkingBalance').textContent = `$${userData.checkingBalance.toFixed(2)}`;
    document.getElementById('savingsBalance').textContent = `$${userData.savingsBalance.toFixed(2)}`;
    document.getElementById('totalBalance').textContent = `$${(userData.checkingBalance + userData.savingsBalance).toFixed(2)}`;
    displayTransactions();
    updateAccountsSummary();
}

// Update accounts summary
function updateAccountsSummary() {
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    
    let totalIncome = 0;
    let monthlyIncome = 0;
    let totalExpenses = 0;
    let monthlyExpenses = 0;
    
    const incomeTransactions = [];
    const expenseTransactions = [];
    
    userData.transactions.forEach(transaction => {
        const transactionDate = new Date(transaction.date);
        const amount = transaction.amount;
        
        if (transaction.type === 'deposit' || transaction.type === 'savings-deposit') {
            totalIncome += amount;
            incomeTransactions.push(transaction);
            
            if (transactionDate >= firstDayOfMonth) {
                monthlyIncome += amount;
            }
        } else {
            totalExpenses += amount;
            expenseTransactions.push(transaction);
            
            if (transactionDate >= firstDayOfMonth) {
                monthlyExpenses += amount;
            }
        }
    });
    
    // Update summary amounts
    document.getElementById('totalIncome').textContent = `$${totalIncome.toFixed(2)}`;
    document.getElementById('monthlyIncome').textContent = `$${monthlyIncome.toFixed(2)}`;
    document.getElementById('totalExpenses').textContent = `$${totalExpenses.toFixed(2)}`;
    document.getElementById('monthlyExpenses').textContent = `$${monthlyExpenses.toFixed(2)}`;
    
    // Update transaction lists
    displayIncomeTransactions(incomeTransactions);
    displayExpenseTransactions(expenseTransactions);
}

// Display income transactions
function displayIncomeTransactions(transactions) {
    const incomeList = document.getElementById('incomeList');
    incomeList.innerHTML = '';
    
    transactions.slice().reverse().forEach(transaction => {
        const transactionItem = document.createElement('div');
        transactionItem.className = 'transaction-item';
        
        transactionItem.innerHTML = `
            <div class="transaction-info">
                <div class="description">${transaction.description}</div>
                <div class="transaction-date">${transaction.date}</div>
            </div>
            <span class="transaction-amount positive">+$${transaction.amount.toFixed(2)}</span>
        `;
        
        incomeList.appendChild(transactionItem);
    });
}

// Display expense transactions
function displayExpenseTransactions(transactions) {
    const expensesList = document.getElementById('expensesList');
    expensesList.innerHTML = '';
    
    transactions.slice().reverse().forEach(transaction => {
        const transactionItem = document.createElement('div');
        transactionItem.className = 'transaction-item';
        
        transactionItem.innerHTML = `
            <div class="transaction-info">
                <div class="description">${transaction.description}</div>
                <div class="transaction-date">${transaction.date}</div>
            </div>
            <span class="transaction-amount negative">-$${transaction.amount.toFixed(2)}</span>
        `;
        
        expensesList.appendChild(transactionItem);
    });
}

// Display transactions
function displayTransactions() {
    const transactionList = document.getElementById('transactionList');
    transactionList.innerHTML = '';
    
    userData.transactions.slice().reverse().forEach(transaction => {
        const transactionItem = document.createElement('div');
        transactionItem.className = 'transaction-item';
        
        const amount = transaction.type === 'deposit' || transaction.type === 'savings-deposit' ? 
            transaction.amount : -transaction.amount;
        
        transactionItem.innerHTML = `
            <div class="transaction-info">
                <span class="description">${transaction.description}</span>
                <span class="date">${transaction.date}</span>
            </div>
            <span class="transaction-amount ${amount >= 0 ? 'positive' : 'negative'}">
                ${amount >= 0 ? '+' : ''}$${Math.abs(amount).toFixed(2)}
            </span>
        `;
        
        transactionList.appendChild(transactionItem);
    });
}

// Add transaction
function addTransaction(type, amount, description, account = 'checking') {
    const transaction = {
        type,
        amount: parseFloat(amount),
        description,
        date: new Date().toLocaleString(),
        account
    };
    
    userData.transactions.push(transaction);
    
    if (account === 'checking') {
        userData.checkingBalance += type === 'deposit' ? amount : -amount;
    } else {
        userData.savingsBalance += type === 'savings-deposit' ? amount : -amount;
    }
    
    localStorage.setItem('userData', JSON.stringify(userData));
    updateUI();
}

// Statement Functions
function getFilteredTransactions() {
    const fromDate = document.getElementById('fromDate').value;
    const toDate = document.getElementById('toDate').value;
    
    if (!fromDate || !toDate) {
        alert('Please select both start and end dates');
        return null;
    }
    
    const startDate = new Date(fromDate);
    const endDate = new Date(toDate);
    endDate.setHours(23, 59, 59, 999); // Set to end of day
    
    return userData.transactions.filter(transaction => {
        const transactionDate = new Date(transaction.date);
        return transactionDate >= startDate && transactionDate <= endDate;
    });
}

function displayStatement() {
    const filteredTransactions = getFilteredTransactions();
    if (!filteredTransactions) return;
    
    const statementView = document.getElementById('statementView');
    statementView.innerHTML = '';
    
    if (filteredTransactions.length === 0) {
        statementView.innerHTML = `
            <div class="no-statement">
                <p>No transactions found for the selected date range</p>
            </div>
        `;
        return;
    }
    
    // Create statement table
    const table = document.createElement('table');
    table.className = 'statement-table';
    
    // Add table header
    const thead = document.createElement('thead');
    thead.innerHTML = `
        <tr>
            <th>Date</th>
            <th>Description</th>
            <th>Type</th>
            <th>Account</th>
            <th>Amount</th>
        </tr>
    `;
    table.appendChild(thead);
    
    // Add table body
    const tbody = document.createElement('tbody');
    
    let totalDeposits = 0;
    let totalWithdrawals = 0;
    
    filteredTransactions.forEach(transaction => {
        const row = document.createElement('tr');
        const isDeposit = transaction.type === 'deposit' || transaction.type === 'savings-deposit';
        const amount = isDeposit ? transaction.amount : -transaction.amount;
        
        if (isDeposit) {
            totalDeposits += transaction.amount;
        } else {
            totalWithdrawals += transaction.amount;
        }
        
        row.innerHTML = `
            <td>${transaction.date}</td>
            <td>${transaction.description}</td>
            <td>${transaction.type}</td>
            <td>${transaction.account}</td>
            <td class="${amount >= 0 ? 'positive' : 'negative'}">
                ${amount >= 0 ? '+' : ''}$${Math.abs(amount).toFixed(2)}
            </td>
        `;
        
        tbody.appendChild(row);
    });
    
    table.appendChild(tbody);
    statementView.appendChild(table);
    
    // Add statement summary
    const summary = document.createElement('div');
    summary.className = 'statement-summary';
    summary.innerHTML = `
        <div class="statement-summary-item">
            <span>Total Deposits</span>
            <span class="positive">$${totalDeposits.toFixed(2)}</span>
        </div>
        <div class="statement-summary-item">
            <span>Total Withdrawals</span>
            <span class="negative">$${totalWithdrawals.toFixed(2)}</span>
        </div>
        <div class="statement-summary-item">
            <span>Net Change</span>
            <span class="${totalDeposits - totalWithdrawals >= 0 ? 'positive' : 'negative'}">
                ${totalDeposits - totalWithdrawals >= 0 ? '+' : ''}$${Math.abs(totalDeposits - totalWithdrawals).toFixed(2)}
            </span>
        </div>
    `;
    
    statementView.appendChild(summary);
}

function exportToExcel() {
    const filteredTransactions = getFilteredTransactions();
    if (!filteredTransactions) return;
    
    if (filteredTransactions.length === 0) {
        alert('No transactions found for the selected date range');
        return;
    }
    
    // Prepare data for Excel
    const excelData = [
        ['Date', 'Description', 'Type', 'Account', 'Amount']
    ];
    
    let totalDeposits = 0;
    let totalWithdrawals = 0;
    
    filteredTransactions.forEach(transaction => {
        const isDeposit = transaction.type === 'deposit' || transaction.type === 'savings-deposit';
        const amount = isDeposit ? transaction.amount : -transaction.amount;
        
        if (isDeposit) {
            totalDeposits += transaction.amount;
        } else {
            totalWithdrawals += transaction.amount;
        }
        
        excelData.push([
            transaction.date,
            transaction.description,
            transaction.type,
            transaction.account,
            amount
        ]);
    });
    
    // Add summary rows
    excelData.push([]);
    excelData.push(['Statement Summary', '', '', '', '']);
    excelData.push(['Total Deposits', '', '', '', totalDeposits]);
    excelData.push(['Total Withdrawals', '', '', '', totalWithdrawals]);
    excelData.push(['Net Change', '', '', '', totalDeposits - totalWithdrawals]);
    
    // Create worksheet
    const ws = XLSX.utils.aoa_to_sheet(excelData);
    
    // Create workbook
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Account Statement');
    
    // Generate filename with date range
    const fromDate = document.getElementById('fromDate').value;
    const toDate = document.getElementById('toDate').value;
    const filename = `Account_Statement_${fromDate}_to_${toDate}.xlsx`;
    
    // Save file
    XLSX.writeFile(wb, filename);
}

// Modal functions
function showModal(modalId) {
    document.getElementById(modalId).style.display = 'block';
}

function closeModal(modalId) {
    document.getElementById(modalId).style.display = 'none';
}

function showDepositModal() {
    showModal('depositModal');
}

function showWithdrawModal() {
    showModal('withdrawModal');
}

function showSavingsModal() {
    showModal('savingsModal');
}

function showPaymentsModal() {
    showModal('paymentsModal');
}

// Form submissions
document.getElementById('depositForm').addEventListener('submit', function(e) {
    e.preventDefault();
    const amount = parseFloat(document.getElementById('depositAmount').value);
    const description = document.getElementById('depositDescription').value;
    
    if (amount <= 0) {
        alert('Please enter a valid amount');
        return;
    }
    
    addTransaction('deposit', amount, description);
    closeModal('depositModal');
    this.reset();
});

document.getElementById('withdrawForm').addEventListener('submit', function(e) {
    e.preventDefault();
    const amount = parseFloat(document.getElementById('withdrawAmount').value);
    const description = document.getElementById('withdrawDescription').value;
    
    if (amount <= 0) {
        alert('Please enter a valid amount');
        return;
    }
    
    if (amount > userData.checkingBalance) {
        alert('Insufficient funds');
        return;
    }
    
    addTransaction('withdraw', amount, description);
    closeModal('withdrawModal');
    this.reset();
});

document.getElementById('savingsForm').addEventListener('submit', function(e) {
    e.preventDefault();
    const amount = parseFloat(document.getElementById('savingsAmount').value);
    const action = document.getElementById('savingsAction').value;
    
    if (amount <= 0) {
        alert('Please enter a valid amount');
        return;
    }
    
    if (action === 'withdraw' && amount > userData.savingsBalance) {
        alert('Insufficient funds in savings');
        return;
    }
    
    if (action === 'deposit' && amount > userData.checkingBalance) {
        alert('Insufficient funds in checking account');
        return;
    }
    
    addTransaction(
        action === 'deposit' ? 'savings-deposit' : 'savings-withdraw',
        amount,
        `${action === 'deposit' ? 'Deposit to' : 'Withdraw from'} savings`,
        'savings'
    );
    
    closeModal('savingsModal');
    this.reset();
});

document.getElementById('paymentsForm').addEventListener('submit', function(e) {
    e.preventDefault();
    const amount = parseFloat(document.getElementById('paymentAmount').value);
    const recipient = document.getElementById('paymentRecipient').value;
    const description = document.getElementById('paymentDescription').value;
    
    if (amount <= 0) {
        alert('Please enter a valid amount');
        return;
    }
    
    if (amount > userData.checkingBalance) {
        alert('Insufficient funds');
        return;
    }
    
    addTransaction('payment', amount, `Payment to ${recipient}: ${description}`);
    closeModal('paymentsModal');
    this.reset();
});

// Statement event listeners
document.getElementById('viewStatementBtn').addEventListener('click', displayStatement);
document.getElementById('exportStatementBtn').addEventListener('click', exportToExcel);

// Set default date range (last 30 days)
window.addEventListener('DOMContentLoaded', function() {
    const today = new Date();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(today.getDate() - 30);
    
    document.getElementById('toDate').value = today.toISOString().split('T')[0];
    document.getElementById('fromDate').value = thirtyDaysAgo.toISOString().split('T')[0];
});

// Handle logout
document.getElementById('logoutBtn').addEventListener('click', function() {
    localStorage.removeItem('isLoggedIn');
    window.location.href = 'index.html';
});

// Handle navigation
document.querySelectorAll('.nav-links a').forEach(link => {
    link.addEventListener('click', function(e) {
        e.preventDefault();
        
        // Remove active class from all links
        document.querySelectorAll('.nav-links li').forEach(li => li.classList.remove('active'));
        
        // Add active class to clicked link
        this.parentElement.classList.add('active');
        
        // Show/hide sections based on navigation
        const target = this.getAttribute('href').substring(1);
        const sections = ['dashboard', 'accounts', 'transactions', 'savings', 'payments', 'statements', 'settings'];
        
        sections.forEach(section => {
            const element = document.querySelector(`.${section}-section`);
            if (element) {
                element.style.display = section === target ? 'block' : 'none';
            }
        });
    });
});

// Show dashboard section by default
document.addEventListener('DOMContentLoaded', function() {
    document.querySelector('.dashboard-section').style.display = 'block';
    document.querySelector('.nav-links li:first-child').classList.add('active');
});

// Initial UI update
updateUI();

// Show reset confirmation modal
function showResetModal() {
    showModal('resetModal');
}

// Reset all data
function resetAllData() {
    // Clear all data from localStorage
    localStorage.clear();
    
    // Show success message
    alert('All data has been reset successfully. You will be redirected to the login page.');
    
    // Redirect to login page
    window.location.href = 'index.html';
} 