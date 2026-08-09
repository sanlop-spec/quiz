const firebaseConfig = {
  apiKey: "AIzaSyBzSXyBWraJ0w4SokENSqEUFHzyN9ZvcWI",
  authDomain: "skillquiz-app.firebaseapp.com",
  projectId: "skillquiz-app",
  storageBucket: "skillquiz-app.firebasestorage.app",
  messagingSenderId: "283936251852",
  appId: "1:283936251852:web:ad546d60b9853c13c48769",
  measurementId: "G-PV86W1HL6M"
};

firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

// Banco Inicial de Preguntas
const baseQuestions = [
  {
    category: "math",
    categoryLabel: "Lógica / Matemáticas",
    question: "Si 3 gatos cazan 3 ratones en 3 minutos, ¿cuántos gatos se necesitan para cazar 100 ratones en 100 minutos?",
    options: ["100 gatos", "3 gatos", "33 gatos", "1 gato"],
    correct: 1,
    explanation: "¡Correcto! Los mismos 3 gatos cazan 1 ratón cada 3 minutos."
  },
  {
    category: "finance",
    categoryLabel: "Finanzas para Jóvenes",
    question: "¿Qué porcentaje de tus ingresos se sugiere ahorrar según la regla 50/30/20?",
    options: ["50%", "30%", "20%", "10%"],
    correct: 2,
    explanation: "¡Exacto! 50% Necesidades, 30% Deseos y 20% Ahorro."
  },
  {
    category: "tech",
    categoryLabel: "Habilidades Digitales",
    question: "¿Qué es el 'Phishing'?",
    options: [
      "Optimizar la velocidad de la red",
      "Engañarte mediante sitios falsos para robar tus claves",
      "Un lenguaje de programación moderno",
      "Comprimir archivos grandes"
    ],
    correct: 1,
    explanation: "¡Cuidado! El phishing simula páginas reales para robar datos."
  }
];

// Estado global
let currentUser = null;
let currentCategory = "all";
let filteredQuestions = [];
let currentIndex = 0;
let score = 0;
let streak = 0;
let nickname = "Jugador";
let timer = null;
let timeLeft = 120;

// Elementos DOM
const questionText = document.getElementById("question-text");
const optionsGrid = document.getElementById("options-grid");
const cardCategory = document.getElementById("card-category");
const feedbackBox = document.getElementById("feedback-box");
const feedbackText = document.getElementById("feedback-text");
const btnNext = document.getElementById("btn-next");
const scoreCount = document.getElementById("score-count");
const streakCount = document.getElementById("streak-count");
const timeLeftDisplay = document.getElementById("time-left");
const catButtons = document.querySelectorAll(".cat-btn");
const btnLogin = document.getElementById("btn-login");
const nicknameInput = document.getElementById("nickname-input");
const btnSaveNickname = document.getElementById("btn-save-nickname");

function initApp() {
  setupAuthListener();
  setupCategoryListeners();
  btnNext.addEventListener("click", nextQuestion);
  btnLogin.addEventListener("click", handleAuthAction);
  btnSaveNickname.addEventListener("click", saveNickname);
  filterQuestions("all");
  listenToLeaderboard();
}

// Autenticación en Firebase
function setupAuthListener() {
  auth.onAuthStateChanged(async (user) => {
    if (user) {
      currentUser = user;
      btnLogin.textContent = user.isAnonymous ? "🔑 Regístrate aquí para guardar" : "🚪 Salir";
      await loadUserDataFromCloud(user.uid);
    } else {
      currentUser = null;
      btnLogin.textContent = "🔑 Regístrate aquí para guardar";
      auth.signInAnonymously().catch(err => console.error(err));
    }
  });
}

function handleAuthAction() {
  if (currentUser && !currentUser.isAnonymous) {
    auth.signOut();
  } else {
    const provider = new firebase.auth.GoogleAuthProvider();
    auth.signInWithPopup(provider).catch(err => console.error(err));
  }
}

// Cargar datos de Firestore
async function loadUserDataFromCloud(uid) {
  try {
    const docRef = db.collection("users").doc(uid);
    const doc = await docRef.get();

    if (doc.exists) {
      const data = doc.data();
      score = data.score || 0;
      streak = data.streak || 0;
      nickname = data.nickname || "Jugador";
      nicknameInput.value = nickname;
    } else {
      await docRef.set({
        score: 0,
        streak: 0,
        nickname: nickname,
        lastUpdated: firebase.firestore.FieldValue.serverTimestamp()
      });
    }
    updateStatsUI();
  } catch (error) {
    console.error("Error al cargar datos:", error);
  }
}

// Guardar datos
async function saveProgressToCloud() {
  if (!currentUser) return;
  try {
    await db.collection("users").doc(currentUser.uid).set({
      score: score,
      streak: streak,
      nickname: nickname,
      lastUpdated: firebase.firestore.FieldValue.serverTimestamp()
    }, { merge: true });
  } catch (error) {
    console.error("Error al guardar:", error);
  }
}

function saveNickname() {
  const val = nicknameInput.value.trim();
  if (val) {
    nickname = val;
    saveProgressToCloud();
    alert("¡Apodo guardado correctamente!");
  }
}

