import React from "react";
import { Text, ScrollView, StyleSheet, View, TouchableOpacity } from "react-native";
import Frame from "../utils/Frame";
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
                privateHistory: await this.loadHistory(false),
                sharedHistory: '',
            });
        } else {
            this.setState({
                ...this.state,
                privateHistory: '',
                sharedHistory: await this.loadHistory(true),
            });
        }
    }

    loadHistory = async (shared) => {
        if (shared) {
            //shared history
            let res = [];
            const mainDoc = await firestore().collection('Userdata').doc(auth().currentUser.uid).get();
            const sharedGroups = mainDoc.data().shared;
            for (const id of sharedGroups) {
                const doc = await firestore().collection('Shared').doc(id).get();
                const history = doc.data().history;
                if (history != undefined) history.forEach((i) => res.push(i));
            }
            return res;
        } else {
            //private history
            const doc = await firestore().collection('Userdata').doc(auth().currentUser.uid).get();
            const data = doc.data();
            return data.history;
        }
    }

    showPrivate = async () => {
        this.setState({
            ...this.state,
            private: true,
            privateHistory: await this.loadHistory(false)
        })
    }

    showShared = async () => {
        this.setState({
            ...this.state,
            private: false,
            sharedHistory: await this.loadHistory(true)
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

        const date = new Date();
        //vsem objectom doda date
        let history2 = history.map((obj) => {
            date.setTime(obj.time);
            let newdate = date.getDate().toString() + '.' + (date.getMonth() + 1).toString();
            return { ...obj, date: newdate };
        })
        history2.sort((a, b) => {
            return b.time - a.time
        })
        let groupedByDate = {};
        const genForPush = (data) => {
            let obj = { action: data.action, path: data.path, who: data.who }
            data.all ? obj.all = data.all : null;
            data.by ? obj.by = data.by : null;
            return obj;
        }
        for (let i of history2) {
            if (groupedByDate[i.date] == undefined) groupedByDate[i.date] = [];
        }
        for (let i of history2) {
            groupedByDate[i.date].push(genForPush(i))
        }
        let jsx = Object.entries(groupedByDate).map((batch) => {
            //čas
            let jsx = [<Text style={{fontSize: 15, color: '#000000'}}>{batch[0]}</Text>];
            //ostalo
            batch[1].forEach(obj => {
                if (obj.action.name == 'Toggle') {
                    jsx.push(<Text>Toggle: ({obj.path}) {obj.who} {'=>'} {obj.action.value ? 'on' : 'off'} {obj.by ? obj.by : null}</Text>)
                } else if (obj.action.name == 'Delete') {
                    jsx.push(<Text>Delete: ({obj.path}) {obj.who} {obj.all ? obj.all : null} {obj.by ? obj.by : null}</Text>)
                } else if (obj.action.name == 'Add') {
                    jsx.push(<Text>Add: ({obj.path}) {obj.who} {obj.all ? obj.all : null} {obj.by ? obj.by : null}</Text>)
                }
            })
            return (jsx.map(((obj, i) => {
                return (
                    <View style={Style.container} key={i}>
                        {obj}
                    </View>
                )
            })))
        });

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