import React from "react";
import { TouchableOpacity } from "react-native";
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import { Config } from "../config";
import Alert from "../utils/Alert";

export default class HistoryField extends React.Component {
    constructor(props) {
        super(props);
        this.alertRef = React.createRef();
    }

    del = async () => {

        const asyncAlert = () => new Promise((resolve) => {
            this.alertRef.current.showAlert('Wait!', `Are you sure you want to remove this log from history?`, 'NO', 'YES',
                () => { this.alertRef.current.hideAlert(); resolve(false) }, () => { this.alertRef.current.hideAlert(); resolve(true) }, true)
        })
        if (Config.settings.confirmDelete) {
            const sure = await asyncAlert();
            if (!sure) return;
        }

        if (this.props.private) {
            //remova iz user doca
            await firestore().collection('Userdata').doc(auth().currentUser.uid).update({
                history: firestore.FieldValue.arrayRemove(this.props.obj)
            })
        } else {
            //remova iz group doca
            let deleted = false;
            //dobi vse shared groupe
            const mainDoc = await firestore().collection('Userdata').doc(auth().currentUser.uid).get();
            const data = mainDoc.data().shared;

            //loopa skozi njih
            for (const group of data) {
                //dobi doc
                const doc = await firestore().collection('Shared').doc(group).get();
                const docData = doc.data();

                //preveri če si owner
                if (docData.owner == auth().currentUser.uid) {
                    //preveri če je toti history log v tej shared groupi
                    let inGroup = false;
                    for (let log of docData.history) {
                        if (log.time == this.props.obj.time) {
                            inGroup = true;
                        }
                    }
                    if (inGroup) {
                        await firestore().collection('Shared').doc(group).update({
                            history: firestore.FieldValue.arrayRemove(this.props.obj)
                        })
                        deleted = true;
                    }

                }
            }

            if (!deleted) {
                this.alertRef.current.showAlert('Ups!', `You can only delete logs if you are the owner/admin of the group!`, 'NO', 'OK',
                () => { null }, () => { this.alertRef.current.hideAlert() }, false)
            }
        }
        this.props.refresh();
    }

    render() {
        return (
            <TouchableOpacity style={{
                width: 300,
                height: 40,
                backgroundColor: '#FFFFFF2b',
                borderRadius: 40,
                justifyContent: 'center',
                alignItems: 'center',
                marginVertical: 5,
                flexDirection: 'row',
            }} onLongPress={this.del}>
                {this.props.text}
                <Alert ref={this.alertRef} />
            </TouchableOpacity>
        )
    }
}