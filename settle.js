const admin = require('firebase-admin');
const fetch = require('node-fetch');

// 1. GitHub Secrets se Firebase ki key uthana
const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);

if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
}

const db = admin.firestore();

async function startSettlement() {
    console.log("Checking Live Result...");
    try {
        // Bhai, ye aapka exact URL hai
        const response = await fetch("https://numbersamra-app-2.ai-st.workers.dev/get-result");
        const data = await response.json();

        if (data && data.number) {
            const winNo = data.number;
            const market = data.game;
            console.log(Result Mil Gaya: ${winNo} for ${market});

            // Pending bets nikalo
            const snapshot = await db.collection("bets")
                .where("gameName", "==", market)
                .where("status", "==", "pending")
                .get();

            if (snapshot.empty) {
                console.log("Is market ki koi pending bets nahi hain.");
                return;
            }

            const batch = db.batch();
            console.log(${snapshot.size} bets ka hisaab shuru ho raha hai...);

            snapshot.forEach(doc => {
                const bet = doc.data();
                const userRef = db.collection("users").doc(bet.userId);
                const khaiwalRef = db.collection("khaiwal").doc("stats");
                const amt = parseInt(bet.amount);

                if (bet.number === winNo) {
                    // Winner: 90 guna paisa
                    batch.update(userRef, { wallet: admin.firestore.FieldValue.increment(amt * 90) });
                    batch.update(khaiwalRef, { totalBalance: admin.firestore.FieldValue.increment(-(amt * 90)) });
                    batch.update(doc.ref, { status: "win" });
                } else {
                    // Loser: Khaiwal ka profit
                    batch.update(khaiwalRef, { totalBalance: admin.firestore.FieldValue.increment(amt) });
                    batch.update(doc.ref, { status: "loss" });
                }
            });

            await batch.commit();
            console.log("HISAAB DONE! Sabka wallet update ho gaya.");
        }
    } catch (err) {
        console.error("Error during settlement:", err);
    }
}

startSettlement();
