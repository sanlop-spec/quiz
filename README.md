# ⚡ SkillQuiz — App de Retos y Habilidades

**SkillQuiz** es una plataforma web interactiva de aprendizaje activo que permite a los usuarios poner a prueba sus conocimientos en áreas como **Lógica/Matemáticas, Finanzas Personales, Habilidades Digitales y Cultura General**. 

La aplicación combina gamificación (puntos, rachas y tabla de posiciones global en tiempo real) con persistencia de datos en la nube mediante **Firebase**.

![SkillQuiz Preview](https://img.shields.io/badge/Status-Active-brightgreen) ![License](https://img.shields.io/badge/License-MIT-blue)

---

## ✨ Características Principales

* **🔥 Sistema de Rachas y Puntaje:** Gana puntos por respuestas correctas y mantén tu racha de aciertos activa.
* **🏆 Leaderboard Global en Tiempo Real:** Revisa los 5 mejores puntajes de la comunidad sincronizados al instante gracias a **Cloud Firestore**.
* **🔑 Autenticación Flexible:** 
  * Acceso automático con **Autenticación Anónima**.
  * Opción de guardar progreso permanente vinculando una cuenta de **Google**.
* **👤 Personalización de Perfil:** Configura tu apodo (*Nickname*) para destacar en la tabla de clasificaciones.
* **♾️ Preguntas Infinitas:** Sistema algorítmico integrado que genera retos matemáticos y lógicos automáticos una vez agotado el banco inicial de preguntas.
* **💬 Retroalimentación Dinámica:** Al fallar una pregunta, la app te muestra la respuesta correcta y resetea tu racha acumulada.
* **⏱️ Temporizador por Reto:** Desafío contrarreloj para responder cada pregunta.
* **📱 Diseño Responsive:** Interfaz moderna desarrollada con variables CSS, adaptada para móviles, tablets y escritorio.

---

## 🛠️ Tecnologías Utilizadas

* **Frontend:** HTML5, CSS3 (Flexbox, Grid, CSS Variables), JavaScript vanilla (ES6+).
* **Backend & Cloud:** 
  * **Firebase Authentication:** Gestión de sesiones anónimas y OAuth con Google.
  * **Cloud Firestore:** Base de datos NoSQL en tiempo real.
* **Deployment:** GitHub Pages / Firebase Hosting.

---

## 🚀 Instalación y Configuración Local

Si deseas clonar este proyecto y correrlo localmente en tu computadora:

1. **Clona el repositorio:**
   ```bash
   git clone [https://github.com/sanlopspec/sanlopspec.github.io.git](https://github.com/sanlopspec/sanlopspec.github.io.git)
