import React from "react";
import { Text, StyleSheet, View, TextInput, Keyboard, BackHandler, Switch } from "react-native";
import { getData, Config, storeData, pushHistory } from '../config';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import Alert from "../utils/Alert";
import Frame from "../utils/Frame";
import AddButton from '../utils/AddButton'
import uuid from 'react-native-uuid';

class AddScreen extends React.Component {

    constructor(props) {
        super(props);

        this.alertRef = React.createRef();

        this.state = {
            name: '',
            lists: '',
            people: '',
            shared: false
        }
    }

    componentDidMount() {
        this.props.navigation.addListener('focus', () => {
            this.setState({
                ...this.state,
                shared: this.props.route.params.shared
            });
        })
        BackHandler.addEventListener('hardwareBackPress', this.handleBack);
    }
    componentWillUnmount() {
        BackHandler.removeEventListener('hardwareBackPress', this.handleBack);
    }

    handleBack = () => {
        if (this.props.route.params.shared) {
            //go back to shared
            this.props.navigation.navigate('Share');
        } else {
            //go back to home
            this.props.navigation.navigate('Home');
        }
        return true;
    }

    clear = (goBack) => {
        Keyboard.dismiss();
        this.setState({
            ...this.state,
            name: '',
            lists: '',
            people: ''
        })
        if (goBack) this.handleBack();
    }

