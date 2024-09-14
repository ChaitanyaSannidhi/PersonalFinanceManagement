// Initialize Firebase
const firebaseConfig = {
    apiKey: "AIzaSyCq31oKhaj3DTJHqMALn-mr7KZylhw6Rpk",
    authDomain: "full-stack-91ccb.firebaseapp.com",
    projectId: "full-stack-91ccb",
    storageBucket: "full-stack-91ccb.appspot.com",
    messagingSenderId: "1042436062668",
    appId: "1:1042436062668:web:e9757f978d137bc15b3169",
    measurementId: "G-33DQZDLK7Y"
};
firebase.initializeApp(firebaseConfig);
const database = firebase.database();

// Event listener for the expense form submission
document.getElementById('finance-form').addEventListener('submit', (e) => {
    e.preventDefault();

    const expense = {
        name: document.getElementById('expense-name').value,
        amount: document.getElementById('expense-amount').value,
        category: document.getElementById('expense-category').value,
        date: document.getElementById('expense-date').value
    };

    database.ref('expenses').push(expense)
        .then(() => {
            alert("Expense added successfully!");
            document.getElementById('finance-form').reset();
        })
        .catch((error) => {
            console.error("Error adding expense:", error.message);
            alert("Error adding expense: " + error.message);
        });
});

// Fetch and display expenses in real-time
database.ref('expenses').on('value', (snapshot) => {
    const expenseList = document.getElementById('expense-list');
    expenseList.innerHTML = ''; // Clear current list
    let totalExpenses = 0;

    snapshot.forEach((childSnapshot) => {
        const expense = childSnapshot.val();
        totalExpenses += parseFloat(expense.amount);
        const expenseItem = document.createElement('tr');
        expenseItem.innerHTML = `
            <td>${expense.name}</td>
            <td>${expense.amount}</td>
            <td>${expense.category}</td>
            <td>${expense.date}</td>
        `;
        expenseList.appendChild(expenseItem);
    });

    // Update total expenses
    document.getElementById('total-expenses').textContent = totalExpenses.toFixed(2);
});
document.addEventListener('DOMContentLoaded', function () {
    const incomeForm = document.getElementById('incomeForm');
    
    incomeForm.addEventListener('submit', function (event) {
      const incomeName = document.getElementById('incomename').value;
      const incomeAmount = document.getElementById('incomeamount').value;
  
      if (incomeName === '' || incomeAmount === '' || incomeAmount <= 0) {
        event.preventDefault(); // Prevent form submission
        alert('Please fill in valid income details.');
      }
    });
  });
  document.addEventListener('DOMContentLoaded', function () {
    const insuranceForm = document.getElementById('insuranceForm');
  
    insuranceForm.addEventListener('submit', function (event) {
      const insuranceName = document.getElementById('insurancename').value;
      const insuranceAmount = document.getElementById('insuranceamount').value;
  
      if (insuranceName === '' || insuranceAmount === '' || insuranceAmount <= 0) {
        event.preventDefault(); // Prevent form submission
        alert('Please fill in valid insurance details.');
      }
    });
  });
  
  document.addEventListener('DOMContentLoaded', function () {
    const emiForm = document.getElementById('emiForm');
  
    emiForm.addEventListener('submit', function (event) {
      const emiName = document.getElementById('eminame').value;
      const emiAmount = document.getElementById('emiamount').value;
  
      if (emiName === '' || emiAmount === '' || emiAmount <= 0) {
        event.preventDefault(); // Prevent form submission
        alert('Please fill in valid EMI details.');
      }
    });
  });
  