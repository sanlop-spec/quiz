// Configuración extraída de tu panel de Firebase
const firebaseConfig = {
  apiKey: "AIzaSyBzSXyBWraJ0w4SokENSqEUFHzyN9ZvcWI",
  authDomain: "skillquiz-app.firebaseapp.com",
  projectId: "skillquiz-app",
  storageBucket: "skillquiz-app.firebasestorage.app",
  messagingSenderId: "283936251852",
  appId: "1:283936251852:web:ad546d60b9853c13c48769",
  measurementId: "G-PV86W1HL6M"
};

// Inicializar Firebase
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

// Banco de Preguntas de Prueba
const questionsData = [
  {
    id: 1,
    category: "math",
    categoryLabel: "Lógica / Matemáticas",
    question: "Si 3 gatos cazan 3 ratones en 3 minutos, ¿cuántos gatos se necesitan para cazar 100 ratones en 100 minutos?",
    options: ["100 gatos", "3 gatos", "33 gatos", "1 gato"],
    correct: 1,
    explanation: "¡Correcto! Los mismos 3 gatos cazan 1 ratón cada 3 minutos. En 100 minutos, esos 3 gatos seguirán cazando al mismo ritmo."
  },
  {
    id: 2,
    category: "math",
    categoryLabel: "Lógica / Matemáticas",
    question: "¿Cuál es el número que sigue en la secuencia: 2, 4, 8, 16, ...?",
    options: ["24", "32", "64", "20"],
    correct: 1,
    explanation: "¡Exacto! Cada número es el doble del anterior."
  },
  {
    id: 3,
    category: "finance",
    categoryLabel: "Finanzas para Jóvenes",
    question: "¿Qué significa el concepto de 'Interés Compuesto'?",
    options: [
      "Un impuesto cobrado por compras con tarjeta de débito",
      "Interés que se calcula sobre el capital inicial + los intereses acumulados",
      "Un préstamo entre amigos sin comisiones",
      "La tasa fija que cobran los bancos por retiro en cajeros"
    ],
    correct: 1,
    explanation: "¡Muy bien! El interés compuesto hace crecer tu dinero exponencialmente porque genera 'intereses sobre los intereses'."
  },
  {
    id: 4,
    category: "finance",
    categoryLabel: "Finanzas para Jóvenes",
    question: "¿Qué porcentaje aproximado de tus ingresos se recomienda destinar al ahorro en la regla 50/30/20?",
    options: ["50%", "30%", "20%", "10%"],
    correct: 2,
    explanation: "¡De una! La regla 50/30/20 sugiere: 50% Necesidades, 30% Deseos y 20% Ahorro."
  },
  {
    id: 5,
    category: "tech",
    categoryLabel: "Habilidades Digitales",
    question: "¿Qué es el 'Phishing' en ciberseguridad?",
    options: [
      "Una técnica para optimizar la velocidad de navegación",
      "Un método de estafa para engañarte y obtener tus claves o datos confidenciales",
      "Crear aplicaciones web usando solo CSS y HTML",
      "Comprimir archivos pesados para enviarlos por correo"
    ],
    correct: 1,
    explanation: "¡Ojo ahí! El phishing usa correos o páginas falsas para robar credenciales."
  },
  {
    id: 6,
    category: "tech",
    categoryLabel: "Habilidades Digitales",
    question: "¿Cuál de estas herramientas es un control de versiones de código muy usado en programación?",
    options: ["Git", "Docker", "Figma", "Node.js"],
    correct: 0,
    explanation: "¡Eso es! Git te permite rastrear cambios en el código y colaborar con otros desarrolladores."
  },
  {
    id: 7,
    category: "general",
    categoryLabel: "Cultura General",
    question: "¿Quién es considerado el creador del sistema operativo Linux?",
    options: ["Steve Jobs", "Bill Gates", "Linus Torvalds", "Mark Zuckerberg"],
    correct: 2,
    explanation: "¡Correcto! Linus Torvalds creó el núcleo de Linux en 1991 como proyecto de código abierto."
  },
  {
    id: 8,
    category: "general",
    categoryLabel: "Cultura General",
    question: "¿Qué gas de la atmósfera terrestre absorbe la mayor parte de los rayos ultravioleta (UV) del Sol?",
    options: ["Dióxido de carbono", "Ozono", "Nitrógeno", "Argón"],
    correct: 1,
    explanation: "¡Exacto! La capa de ozono actúa como un escudo protector esencial para la vida."
  }
];

