import React from "react";
import { Text, TouchableOpacity, View, StyleSheet } from "react-native";
import PermsPopup from "../../utils/PermsPopup";

class AccessList extends React.Component {

    constructor(props) {
        super(props);

        this.state = {
            showPopup: false
        }

        this.permsPopupRef = React.createRef();
    }

    showPermsPopup = () => {
        this.setState({
            ...this.state,
            showPopup: true
        })
        this.permsPopupRef.current.show(this.props.waiting ? this.props.email : this.props.name,
             'Perms:', 'Viewer', ['Viewer', 'User', 'Admin'], this.done)
    }

    done = (newperm) => {
        console.log(newperm)
        this.setState({
            ...this.state,
            showPopup: false
        })
    }

    render() {
        return (
            <>
                <TouchableOpacity style={Style.container} onLongPress={this.showPermsPopup}>
                    {(this.props.name != undefined && this.props.name != '') || (this.props.email != undefined && this.props.email != '') ? (
                        <>
                            <Text style={[Style.name, this.props.waiting ? { fontSize: 12 } : null]}>
                                {this.props.waiting ? (
                                    <>
                                        {this.props.email ? this.props.email : (null)}
                                    </>
                                ) : (
                                    <>
                                        {this.props.name ? this.props.name.charAt(0).toUpperCase() + this.props.name.slice(1) : (null)}
                                    </>
                                )}
                            </Text>
                            <TouchableOpacity style={Style.button} onPress={() => {
                                !this.props.waiting ? this.props.click(false, this.props.name, this.props.uid) :
                                    this.props.click(true, this.props.email)
                            }}>
                                <Text style={Style.remove}>X</Text>
                            </TouchableOpacity>
                        </>
                    ) : (null)}
                </TouchableOpacity>
                {this.state.showPopup ? (<PermsPopup ref={this.permsPopupRef} />) : (null)}
            </>
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
    },
})

export default AccessList;