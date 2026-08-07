const admin = require('firebase-admin');

if (!admin.apps.length) {
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
}
const db = admin.firestore();

module.exports = async (req, res) => {
    // Zyporapay POST request bhejta hai
    if (req.method === 'POST') {
        try {
            const data = req.body;
            
            // Zyporapay ke data fields (Status 'SUCCESS' hona chahiye)
            if (data.status === 'SUCCESS') {
                // Zyporapay mein hum userId ko 'remark' ya 'client_id' mein bhejenge
                const userId = data.remark || data.client_id; 
                const amount = parseFloat(data.amount);

                if (userId && amount) {
                    const userRef = db.collection("users").doc(userId);
                    
                    // Wallet mein paise jodo
                    await userRef.update({
                        wallet: admin.firestore.FieldValue.increment(amount)
                    });

                    console.log(Automatic Recharge: ₹${amount} added to ${userId});
                    return res.status(200).send("OK");
                }
            }
            res.status(400).send("Payment not successful or data missing");
        } catch (err) {
            res.status(500).send("Webhook Error: " + err.message);
        }
    } else {
        res.status(200).send("Zyporapay Webhook Active");
    }
};
