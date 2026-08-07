const admin = require('firebase-admin');

// Firebase Setup (Wahi purani chabi use hogi)
if (!admin.apps.length) {
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
}
const db = admin.firestore();

module.exports = async (req, res) => {
    // Ye function Payment Gateway ka signal sunega
    if (req.method === 'POST') {
        const data = req.body;
        
        // --- YEAHAN SE AUTOMATIC WALLET UPDATE HOGA ---
        // Alag-alag gateway ka data format alag hota hai
        // Abhi hum ise generic rakh rahe hain
        try {
            const userId = data.userId || (data.notes && data.notes.userId);
            const amount = parseInt(data.amount);

            if (userId && amount) {
                const userRef = db.collection("users").doc(userId);
                await userRef.update({
                    wallet: admin.firestore.FieldValue.increment(amount)
                });
                console.log(Successfully added ₹${amount} to user ${userId});
                return res.status(200).send("Wallet Updated ✅");
            }
            
            res.status(400).send("Invalid Data");
        } catch (err) {
            res.status(500).send("Error: " + err.message);
        }
    } else {
        res.status(200).send("Webhook is running... Waiting for POST request.");
    }
};
