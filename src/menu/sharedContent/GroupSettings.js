import React from "react";
import { Text, StyleSheet, BackHandler, View, TouchableOpacity, TextInput, ScrollView, Keyboard } from "react-native";
import { Config, storeData } from '../../config';
import AddButton from "../../utils/AddButton";
import AccessList from "./AccessField";
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import Alert from "../../utils/Alert";
import Frame from "../../utils/Frame";


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

        storeData(['groupSettingsId',id]);

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

    removeAccess = async (waiting, name, uid, perms) => {
        if (!this.state.owner) return;
        if (!waiting) {
            await firestore().collection('Shared').doc(this.state.id).update({
                access: firestore.FieldValue.arrayRemove({ name: name, uid: uid, perms: perms })
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

        //add to waitinglist
        await firestore().collection('Shared').doc('waitingList').collection(email).doc(this.state.id).set({ 0: 0 });

        //add to access
        await firestore().collection('Shared').doc(this.state.id).update({
            waiting: firestore.FieldValue.arrayUnion(email)
        });

        Keyboard.dismiss();

        this.alertRef.current.showAlert('Success!', `Added ${this.state.access} to the waiting list. Tell them to login to gain access.`, 'NO', 'OK',
            () => { null }, () => { this.alertRef.current.hideAlert(); this.update() }, false)
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
                                return <AccessList name={obj.name} uid={obj.uid} perms={obj.perms} key={i} click={this.removeAccess} waiting={false} />
                            })}
                        </ScrollView>

                    </View>
                ) : (
                    <View style={Style.noperms}>
                        <Text style={Style.title}>You don't have the permission to manage this group's settings!</Text>
                    </View>
                )}


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
    }
})

export default GroupSettings;