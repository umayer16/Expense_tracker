// ===============================
// Hostel Expense Tracker with Login + Fixed Charts
// ===============================

let currentUser = null;
let expenses = [];
let editIndex = null;

// --- Helper ---
function userKey() {
  return `expenses_${currentUser}`;
}

// --- Save / Load ---
function saveExpenses() {
  if (currentUser) {
    localStorage.setItem(userKey(), JSON.stringify(expenses));
  }
}

function loadExpenses() {
  if (currentUser) {
    expenses = JSON.parse(localStorage.getItem(userKey()) || "[]");
  } else {
    expenses = [];
  }
}

// --- LOGIN / LOGOUT ---
function login() {
  const email = document.getElementById("emailInput").value.trim();
  if (!email) return alert("Please enter your email.");

  currentUser = email.toLowerCase();
  localStorage.setItem("currentUser", currentUser);
  loadExpenses();

  document.getElementById("loginSection").style.display = "none";
  document.getElementById("appSection").style.display = "block";
  document.getElementById("userEmail").innerText = currentUser;

  displayExpenses();
  updateSummary();
  drawCharts();
}

function logout() {
  localStorage.removeItem("currentUser");
  currentUser = null;
  expenses = [];
  document.getElementById("loginSection").style.display = "block";
  document.getElementById("appSection").style.display = "none";
}

// --- Auto-login if session exists ---
window.onload = function() {
  const savedUser = localStorage.getItem("currentUser");
  if (savedUser) {
    currentUser = savedUser;
    loadExpenses();
    document.getElementById("loginSection").style.display = "none";
    document.getElementById("appSection").style.display = "block";
    document.getElementById("userEmail").innerText = currentUser;
    displayExpenses();
    updateSummary();
    drawCharts();
  }
};

// --- Add / Edit / Delete ---
function addExpense() {
  const category = document.getElementById("category").value.trim();
  const amount = parseFloat(document.getElementById("amount").value);
  const date = document.getElementById("date").value;

  if (!category || isNaN(amount) || !date) return alert("Fill all fields correctly.");

  if (editIndex !== null) {
    expenses[editIndex] = { category, amount, date };
    editIndex = null;
    document.querySelector('button[onclick="addExpense()"]').innerText = "Add Expense";
  } else {
    expenses.push({ category, amount, date });
  }

  saveExpenses();
  displayExpenses();
  updateSummary();
  drawCharts();

  document.getElementById("category").value = "";
  document.getElementById("amount").value = "";
  document.getElementById("date").value = "";
}

function editExpense(index) {
  const e = expenses[index];
  document.getElementById("category").value = e.category;
  document.getElementById("amount").value = e.amount;
  document.getElementById("date").value = e.date;
  editIndex = index;
  document.querySelector('button[onclick="addExpense()"]').innerText = "Update Expense";
}

function deleteExpense(index) {
  if (confirm("Delete this expense?")) {
    expenses.splice(index, 1);
    saveExpenses();
    displayExpenses();
    updateSummary();
    drawCharts();
  }
}

// --- Summaries ---
function summarize() {
  const summary = {};
  expenses.forEach(e => summary[e.category] = (summary[e.category] || 0) + e.amount);
  return summary;
}

function expensesOverTime() {
  const daily = {};
  expenses.forEach(e => daily[e.date] = (daily[e.date] || 0) + e.amount);
  return Object.fromEntries(Object.entries(daily).sort());
}

function updateSummary() {
  const summary = summarize();
  const ul = document.getElementById("summaryList");
  ul.innerHTML = "";
  for (const [cat, amt] of Object.entries(summary)) {
    const li = document.createElement("li");
    li.innerText = `${cat}: ${amt.toFixed(2)}`;
    ul.appendChild(li);
  }
}

// --- Display Table ---
function displayExpenses() {
  const table = document.getElementById("expenseTable");
  table.innerHTML = `
    <tr>
      <th>Date</th>
      <th>Category</th>
      <th>Amount</th>
      <th>Actions</th>
    </tr>
  `;
  expenses.forEach((e, i) => {
    const row = table.insertRow();
    row.insertCell(0).innerText = e.date;
    row.insertCell(1).innerText = e.category;
    row.insertCell(2).innerText = e.amount.toFixed(2);
    row.insertCell(3).innerHTML = `
      <button onclick="editExpense(${i})">Edit</button>
      <button onclick="deleteExpense(${i})">Delete</button>
    `;
  });
}

// --- Draw Charts ---
function drawCharts() {
  if (!expenses.length) return; // Avoid errors if empty

  const sum = summarize();
  const categories = Object.keys(sum);
  const amounts = Object.values(sum);
  const daily = expensesOverTime();
  const dates = Object.keys(daily);
  const totals = Object.values(daily);

  // Destroy previous charts
  ['barChart', 'pieChart', 'lineChart', 'scatterChart'].forEach(id => {
    if (window[id]) window[id].destroy();
  });

  // Bar Chart
  const barCtx = document.getElementById('barChart').getContext('2d');
  window.barChart = new Chart(barCtx, {
    type: 'bar',
    data: {
      labels: categories,
      datasets: [{
        label: 'Expenses by Category',
        data: amounts,
        backgroundColor: 'skyblue'
      }]
    },
    options: { responsive: true }
  });

  // Pie Chart
  const pieCtx = document.getElementById('pieChart').getContext('2d');
  window.pieChart = new Chart(pieCtx, {
    type: 'pie',
    data: {
      labels: categories,
      datasets: [{
        data: amounts,
        backgroundColor: ['#FF6384','#36A2EB','#FFCE56','#4BC0C0','#9966FF','#FF9F40']
      }]
    },
    options: { responsive: true }
  });

  // Line Chart
  const lineCtx = document.getElementById('lineChart').getContext('2d');
  window.lineChart = new Chart(lineCtx, {
    type: 'line',
    data: {
      labels: dates,
      datasets: [{
        label: 'Total Expenses Over Time',
        data: totals,
        borderColor: 'green',
        fill: false,
        tension: 0.3
      }]
    },
    options: { responsive: true }
  });

  // Scatter Chart (Amount vs Date)
  const scatterCtx = document.getElementById('scatterChart').getContext('2d');
  const scatterData = expenses.map(e => ({
    x: e.amount,
    y: e.date
  }));

  window.scatterChart = new Chart(scatterCtx, {
    type: 'scatter',
    data: {
      datasets: [{
        label: 'Amount vs Date',
        data: scatterData,
        backgroundColor: 'orange'
      }]
    },
    options: {
      responsive: true,
      scales: {
        x: {
          title: { display: true, text: 'Amount Spent' }
        },
        y: {
          type: 'time',
          time: {
            unit: 'day',
            tooltipFormat: 'dd MMM yyyy',
            displayFormats: { day: 'dd MMM' }
          },
          title: { display: true, text: 'Date' }
        }
      }
    }
  });
}
