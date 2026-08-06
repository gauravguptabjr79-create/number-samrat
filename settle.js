const admin = require('firebase-admin');
const fetch = require('node-fetch');

// Firebase Engine Start
async function run() {
    console.log("--- SAMRAT AUTO-ENGINE START ---");
    
    try {
        // 1. Secret Key Check
        if (!process.env.FIREBASE_SERVICE_ACCOUNT) {
            throw new Error("SECRET 'FIREBASE_SERVICE_ACCOUNT' missing in GitHub Settings!");
        }

        const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);

        if (!admin.apps.length) {
            admin.initializeApp({
                credential: admin.credential.cert(serviceAccount)
            });
        }
        const db = admin.firestore();
        console.log("Firebase Connected ✅");

        // 2. Fetch Live Result
        const response = await fetch("https://numbersamra-app-2.ai-st.workers.dev/get-result");
        const data = await response.json();
        
        if (!data || !data.number) {
            console.log("No new result found from API.");
            return;
        }

        const winNo = data.number;
        const market = data.game;
        console.log(Live Result: ${winNo} (${market}));

        // 3. Database Check
        const snapshot = await db.collection("bets")
            .where("gameName", "==", market)
            .where("status", "==", "pending")
            .get();

        if (snapshot.empty) {
            console.log("No pending bets for this market.");
            return;
        }

        const batch = db.batch();
        console.log(Processing ${snapshot.size} bets...);

        snapshot.forEach(doc => {
            const bet = doc.data();
            const userRef = db.collection("users").doc(bet.userId);
            const statsRef = db.collection("khaiwal").doc("stats");
            const amt = parseInt(bet.amount);

            if (bet.number === winNo) {
                // Winner Logic (90x)
                batch.update(userRef, { wallet: admin.firestore.FieldValue.increment(amt * 90) });
                batch.update(statsRef, { totalBalance: admin.firestore.FieldValue.increment(-(amt * 90)) });
                batch.update(doc.ref, { status: "win" });
            } else {
                // Loser Logic
                batch.update(statsRef, { totalBalance: admin.firestore.FieldValue.increment(amt) });
                batch.update(doc.ref, { status: "loss" });
            }
        });

        // 4. Final Save
        await batch.commit();
        console.log("ALL BETS SETTLED SUCCESSFULLY! 🏆");

    } catch (error) {
        console.error("CRITICAL ERROR:", error.message);
        process.exit(1);
    }
}

// System ko chalu karna
run();

