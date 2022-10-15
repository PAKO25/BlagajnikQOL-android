import React from "react";
import { Text, ScrollView, StyleSheet, View, TouchableOpacity } from "react-native";
import Frame from "../utils/Frame";
import { loadHistory } from "../config";
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';

class History extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            jsx: <Text>Fetching data...</Text>,
            private: true,
            privateHistory: [],
            sharedHistory: [],
        }
    }

    componentDidMount() {
        //listener za rerender, da se updata history list
        this.props.navigation.addListener('focus', this.refresh)
    }

    refresh = async () => {
        if (this.state.private) {
            this.setState({
                ...this.state,
                privateHistory: await loadHistory(false),
                sharedHistory: '',
            });
        } else {
            this.setState({
                ...this.state,
                privateHistory: '',
                sharedHistory: await loadHistory(true),
            });
        }
    }

    showPrivate = async () => {
        this.setState({
            ...this.state,
            private: true,
            privateHistory: await loadHistory(false)
        })
    }

    showShared = async () => {
        this.setState({
            ...this.state,
            private: false,
            sharedHistory: await loadHistory(true)
        })
    }

    clearHistory = async () => {
        if (this.state.private) {
            await firestore().collection('Userdata').doc(auth().currentUser.uid).update({
                history: []
            })
        } else {
            //dobi vse shared groupe
            const mainDoc = await firestore().collection('Userdata').doc(auth().currentUser.uid).get();
            const data = mainDoc.data().shared;

            //loopa skozi njih
            for (const group of data) {
                //dobi doc
                const doc = await firestore().collection('Shared').doc(group).get();
                const docData = doc.data();

                if (docData.owner == auth().currentUser.uid) {
                    await firestore().collection('Shared').doc(group).update({
                        history: [],
                    })
                } else {
                    console.log('You are not the owner!');
                }
            }
        }
        this.refresh();
    }

    render() {
        let history;
        this.state.private ? history = this.state.privateHistory : history = this.state.sharedHistory
        let sorted = history.sort((a, b) => {
            return b.time - a.time
        })
        let jsx = sorted.map((obj, i) => {
            let jsx;
            if (obj.action.name == 'Toggle') {
                jsx = <Text>Toggle: ({obj.path}) {obj.who} {'=>'} {obj.action.value ? 'on' : 'off'} {obj.by ? obj.by : null}</Text>
            } else if (obj.action.name == 'Delete') {
                jsx = <Text>Delete: ({obj.path}) {obj.who} {obj.all ? obj.all : null} {obj.by ? obj.by : null}</Text>
            } else if (obj.action.name == 'Add') {
                jsx = <Text>Add: ({obj.path}) {obj.who} {obj.all ? obj.all : null} {obj.by ? obj.by : null}</Text>
            }
            return (
                <View style={Style.container} key={i}>

                    {jsx}

                </View>
            )
        })

        return (
            <Frame navigation={this.props.navigation} hideToolbarOnKeyboard={false}>
                <View style={Style.switchField}>
                    <TouchableOpacity style={[Style.button, {
                        backgroundColor: this.state.private ? '#00FF007F' : '#FF00007F'
                    }]} onPress={this.showPrivate}>
                        <Text style={Style.btnText}>Private</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[Style.button, {
                        backgroundColor: !this.state.private ? '#00FF007F' : '#FF00007F'
                    }]} onPress={this.showShared}>
                        <Text style={Style.btnText}>Shared</Text>
                    </TouchableOpacity>
                </View>

                <ScrollView style={Style.scroll}>
                    {jsx}
                </ScrollView>

                <TouchableOpacity style={[Style.button, { marginBottom: 20 }]} onPress={this.clearHistory}>
                    <Text style={Style.btnText}>Clear</Text>
                </TouchableOpacity>
            </Frame>
        )
    }
}

const Style = StyleSheet.create({
    scroll: {
        flex: 1,
        marginBottom: 50,
        marginTop: 20,
        width: 300,
        flexDirection: 'row',
        flexWrap: 'wrap',
    },
    container: {
        width: 300,
        height: 40,
        backgroundColor: '#FFFFFF2b',
        borderRadius: 40,
        justifyContent: 'center',
        alignItems: 'center',
        marginVertical: 5,
        flexDirection: 'row',
    },
    switchField: {
        flexDirection: 'row',
        justifyContent: 'space-evenly',
        marginTop: 20
    },
    button: {
        width: 100,
        height: 30,
        backgroundColor: '#FFFFFF2b',
        justifyContent: 'center',
        alignItems: 'center',
        marginHorizontal: 20,
        borderRadius: 40
    },
    btnText: {
        fontSize: 15
    }
})


export default History;