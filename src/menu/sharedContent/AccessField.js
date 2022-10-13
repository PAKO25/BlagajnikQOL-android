import React from "react";
import { Text, TouchableOpacity, View, StyleSheet } from "react-native";

class AccessList extends React.Component {

    constructor(props) {
        super(props);
    }

    render() {
        return (
            <View style={Style.container}>
                {this.props.name != undefined && this.props.name != '' ? (
                    <>
                        <Text style={Style.name}>
                            {this.props.name ? this.props.name.charAt(0).toUpperCase() + this.props.name.slice(1) : (null)}
                        </Text>
                        <TouchableOpacity style={Style.button} onPress={() => { this.props.click(this.props.name, this.props.uid) }}>
                            <Text style={Style.remove}>X</Text>
                        </TouchableOpacity>
                    </>
                ) : (null)}
            </View>
        )
    }
}

const Style = new StyleSheet.create({
    container: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginVertical: 5
    },
    name: {
        fontSize: 15,
        color: '#000000',
        marginRight: 20
    },
    remove: {
        fontSize: 20,
        color: '#000000',
    },
    button: {
        backgroundColor: '#FFFFFF2B',
        justifyContent: 'center',
        alignItems: 'center',
        height: 30,
        width: 30,
        borderRadius: 50
    }
})

export default AccessList;