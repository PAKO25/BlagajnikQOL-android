import React from "react";
import { Text, ScrollView, StyleSheet, View, TouchableOpacity, Switch, Pressable, findNodeHandle } from "react-native";
import { Config, changeSettings, setNewBackground } from "../config";
import Alert from "../Alert";
import { launchCamera, launchImageLibrary } from 'react-native-image-picker';
import ExplainText from "./ExplainText";
import Frame from "../Frame";

class Settings extends React.Component {

    constructor(props) {
        super(props);

        this.alertRef = React.createRef();

        this.state = {
            confirmDelete: Config.settings.confirmDelete,
            showShared: Config.settings.showShared,
            confirmToggle: Config.settings.confirmToggle,
            explainText: '',
            showExplainText: false,
            explainTextY: 0
        }
    }

    showExplainText = (text, y) => {
        this.setState({
            ...this.state,
            explainText: text,
            explainTextY: y,
            showExplainText: true
        })
        this.setState({
            ...this.state,
            showExplainText: false
        })
    }

    toggleSwitch = (which, value) => {
        let obj = { ...this.state };
        obj[which] = value;
        this.setState(obj);

        changeSettings(which, value);
    }

    changeImage = async () => {

        let choose;
        const whereToChoose = () => new Promise((resolve) => {
            this.alertRef.current.showAlert('Choose.', `Where do you want to get the image?`, 'Camera', 'Gallery',
                () => { this.alertRef.current.hideAlert(); choose = 'camera'; resolve() }, () => { this.alertRef.current.hideAlert(); choose = 'gallery'; resolve() }, true)
        })

        const options = {
            mediaType: 'photo',
            includeBase64: true
        }

        let data;

        await whereToChoose();
        if (choose == 'gallery') {
            console.log('gallery')
            data = await launchImageLibrary(options);
        } else if (choose == 'camera') {
            console.log('camera')
            data = await launchCamera(options);
        } else {
            return;
        }

        if (!data.didCancel) {
            if (data.errorCode) {
                console.log(data.errorMessage);
                return;
            }
            await setNewBackground(data.assets[0].base64);
            this.forceUpdate();
        }
    }

    render() {
        return (
            <Frame navigation={this.props.navigation} hideToolbarOnKeyboard={false}>

                <ScrollView contentContainerStyle={Style.settingsContainer}>

                    <Pressable delayLongPress={300}
                        onLongPress={(e) => {
                            let relY = e.nativeEvent.locationY;
                            let elementHandle = findNodeHandle(this.refs["el1"]);
                            if (e.nativeEvent.target == elementHandle) {
                                relY = (Style.label.height - Style.settingsText.fontSize) / 2 + relY;
                            }
                            this.showExplainText("Prompts you to confirm deleting groups/lists/humans.",
                                e.nativeEvent.pageY - relY + Style.label.height)
                        }}>
                        <View style={[Style.label, Style.fade]}>
                            <Text style={Style.settingsText} ref="el1">Confirm delete</Text>
                            <Switch
                                onValueChange={value => { this.toggleSwitch('confirmDelete', value) }}
                                value={this.state.confirmDelete}
                                style={Style.radio}
                                trackColor={{ false: Config.settings.mainColor, true: '#000000' }}
                                thumbColor={this.state.confirmDelete ? Config.settings.mainColor : '#000000'}
                            />
                        </View>
                    </Pressable>

                    <Pressable delayLongPress={300}
                        onLongPress={(e) => {
                            let relY = e.nativeEvent.locationY;
                            let elementHandle = findNodeHandle(this.refs["el2"]);
                            if (e.nativeEvent.target == elementHandle) {
                                relY = (Style.label.height - Style.settingsText.fontSize) / 2 + relY;
                            }
                            this.showExplainText("Prompts you to confirm toggling a human's value.",
                                e.nativeEvent.pageY - relY + Style.label.height);
                        }}>
                        <View style={[Style.label, Style.fade]}>
                            <Text style={Style.settingsText} ref="el2">Confirm toggle</Text>
                            <Switch
                                onValueChange={value => { this.toggleSwitch('confirmToggle', value) }}
                                value={this.state.confirmToggle}
                                style={Style.radio}
                                trackColor={{ false: Config.settings.mainColor, true: '#000000' }}
                                thumbColor={this.state.confirmToggle ? Config.settings.mainColor : '#000000'}
                            />
                        </View>
                    </Pressable>

                    <Pressable delayLongPress={300}
                        onLongPress={(e) => {
                            let relY = e.nativeEvent.locationY;
                            let elementHandle = findNodeHandle(this.refs["el3"]);
                            if (e.nativeEvent.target == elementHandle) {
                                relY = (Style.label.height - Style.settingsText.fontSize) / 2 + relY;
                            }
                            this.showExplainText("If enabled, displays shared groups with private groups on home screen.",
                                e.nativeEvent.pageY - relY + Style.label.height)
                        }}>
                        <View style={[Style.label, Style.fade]}>
                            <Text style={Style.settingsText} ref="el3">Show shared</Text>
                            <Switch
                                onValueChange={value => { this.toggleSwitch('showShared', value) }}
                                value={this.state.showShared}
                                style={Style.radio}
                                trackColor={{ false: Config.settings.mainColor, true: '#000000' }}
                                thumbColor={this.state.showShared ? Config.settings.mainColor : '#000000'}
                            />
                        </View>
                    </Pressable>

                    <TouchableOpacity style={[Style.label, Style.fade]} onPress={this.changeImage}>
                        <Text style={Style.settingsText}>Background Image</Text>
                    </TouchableOpacity>

                </ScrollView>

                <Alert ref={this.alertRef} />
                <ExplainText text={this.state.explainText} shown={this.state.showExplainText} y={this.state.explainTextY} />

            </Frame>
        )
    }
}

const Style = StyleSheet.create({
    fade: {
        backgroundColor: '#FFFFFF2B',
        borderRadius: 30
    },
    settingsContainer: {
        backgroundColor: '#FFFFFF2B',
        borderRadius: 30,
        marginVertical: 40,
        width: 300,
        height: 550,
        flexDirection: 'row',
        justifyContent: 'center',
        flexWrap: 'wrap',
    },
    label: {
        flexDirection: 'row',
        justifyContent: "space-evenly",
        marginVertical: 10,
        width: 250,
        height: 50,
        alignItems: 'center'
    },
    settingsText: {
        fontSize: 20,
        color: '#000000'
    },
    radio: {
        transform: [{ scaleX: 1.5 }, { scaleY: 1.5 }]
    }
})

export default Settings;