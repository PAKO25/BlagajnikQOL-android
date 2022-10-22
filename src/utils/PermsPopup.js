import React from "react";
import { View, TextInput, TouchableOpacity, StyleSheet, Modal, Text } from "react-native";
import ModalDropdown from 'react-native-modal-dropdown';

export default class PermsPopup extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            desc: '',
            title: '',
            done: () => { },
            visible: false,
            defaultSelected : 'Viewer',
            selected: '',
            options: []
        }
    }

    show = (title, desc, selected, options, done) => {
        this.setState({
            ...this.state,
            title: title,
            desc: desc,
            defaultSelected: selected,
            selected: selected,
            done: done,
            visible: true,
            options: options
        })
    }

    hide = () => {
        this.setState({
            ...this.state,
            visible: false
        })
        this.state.done(this.state.selected)
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
                            <View style={Style.inline}>
                                <Text style={Style.desc}>{this.state.desc}</Text>
                                <ModalDropdown style={Style.dropDownBtn} textStyle={{fontSize: 15, color: '#000000',}}
                                    options={this.state.options}
                                    defaultValue={this.state.defaultSelected}
                                    showsVerticalScrollIndicator={false}
                                    dropdownTextStyle={Style.dropDownText}
                                    dropdownStyle={{backgroundColor: '#00000000', borderWidth: 0}}
                                    dropdownTextHighlightStyle={Style.dropDownText}
                                    renderSeparator={() =>{null}}
                                    adjustFrame={(pos) => {return {...pos, left: 210, top: 408}}}
                                    onSelect={(i, option) => {this.setState({...this.state, selected: option})}}
                                />
                            </View>
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
        backgroundColor: '#c3bcbb50'
    },
    modal: {
        margin: 20,
        backgroundColor: "#000000dd",
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
        elevation: 5,
        bottom: 0
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
        justifyContent: 'center',
    },
    inline: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: 20
    },
    desc: {
        fontSize: 20,
        color: '#000000',
        borderColor: '#000000',
        borderWidth: 1,
        borderRadius: 10,
        padding: 5
    },
    dropDownText: {
        backgroundColor: '#000000',
        fontSize: 15,
        color: '#f02b09',
        borderColor: '#f02b09',
        borderWidth: 1,
        borderRadius: 10
    },
    dropDownBtn: {
        backgroundColor: '#f02b09dd',
        height: 34,
        width: 70,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 10,
        marginLeft: 20
    }
})