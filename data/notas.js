// Imaginary grades per student.
// Format: "studentId": { "subjectId": [T1P1, T1P2, T2P1, T2P2, T3P1, T3P2] }
// Scale: 0 to 10. Average is computed automatically for the radar chart.

const notasDB = {

    /* ============ 2ITA (students 1-17) ============ */

    "1": { // Carlos Álvarez
        matematicas:[8,8,9,8,9,9], programacion:[10,10,9,10,10,10],
        tutoria:[9,10,10,9,10,10], classroom2ITA:[8,9,9,9,9,9],
        soporte:[9,9,9,9,9,9], ciudadania:[9,9,9,9,9,9],
        quimica:[9,9,8,9,9,9], filosofia:[7,8,8,7,8,8],
        lengua:[9,9,9,9,9,10], religion:[9,9,9,9,9,9],
        fisica:[8,8,8,9,8,9], sistemas:[9,9,9,10,9,10],
        emprendimiento:[9,9,8,9,9,9], diseno:[9,9,9,9,10,9],
        eca:[8,8,8,8,9,9], efisica:[9,9,10,9,10,10],
        ingles2ITA:[9,9,9,9,10,9], historia:[8,9,8,9,9,9],
        biologia:[8,8,9,9,9,9], animacion:[8,8,9,8,9,9],
        robotica:[8,9,9,8,9,9], civica:[9,9,9,9,9,9]
    },

    "2": { // Santiago Cerezo
        matematicas:[9,9,9,9,10,9], programacion:[9,9,9,9,9,9],
        tutoria:[9,9,9,9,10,9], classroom2ITA:[9,9,10,9,9,10],
        soporte:[8,9,9,9,9,9], ciudadania:[9,9,9,9,9,9],
        quimica:[8,9,9,9,9,9], filosofia:[8,8,9,8,9,9],
        lengua:[9,9,9,10,9,10], religion:[9,9,9,9,9,9],
        fisica:[8,8,9,9,9,9], sistemas:[9,9,9,9,9,9],
        emprendimiento:[9,9,9,9,9,10], diseno:[9,9,9,9,9,9],
        eca:[8,9,8,9,9,9], efisica:[8,9,9,9,9,9],
        ingles2ITA:[9,10,9,9,10,10], historia:[8,8,8,9,9,9],
        biologia:[9,9,9,9,9,9], animacion:[8,8,8,9,9,9],
        robotica:[9,9,9,9,9,9], civica:[9,9,9,9,9,9]
    },

    "3": { // Adrián Domínguez
        matematicas:[7,8,7,8,8,8], programacion:[8,8,9,8,9,9],
        tutoria:[8,9,9,8,9,9], classroom2ITA:[7,8,8,8,8,9],
        soporte:[8,8,8,8,9,9], ciudadania:[8,9,8,9,9,9],
        quimica:[7,7,8,8,8,8], filosofia:[7,7,8,8,8,8],
        lengua:[8,8,8,9,9,9], religion:[8,8,9,8,9,9],
        fisica:[6,7,7,7,8,8], sistemas:[8,8,8,9,9,9],
        emprendimiento:[8,8,8,8,9,9], diseno:[8,8,8,9,9,9],
        eca:[8,8,8,9,9,9], efisica:[8,8,9,9,9,10],
        ingles2ITA:[8,8,8,8,9,9], historia:[7,8,8,8,9,9],
        biologia:[7,8,8,8,9,9], animacion:[8,8,8,8,9,9],
        robotica:[8,8,8,8,9,9], civica:[8,8,9,9,9,9]
    },

    "4": { // Emerson Galarza
        matematicas:[7,7,8,7,8,8], programacion:[8,8,8,8,9,9],
        tutoria:[8,8,9,9,9,9], classroom2ITA:[7,8,8,8,8,8],
        soporte:[8,8,8,8,8,9], ciudadania:[8,8,8,8,9,9],
        quimica:[8,8,8,8,9,9], filosofia:[8,8,8,9,9,9],
        lengua:[8,8,9,8,9,9], religion:[8,8,8,9,9,9],
        fisica:[7,7,7,8,8,8], sistemas:[8,8,8,9,9,9],
        emprendimiento:[7,8,8,8,9,9], diseno:[8,8,9,9,9,9],
        eca:[8,8,8,8,9,9], efisica:[8,9,9,9,9,10],
        ingles2ITA:[7,7,8,8,8,8], historia:[8,8,8,8,8,9],
        biologia:[8,8,8,8,9,9], animacion:[7,8,8,8,8,9],
        robotica:[8,8,8,8,9,9], civica:[8,8,8,9,9,9]
    },

    "5": { // Adrián Granda
        matematicas:[8,8,8,9,9,9], programacion:[9,9,9,9,9,10],
        tutoria:[8,9,9,9,9,9], classroom2ITA:[8,8,8,9,9,9],
        soporte:[8,9,9,9,9,9], ciudadania:[9,9,9,9,9,9],
        quimica:[8,8,9,9,9,9], filosofia:[7,8,8,8,9,9],
        lengua:[8,9,9,9,9,9], religion:[8,9,9,9,9,9],
        fisica:[8,8,8,9,9,9], sistemas:[8,9,9,9,9,9],
        emprendimiento:[8,9,9,9,9,9], diseno:[9,9,9,9,9,9],
        eca:[7,8,8,8,9,9], efisica:[8,8,9,9,9,9],
        ingles2ITA:[8,8,8,9,9,9], historia:[8,8,8,9,9,9],
        biologia:[8,8,9,9,9,9], animacion:[8,8,8,8,9,9],
        robotica:[8,8,9,9,9,9], civica:[8,9,9,9,9,9]
    },

    "6": { // Nicolás Menéndez
        matematicas:[9,10,9,10,10,10], programacion:[10,10,10,10,10,10],
        tutoria:[9,9,9,9,9,10], classroom2ITA:[9,9,9,9,10,10],
        soporte:[9,9,10,9,10,10], ciudadania:[9,9,9,9,9,9],
        quimica:[9,9,9,9,10,10], filosofia:[9,9,9,10,9,10],
        lengua:[9,9,9,10,10,10], religion:[9,9,9,9,9,9],
        fisica:[9,9,9,10,10,10], sistemas:[9,10,10,10,10,10],
        emprendimiento:[9,9,9,10,10,10], diseno:[9,9,10,10,10,10],
        eca:[9,9,9,9,9,9], efisica:[9,9,10,10,10,10],
        ingles2ITA:[10,10,10,10,10,10], historia:[9,9,9,9,10,10],
        biologia:[9,10,10,10,10,10], animacion:[9,9,9,9,9,10],
        robotica:[9,10,10,10,10,10], civica:[9,9,9,10,10,10]
    },

    "7": { // Jeremy Moya
        matematicas:[8,9,9,9,9,9], programacion:[9,9,9,9,10,10],
        tutoria:[9,9,9,9,9,10], classroom2ITA:[8,9,9,9,9,9],
        soporte:[8,9,9,9,9,9], ciudadania:[9,9,9,9,9,9],
        quimica:[8,9,9,9,9,9], filosofia:[8,8,9,9,9,9],
        lengua:[8,9,9,9,9,9], religion:[8,9,9,9,9,9],
        fisica:[8,8,9,9,9,9], sistemas:[9,9,9,9,9,10],
        emprendimiento:[8,9,9,9,9,9], diseno:[9,9,9,9,9,10],
        eca:[8,8,9,9,9,9], efisica:[9,9,9,10,10,10],
        ingles2ITA:[9,9,9,9,9,10], historia:[8,9,9,9,9,9],
        biologia:[8,9,9,9,9,9], animacion:[8,8,9,9,9,9],
        robotica:[8,9,9,9,9,9], civica:[9,9,9,9,9,9]
    },

    "8": { // Jonathan Ocampo
        matematicas:[8,8,8,9,9,9], programacion:[9,9,9,9,9,9],
        tutoria:[8,9,9,9,9,9], classroom2ITA:[8,8,9,9,9,9],
        soporte:[8,8,9,9,9,9], ciudadania:[8,9,9,9,9,9],
        quimica:[8,8,8,9,9,9], filosofia:[7,8,8,8,9,9],
        lengua:[8,8,9,9,9,9], religion:[8,8,9,9,9,9],
        fisica:[7,8,8,9,9,9], sistemas:[8,9,9,9,9,9],
        emprendimiento:[8,8,9,9,9,9], diseno:[8,9,9,9,9,9],
        eca:[8,8,8,9,9,9], efisica:[8,9,9,9,9,9],
        ingles2ITA:[8,9,9,9,9,9], historia:[8,8,9,9,9,9],
        biologia:[8,8,9,9,9,9], animacion:[7,8,8,9,9,9],
        robotica:[8,8,9,9,9,9], civica:[8,9,9,9,9,9]
    },

    "9": { // Kevin Ortiz
        matematicas:[9,9,9,10,10,10], programacion:[10,10,10,10,10,10],
        tutoria:[9,9,9,9,10,10], classroom2ITA:[9,9,9,10,10,10],
        soporte:[9,10,10,10,10,10], ciudadania:[9,9,9,9,9,10],
        quimica:[9,9,9,10,10,10], filosofia:[9,9,9,9,10,10],
        lengua:[9,9,9,9,10,10], religion:[9,9,9,9,9,9],
        fisica:[9,9,9,10,10,10], sistemas:[10,10,10,10,10,10],
        emprendimiento:[9,9,9,9,10,10], diseno:[10,10,10,10,10,10],
        eca:[9,9,9,9,9,10], efisica:[9,9,10,10,10,10],
        ingles2ITA:[9,10,10,10,10,10], historia:[9,9,9,10,10,10],
        biologia:[9,9,9,10,10,10], animacion:[8,9,9,9,9,10],
        robotica:[9,10,10,10,10,10], civica:[9,9,9,10,10,10]
    },

    "10": { // Matías Pilco
        matematicas:[8,8,8,9,9,9], programacion:[9,9,9,9,9,9],
        tutoria:[8,9,9,9,9,9], classroom2ITA:[8,8,8,9,9,9],
        soporte:[8,8,9,9,9,9], ciudadania:[8,8,9,9,9,9],
        quimica:[8,8,8,9,9,9], filosofia:[8,8,8,9,9,9],
        lengua:[8,8,8,9,9,9], religion:[8,8,8,9,9,9],
        fisica:[8,8,8,9,9,9], sistemas:[8,9,9,9,9,9],
        emprendimiento:[8,8,8,9,9,9], diseno:[8,9,9,9,9,9],
        eca:[8,8,8,8,9,9], efisica:[8,8,9,9,9,9],
        ingles2ITA:[8,8,9,9,9,9], historia:[8,8,8,8,9,9],
        biologia:[8,8,9,9,9,9], animacion:[8,8,8,9,9,9],
        robotica:[8,8,9,9,9,9], civica:[8,8,9,9,9,9]
    },

    "11": { // Juan Quichimbo (autor)
        matematicas:[8,8,8,9,9,9], programacion:[10,10,10,10,10,10],
        tutoria:[9,9,9,9,9,10], classroom2ITA:[8,9,9,9,9,9],
        soporte:[8,8,9,9,9,9], ciudadania:[9,9,9,9,9,9],
        quimica:[8,8,9,9,9,9], filosofia:[8,9,9,9,9,9],
        lengua:[8,8,9,9,9,9], religion:[9,9,9,9,9,9],
        fisica:[8,8,9,9,9,9], sistemas:[9,9,9,9,9,9],
        emprendimiento:[8,9,9,9,9,9], diseno:[9,9,9,9,10,10],
        eca:[8,8,9,9,9,9], efisica:[8,8,9,9,9,9],
        ingles2ITA:[9,9,9,9,9,10], historia:[8,8,9,9,9,9],
        biologia:[8,8,9,9,9,9], animacion:[8,9,9,9,9,9],
        robotica:[8,9,9,9,9,9], civica:[9,9,9,9,9,9]
    },

    "12": { // Danny Saavedra
        matematicas:[8,8,9,9,9,9], programacion:[9,9,9,9,9,9],
        tutoria:[9,9,9,9,10,10], classroom2ITA:[8,9,9,9,9,9],
        soporte:[8,9,9,9,9,9], ciudadania:[9,9,9,9,9,9],
        quimica:[8,8,9,9,9,9], filosofia:[8,8,9,9,9,9],
        lengua:[8,9,9,9,9,9], religion:[8,9,9,9,9,9],
        fisica:[8,8,9,9,9,9], sistemas:[8,9,9,9,9,9],
        emprendimiento:[9,9,9,9,9,9], diseno:[8,9,9,9,9,9],
        eca:[8,8,8,9,9,9], efisica:[8,9,9,9,10,10],
        ingles2ITA:[8,8,8,9,9,9], historia:[8,8,9,9,9,9],
        biologia:[8,8,8,9,9,9], animacion:[8,8,9,9,9,9],
        robotica:[8,8,9,9,9,9], civica:[9,9,9,9,9,9]
    },

    "13": { // Ricardo Suárez
        matematicas:[7,8,8,8,9,9], programacion:[8,8,8,9,9,9],
        tutoria:[8,8,8,9,9,9], classroom2ITA:[7,7,8,8,8,9],
        soporte:[7,8,8,8,9,9], ciudadania:[8,8,8,8,9,9],
        quimica:[7,7,8,8,8,8], filosofia:[8,8,8,9,9,9],
        lengua:[8,8,8,8,9,9], religion:[8,8,8,9,9,9],
        fisica:[7,7,7,8,8,8], sistemas:[8,8,8,8,9,9],
        emprendimiento:[7,7,8,8,8,9], diseno:[8,8,8,9,9,9],
        eca:[8,8,8,8,8,9], efisica:[8,8,9,9,9,9],
        ingles2ITA:[7,7,8,8,8,8], historia:[7,8,8,8,8,9],
        biologia:[7,8,8,8,8,9], animacion:[7,8,8,8,8,8],
        robotica:[7,8,8,8,8,9], civica:[8,8,8,8,9,9]
    },

    "14": { // Alessandro Tipán
        matematicas:[8,8,8,9,9,9], programacion:[9,9,9,9,9,9],
        tutoria:[8,8,9,9,9,9], classroom2ITA:[8,8,8,9,9,9],
        soporte:[8,8,9,9,9,9], ciudadania:[8,8,9,9,9,9],
        quimica:[8,8,8,9,9,9], filosofia:[8,8,8,9,9,9],
        lengua:[8,8,9,9,9,9], religion:[8,8,8,9,9,9],
        fisica:[8,8,8,9,9,9], sistemas:[8,8,9,9,9,9],
        emprendimiento:[8,8,8,9,9,9], diseno:[8,8,9,9,9,9],
        eca:[8,8,8,8,9,9], efisica:[8,8,8,9,9,9],
        ingles2ITA:[8,8,8,9,9,9], historia:[8,8,8,9,9,9],
        biologia:[8,8,8,9,9,9], animacion:[8,8,8,9,9,9],
        robotica:[8,8,8,9,9,9], civica:[8,8,8,9,9,9]
    },

    "15": { // Ricardo Torres
        matematicas:[8,8,9,9,9,9], programacion:[9,9,9,9,9,9],
        tutoria:[8,9,9,9,9,9], classroom2ITA:[8,8,9,9,9,9],
        soporte:[8,9,9,9,9,9], ciudadania:[8,9,9,9,9,9],
        quimica:[8,9,9,9,9,9], filosofia:[8,8,9,9,9,9],
        lengua:[8,9,9,9,9,9], religion:[8,9,9,9,9,9],
        fisica:[8,8,9,9,9,9], sistemas:[8,9,9,9,9,9],
        emprendimiento:[9,9,9,9,9,9], diseno:[8,8,9,9,9,9],
        eca:[8,8,8,9,9,9], efisica:[9,9,9,9,10,10],
        ingles2ITA:[8,8,8,9,9,9], historia:[8,8,9,9,9,9],
        biologia:[8,8,9,9,9,9], animacion:[8,8,8,9,9,9],
        robotica:[8,8,9,9,9,9], civica:[8,8,9,9,9,9]
    },

    "16": { // Leonel Veintimilla
        matematicas:[8,8,9,9,9,9], programacion:[9,9,9,9,9,10],
        tutoria:[8,9,9,9,9,9], classroom2ITA:[8,8,9,9,9,9],
        soporte:[8,8,9,9,9,9], ciudadania:[8,9,9,9,9,9],
        quimica:[8,8,8,9,9,9], filosofia:[8,8,8,9,9,9],
        lengua:[8,9,9,9,9,9], religion:[8,8,9,9,9,9],
        fisica:[8,8,8,9,9,9], sistemas:[9,9,9,9,9,9],
        emprendimiento:[8,9,9,9,9,9], diseno:[9,9,9,9,9,9],
        eca:[8,8,8,9,9,9], efisica:[8,9,9,9,9,9],
        ingles2ITA:[9,9,9,9,9,9], historia:[8,8,8,9,9,9],
        biologia:[8,8,9,9,9,9], animacion:[8,8,8,9,9,9],
        robotica:[8,9,9,9,9,9], civica:[8,9,9,9,9,9]
    },

    "17": { // Joaquín Villavicencio
        matematicas:[8,8,8,9,9,9], programacion:[9,9,9,9,9,9],
        tutoria:[8,8,9,9,9,9], classroom2ITA:[8,8,9,9,9,9],
        soporte:[8,8,9,9,9,9], ciudadania:[8,8,9,9,9,9],
        quimica:[8,8,8,9,9,9], filosofia:[8,8,9,9,9,9],
        lengua:[8,8,9,9,9,9], religion:[8,8,8,9,9,9],
        fisica:[8,8,8,9,9,9], sistemas:[8,8,9,9,9,9],
        emprendimiento:[8,8,8,9,9,9], diseno:[8,8,9,9,9,9],
        eca:[8,8,8,8,9,9], efisica:[8,8,9,9,9,9],
        ingles2ITA:[8,8,9,9,9,9], historia:[8,8,8,9,9,9],
        biologia:[8,8,8,9,9,9], animacion:[8,8,8,9,9,9],
        robotica:[8,8,8,9,9,9], civica:[8,8,9,9,9,9]
    },

    /* ============ 2CNB (students 18-36) ============ */

    "18": { // Eder Cañarte
        fisica:[8,8,8,9,9,9], quimica:[9,9,9,9,9,9],
        lengua:[9,9,9,9,9,10], tutoria:[9,9,9,9,9,9],
        matematicas:[9,9,9,9,9,9], biologia:[9,9,9,9,9,10],
        animacion:[8,8,8,9,9,9], religion:[8,9,9,9,9,9],
        ingles2CNB:[8,9,9,9,9,9], efisica:[8,8,9,9,9,9],
        eca:[8,8,8,9,9,9], historia:[8,8,9,9,9,9],
        classroom2CNB:[8,9,9,9,9,9], ciudadania:[8,9,9,9,9,9],
        emprendimiento:[8,9,9,9,9,9], filosofia:[8,8,9,9,9,9],
        robotica:[8,8,9,9,9,9], civica:[9,9,9,9,9,9]
    },

    "19": { // Matías Castro
        fisica:[8,8,9,9,9,9], quimica:[9,9,9,9,9,9],
        lengua:[9,9,9,9,9,9], tutoria:[9,9,9,9,9,9],
        matematicas:[9,9,9,9,10,10], biologia:[9,9,9,9,9,10],
        animacion:[8,8,8,9,9,9], religion:[8,8,9,9,9,9],
        ingles2CNB:[8,8,9,9,9,9], efisica:[8,8,9,9,9,9],
        eca:[8,8,9,9,9,9], historia:[8,8,9,9,9,9],
        classroom2CNB:[8,9,9,9,9,9], ciudadania:[8,9,9,9,9,9],
        emprendimiento:[8,8,9,9,9,9], filosofia:[8,8,8,9,9,9],
        robotica:[8,9,9,9,9,9], civica:[8,9,9,9,9,9]
    },

    "20": { // Carlos Coronel
        fisica:[8,8,8,9,9,9], quimica:[8,8,9,9,9,9],
        lengua:[8,8,9,9,9,9], tutoria:[8,8,9,9,9,9],
        matematicas:[8,9,9,9,9,9], biologia:[8,8,9,9,9,9],
        animacion:[8,8,8,8,9,9], religion:[8,8,8,9,9,9],
        ingles2CNB:[8,8,8,9,9,9], efisica:[8,9,9,9,9,9],
        eca:[8,8,8,9,9,9], historia:[8,8,9,9,9,9],
        classroom2CNB:[8,8,9,9,9,9], ciudadania:[8,8,9,9,9,9],
        emprendimiento:[8,8,8,9,9,9], filosofia:[8,8,8,9,9,9],
        robotica:[8,8,9,9,9,9], civica:[8,8,9,9,9,9]
    },

    "21": { // Ian Freire
        fisica:[9,9,9,9,9,10], quimica:[9,9,9,9,9,9],
        lengua:[9,9,9,9,10,10], tutoria:[9,9,9,9,9,9],
        matematicas:[9,9,10,10,10,10], biologia:[9,9,9,9,9,10],
        animacion:[8,9,9,9,9,9], religion:[8,9,9,9,9,9],
        ingles2CNB:[9,9,9,9,10,10], efisica:[8,8,9,9,9,9],
        eca:[8,8,8,9,9,9], historia:[9,9,9,9,9,9],
        classroom2CNB:[9,9,9,9,9,10], ciudadania:[9,9,9,9,9,9],
        emprendimiento:[8,9,9,9,9,9], filosofia:[8,9,9,9,9,9],
        robotica:[9,9,9,9,9,9], civica:[9,9,9,9,9,9]
    },

    "22": { // Damián Guedez
        fisica:[7,7,8,8,8,8], quimica:[7,8,8,8,9,9],
        lengua:[7,8,8,8,8,9], tutoria:[8,8,8,8,9,9],
        matematicas:[6,7,7,7,8,8], biologia:[7,7,8,8,8,9],
        animacion:[7,8,8,8,8,9], religion:[8,8,8,9,9,9],
        ingles2CNB:[7,7,8,8,8,8], efisica:[8,8,9,9,9,9],
        eca:[7,8,8,8,8,9], historia:[7,8,8,8,8,9],
        classroom2CNB:[7,7,8,8,8,8], ciudadania:[7,8,8,8,8,9],
        emprendimiento:[7,8,8,8,8,9], filosofia:[7,7,8,8,8,8],
        robotica:[7,8,8,8,8,9], civica:[8,8,8,8,9,9]
    },

    "23": { // César Jaramillo
        fisica:[8,8,8,9,9,9], quimica:[8,9,9,9,9,9],
        lengua:[8,8,9,9,9,9], tutoria:[8,9,9,9,9,9],
        matematicas:[8,8,9,9,9,9], biologia:[8,8,9,9,9,9],
        animacion:[8,8,8,9,9,9], religion:[8,8,8,9,9,9],
        ingles2CNB:[8,8,9,9,9,9], efisica:[8,8,9,9,9,9],
        eca:[8,8,8,8,9,9], historia:[8,8,9,9,9,9],
        classroom2CNB:[8,8,8,9,9,9], ciudadania:[8,9,9,9,9,9],
        emprendimiento:[8,9,9,9,9,9], filosofia:[8,8,8,9,9,9],
        robotica:[8,8,9,9,9,9], civica:[8,8,9,9,9,9]
    },

    "24": { // Sebastián Lara
        fisica:[9,9,9,9,10,10], quimica:[9,9,9,9,10,10],
        lengua:[9,9,9,9,10,10], tutoria:[9,9,9,9,9,9],
        matematicas:[9,9,9,10,10,10], biologia:[9,9,9,10,10,10],
        animacion:[8,9,9,9,9,9], religion:[8,9,9,9,9,9],
        ingles2CNB:[9,9,9,9,9,10], efisica:[8,9,9,9,9,9],
        eca:[8,9,9,9,9,9], historia:[9,9,9,9,9,9],
        classroom2CNB:[8,9,9,9,9,9], ciudadania:[8,9,9,9,9,9],
        emprendimiento:[9,9,9,9,9,9], filosofia:[8,9,9,9,9,9],
        robotica:[9,9,9,9,9,9], civica:[9,9,9,9,9,9]
    },

    "25": { // Alejandro Mata
        fisica:[8,8,8,9,9,9], quimica:[8,8,9,9,9,9],
        lengua:[8,8,8,9,9,9], tutoria:[8,9,9,9,9,9],
        matematicas:[8,8,8,9,9,9], biologia:[8,8,9,9,9,9],
        animacion:[8,8,8,8,9,9], religion:[8,8,8,9,9,9],
        ingles2CNB:[8,8,8,9,9,9], efisica:[8,8,8,9,9,9],
        eca:[7,8,8,8,8,9], historia:[8,8,8,9,9,9],
        classroom2CNB:[8,8,8,9,9,9], ciudadania:[8,8,9,9,9,9],
        emprendimiento:[8,8,9,9,9,9], filosofia:[8,8,8,9,9,9],
        robotica:[8,8,8,9,9,9], civica:[8,8,9,9,9,9]
    },

    "26": { // Thiago Mejía
        fisica:[8,8,9,9,9,9], quimica:[9,9,9,9,9,9],
        lengua:[8,8,8,9,9,9], tutoria:[8,9,9,9,9,9],
        matematicas:[8,8,9,9,9,9], biologia:[8,9,9,9,9,9],
        animacion:[8,8,8,9,9,9], religion:[8,8,9,9,9,9],
        ingles2CNB:[8,8,9,9,9,9], efisica:[8,9,9,9,9,9],
        eca:[8,8,8,9,9,9], historia:[8,8,8,9,9,9],
        classroom2CNB:[8,8,9,9,9,9], ciudadania:[8,8,9,9,9,9],
        emprendimiento:[8,8,9,9,9,9], filosofia:[8,8,9,9,9,9],
        robotica:[8,8,8,9,9,9], civica:[8,9,9,9,9,9]
    },

    "27": { // Lucas Méndez
        fisica:[8,8,8,8,9,9], quimica:[8,8,8,9,9,9],
        lengua:[8,8,9,9,9,9], tutoria:[8,9,9,9,9,9],
        matematicas:[8,8,8,9,9,9], biologia:[8,8,8,9,9,9],
        animacion:[8,8,8,8,9,9], religion:[8,8,8,9,9,9],
        ingles2CNB:[8,8,8,8,9,9], efisica:[8,8,9,9,9,9],
        eca:[8,8,8,8,8,9], historia:[8,8,8,9,9,9],
        classroom2CNB:[8,8,8,8,9,9], ciudadania:[8,8,8,9,9,9],
        emprendimiento:[8,8,8,9,9,9], filosofia:[8,8,8,9,9,9],
        robotica:[8,8,8,8,9,9], civica:[8,8,8,9,9,9]
    },

    "28": { // Fernando Mera
        fisica:[8,8,8,9,9,9], quimica:[8,8,8,9,9,9],
        lengua:[8,8,8,8,9,9], tutoria:[8,8,9,9,9,9],
        matematicas:[8,8,9,9,9,9], biologia:[8,8,8,9,9,9],
        animacion:[8,8,8,8,8,9], religion:[8,8,8,9,9,9],
        ingles2CNB:[8,8,8,8,9,9], efisica:[8,8,9,9,9,9],
        eca:[7,8,8,8,8,9], historia:[8,8,8,9,9,9],
        classroom2CNB:[8,8,8,8,9,9], ciudadania:[8,8,8,9,9,9],
        emprendimiento:[8,8,8,9,9,9], filosofia:[8,8,8,9,9,9],
        robotica:[8,8,8,8,9,9], civica:[8,8,8,9,9,9]
    },

    "29": { // Carlos Morán
        fisica:[7,8,8,8,9,9], quimica:[7,8,8,8,8,9],
        lengua:[8,8,8,9,9,9], tutoria:[8,8,8,9,9,9],
        matematicas:[7,8,8,8,9,9], biologia:[8,8,8,9,9,9],
        animacion:[7,8,8,8,8,9], religion:[8,8,8,9,9,9],
        ingles2CNB:[7,7,8,8,8,9], efisica:[8,8,9,9,9,9],
        eca:[8,8,8,8,9,9], historia:[8,8,8,9,9,9],
        classroom2CNB:[7,8,8,8,8,9], ciudadania:[8,8,8,9,9,9],
        emprendimiento:[7,8,8,8,9,9], filosofia:[8,8,8,9,9,9],
        robotica:[8,8,8,8,9,9], civica:[8,8,8,9,9,9]
    },

    "30": { // Rommel Navas
        fisica:[8,8,9,9,9,9], quimica:[8,9,9,9,9,9],
        lengua:[8,8,9,9,9,9], tutoria:[8,9,9,9,9,9],
        matematicas:[8,8,9,9,9,9], biologia:[8,9,9,9,9,9],
        animacion:[8,8,8,9,9,9], religion:[8,8,9,9,9,9],
        ingles2CNB:[8,8,9,9,9,9], efisica:[8,8,9,9,9,9],
        eca:[8,8,8,9,9,9], historia:[8,8,9,9,9,9],
        classroom2CNB:[8,8,9,9,9,9], ciudadania:[8,8,9,9,9,9],
        emprendimiento:[8,8,9,9,9,9], filosofia:[8,8,8,9,9,9],
        robotica:[8,8,9,9,9,9], civica:[8,8,9,9,9,9]
    },

    "31": { // Kevin Pihuave
        fisica:[8,9,9,9,9,9], quimica:[8,9,9,9,9,9],
        lengua:[8,9,9,9,9,9], tutoria:[9,9,9,9,10,10],
        matematicas:[8,9,9,9,9,9], biologia:[8,9,9,9,9,9],
        animacion:[8,8,9,9,9,9], religion:[8,9,9,9,9,9],
        ingles2CNB:[8,9,9,9,9,9], efisica:[8,9,9,9,9,9],
        eca:[8,8,9,9,9,9], historia:[8,8,9,9,9,9],
        classroom2CNB:[8,8,9,9,9,9], ciudadania:[9,9,9,9,9,9],
        emprendimiento:[8,9,9,9,9,9], filosofia:[8,8,9,9,9,9],
        robotica:[8,9,9,9,9,9], civica:[8,9,9,9,9,9]
    },

    "32": { // Nicolás Rodríguez
        fisica:[9,9,9,9,10,10], quimica:[9,9,9,9,10,10],
        lengua:[9,9,9,9,9,10], tutoria:[9,9,9,9,9,9],
        matematicas:[9,9,9,10,10,10], biologia:[9,9,9,10,10,10],
        animacion:[8,9,9,9,9,9], religion:[8,9,9,9,9,9],
        ingles2CNB:[9,9,9,10,10,10], efisica:[8,8,9,9,9,9],
        eca:[8,9,9,9,9,9], historia:[9,9,9,9,9,9],
        classroom2CNB:[8,9,9,9,9,9], ciudadania:[8,9,9,9,9,9],
        emprendimiento:[9,9,9,9,9,9], filosofia:[8,9,9,9,9,9],
        robotica:[9,9,9,9,9,9], civica:[9,9,9,9,9,9]
    },

    "33": { // Christhian Rocohano
        fisica:[7,8,8,8,8,9], quimica:[7,8,8,8,8,9],
        lengua:[8,8,8,8,9,9], tutoria:[8,8,8,9,9,9],
        matematicas:[7,7,8,8,8,9], biologia:[8,8,8,8,9,9],
        animacion:[8,8,8,8,8,9], religion:[8,8,8,9,9,9],
        ingles2CNB:[7,7,8,8,8,8], efisica:[8,8,8,9,9,9],
        eca:[8,8,8,8,9,9], historia:[7,8,8,8,8,9],
        classroom2CNB:[8,8,8,8,8,9], ciudadania:[8,8,8,9,9,9],
        emprendimiento:[8,8,8,9,9,9], filosofia:[8,8,8,9,9,9],
        robotica:[8,8,8,8,9,9], civica:[8,8,8,9,9,9]
    },

    "34": { // Ethan Sigüenza
        fisica:[8,8,8,9,9,9], quimica:[8,8,8,9,9,9],
        lengua:[8,8,8,9,9,9], tutoria:[8,8,9,9,9,9],
        matematicas:[8,8,9,9,9,9], biologia:[8,8,8,9,9,9],
        animacion:[8,8,8,9,9,9], religion:[8,8,9,9,9,9],
        ingles2CNB:[8,8,8,9,9,9], efisica:[8,8,9,9,9,9],
        eca:[8,8,8,8,9,9], historia:[8,8,8,9,9,9],
        classroom2CNB:[8,8,8,9,9,9], ciudadania:[8,8,9,9,9,9],
        emprendimiento:[8,8,8,9,9,9], filosofia:[8,8,8,9,9,9],
        robotica:[8,8,8,9,9,9], civica:[8,8,9,9,9,9]
    },

    "35": { // Pedro Trejo
        fisica:[9,9,9,9,9,10], quimica:[9,9,9,9,9,9],
        lengua:[9,9,9,9,9,9], tutoria:[9,9,9,9,9,10],
        matematicas:[9,9,9,9,10,10], biologia:[9,9,9,10,10,10],
        animacion:[8,9,9,9,9,9], religion:[9,9,9,9,9,9],
        ingles2CNB:[8,9,9,9,9,9], efisica:[8,8,9,9,9,9],
        eca:[8,9,9,9,9,9], historia:[9,9,9,9,9,9],
        classroom2CNB:[8,9,9,9,9,9], ciudadania:[9,9,9,9,9,9],
        emprendimiento:[9,9,9,9,9,9], filosofia:[8,9,9,9,9,9],
        robotica:[9,9,9,9,9,9], civica:[9,9,9,9,9,9]
    },

    "36": { // Manuel Zumba
        fisica:[8,9,9,9,9,9], quimica:[8,9,9,9,9,9],
        lengua:[8,8,9,9,9,9], tutoria:[9,9,9,9,9,9],
        matematicas:[8,9,9,9,9,9], biologia:[8,9,9,9,9,9],
        animacion:[8,8,9,9,9,9], religion:[8,9,9,9,9,9],
        ingles2CNB:[8,9,9,9,9,9], efisica:[8,8,9,9,9,9],
        eca:[8,8,8,9,9,9], historia:[8,8,9,9,9,9],
        classroom2CNB:[8,8,9,9,9,9], ciudadania:[8,9,9,9,9,9],
        emprendimiento:[8,9,9,9,9,9], filosofia:[8,8,9,9,9,9],
        robotica:[8,9,9,9,9,9], civica:[8,9,9,9,9,9]
    }
};