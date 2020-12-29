const { google, reseller_v1 } = require('googleapis')

const sheets = require('./sheets')
const firebase = require('./firebase')
const { getFirebaseDb } = require('./firebase')
const config = require("./config/config.json");

const spreadsheetId = config.spreadSheetId

function getMessages(sheets) {
    return new Promise(resolve => {
        sheets.spreadsheets.values.get({
            spreadsheetId: spreadsheetId,
            range: 'Dataset!A2:B',
        }, (err, res) => {
            if (err) return console.log('The API returned an error: ' + err)
            const messagesMap = new Map()
            for (const row of res.data.values) {
                var messageType = null
                if (row[1]) messageType = row[1]
                messagesMap.set(row[0], messageType)
            }
            resolve(messagesMap)
        })
    })
}

function getFirebaseMessages(db) {
    return new Promise(resolve => {
        db.ref("messages/").once('value', messages => {
            const messagesSet = new Set()
            for (const message of Object.values(messages.val())) {
                if (message.user2.length == 13 && !isNaN(message.user2.slice(1))) {
                    continue
                }
                messagesSet.add(message.body)
            }
            resolve(messagesSet)
        })
    })
}

function updateSheets(sheets, data) {
    return new Promise(resolve => {

        const values = []
        for (const item of data) {
            values.push([item[0], item[1]])
        }

        const resource = { values }

        sheets.spreadsheets.values.update({
            spreadsheetId: spreadsheetId,
            range: 'Dataset!A2:B',
            valueInputOption: 'RAW',
            resource,
        }).then(res => {
            resolve(res)
        }).catch(err => {
            resolve(err)
        })
    })
}

async function main() {

    const sheetsClient = await sheets.getSheetsClient()
    const sheetsObj = google.sheets({ version: 'v4', auth: sheetsClient })
    const messagesInSheet = await getMessages(sheetsObj)

    const db = await getFirebaseDb()
    const messagesInFirebase = await getFirebaseMessages(db)

    console.log('Messages in sheets -', messagesInSheet.size)
    console.log('Messages in firebase - ', messagesInFirebase.size)

    for (const message of messagesInFirebase) {
        if (!messagesInSheet.has(message)) {
            messagesInSheet.set(message, null)
        }
    }

    await updateSheets(sheetsObj, messagesInSheet)
    console.log('Messages in updated sheets -', messagesInSheet.size)
}

main()
