// =====================================================
//  CAMPUS HUNT — Station Data
//  Edit this file to customize questions and clues
// =====================================================

const STATION_DATA = [
    {
        id: 1,
        name: "Station 1 — Main Gate",
        question: "Which scientist is known as the 'Father of Modern Physics'?",
        options: ["Isaac Newton", "Albert Einstein", "Niels Bohr", "Richard Feynman"],
        correctIndex: 1,
        secretLetter: "C",
        nextClue: "Go to the place where students gather every morning to begin their day — the one spot with a notice board everyone reads! 📋",
        funTask: "Do your best impression of Albert Einstein! Make the most creative 'genius' pose you can for 10 seconds! 🤓"
    },
    {
        id: 2,
        name: "Station 2 — Notice Board",
        question: "What does CPU stand for in computing?",
        options: ["Central Processing Unit", "Computer Power Unit", "Core Processing Unit", "Central Program Utility"],
        correctIndex: 0,
        secretLetter: "A",
        nextClue: "The next station is where knowledge grows and books live — find the building where silence is golden! 📚",
        funTask: "Do 10 jumping jacks while saying 'CPU, CPU!' with each jump. Record the whole thing! 💪"
    },
    {
        id: 3,
        name: "Station 3 — Library",
        question: "What is the chemical symbol for Gold?",
        options: ["Go", "Gd", "Au", "Ag"],
        correctIndex: 2,
        secretLetter: "M",
        nextClue: "Head to the heart of campus learning — the place where teachers teach and lectures happen daily. Look for the biggest classroom block! 🏫",
        funTask: "Act out mining for gold with exaggerated moves for 15 seconds. Look dramatic! ⛏️"
    },
    {
        id: 4,
        name: "Station 4 — Lecture Block",
        question: "How many planets are in our Solar System?",
        options: ["7", "8", "9", "10"],
        correctIndex: 1,
        secretLetter: "P",
        nextClue: "The next clue awaits where students fuel their body and mind — the place that smells of chai and delicious food! ☕",
        funTask: "Pretend you're floating in zero gravity for 20 seconds. Move in slow motion! 🚀"
    },
    {
        id: 5,
        name: "Station 5 — Canteen",
        question: "Who painted the Mona Lisa?",
        options: ["Michelangelo", "Vincent van Gogh", "Pablo Picasso", "Leonardo da Vinci"],
        correctIndex: 3,
        secretLetter: "U",
        nextClue: "Find the green space where students relax between classes — the open ground or garden area of your campus! 🌿",
        funTask: "Strike your most dramatic 'Mona Lisa smile' pose and hold it for 15 seconds. No laughing allowed! 😐"
    },
    {
        id: 6,
        name: "Station 6 — Campus Ground",
        question: "What does HTML stand for?",
        options: ["Hyper Text Markup Language", "High Technical Modern Language", "Hyper Transfer Markup Layout", "Home Tool Markup Language"],
        correctIndex: 0,
        secretLetter: "S",
        nextClue: "The final station awaits at the place where great ideas are born — the innovation hub or seminar hall of your campus! 🎓",
        funTask: "Spell out H-T-M-L using your body. One person per letter (you can involve teammates!) 🤸"
    },
    {
        id: 7,
        name: "Station 7 — Seminar Hall",
        question: "What year was the World Wide Web invented?",
        options: ["1985", "1989", "1991", "1995"],
        correctIndex: 1,
        secretLetter: "E",
        nextClue: "🎉 Congratulations! You've reached the FINAL station! Collect all your secret letters and find the organizer to claim your prize!",
        funTask: "Do a victory dance and celebrate like you just won the World Cup! Record it for at least 15 seconds! 🕺"
    }
];

// The final secret word formed by letters: C-A-M-P-U-S-E = CAMPUSE
// You can change this to any word by updating the secretLetter for each station.
