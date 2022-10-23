import React from "react";
import { Text, StyleSheet, BackHandler, View, TouchableOpacity, TextInput, ScrollView, Keyboard, Image } from "react-native";
import { Config, storeData } from '../../config';
import AddButton from "../../utils/AddButton";
import AccessList from "./AccessField";
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import Alert from "../../utils/Alert";
import Frame from "../../utils/Frame";
import { resolvePlugin } from "@babel/core";


class GroupSettings extends React.Component {

    constructor(props) {
        super(props);

        this.alertRef = React.createRef();

        this.state = {
            access: '',
            accessList: ['uid1', 'uid2'],
            owner: true,
            id: '',
            keyboardShown: false,
        }
    }

    componentDidMount() {
        this.props.navigation.addListener('focus', async () => {
            this.keyboardDidShowSubscription = Keyboard.addListener(
                'keyboardDidShow', () => { this.setState({ keyboardShown: true }) }
            );
            this.keyboardDidHideSubscription = Keyboard.addListener(
                'keyboardDidHide', () => { this.setState({ keyboardShown: false }) }
            );
            BackHandler.addEventListener('hardwareBackPress', this.handleBack);

            this.update();
        })
        this.props.navigation.addListener('blur', () => {
            this.keyboardDidShowSubscription.remove();
            this.keyboardDidHideSubscription.remove();
            BackHandler.removeEventListener('hardwareBackPress', this.handleBack);
        })
    }

    handleBack = () => {
        if (this.props.route.params.fromHome) {
            this.props.navigation.goBack();
        } else {
            this.props.navigation.navigate('Share');
        }
        return true;
    }

    update = async () => {
        const id = this.props.route.params.id;

        storeData(['groupSettingsId', id]);

        const doc = await firestore().collection('Shared').doc(id).get();
        const data = doc.data();

        let owner = false
        if (data.owner == auth().currentUser.uid) owner = true;

        let accessList = [];

        for (let i of data.access) {
            accessList.push({ ...i, waiting: false });
        }
        for (i of data.waiting) {
            accessList.push({ email: i, waiting: true });
        }
        this.setState({
            ...this.state,
            owner: owner,
            accessList: accessList,
            id: id
        })
    }

    removeAccess = async (waiting, name, uid, perms, email) => {
        if (!this.state.owner) return;
        if (!waiting) {
            await firestore().collection('Shared').doc(this.state.id).update({
                access: firestore.FieldValue.arrayRemove({ name: name, uid: uid, perms: perms, email: email })
            })
        } else {
            await firestore().collection('Shared').doc(this.state.id).update({
                waiting: firestore.FieldValue.arrayRemove(name)
            })
        }
        this.update();
    }

    addAccess = async () => {
        if (!this.state.owner) return;

        const email = this.state.access;

        if (email == auth().currentUser.email) {
            this.alertRef.current.showAlert('You ok?', `You can't add yorself`, 'NO', 'Sorry my bad',
                () => { this.alertRef.current.hideAlert(); }, () => { this.alertRef.current.hideAlert(); }, false)
            return;
        }

        //preveri če že čaka
        const doc = await firestore().collection('Shared').doc(this.state.id).get();
        const data = doc.data();
        let alreadyWaiting = false;
        for (let i of data.waiting) {
            if (i == email) alreadyWaiting = true;
        }
        if (alreadyWaiting) {
            this.alertRef.current.showAlert('You ok?', `This person is already waiting to join the group!`, 'NO', 'Sorry my bad',
                () => { this.alertRef.current.hideAlert(); }, () => { this.alertRef.current.hideAlert(); }, false)
            return;
        }

        //preveri če je že not
        alreadyWaiting = false;
        for (let i of data.access) {
            if (i.email == email) alreadyWaiting = true;
        }
        if (alreadyWaiting) {
            this.alertRef.current.showAlert('You ok?', `This person is already in the group!`, 'NO', 'Sorry my bad',
                () => { this.alertRef.current.hideAlert(); }, () => { this.alertRef.current.hideAlert(); }, false)
            return;
        }

        //add to waitinglist
        await firestore().collection('Shared').doc('waitingList').collection(email).doc(this.state.id).set({
            time: firestore.FieldValue.serverTimestamp()
        });

        //add to access
        await firestore().collection('Shared').doc(this.state.id).update({
            waiting: firestore.FieldValue.arrayUnion(email)
        });

        Keyboard.dismiss();

        const asyncAlert = () => new Promise((resolve) => {
            this.alertRef.current.showAlert('Success!', `Added ${this.state.access} to the waiting list. Tell them to login to gain access.`, 'NO', 'OK',
                () => { null }, async () => { await this.alertRef.current.hideAlert(); resolve() }, false)
        })

        await asyncAlert();

        this.update()
    }