    add = async () => {

        if (this.state.shared && this.props.route.params.name != 'groups') {
            //preveri če ma dovoljenje
            const perms = getData('sharedGroupShownPerms');
            if (perms != 'Admin') {
                this.alertRef.current.showAlert('Oops!', `You dont have the required permissions! Talk to the group owner.`, 'NO', 'OK',
                    () => { null }, () => { this.alertRef.current.hideAlert(); }, false);
                return;
            }
        }

        if (this.state.name == '') {
            //name is undefined
            this.alertRef.current.showAlert('U ok?', `Fill out the form first!`, 'NO', 'OK',
                () => { this.alertRef.current.hideAlert(); }, () => { this.alertRef.current.hideAlert(); }, false);
            return;
        }

        switch (this.props.route.params.name) {
            case 'groups':
                //add group

                if (this.state.lists == '' || this.state.people == '') {
                    //alerta da se nisi izpolno forma
                    this.alertRef.current.showAlert('U ok?', `Fill out the form first!`, 'NO', 'OK',
                        () => { this.alertRef.current.hideAlert(); }, () => { this.alertRef.current.hideAlert(); }, false);
                    return;
                }

                //dobi in oblikuje vse podatke
                const groupName = this.state.name.trim();
                const groupPeople = this.state.people.split(',').map((v) => { return v.trim() });
                const groupLists = this.state.lists.split(',').map((v) => { return v.trim() });

                //check if the group already exists
                //if je za shared else je če ni shared
                let exists = false;
                let groups;
                if (this.state.shared) {
                    const userDocument = await firestore().collection('Userdata').doc(auth().currentUser.uid).get();
                    const groupsById = userDocument.data().shared;
                    let groupsByName = [];
                    for (const group of groupsById) {
                        //converta id v name, kasneje dodaj da se autoremova ce si removan iz groupa
                        const groupDoc = await firestore().collection('Shared').doc(group).get();
                        groupsByName.push(groupDoc.data().groupName);
                    }
                    storeData(['sharedGroups', groupsByName]);
                }
                this.state.shared ? groups = getData('sharedGroups') : groups = getData('groups');
                console.log('existing groups:', groups)
                groups.forEach(group => { if (group == groupName) exists = true; })
                if (exists) {
                    //alert za group exists
                    this.alertRef.current.showAlert('U ok?', `This group already exists!`, 'NO', 'OK',
                        () => { this.alertRef.current.hideAlert(); }, () => { this.alertRef.current.hideAlert(); }, false);
                    return;
                }

                //doda v main doc
                let obj = {};
                const randomId = uuid.v4();
                if (this.state.shared) {
                    obj.shared = firestore.FieldValue.arrayUnion(randomId); //shared
                } else {
                    obj.skupine = firestore.FieldValue.arrayUnion(groupName); //normalno
                }
                await firestore().collection('Userdata').doc(auth().currentUser.uid).update(obj)

                //ustvari main doc in novi subcollection za group
                if (this.state.shared) {
                    //shared skupina: najprej file za skupino (owner + members + name), pol pa se main doc v subcollectionu
                    await firestore().collection('Shared').doc(randomId).set({
                        access: [{ name: auth().currentUser.displayName, uid: auth().currentUser.uid, perms: 'Admin' }],
                        owner: auth().currentUser.uid,
                        groupName: groupName,
                        waiting: []
                    })
                    await firestore().collection('Shared').doc(randomId).collection('group').doc('main').set({
                        liste: groupLists,
                        ljudje: groupPeople,
                        emails: []
                    })

                } else {
                    //normalna skupina
                    await firestore().collection('Userdata').doc(auth().currentUser.uid).collection(groupName).doc('main').set({
                        liste: groupLists,
                        ljudje: groupPeople,
                        emails: []
                    })
                }

                //ustvari nove liste v groupi
                for (const list of groupLists) {
                    console.log(list)
                    let obj = {};
                    groupPeople.forEach(human => {
                        obj[human] = false;
                    })
                    if (this.state.shared) {
                        await firestore().collection('Shared').doc(randomId).collection('group').doc(list).set(obj);
                    } else {
                        await firestore().collection('Userdata').doc(auth().currentUser.uid).collection(groupName).doc(list).set(obj);
                    }
                }

                if (this.state.shared) {
                    pushHistory({ name: 'Add' }, `group`, groupName, false, true, randomId, auth().currentUser.displayName);
                } else {
                    pushHistory({ name: 'Add' }, `group`, groupName)
                }

                //idi nazaj
                this.clear(true);
                break;

            case 'lists':
                //add list

                //dobi in oblikuje vse podatke
                const listName = this.state.name.trim();

                //preveri če že obstaja
                let exists2 = false;
                let lists;
                this.state.shared ? lists = getData('sharedLists') : lists = getData('lists');
                lists.forEach(list => { if (list == listName) exists2 = true })
                if (exists2) {
                    //list already exists
                    this.alertRef.current.showAlert('U ok?', `This list already exists!`, 'NO', 'OK',
                        () => { this.alertRef.current.hideAlert(); }, () => { this.alertRef.current.hideAlert(); }, false);
                    return;
                }

                //doda na main doc v groupu
                if (this.state.shared) {
                    await firestore().collection('Shared').doc(getData('sharedGroupShown'))
                        .collection('group').doc('main').update({
                            liste: firestore.FieldValue.arrayUnion(listName)
                        })
                } else {
                    await firestore().collection('Userdata').doc(auth().currentUser.uid)
                        .collection(getData('groupShown')).doc('main').update({
                            liste: firestore.FieldValue.arrayUnion(listName)
                        })
                }

                //dobi vse ljudi iz main doca
                let data;
                if (this.state.shared) {
                    data = await firestore().collection('Shared').doc(getData('sharedGroupShown'))
                        .collection('group').doc('main').get();
                } else {
                    data = await firestore().collection('Userdata').doc(auth().currentUser.uid)
                        .collection(getData('groupShown')).doc('main').get();
                }
                const humans = data.data().ljudje;

                //naredi novo listo
                let obj2 = {};
                humans.forEach(human => {
                    obj2[human] = false;
                })
                if (this.state.shared) {
                    await firestore().collection('Shared').doc(getData('sharedGroupShown'))
                        .collection('group').doc(listName).set(obj2);
                } else {
                    await firestore().collection('Userdata').doc(auth().currentUser.uid)
                        .collection(getData('groupShown')).doc(listName).set(obj2);
                }

                if (this.state.shared) {
                    pushHistory({ name: 'Add' }, `${getData('sharedGroupShownName')}/list`, listName, false, true, getData('sharedGroupShown'), auth().currentUser.displayName)
                } else {
                    pushHistory({ name: 'Add' }, `${getData('groupShown')}/list`, listName)
                }

                //idi nazaj
                this.clear(true);
                break;

            case 'humans':
                //add human

                //dobi in oblikuje vse podatke
                const humanName = this.state.name.trim();

                //preveri če že obstaja
                let exists3 = false;
                let human;
                this.state.shared ? human = getData('sharedHumans') : human = getData('humans');
                human.forEach(human => { if (human[0] == humanName) exists3 = true })
                if (exists3) {
                    //human already exists
                    this.alertRef.current.showAlert('U ok?', `This person already exists!`, 'NO', 'OK',
                        () => { this.alertRef.current.hideAlert(); }, () => { this.alertRef.current.hideAlert(); }, false);
                    return;
                }

                //oblikuje v object
                let obj3 = {};
                obj3[humanName] = false;

                //vpraša če želimo dodati tega človeka v vse liste ali samo trenutno

                const asyncAlert = () => new Promise((resolve) => {
                    this.alertRef.current.showAlert('Wait!', `Do you want to add this person to all lists or just the current 
                    (${this.state.shared ? getData('sharedListShown') : getData('listShown')}) one?`,
                        'Just the current one', 'All lists',
                        async () => {
                            this.alertRef.current.hideAlert();
                            //samo v trenutno
                            if (this.state.shared) {
                                await firestore().collection('Shared').doc(getData('sharedGroupShown'))
                                    .collection('group').doc(getData('sharedListShown')).update(obj3);
                                pushHistory({ name: 'Add' }, `${getData('sharedGroupShownName')}/${getData('sharedListShown')}/human`, humanName, false, true, getData('sharedGroupShown'), auth().currentUser.displayName)
                            } else {
                                await firestore().collection('Userdata').doc(auth().currentUser.uid)
                                    .collection(getData('groupShown')).doc(getData('listShown')).update(obj3);
                                pushHistory({ name: 'Add' }, `${getData('groupShown')}/${getData('listShown')}/human`, humanName)
                            }
                            resolve();
                        },
                        async () => {
                            this.alertRef.current.hideAlert();
                            //v vse
                            if (this.state.shared) {
                                //najprej doda v main
                                await firestore().collection('Shared').doc(getData('sharedGroupShown'))
                                    .collection('group').doc('main').update({
                                        ljudje: firestore.FieldValue.arrayUnion(humanName)
                                    })
                                //nato še v vsako listo posebej
                                getData('sharedLists').forEach(async (list) => {
                                    await firestore().collection('Shared').doc(getData('sharedGroupShown'))
                                        .collection('group').doc(list).update(obj3);
                                })
                                pushHistory({ name: 'Add' }, `${getData('sharedGroupShownName')}/${getData('sharedListShown')}/human`, humanName, true, true, getData('sharedGroupShown'), auth().currentUser.displayName)
                            } else {
                                //najprej doda v main
                                await firestore().collection('Userdata').doc(auth().currentUser.uid)
                                    .collection(getData('groupShown')).doc('main').update({
                                        ljudje: firestore.FieldValue.arrayUnion(humanName)
                                    })
                                //nato še v vsako listo posebej
                                getData('lists').forEach(async (list) => {
                                    await firestore().collection('Userdata').doc(auth().currentUser.uid)
                                        .collection(getData('groupShown')).doc(list).update(obj3);
                                })
                                pushHistory({ name: 'Add' }, `${getData('groupShown')}/${getData('listShown')}/human`, humanName, true)
                            }
                            all = true;
                            resolve();
                        },
                        true); return;
                });
                await asyncAlert();

                //ne idi nazaj, mogoce jih hoce dodat vec
                this.clear(false);
                break;
        }
    }

