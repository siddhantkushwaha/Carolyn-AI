const fs = require('fs');
const admin = require("firebase-admin");
const serviceAccount = require("./config/firebase_credentials.json");

const getFirebaseDb = callback => {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: "https://hola-messaging.firebaseio.com/"
  });
  const db = admin.database();
  callback(db)
}

module.exports = { getFirebaseDb }