const admin = require('firebase-admin');
const fetch = require('node-fetch');

async function run() {
    console.log("--- ENGINE START ---");
    
    const key = process.env.FIREBASE_SERVICE_ACCOUNT;
    if (!key) {
        console.error("ERROR: Secret 'FIREBASE_SERVICE_ACCOUNT' missing!");
        return;
    }

    try {
        // Firebase Connect (Bina kisi extra check ke)
        const serviceAccount = JSON.parse(key);
        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount)
        });
        const db = admin.firestore();
        console.log("Firebase Connected ✅");

        // Result Fetch (Spelling: ai.studio)
        const res = await fetch("https://numbersamra-app-2.ai.studio/get-result");
        const data = await res.json();

        if (data && data.number) {
            const winNo = String(data.number);
            const market = data.game;
            console.log("Result Found: " + winNo + " for " + market);

            // Database checking
            const snap = await db.collection("bets").where("gameName", "==", market).where("status", "==", "pending").get();
            
            if (snap.empty) {
                console.log("No pending bets found.");
                return;
            }

            const batch = db.batch();
            console.log("Processing " + snap.size + " bets...");

            snap.forEach(doc => {
                const b = doc.data();
                const uRef = db.collection("users").doc(b.userId);
                const sRef = db.collection("khaiwal").doc("stats");
                const amt = parseInt(b.amount);

                if (String(b.number) === winNo) {
                    batch.update(uRef, { wallet: admin.firestore.FieldValue.increment(amt * 90) });
                    batch.update(sRef, { totalBalance: admin.firestore.FieldValue.increment(-(amt * 90)) });
                    batch.update(doc.ref, { status: "win" });
                } else {
                    batch.update(sRef, { totalBalance: admin.firestore.FieldValue.increment(amt) });
                    batch.update(doc.ref, { status: "loss" });
                }
            });

            await batch.commit();
            console.log("ALL PAYMENTS SETTLED! 🏆");
        }
    } catch (err) {
        console.error("ASLI ERROR YE HAI: " + err.message);
    }
}

run();
