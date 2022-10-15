import React from "react";
import { StyleSheet, TouchableOpacity, Text } from "react-native";

class AddButton extends React.Component {

    constructor(props) {
        super(props);
    }

    render() {
        return (
            <TouchableOpacity style={[Style.fade, Style.addButton]}
                onPress={this.props.handler}>
                {/* addbutton */}
                <Text style={Style.addPlus}>
                    {this.props.sign != undefined ? (this.props.sign) : ('+')}
                </Text>
            </TouchableOpacity>
        )
    }
}

const Style = StyleSheet.create({
    fade: {
        backgroundColor: '#FFFFFF2B',
        borderRadius: 30
    },
    addPlus: {
        color: '#000000',
        fontSize: 50,
        bottom: 7
    },
    addButton: {
        position: "absolute",
        bottom: 20,
        width: 300,
        height: 60,
        alignItems: 'center'
    }
})

export default AddButton;