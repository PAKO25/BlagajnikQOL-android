import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import storage from '@react-native-firebase/storage';
import uuid from 'react-native-uuid';


var localstorage = {};
function storeData(data) {
    //data pride v obliki ['displayName', 'Patrik Kocmut']
    //stora v storage {data[0]: data[1]} npr. {displayName: 'Patrik Kocmut'}
    localstorage[data[0]] = data[1];
}
function getData(data) {
    return localstorage[data];
}

const defaultConfig = {
    settings: {
        confirmDelete: true,
        showShared: false,
        confirmToggle: false,
        sendEmail: false,
        mainColor: '#429ef5',
        customBackground: {
            use: false,
            base64: '',
            uri: ''
        }
    },
    background: {
        uri: '../assets/ozadje.jpg',
    },
    email: {
        
    }
}

let Config = {
    settings: {
        confirmDelete: true,
        showShared: false,
        confirmToggle: false,
        sendEmail: false,
        mainColor: '#429ef5',
        customBackground: {
            use: false,
            base64: '',
            uri: ''
        }
    },
    background: {
        uri: '../assets/ozadje.jpg',
    },
    email: {
        
    }
}

function restoreConfig() {
    Config = defaultConfig;
    console.log('restored config')
}

function useNewSettings(settings, resolve) {
    if (settings.customBackground.use) {
        //dobi custom background iz storiga gleda na uri v base64
        const path = settings.customBackground.base64;
        const ref = storage().ref(path);
        ref.getDownloadURL().then((url) => {
            fetch(url).then(r => {
                r.blob().then(b => {
                    var reader = new FileReader();
                    reader.onload = function () {
                        var dataUrl = reader.result;
                        var base64 = dataUrl.split(',')[1];
                        settings.customBackground.base64 = 'data:image/png;base64,' + base64;
                        settings.customBackground.uri = path;
                        Config.settings = settings;
                        resolve();
                    };
                    reader.readAsDataURL(b);
                })
            })
        })
    } else {
        Config.settings = settings;
        resolve();
    }
}

async function changeSettings(which, value) {
    Config.settings[which] = value;

    let newSettings = JSON.parse(JSON.stringify(Config.settings));
    if (newSettings.customBackground.use) newSettings.customBackground.base64 = newSettings.customBackground.uri;

    await firestore().collection('Userdata').doc(auth().currentUser.uid).update({
        settings: newSettings
    })

    console.log('changed')
}

async function setNewBackground(base64) {

    const string = 'data:image/png;base64,' + base64;
    const randomId = uuid.v4();
    const ref = storage().ref(randomId);

    await ref.putString(base64, storage.StringFormat.BASE64);

    Config.settings.customBackground.base64 = randomId;
    Config.settings.customBackground.use = true;

    //deleta staro sliko
    const pastUri = Config.settings.customBackground.uri;
    if (pastUri != '') {
        await storage().ref(pastUri).delete();
    }

    Config.settings.customBackground.uri = randomId;

    await firestore().collection('Userdata').doc(auth().currentUser.uid).update({
        settings: Config.settings
    })

    Config.settings.customBackground.base64 = string;
}

async function resetBackground() {
    console.log('reset background')
    Config.settings.customBackground.base64 = '';
    Config.settings.customBackground.use = false;
    await firestore().collection('Userdata').doc(auth().currentUser.uid).update({
        settings: Config.settings
    })
}


async function checkShared() {
    //previeri waiting list
    const email = auth().currentUser.email;
    const snapshot = await firestore().collection('Shared').doc('waitingList').collection(email).get();
    const lists = snapshot.docs.map(doc => doc.id);

    if (lists[0] != undefined) {
        for (const groupId of lists) {

            //preveri če si na waiting listu
            const doc = await firestore().collection('Shared').doc(groupId).get();
            const waiting = doc.data().waiting;
            let fake = true;
            for (let i of waiting) {
                if (i == auth().currentUser.email) fake = false;
            }
            if (!fake) {

                //doda
                await firestore().collection('Shared').doc(groupId).update({
                    access: firestore.FieldValue.arrayUnion({ name: auth().currentUser.displayName, uid: auth().currentUser.uid, perms: 'Viewer', email: auth().currentUser.email }),
                    waiting: firestore.FieldValue.arrayRemove(email)
                }).catch(() => { console.log('fake waitinglist') })

                await firestore().collection('Userdata').doc(auth().currentUser.uid).update({
                    shared: firestore.FieldValue.arrayUnion(groupId)
                })
            }

            await firestore().collection('Shared').doc('waitingList').collection(email).doc(groupId).delete();
        }
    }

    //preveri ce sem se vedno v vseh grupah
    const doc = await firestore().collection('Userdata').doc(auth().currentUser.uid).get();
    const shared = doc.data().shared;

    for (const groupId of shared) {
        let remove = false;
        const trydoc = await firestore().collection('Shared').doc(groupId).get().catch((r) => {
            remove = true;
        })
        if (trydoc == undefined || trydoc.data() == undefined || trydoc.data().access == undefined) {
            remove = true;

        } else {

            let me = false;
            trydoc.data().access.forEach(e => {
                if (e.uid == auth().currentUser.uid) me = true;
            })
            if (!me) remove = true;
        }


        if (remove) {
            await firestore().collection('Userdata').doc(auth().currentUser.uid).update({
                shared: firestore.FieldValue.arrayRemove(groupId)
            })
        }
    }
}

async function pushHistory(action, path, who, alllists, shared, sharedGroupId, by) {
    const push = {
        action: action,
        who: who,
        path: path,
        time: new Date().getTime()
    }
    if (alllists == true) push['all'] = '(all lists)';
    if (by != undefined) push['by'] = `made by ${by}`; //pri sharedlistsih kdo je naredil action

    if (shared) {
        //push to shared history
        await firestore().collection('Shared').doc(sharedGroupId).update({
            history: firestore.FieldValue.arrayUnion(push)
        })
    } else {
        //push to private history
        await firestore().collection('Userdata').doc(auth().currentUser.uid).update({
            history: firestore.FieldValue.arrayUnion(push)
        })
    }
}

export { Config, storeData, getData, useNewSettings, changeSettings, setNewBackground, checkShared, pushHistory, resetBackground, restoreConfig };