// Generador de Preguntas Infinitas
function generateInfiniteQuestion() {
  const a = Math.floor(Math.random() * 30) + 5;
  const b = Math.floor(Math.random() * 30) + 5;
  const correctVal = a + b;
  
  const options = [
    correctVal.toString(),
    (correctVal + 2).toString(),
    (correctVal - 3).toString(),
    (correctVal + 5).toString()
  ].sort(() => Math.random() - 0.5);

  return {
    category: "math",
    categoryLabel: "Lógica / Matemáticas",
    question: `¿Cuánto es ${a} + ${b}?`,
    options: options,
    correct: options.indexOf(correctVal.toString()),
    explanation: `Resultado: ${a} + ${b} = ${correctVal}.`
  };
}

function filterQuestions(cat) {
  currentCategory = cat;
  filteredQuestions = cat === "all" 
    ? [...baseQuestions] 
    : baseQuestions.filter(q => q.category === cat);
  
  filteredQuestions.sort(() => Math.random() - 0.5);
  currentIndex = 0;
  loadQuestion();
}

function setupCategoryListeners() {
  catButtons.forEach(btn => {
    btn.addEventListener("click", (e) => {
      catButtons.forEach(b => b.classList.remove("active"));
      e.target.classList.add("active");
      filterQuestions(e.target.getAttribute("data-cat"));
    });
  });
}

function loadQuestion() {
  resetState();

  // Si se agotan las preguntas, generar infinitas de forma matemática
  let currentQ = filteredQuestions[currentIndex];
  if (!currentQ) {
    currentQ = generateInfiniteQuestion();
  }

  cardCategory.textContent = currentQ.categoryLabel;
  questionText.textContent = currentQ.question;

  currentQ.options.forEach((optText, index) => {
    const btn = document.createElement("button");
    btn.classList.add("option-btn");
    btn.textContent = optText;
    btn.addEventListener("click", () => handleSelectAnswer(index, currentQ.correct, currentQ));
    optionsGrid.appendChild(btn);
  });

  startTimer();
}

function resetState() {
  clearInterval(timer);
  timeLeft = 120;
  timeLeftDisplay.textContent = timeLeft;
  optionsGrid.innerHTML = "";
  feedbackBox.classList.add("hidden");
}

function startTimer() {
  timer = setInterval(() => {
    timeLeft--;
    timeLeftDisplay.textContent = timeLeft;
    if (timeLeft <= 0) {
      clearInterval(timer);
      disableOptions();
      const currentQ = filteredQuestions[currentIndex] || generateInfiniteQuestion();
      handleFailure(currentQ);
    }
  }, 1000);
}

function handleSelectAnswer(selectedIndex, correctIndex, questionObj) {
  clearInterval(timer);
  disableOptions();

  const buttons = optionsGrid.querySelectorAll(".option-btn");
  const isCorrect = selectedIndex === correctIndex;

  buttons[selectedIndex].classList.add(isCorrect ? "correct" : "incorrect");
  
  if (isCorrect) {
    score += 10;
    streak += 1;
    showFeedback(true, questionObj.explanation);
  } else {
    buttons[correctIndex].classList.add("correct");
    handleFailure(questionObj);
  }

  updateStatsUI();
  saveProgressToCloud();
}

function handleFailure(questionObj) {
  const previousStreak = streak;
  streak = 0;
  const correctAnswerText = questionObj.options[questionObj.correct];
  
  const msg = previousStreak > 0 
    ? ` Has perdido tu racha de ${previousStreak} acierto(s). La respuesta correcta era: "${correctAnswerText}". Así que aprendan.`
    : ` Respuesta incorrecta. La respuesta correcta era: "${correctAnswerText}". Así que aprendan.`;

  showFeedback(false, msg);
  updateStatsUI();
  saveProgressToCloud();
}

function disableOptions() {
  const buttons = optionsGrid.querySelectorAll(".option-btn");
  buttons.forEach(btn => btn.disabled = true);
}

function showFeedback(isCorrect, text) {
  feedbackText.textContent = text;
  feedbackText.style.color = isCorrect ? "#34d399" : "#f87171";
  feedbackBox.classList.remove("hidden");
}

function updateStatsUI() {
  scoreCount.textContent = score;
  streakCount.textContent = streak;
}

function nextQuestion() {
  currentIndex++;
  loadQuestion();
}

// Leaderboard en tiempo real
function listenToLeaderboard() {
  const leaderboardList = document.getElementById("leaderboard-list");
  db.collection("users")
    .orderBy("score", "desc")
    .limit(5)
    .onSnapshot((snapshot) => {
      leaderboardList.innerHTML = "";
      let rank = 1;
      snapshot.forEach((doc) => {
        const data = doc.data();
        const li = document.createElement("li");
        li.classList.add("leaderboard-item");
        const displayName = data.nickname || `Jugador #${rank}`;
        li.innerHTML = `
          <span><strong class="rank">#${rank}</strong> ${displayName}</span>
          <span class="score">🏆 ${data.score || 0} pts</span>
        `;
        leaderboardList.appendChild(li);
        rank++;
      });
    });
}

document.addEventListener("DOMContentLoaded", initApp);
