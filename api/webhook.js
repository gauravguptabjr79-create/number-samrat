const admin = require('firebase-admin');

if (!admin.apps.length) {
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
}
const db = admin.firestore();

module.exports = async (req, res) => {
    if (req.method === 'POST') {
        try {
            const data = req.body;
            
            if (data.status === 'SUCCESS') {
                const userId = data.remark || data.client_id; 
                const amount = parseFloat(data.amount);

                if (userId && amount) {
                    const userRef = db.collection("users").doc(userId);
                    
                    // 1. Wallet update karo
                    await userRef.update({
                        wallet: admin.firestore.FieldValue.increment(amount)
                    });

                    // 2. Recharge History mein record dalo (TAKI KHAIWAL DEKH SAKE)
                    await db.collection("recharges").add({
                        userId: userId,
                        amount: amount,
                        status: "SUCCESS",
                        timestamp: admin.firestore.FieldValue.serverTimestamp()
                    });

                    return res.status(200).send("OK");
                }
            }
            res.status(400).send("Invalid Data");
        } catch (err) {
            res.status(500).send(err.message);
        }
    } else {
        res.status(200).send("Webhook Active");
    }
};
