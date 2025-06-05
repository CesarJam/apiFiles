const admin = require("firebase-admin");
const { FieldValue } = require("firebase-admin/firestore");
var serviceAccount = require("./permisos.json");

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();
db.settings({ ignoreUndefinedProperties: true });

// Aquí está la línea clave:
//const FieldValue = admin.firestore.FieldValue;
// 💡 ESTA es la forma correcta y segura de acceder a FieldValue
//const FieldValue = require("firebase-admin").firestore.FieldValue;

module.exports = { admin, db, FieldValue };