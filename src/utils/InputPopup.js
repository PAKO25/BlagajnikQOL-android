import React from "react";
import { View, TextInput, TouchableOpacity, StyleSheet, Modal, Text } from "react-native";


export default class InputPopup extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            text: '',
            placeholder: '',
            title: '',
            done: () => { },
            visible: false
        }
    }

    show = (title, placeholder, done) => {
        this.setState({
            ...this.state,
            title: title,
            placeholder: placeholder,
            done: done,
            visible: true,
            text: ''
        })
    }

    hide = () => {
        this.setState({
            ...this.state,
            visible: false
        })
        this.state.done(this.state.text)
    }

    render() {
        return (
            <View style={Style.center}>
                <Modal
                    animationType="fade"
                    transparent={true}
                    visible={this.state.visible}
                    onRequestClose={this.hide}
                >
                    <View style={Style.center}>
                        <View style={Style.modal}>
                            <Text style={Style.title}>{this.state.title}</Text>
                            <TextInput
                                style={Style.input}
                                placeholderTextColor='#000000'
                                onChangeText={(text) => { this.setState({ text: text }); }}
                                value={this.state.text}
                                placeholder={this.state.placeholder} />
                            <TouchableOpacity onPress={this.hide} style={Style.confirm}>
                                <Text>Confirm</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </Modal>
            </View>
        )
    }
}

const Style = StyleSheet.create({
    center: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        marginTop: 22
    },
    modal: {
        margin: 20,
        backgroundColor: "#000000aa",
        borderRadius: 20,
        padding: 35,
        alignItems: "center",
        shadowColor: "#00000000",
        shadowOffset: {
            width: 0,
            height: 2
        },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 5
    },
    input: {
        fontSize: 20,
    },
    title: {
        fontSize: 25,
        color: "#f02b09",
    },
    confirm: {
        backgroundColor: "#f02b09",
        borderRadius: 10,
        height: 34,
        width: 70,
        alignItems: 'center',
        justifyContent: 'center'
    }
})