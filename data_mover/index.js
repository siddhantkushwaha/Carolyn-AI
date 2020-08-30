const { google, reseller_v1 } = require('googleapis')

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
            return
        }

        if (message.user2.length == 13 && !isNaN(message.user2.slice(1))) {
            console.log('Maybe personal.')
            resolve(-1)
            return
        }

        const values = [[message.body]]
        const resource = { values }

        sheets.spreadsheets.values.append({
            spreadsheetId: spreadsheetId,
            range: 'Dataset!A2:A',
            valueInputOption: 'RAW',
            resource,
        }).then(res => {
            resolve(1)
            return
        }).catch(err => {
            resolve(2)
            return
        })
    })
}

async function main() {

    const db = await getFirebaseDb()

    const sheetsClient = await sheets.getSheetsClient()
    const sheetsObj = google.sheets({ version: 'v4', auth: sheetsClient })
    sheetsObj.spreadsheets.values.append

    const messagesSet = await getMessages(sheetsObj)
    const messages = await getFirebaseMessages(db)

    let count = 0
    const uniqueMessages = new Set()

    for (const message of Object.values(messages)) {
        res = await addToSheets(sheetsObj, messagesSet, message)
        
        if (res == 1) {
            console.log('Added.')
            sleep(500)
        }

        if (res == 2) {
            console.log('There was an error.')
            break
        }

        count += 1
        uniqueMessages.add(message.body)
    }

    // ***** For test - don't delete *****
    // await addToSheets(sheetsObj, messagesSet, { body: 'This is a test message. Please skip this.', user2: 'siddhantkushwaha' })
    
    console.log('All messages processed.')
    console.log('Total unique messages in firebase db:', uniqueMessages.size, count)
}

main()