// Estado global de la aplicación
let currentUser = null;
let currentCategory = "all";
let filteredQuestions = [];
let currentIndex = 0;
let score = 0;
let streak = 0;
let timer = null;
let timeLeft = 120;

// Referencias al DOM
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

// Inicialización de la App
function initApp() {
  setupAuthListener();
  setupCategoryListeners();
  btnNext.addEventListener("click", nextQuestion);
  btnLogin.addEventListener("click", handleAuthAction);
  filterQuestions("all");
}

// Escuchar cambios de autenticación en Firebase
function setupAuthListener() {
  auth.onAuthStateChanged(async (user) => {
    if (user) {
      currentUser = user;
      btnLogin.textContent = user.isAnonymous ? "👤 Anónimo" : "🚪 Salir";
      await loadUserDataFromCloud(user.uid);
    } else {
      currentUser = null;
      btnLogin.textContent = "🔑 Entrar";
      // Iniciar sesión anónima de forma transparente
      auth.signInAnonymously().catch(err => console.error("Error al autenticar de forma anónima:", err));
    }
  });
}

// Iniciar sesión con Google o Salir
function handleAuthAction() {
  if (currentUser && !currentUser.isAnonymous) {
    auth.signOut();
  } else {
    const provider = new firebase.auth.GoogleAuthProvider();
    auth.signInWithPopup(provider).catch(err => console.error("Error al iniciar sesión con Google:", err));
  }
}

// Cargar progreso desde Firestore
async function loadUserDataFromCloud(uid) {
  try {
    const docRef = db.collection("users").doc(uid);
    const doc = await docRef.get();

    if (doc.exists) {
      const data = doc.data();
      score = data.score || 0;
      streak = data.streak || 0;
    } else {
      await docRef.set({
        score: 0,
        streak: 0,
        lastUpdated: firebase.firestore.FieldValue.serverTimestamp()
      });
      score = 0;
      streak = 0;
    }
    updateStatsUI();
  } catch (error) {
    console.error("Error al consultar datos en la nube:", error);
  }
}

// Guardar datos en Firestore
async function saveProgressToCloud() {
  if (!currentUser) return;

  try {
    await db.collection("users").doc(currentUser.uid).set({
      score: score,
      streak: streak,
      lastUpdated: firebase.firestore.FieldValue.serverTimestamp()
    }, { merge: true });
  } catch (error) {
    console.error("Error al guardar en la nube:", error);
  }
}

// Filtrar preguntas por categoría
function filterQuestions(cat) {
  currentCategory = cat;
  filteredQuestions = cat === "all" 
    ? [...questionsData] 
    : questionsData.filter(q => q.category === cat);
  
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

  if (filteredQuestions.length === 0) {
    questionText.textContent = "No hay preguntas en esta categoría.";
    return;
  }

  const currentQ = filteredQuestions[currentIndex];
  cardCategory.textContent = currentQ.categoryLabel;
  questionText.textContent = currentQ.question;

  currentQ.options.forEach((optText, index) => {
    const btn = document.createElement("button");
    btn.classList.add("option-btn");
    btn.textContent = optText;
    btn.addEventListener("click", () => handleSelectAnswer(index, currentQ.correct));
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
      showFeedback(false, "⏰ ¡Tiempo agotado! Intenta el siguiente reto.");
      streak = 0;
      updateStatsUI();
      saveProgressToCloud();
    }
  }, 1000);
}

function handleSelectAnswer(selectedIndex, correctIndex) {
  clearInterval(timer);
  disableOptions();

  const buttons = optionsGrid.querySelectorAll(".option-btn");
  const isCorrect = selectedIndex === correctIndex;

  buttons[selectedIndex].classList.add(isCorrect ? "correct" : "incorrect");
  
  if (!isCorrect) {
    buttons[correctIndex].classList.add("correct");
    streak = 0;
  } else {
    score += 10;
    streak += 1;
  }

  updateStatsUI();
  saveProgressToCloud(); // Guarda puntos y racha en la nube
  
  const currentQ = filteredQuestions[currentIndex];
  showFeedback(isCorrect, currentQ.explanation);
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
  currentIndex = (currentIndex + 1) % filteredQuestions.length;
  loadQuestion();
}

// Arrancar la app al cargar la página
document.addEventListener("DOMContentLoaded", initApp);
