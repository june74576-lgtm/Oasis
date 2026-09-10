# OASIS AI

> **Plataforma Inteligente de Asistencia Académica con Inteligencia Artificial Local**

[![Estado](https://img.shields.io/badge/estado-en%20desarrollo-yellow)]()
[![Licencia](https://img.shields.io/badge/licencia-MIT-blue)]()
[![Python](https://img.shields.io/badge/Python-3.10%2B-3776AB?logo=python)]()
[![MySQL](https://img.shields.io/badge/MySQL-8.0-4479A1?logo=mysql)]()
[![Ollama](https://img.shields.io/badge/Ollama-IA%20Local-000000)]()

**OASIS AI** es una plataforma web desarrollada para instituciones educativas que centraliza la gestión académica e incorpora un asistente inteligente basado en **Inteligencia Artificial Local**. Permite a estudiantes y docentes acceder a horarios, materias, recursos, documentos y actividades, además de interactuar con asistentes virtuales especializados por materia.

El sistema utiliza una **arquitectura híbrida** que determina automáticamente si una consulta debe resolverse mediante la **base de datos institucional (MySQL)** o mediante **IA local + RAG**, garantizando respuestas rápidas, precisas y contextualizadas.

---

## ✨ Características principales

- 🔐 **Autenticación y seguridad** – Roles de Administrador, Docente y Estudiante.
- 📚 **Portal académico** – Perfil, horario, materias, docentes, tutor y calendario.
- 📂 **Gestión documental** – PDF, Word, presentaciones, videos y descargas.
- 🤖 **Asistente académico general** – Resuelve consultas institucionales usando MySQL.
- 🧠 **Tutor inteligente por materia** – Responde exclusivamente con el material oficial de cada asignatura mediante RAG.
- 🔎 **Buscador inteligente** – Búsqueda en lenguaje natural sobre documentos.
- 📝 **Generador de material de estudio** – Resúmenes, cuestionarios, flashcards y guías.
- 📈 **Recomendador académico** – Sugerencias personalizadas según el rendimiento.
- 👨‍🏫 **Panel del docente** – Subida y organización de material, gestión de actividades.
- 📊 **Dashboard administrativo** – Estadísticas de uso, consultas IA y rendimiento del sistema.

---

## 🏗️ Arquitectura híbrida

OASIS AI decide automáticamente el mejor motor de respuesta:

| Tipo de consulta | Motor | Ejemplo |
|------------------|-------|---------|
| **Estructurada** | MySQL | “¿Qué materias tengo mañana?” |
| **Académica** | IA Local + RAG | “Explícame el concepto de herencia en POO” |

Esto optimiza el rendimiento, reduce tiempos de respuesta y evita que la IA genere información fuera del contexto académico.

---

## 🛠️ Tecnologías

- **Frontend:** HTML5, CSS3, Bootstrap, JavaScript
- **Backend:** Python (FastAPI/Flask) o Spring Boot
- **Base de datos:** MySQL
- **IA Local:** Ollama
- **Modelos LLM:** Qwen / Llama
- **Recuperación aumentada:** RAG (Retrieval-Augmented Generation)
- **API:** REST
- **Control de versiones:** Git / GitHub

---

## 🚀 Instalación rápida

```bash
# Clonar el repositorio
git clone https://github.com/tu-usuario/oasis-ai.git
cd oasis-ai

# Configurar entorno virtual (Python)
python -m venv venv
source venv/bin/activate  # En Windows: venv\Scripts\activate

# Instalar dependencias
pip install -r requirements.txt

# Configurar variables de entorno
cp .env.example .env
# Editar .env con credenciales de MySQL y configuración de Ollama

# Iniciar servidor
uvicorn main:app --reload
