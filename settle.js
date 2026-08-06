const admin = require('firebase-admin');
const fetch = require('node-fetch');

const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
if (!admin.apps.length) {
    admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
}
const db = admin.firestore();

async function run() {
    try {
        const res = await fetch("https://numbersamra-app-2.ai-st.workers.dev/get-result");
        const data = await res.json();

        if (data && data.number) {
            const winNo = data.number;
            const market = data.game;
            // Line 35 Fix: Standard Quotes use kiye hain
            console.log("Live Result: " + winNo + " (" + market + ")");

            const snapshot = await db.collection("bets")
                .where("gameName", "==", market)
                .where("status", "==", "pending")
                .get(); // Line 41 Fix: Faltu quote hata diya

            if (snapshot.empty) {
                console.log("No pending bets.");
                return;
            }

            const batch = db.batch();
            // Line 49 Fix: Standard Quotes use kiye hain
            console.log("Processing " + snapshot.size + " bets...");

            snapshot.forEach(doc => {
                const bet = doc.data();
                const uRef = db.collection("users").doc(bet.userId);
                const sRef = db.collection("khaiwal").doc("stats");
                const amt = parseInt(bet.amount);

                if (bet.number === winNo) {
                    batch.update(uRef, { wallet: admin.firestore.FieldValue.increment(amt * 90) });
                    batch.update(sRef, { totalBalance: admin.firestore.FieldValue.increment(-(amt * 90)) });
                    batch.update(doc.ref, { status: "win" });
                } else {
                    batch.update(sRef, { totalBalance: admin.firestore.FieldValue.increment(amt) });
                    batch.update(doc.ref, { status: "loss" });
                }
            });

            await batch.commit();
            console.log("ALL BETS SETTLED!");
        }
    } catch (err) {
        console.log("Error: " + err.message);
    }
}

run();
