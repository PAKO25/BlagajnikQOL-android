import React from "react";
import SharedGroups from "../menu/sharedContent/SharedGroups";
import Groups from './Groups';
import Lists from "./Lists";
import SharedLists from "../menu/sharedContent/SharedLists";
import Humans from "./Humans";
import SharedHumans from "../menu/sharedContent/SharedHumans";
import { Text, View, StyleSheet } from "react-native";
import AddButton from "../AddButton";

class HomeExtension extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            shown: 'groups',
            shared: false,
        }
    }

    changeShown = (towhat, shared) => {
        if (towhat == 'groups') shared = false;
        this.setState({
            ...this.state,
            shown: towhat,
            shared: shared
        })
    }

    handleBack = () => {
        console.log('back');
        if (this.state.shown == 'lists') this.changeShown('groups', this.state.shared);
        if (this.state.shown == 'humans') this.changeShown('lists', this.state.shared);
    }

    render() {

        let show;
        if (!this.state.shared) {
            if (this.state.shown == 'lists') show = <Lists changeShown={this.changeShown} />
            if (this.state.shown == 'humans') show = <Humans changeShown={this.changeShown} />
        } else {
            if (this.state.shown == 'lists') show = <SharedLists changeShown={this.changeShown} />
            if (this.state.shown == 'humans') show = <SharedHumans changeShown={this.changeShown} />
        }

        return (
            <>

                <View style={Style.mainContainer}>

                    {this.state.shown == 'groups' ? (
                        <>
                            <View style={Style.container}>
                                <Text style={Style.title}>Private: </Text>
                                <Groups changeShown={this.changeShown} />
                            </View>
                            <View style={Style.container}>
                                <Text style={Style.title}>Shared: </Text>
                                <SharedGroups changeShown={this.changeShown} navigation={this.props.navigation} inHome={true} />
                            </View>
                        </>
                    ) : (
                        <>
                            <View style={Style.container}>
                                <Text style={Style.title}>{this.state.shared ? 'Shared' : 'Private'}:</Text>
                                {show}
                            </View>
                        </>
                    )}
                </View>

                <AddButton handler={() => { this.props.navigation.navigate('AddScreen', { name: this.state.shown, shared: this.state.shared }) }} />
            </>
        )
    }
}

const Style = StyleSheet.create({
    title: {
        left: 0,
        alignSelf: 'flex-start',
        color: '#000000',
        fontSize: 20,
        marginVertical: 10,
        left: 20
    },
    mainContainer: {
        top: 20,
        marginBottom: 250
    },
    container: {
        flex: 1,
        width: 400
    }
})

export default HomeExtension;