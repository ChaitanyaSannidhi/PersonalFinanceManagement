const express = require('express');
const path = require('path');
const session = require('express-session');
const admin = require('firebase-admin');
require('dotenv').config();

// Initialize Firebase Admin SDK
const serviceAccount = require(path.join(__dirname, 'full-stack-91ccb-firebase-adminsdk-9i681-d1a745d5bc.json'));

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: process.env.FIREBASE_ADMIN_DATABASE_URL
});

const db = admin.firestore();

const app = express();
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));
app.set('view engine', 'ejs');

// Session setup
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false }
}));

// Middleware to check if the user is authenticated
function checkAuth(req, res, next) {
  if (req.session.user) {
    next();
  } else {
    res.redirect('/login');
  }
}

// Routes
app.get('/', (req, res) => {
    res.render('dashboard');
});

app.get('/login', (req, res) => {
  res.render('login');
});
app.get('/notifications', (req, res) => {
  res.render('notification');
});

app.get('/signup', (req, res) => {
  res.render('signup');
});

// Signup Route
app.post('/signup', async (req, res) => {
  const { email, password } = req.body;
  try {
    // Create user in Firebase Authentication
    const userRecord = await admin.auth().createUser({
      email,
      password
    });
    
    // Store user data in Firestore (without the password)
    await db.collection('users').doc(userRecord.uid).set({ email });

    res.redirect('/login');
  } catch (error) {
    console.error('Error signing up:', error.message);
    res.status(500).send('Error signing up');
  }
});

// Login Route
app.post('/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    // Fetch the user by email
    const userRecord = await admin.auth().getUserByEmail(email);

    // Verify the password manually or use an authentication service (optional)
    if (userRecord) {
      req.session.user = { email, uid: userRecord.uid };  // Store UID in session
      res.redirect('/home');
    } else {
      res.render('login', { error: 'Invalid email or password' });
    }
  } catch (error) {
    console.error('Error logging in:', error.message);
    res.render('login', { error: 'Invalid email or password' });
  }
});

// Home Route (Protected)
app.get('/home', checkAuth, (req, res) => {
  res.render('home');
});

// Logout Route
app.get('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error('Error logging out:', err.message);
      return res.status(500).send('Error logging out');
    }
    res.redirect('/login'); // Redirect to the login page after successful logout
  });
});

// Expenses routes
app.get('/expenses', checkAuth, async (req, res) => {
  const uid = req.session.user.uid;  // Get the user's UID from the session
  try {
    const expensesSnapshot = await db.collection('users').doc(uid).collection('expenses').orderBy('timestamp', 'desc').get();
    const expenses = expensesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    const totalExpenses = expenses.reduce((total, expense) => total + parseFloat(expense.expenseamount), 0);
    res.render('expenses', { expenses, totalExpenses });
  } catch (error) {
    console.error('Error fetching expenses:', error.message);
    res.status(500).send('Error fetching expenses');
  }
});

app.post('/expenses', checkAuth, async (req, res) => {
  const { expensename, expenseamount, expensecategory, expensedate } = req.body;
  const uid = req.session.user.uid;

  try {
    // Fetch the total income
    const incomeSnapshot = await db.collection('users').doc(uid).collection('incomes').get();
    const totalIncome = incomeSnapshot.docs.reduce((total, doc) => total + parseFloat(doc.data().incomeamount), 0);

    // Fetch the total expenses
    const expensesSnapshot = await db.collection('users').doc(uid).collection('expenses').get();
    const totalExpenses = expensesSnapshot.docs.reduce((total, doc) => total + parseFloat(doc.data().expenseamount), 0);

    // Check if adding the new expense exceeds total income
    if (totalExpenses + parseFloat(expenseamount) > totalIncome) {
      return res.send('<script>alert("Expense exceeds total income!"); window.location.href="/expenses";</script>');
    }

    // Add the expense if conditions are met
    await db.collection('users').doc(uid).collection('expenses').add({
      expensename,
      expenseamount,
      expensecategory,
      expensedate,
      timestamp: admin.firestore.FieldValue.serverTimestamp()
    });
    res.redirect('/expenses');
  } catch (error) {
    console.error('Error adding expense:', error.message);
    res.status(500).send('Error adding expense');
  }
});

