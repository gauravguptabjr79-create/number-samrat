const admin = require('firebase-admin');
const fetch = require('node-fetch');

// 1. Firebase key check
if (!process.env.FIREBASE_SERVICE_ACCOUNT) {
    console.error("Error: FIREBASE_SERVICE_ACCOUNT is missing!");
    process.exit(1);
}

const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);

if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
}

const db = admin.firestore();

async function start() {
    console.log("Starting Engine...");
    try {
        // Result fetch karna
        const res = await fetch("https://numbersamra-app-2.ai-st.workers.dev/get-result");
        const data = await res.json();

        if (data && data.number) {
            const winNo = data.number;
            const market = data.game;
            // Yahan thi galti (Backticks fix kar diye hain)
            console.log(`Result M
