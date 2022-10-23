import React from 'react';
import { ScrollView, Text } from 'react-native';
import Human from '../../content/Human';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import { getData, storeData, Config, pushHistory } from '../../config';
import Alert from '../../utils/Alert';

class SharedHumans extends React.Component {

    constructor(props) {
        super(props);

        this.alertRef = React.createRef();

        this.state = {
            jsx: <Text>Fetching data...</Text>,
        }
    }

    async componentDidMount() {
        console.log('showSHAREDhumans')

        const main = await firestore().collection('Shared').doc(getData('sharedGroupShown'))
            .collection('group').doc(getData('sharedListShown')).get();

        const data = main.data();

        console.log(data)

        let humans = Object.keys(data)
        Object.values(data).forEach((value, i) => {
            humans[i] = [humans[i], value]
        })

        humans.sort();

        storeData(['sharedHumans', humans]);

        let jsx = humans.map((human, i) => {
            return <Human name={human[0]} checked={human[1]} key={i} delHuman={this.delHuman} shared={true} />
        })

        this.setState({
            jsx: jsx
        })
    }


    delHuman = async (name) => {

        //preveri če ma dovoljenje
        const perms = getData('sharedGroupShownPerms');
        if (perms != 'Admin') {
            this.alertRef.current.showAlert('Oops!', `You dont have the required permissions! Talk to the group owner.`, 'NO', 'OK',
                () => { null }, () => { this.alertRef.current.hideAlert(); }, false);
            return;
        }

        //preveri če je ziher
        let sure = false;
        const asyncAlert = () => new Promise((resolve) => {
            this.alertRef.current.showAlert('Wait!', `Are you sure you want to remove ${name}?`, 'NO', 'YES',
                () => { this.alertRef.current.hideAlert(); resolve() }, () => { sure = true; resolve() }, true)
        });
        if (Config.settings.confirmDelete) {
            await asyncAlert();
        } else {
            sure = true;
        }
        if (!sure) return;

        //remova iz vseh al samo totega
        let all = false;
        const asyncAlert2 = () => new Promise((resolve) => {
            this.alertRef.current.showAlert('Wait!', `Do you want to remove him from just this list or all the lists?`, 'Just this one', 'All of them',
                () => { this.alertRef.current.hideAlert(); resolve() }, () => { this.alertRef.current.hideAlert(); all = true; resolve() }, true)
        });
        await asyncAlert2();

        if (all) {
            //remova iz vseh + iz maina (če ni v filih upam da ne crashne aplikacije xd)
            //deleta iz maina
            let obj = { ljudje: firestore.FieldValue.arrayRemove(name) };
            await firestore().collection('Shared').doc(getData('sharedGroupShown')).collection('group').doc('main').update(obj);

            //deleta iz vseh ostalih
            let obj2 = {};
            obj2[name] = firestore.FieldValue.delete();

            for (const list of getData('sharedLists')) {
                await firestore().collection('Shared').doc(getData('sharedGroupShown')).collection('group').doc(list).update(obj2);
            }

        } else {
            //remova samo iz current lista
            let obj = {};
            obj[name] = firestore.FieldValue.delete();
            await firestore().collection('Shared').doc(getData('sharedGroupShown'))
                .collection('group').doc(getData('sharedListShown')).update(obj);
        }

        pushHistory({ name: 'Delete' }, `${getData('sharedGroupShownName')}/${getData('sharedListShown')}`, name, all, true, getData('sharedGroupShown'), auth().currentUser.displayName)

        //rerendera
        this.componentDidMount();
    }


    render() {
        return (
            <>
                <ScrollView contentContainerStyle={{
                    flexDirection: 'row',
                    width: 330,
                    flexWrap: 'wrap',
                }}>

                    {this.state.jsx}

                </ScrollView>
                <Alert ref={this.alertRef} />
            </>
        )
    }
}



export default SharedHumans;