// Savings routes
app.get('/savings', checkAuth, async (req, res) => {
  const uid = req.session.user.uid;  // Get the user's UID from the session
  try {
    const savingsSnapshot = await db.collection('users').doc(uid).collection('savings').orderBy('timestamp', 'desc').get();
    const savings = savingsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    const totalSavings = savings.reduce((total, saving) => total + parseFloat(saving.savingamount), 0);
    res.render('savings', { savings, totalSavings });
  } catch (error) {
    console.error('Error fetching savings:', error.message);
    res.status(500).send('Error fetching savings');
  }
});

app.post('/savings', checkAuth, async (req, res) => {
  const { savingname, savingamount, savingdate } = req.body;
  const uid = req.session.user.uid;

  try {
    const incomeSnapshot = await db.collection('users').doc(uid).collection('incomes').get();
    const totalIncome = incomeSnapshot.docs.reduce((total, doc) => total + parseFloat(doc.data().incomeamount), 0);

    const savingsSnapshot = await db.collection('users').doc(uid).collection('savings').get();
    const totalSavings = savingsSnapshot.docs.reduce((total, doc) => total + parseFloat(doc.data().savingamount), 0);

    if (totalSavings + parseFloat(savingamount) > totalIncome) {
      return res.send('<script>alert("Savings exceeds total income!"); window.location.href="/savings";</script>');
    }

    await db.collection('users').doc(uid).collection('savings').add({
      savingname,
      savingamount,
      savingdate,
      timestamp: admin.firestore.FieldValue.serverTimestamp()
    });
    res.redirect('/savings');
  } catch (error) {
    console.error('Error adding saving:', error.message);
    res.status(500).send('Error adding saving');
  }
});

// Income routes
app.get('/income', checkAuth, async (req, res) => {
  const uid = req.session.user.uid;
  try {
    const incomeSnapshot = await db.collection('users').doc(uid).collection('incomes').orderBy('timestamp', 'desc').get();
    const incomes = incomeSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    const totalIncome = incomes.reduce((total, income) => total + parseFloat(income.incomeamount), 0);
    res.render('income', { incomes, totalIncome });
  } catch (error) {
    console.error('Error fetching income:', error.message);
    res.status(500).send('Error fetching income');
  }
});

app.post('/income', checkAuth, async (req, res) => {
  const { incomename, incomeamount, incomedate } = req.body;
  const uid = req.session.user.uid;
  try {
    await db.collection('users').doc(uid).collection('incomes').add({
      incomename,
      incomeamount,
      incomedate,
      timestamp: admin.firestore.FieldValue.serverTimestamp()
    });
    res.redirect('/income');
  } catch (error) {
    console.error('Error adding income:', error.message);
    res.status(500).send('Error adding income');
  }
});

// Insurance routes
app.get('/insurance', checkAuth, async (req, res) => {
  const uid = req.session.user.uid;
  try {
    const insuranceSnapshot = await db.collection('users').doc(uid).collection('insurances').orderBy('timestamp', 'desc').get();
    const insurances = insuranceSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    const totalInsurance = insurances.reduce((total, insurance) => total + parseFloat(insurance.insuranceamount), 0);
    res.render('insurance', { insurances, totalInsurance });
  } catch (error) {
    console.error('Error fetching insurances:', error.message);
    res.status(500).send('Error fetching insurances');
  }
});

app.post('/insurance', checkAuth, async (req, res) => {
  const { insurancename, insuranceamount, insurancedate } = req.body;
  const uid = req.session.user.uid;
  try {
    await db.collection('users').doc(uid).collection('insurances').add({
      insurancename,
      insuranceamount,
      insurancedate,
      timestamp: admin.firestore.FieldValue.serverTimestamp()
    });
    res.redirect('/insurance');
  } catch (error) {
    console.error('Error adding insurance:', error.message);
    res.status(500).send('Error adding insurance');
  }
});

// Listen to the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
