import React from "react";
import AwesomeAlert from "react-native-awesome-alerts";

export default class Alert extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            alertContainerStyle: {
                backgroundColor: "#00000010"
            },
            contentContainerStyle: {
                backgroundColor: "#000000aa",
                elevation: 10,
                borderRadius: 50,
            },
            titleStyle: {
                fontSize: 25,
                color: "#f02b09",
            },
            messageStyle: {
                fontSize: 15,
                backgroundColor: "#00000000"
            },
            cancleBtnStyle: {
                backgroundColor: "#1b1b1b"
            },
            confirmBtnStyle: {
                backgroundColor: "#f02b09"
            },
            showAlert: false,
            alertTitle: '',
            alertMessage: '',
            alertCancelText: '',
            alertConfirmText: '',
            alertCancelFunc: () => { },
            alertConfirmFunc: () => { },
            showCancelButton: false
        }
    }

    showAlert = (title, msg, cancelText, confirmText, cancelFunc, confirmFunc, showCancelButton) => {
        let obj = {
            ...this.state, showAlert: true, alertTitle: title, alertMessage: msg, alertCancelText:
                cancelText, alertConfirmText: confirmText, alertCancelFunc: cancelFunc, alertConfirmFunc: confirmFunc,
        };
        showCancelButton ? obj['showCancelButton'] = true : null
        this.setState(obj);
    }
    hideAlert = () => {
        console.log('hide')
        this.setState({ ...this.state, showAlert: false })
    }

    render() {
        return (
            <AwesomeAlert
                show={this.state.showAlert}
                showProgress={false}
                title={this.state.alertTitle}
                message={this.state.alertMessage}
                closeOnTouchOutside={false}
                closeOnHardwareBackPress={false}
                showCancelButton={this.state.showCancelButton}
                showConfirmButton={true}
                cancelText={this.state.alertCancelText}
                confirmText={this.state.alertConfirmText}
                onCancelPressed={this.state.alertCancelFunc}
                onConfirmPressed={this.state.alertConfirmFunc}
                alertContainerStyle={this.state.alertContainerStyle}
                contentContainerStyle={this.state.contentContainerStyle}
                titleStyle={this.state.titleStyle}
                messageStyle={this.state.messageStyle}
                confirmButtonStyle={this.state.confirmBtnStyle}
                cancelButtonStyle={this.state.cancleBtnStyle} />
        )
    }
}