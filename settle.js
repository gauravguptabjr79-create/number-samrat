const admin = require('firebase-admin');
const fetch = require('node-fetch');

async function runEngine() {
    console.log("--- SAMRAT ENGINE START (Fixed URL) ---");

    try {
        // 1. Chabi (Secret) check
        const keyData = process.env.FIREBASE_SERVICE_ACCOUNT;
        if (!keyData) {
            throw new Error("GitHub Secrets mein 'FIREBASE_SERVICE_ACCOUNT' nahi mila.");
        }

        const serviceAccount = JSON.parse(keyData);

        // 2. Firebase Initialize
        if (!admin.apps.length) {
            admin.initializeApp({
                credential: admin.credential.cert(serviceAccount)
            });
        }
        
        const db = admin.firestore();
        console.log("Firebase Connected ✅");

        // 3. CORRECTED URL (Spelling Check: ai.studio)
        const URL = "https://numbersamra-app-2.ai.studio/get-result";
        console.log("Fetching from: " + URL);

        const response = await fetch(URL);
        const data = await response.json();

        if (data && data.number) {
            const winNo = String(data.number);
            const market = data.game;
            console.log("Result Mil Gaya: " + winNo + " for " + market);

            const snapshot = await db.collection("bets")
                .where("gameName", "==", market)
                .where("status", "==", "pending")
                .get();

            if (snapshot.empty) {
                console.log("No pending bets found.");
                return;
            }

            const batch = db.batch();
            console.log("Found " + snapshot.size + " bets. Settling...");

            snapshot.forEach(doc => {
                const bet = doc.data();
                const uRef = db.collection("users").doc(bet.userId);
                const sRef = db.collection("khaiwal").doc("stats");
                const amt = parseInt(bet.amount);

                if (String(bet.number) === winNo) {
                    batch.update(uRef, { wallet: admin.firestore.FieldValue.increment(amt * 90) });
                    batch.update(sRef, { totalBalance: admin.firestore.FieldValue.increment(-(amt * 90)) });
                    batch.update(doc.ref, { status: "win" });
                } else {
                    batch.update(sRef, { totalBalance: admin.firestore.FieldValue.increment(amt) });
                    batch.update(doc.ref, { status: "loss" });
                }
            });

            await batch.commit();
            console.log("HISAAB POORA HO GAYA! 🏆");
        } else {
            console.log("API se sahi data nahi mila. Check URL.");
        }
    } catch (err) {
        console.error("ERROR AA GAYA: " + err.message);
        process.exit(1);
    }
}

runEngine();