    toggleShared = (value) => {
        this.setState({
            ...this.state,
            shared: value
        })
    }

    render() {
        return (
            <Frame navigation={this.props.navigation} hideToolbarOnKeyboard={true}>

                <View style={[Style.fade, Style.form]}>
                    {/* form */}
                    <Text style={Style.formTitle}>Add a {
                        this.props.route.params.name.charAt(0).toUpperCase() + this.props.route.params.name.slice(1, -1)
                    }</Text>

                    <TextInput
                        style={[Style.fade, Style.input]}
                        placeholderTextColor='#000000'
                        onChangeText={(text) => { this.setState({ ...this.state, name: text }); }}
                        value={this.state.name}
                        placeholder={this.props.route.params.name.charAt(0).toUpperCase() +
                            this.props.route.params.name.slice(1, -1) + ' name'} />

                    {/* only for groups */}
                    {this.props.route.params.name == 'groups' ? (
                        <>
                            <TextInput
                                style={[Style.fade, Style.input]}
                                placeholderTextColor='#000000'
                                onChangeText={(text) => { this.setState({ ...this.state, people: text }); }}
                                value={this.state.people}
                                placeholder='People in the group' />
                            <TextInput
                                style={[Style.fade, Style.input]}
                                placeholderTextColor='#000000'
                                onChangeText={(text) => { this.setState({ ...this.state, lists: text }); }}
                                value={this.state.lists}
                                placeholder='Lists in the group' />


                            {/* shared toggle samo za groupe, ker liste pa ludi neves kam dodat */}
                            <View style={Style.label}>
                                <Text style={Style.toggleText}>Shared</Text>
                                <Switch
                                    onValueChange={(value => { this.toggleShared(value) })}
                                    value={this.state.shared}
                                    style={Style.radio}
                                    trackColor={{ false: Config.settings.mainColor, true: '#000000' }}
                                    thumbColor={this.state.shared ? Config.settings.mainColor : '#000000'}
                                />
                            </View>
                        </>
                    ) : (null)}

                    {this.props.route.params.shared ? (
                        <>
                            {this.props.route.params.name == 'lists' ? (
                                <><Text style={Style.bottomMessageText}>This is a shared list.</Text></>
                            ) : (null)}
                            {this.props.route.params.name == 'humans' ? (
                                <><Text style={Style.bottomMessageText}>This is a shared human.</Text></>
                            ) : (null)}
                        </>
                    ) : (null)}

                </View>


                <AddButton handler={() => { this.add() }} />
                <Alert ref={this.alertRef} />
            </Frame>
        )
    }
}

const Style = StyleSheet.create({
    fade: {
        backgroundColor: '#FFFFFF2B',
        borderRadius: 30
    },
    form: {
        flex: 1,
        marginTop: 30,
        marginBottom: 130,
        alignItems: 'center',
        width: 300
    },
    formTitle: {
        color: '#000000',
        fontSize: 25,
        marginVertical: 30
    },
    input: {
        width: 200,
        height: 50,
        textAlign: 'center',
        fontSize: 15,
        marginVertical: 10
    },
    radio: {
        transform: [{ scaleX: 1.5 }, { scaleY: 1.5 }]
    },
    toggleText: {
        fontSize: 15,
        color: '#000000'
    },
    label: {
        flexDirection: 'row',
        justifyContent: "space-evenly",
        marginVertical: 10,
        width: 250,
        height: 50,
        alignItems: 'center',
        position: 'absolute',
        bottom: 0
    },
    bottomMessageText: {
        position: 'absolute',
        bottom: 10
    }
})

export default AddScreen;