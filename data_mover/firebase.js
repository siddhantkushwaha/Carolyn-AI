const fs = require('fs');
const admin = require("firebase-admin");
const serviceAccount = require("./config/firebase_credentials.json");

const getFirebaseDb = () => {
  return new Promise(resolve => {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      databaseURL: "https://hola-messaging.firebaseio.com/"
    })
    resolve(admin.database())
  }) 
}

module.exports = { getFirebaseDb }