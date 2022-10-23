import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import lzstring from './utils/lz-string';


var storage = {};
function storeData(data) {
    //data pride v obliki ['displayName', 'Patrik Kocmut']
    //stora v storage {data[0]: data[1]} npr. {displayName: 'Patrik Kocmut'}
    storage[data[0]] = data[1];
}
function getData(data) {
    return storage[data];
}

let Config = {
    settings: {
        confirmDelete: true,
        showShared: false,
        confirmToggle: false,
        sendEmail: true,
        mainColor: '#429ef5',
        customBackground: {
            use: false,
            base64: ''
        }
    },
    background: {
        uri: '../assets/ozadje.jpg',
    },
    email: {
        publicKey: 'aPviREniYHskJ59p5',
        serviceId: 'service_a92cifs',
        templateId: 'template_bwl2eme',
    }
}

function useNewSettings(settings) {
    if (settings.customBackground.use) {
        settings.customBackground.base64 = lzstring.decompressFromUTF16(settings.customBackground.base64);
    }
    Config.settings = settings;
}

async function changeSettings(which, value) {
    Config.settings[which] = value;

    await firestore().collection('Userdata').doc(auth().currentUser.uid).update({
        settings: Config.settings
    })
}

async function setNewBackground(base64) {
    const string = 'data:image/png;base64,' + base64
    Config.settings.customBackground.base64 = lzstring.compressToUTF16(string);
    Config.settings.customBackground.use = true;

    await firestore().collection('Userdata').doc(auth().currentUser.uid).update({
        settings: Config.settings
    }) 
    
    Config.settings.customBackground.base64 = string;
}


async function checkShared() {
    //previeri waiting list
    const email = auth().currentUser.email;
    const snapshot = await firestore().collection('Shared').doc('waitingList').collection(email).get();
    const lists = snapshot.docs.map(doc => doc.id);

    if (lists[0] != undefined) {
        for (const groupId of lists) {

            await firestore().collection('Shared').doc(groupId).update({
                access: firestore.FieldValue.arrayUnion({ name: auth().currentUser.displayName, uid: auth().currentUser.uid, perms: 'Viewer' }),
                waiting: firestore.FieldValue.arrayRemove(email)
            }).catch(() => { console.log('fake waitinglist') })

            await firestore().collection('Userdata').doc(auth().currentUser.uid).update({
                shared: firestore.FieldValue.arrayUnion(groupId)
            })

            await firestore().collection('Shared').doc('waitingList').collection(email).doc(groupId).delete();
        }
    } else {
        console.log('No new groups to join!')
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

export { Config, storeData, getData, useNewSettings, changeSettings, setNewBackground, checkShared, pushHistory };