    convertToPrivate = async () => {
        const asyncAlert = () => new Promise((resolve) => {
            this.alertRef.current.showAlert('Wait!', `Are you sure you want to make a private copy of this group?`, 'NO', 'YES',
                () => { this.alertRef.current.hideAlert(); resolve(false) }, () => { this.alertRef.current.hideAlert(); resolve(true) }, true)
        })

        if (!await asyncAlert()) return;

        const doc = await firestore().collection('Shared').doc(this.state.id).get();
        const docData = doc.data();

        const groupName = docData.groupName;

        const maindoc = await firestore().collection('Shared').doc(this.state.id).collection('group').doc('main').get();
        const maindata = maindoc.data();
        const emails = maindata.emails;
        const liste = maindata.liste;
        const ljudje = maindata.ljudje;

        //ustvari main
        await firestore().collection('Userdata').doc(auth().currentUser.uid).collection(groupName).doc('main').set({
            emails: emails,
            liste: liste,
            ljudje: ljudje
        })

        //loopa skozi liste
        for (const list of liste) {
            //dobi podatke
            const listDoc = await firestore().collection('Shared').doc(this.state.id).collection('group').doc(list).get();
            const listData = listDoc.data();

            //ustvari novo listo v private
            await firestore().collection('Userdata').doc(auth().currentUser.uid).collection(groupName).doc(list).set(listData);
        }

        //doda v skupine
        await firestore().collection('Userdata').doc(auth().currentUser.uid).update({
            skupine: firestore.FieldValue.arrayUnion(groupName)
          })
    }

    render() {
        return (
            <Frame navigation={this.props.navigation} hideToolbarOnKeyboard={true}>

                {this.state.owner ? (
                    <View style={Style.container}>

                        <Text style={Style.title}>
                            {this.props.route.params.name.charAt(0).toUpperCase() + this.props.route.params.name.slice(1)}
                        </Text>

                        <View style={Style.inline}>
                            <TextInput
                                style={Style.input}
                                placeholderTextColor='#000000'
                                onChangeText={(text) => { this.setState({ ...this.state, access: text }); }}
                                value={this.state.access}
                                placeholder="Person's e-mail" />
                            <TouchableOpacity style={Style.button} onPress={this.addAccess}>
                                <Text style={{ color: '#000000' }}>Add</Text>
                            </TouchableOpacity>
                        </View>



                        <ScrollView contentContainerStyle={Style.accessList}>
                            {this.state.accessList.map((obj, i) => {
                                if (obj.waiting) {
                                    return <AccessList email={obj.email} key={i} click={this.removeAccess} waiting={true} />
                                }
                                if (obj.uid == auth().currentUser.uid) return null;
                                return <AccessList name={obj.name} uid={obj.uid} perms={obj.perms} email={obj.email} key={i} click={this.removeAccess} waiting={false} />
                            })}
                        </ScrollView>

                    </View>
                ) : (
                    <View style={Style.noperms}>
                        <Text style={Style.title}>You don't have the permission to manage this group's settings!</Text>
                    </View>
                )}


                <TouchableOpacity style={Style.convertField} onPress={this.convertToPrivate}>
                    <Image source={require('../../../assets/homeicon.png')} style={Style.convertIcon}></Image>
                </TouchableOpacity>


                <AddButton sign={'<---'} handler={this.handleBack} />
                <Alert ref={this.alertRef} />
            </Frame>
        )
    }
}

const Style = StyleSheet.create({
    background: {
        flex: 1,
        alignItems: 'center'
    },
    title: {
        fontSize: 30,
        color: '#000000',
        marginTop: 30,
        textAlign: 'center'
    },
    container: {
        flex: 1,
        backgroundColor: '#FFFFFF2B',
        marginTop: 30,
        marginBottom: 120,
        width: 300,
        borderRadius: 30,
        alignItems: 'center'
    },
    input: {
        backgroundColor: '#FFFFFF2B',
        width: 170,
        right: 20,
        borderRadius: 30
    },
    button: {
        padding: 15,
        backgroundColor: '#FFFFFF2B',
        borderRadius: 50,
    },
    inline: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 30
    },
    accessList: {
        width: 200,
        borderColor: '#000000',
        borderWidth: 1,
        marginVertical: 20,
        borderRadius: 30,
        flex: 1,
        alignItems: 'center',
        paddingTop: 10,
    },
    noperms: {
        justifyContent: 'center',
        flex: 1,
        marginBottom: 120,
    },
    convertField: {
        position: 'absolute',
        top: 185,
        right: 70,
        backgroundColor: '#00000050',
        borderRadius: 40,
        width: 30,
        height: 30,
        alignItems: 'center',
        justifyContent: 'center'
    },
    convertIcon: {
        width: 20,
        height: 20
    }
})

export default GroupSettings;