import React from "react";
import Frame from "../utils/Frame";
import { Text, View, ScrollView, StyleSheet, TouchableOpacity } from "react-native";
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import AddButton from '../utils/AddButton'
import InputPopup from '../utils/InputPopup'
import Alert from "../utils/Alert";
import { Config } from "../config";

export default class Payments extends React.Component {
    constructor(props) {
        super(props);

        this.inputRef = React.createRef();
        this.alertRef = React.createRef();

        this.state = {
            jsx: <Text>No payments yet!</Text>
        }
    }

    componentDidMount() {
        this.refresh();
    }

    refresh = async () => {
        const doc = await firestore().collection('Userdata').doc(auth().currentUser.uid).get();
        const data = doc.data().payments;
        if (data == undefined) return;
        const jsx = data.map((batch, i) => {
            const date = new Date();
            date.setTime(batch.time);
            return (
                <TouchableOpacity style={Style.tile} key={i} onLongPress={() => { this.deletePayment(batch) }}>
                    <Text>{batch.list.toUpperCase()}</Text>
                    <Text>For: {batch.approved}</Text>
                    <Text>{date.getDate()}.{date.getMonth()+1}.{date.getFullYear()}, {date.getHours()}:{date.getMinutes()}</Text>
                </TouchableOpacity>
            )
        })
        this.setState({ jsx: jsx })
    }

    add = async () => {
        //vpraša za kodo
        const asyncInput = () => new Promise((resolve) => {
            this.inputRef.current.show('Enter the code:', 'xxxxxxxx', (text) => {
                resolve(text)
            })
        })
        const code = await asyncInput();
        if (code.length < 5) { this.doesntExist(); return; }

        //poišče kodo
        const doc = await firestore().collection('Payments').doc(code).get();
        if (!doc.exists) { this.doesntExist(); return; }

        const data = doc.data();
        if (data.for != auth().currentUser.email) { this.doesntExist(); return; }

        //doda v user doc
        await firestore().collection('Userdata').doc(auth().currentUser.uid).update({
            payments: firestore.FieldValue.arrayUnion({
                approved: data.data.approved,
                list: data.data.list,
                time: data.data.time,
            })
        })

        //remova iz payments collectiona
        await firestore().collection('Payments').doc(code).delete();

        this.refresh();
    }

    doesntExist = () => {
        this.alertRef.current.showAlert(':(', `The code you provided does not exist.`, 'NO', 'OK',
            () => { null }, () => { this.alertRef.current.hideAlert(); }, false)
    }

    deletePayment = async (payment) => {

        if (Config.settings.confirmDelete) {
            const asyncAlert = () => new Promise((resolve) => {
                this.alertRef.current.showAlert('Wait!', `Do you want to remove this payment? (it is not recoverable)`, 'NO', 'YES',
                    () => { this.alertRef.current.hideAlert(); resolve(false) }, () => { this.alertRef.current.hideAlert(); resolve(true) }, true)
            })
            if (!await asyncAlert()) return;
        }

        //remova
        await firestore().collection('Userdata').doc(auth().currentUser.uid).update({
            payments: firestore.FieldValue.arrayRemove({
                approved: payment.approved,
                list: payment.list,
                time: payment.time,
            })
        })

        this.refresh();
    }

    render() {
        return (
            <Frame navigation={this.props.navigation} hideToolbarOnKeyboard={true}>
                <ScrollView contentContainerStyle={{
                    flexDirection: 'row',
                    justifyContent: 'center',
                    flexWrap: 'wrap',
                }}>
                    {this.state.jsx}
                </ScrollView>

                <AddButton handler={() => { this.add() }} />
                <InputPopup ref={this.inputRef} />
                <Alert ref={this.alertRef} />
            </Frame>
        )
    }
}

const Style = StyleSheet.create({
    tile: {
        width: 130,
        height: 130,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#D9D9D93F',
        borderRadius: 30,
        marginHorizontal: 15,
        marginVertical: 15
    }
})