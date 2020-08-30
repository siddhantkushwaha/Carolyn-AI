const { google } = require('googleapis')

const sleep = require('system-sleep')

const sheets = require('./sheets')
const firebase = require('./firebase')
const { getFirebaseDb } = require('./firebase')

const spreadsheetId = '**'

function getMessages(sheets) {
    return new Promise(resolve => {
        sheets.spreadsheets.values.get({
            spreadsheetId: spreadsheetId,
            range: 'Dataset!A2:A',
        }, (err, res) => {
            if (err) return console.log('The API returned an error: ' + err)
            const messagesSet = new Set()
            for (const row of res.data.values) {
                messagesSet.add(row[0])
            }
            resolve(messagesSet)
        })
    })
}

function getFirebaseMessages(db) {
    return new Promise(resolve => {
        db.ref("messages/").once('value', messages => {
            resolve(messages.val())
        })
    })
}

function addToSheets(sheets, messagesSet, message) {
    return new Promise(resolve => {
        if (messagesSet.has(message.body)) {
            console.log('Already exists.')
            resolve(-1)
        }

        if (message.user2.length == 13 && !isNaN(message.user2.slice(1))) {
            console.log('Maybe personal.')
            resolve(-1)
        }

        const values = [[message.body]]
        const resource = { values }
        sheets.spreadsheets.values.append({
            spreadsheetId: spreadsheetId,
            range: 'Dataset!A2:A',
            valueInputOption: 'RAW',
            resource,
        }, (err, res) => {
            if (err) { console.log(err); resolve(-1) }
            messagesSet.add(message.body)
            resolve(1)
        })
    })
}

async function main() {

    const db = await getFirebaseDb()

    const sheetsClient = await sheets.getSheetsClient()
    const sheetsObj = google.sheets({ version: 'v4', auth: sheetsClient })

    const messagesSet = await getMessages(sheetsObj)
    const messages = await getFirebaseMessages(db)

    for (const message of Object.values(messages)) {
        await addToSheets(sheetsObj, messagesSet, message)
            .then(res => {
                console.log(res)
                if (res === 1)
                    sleep(2000)
            })
            .catch(err => { console.log(err) })
    }

    console.log('All messages processed.')
}

main()