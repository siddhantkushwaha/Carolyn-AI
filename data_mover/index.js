const { google } = require('googleapis')

const sleep = require('system-sleep')

const sheets = require('./sheets')
const firebase = require('./firebase')

const spreadsheetId = '*****************'


function getMessages(sheetsClient, callback) {
    const sheets = google.sheets({ version: 'v4', auth: sheetsClient })
    sheets.spreadsheets.values.get({
        spreadsheetId: spreadsheetId,
        range: 'Dataset!A2:A',
    }, (err, res) => {
        if (err) return console.log('The API returned an error: ' + err)
        const messagesSet = new Set()
        for (const row of res.data.values) {
            messagesSet.add(row[0])
        }
        callback(messagesSet)
    })
}

function addToSheets(sheetsClient, messagesSet, message) {
    if (messagesSet.has(message.body)) {
        console.log('Already exists.')
        return -1
    }

    if (message.user2.length == 13 && !isNaN(message.user2.slice(1))) {
        console.log('Maybe personal.')
        return -1
    }

    const sheets = google.sheets({ version: 'v4', auth: sheetsClient })

    const values = [[message.body]]
    const resource = { values }

    sheets.spreadsheets.values.append({
        spreadsheetId: spreadsheetId,
        range: 'Dataset!A2:A',
        valueInputOption: 'RAW',
        resource,
    }, (err, res) => {
        if (err) { console.log(err); return }
        console.log('Done.')
        messagesSet.add(message.body)
    })
}

firebase.getFirebaseDb(db => {
    sheets.getSheetsClient(sheetsClient => {
        getMessages(sheetsClient, messagesSet => {
            console.log(messagesSet)
            db.ref("messages/").once('value', function (messages) {
                for(const message of Object.values(messages.val())) {
                    console.log(message)
                    const ret = addToSheets(sheetsClient, messagesSet, message)
                    if (ret !== -1)
                        sleep(2000)
                }
            })
        })
    })
})

/* Test func, don't remove */
/*sheets.getSheetsClient(sc => {
    message = {
        body: 'this is a test message.',
        user2: '+917353111',
    }
    getMessages(sc, messagesSet => {
        console.log(messagesSet)
        addToSheets(sc, messagesSet, message)
        console.log(messagesSet)
    })
})*/