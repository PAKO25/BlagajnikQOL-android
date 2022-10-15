import React from "react";
import { ImageBackground, StyleSheet, Keyboard, TouchableOpacity, Image, View } from "react-native";
import { Config } from "../config";
import { useDrawerStatus } from "@react-navigation/drawer";

class Frame extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            keyboardShown: false,
        }
    }
    componentDidMount() {
        if (this.props.hideToolbarOnKeyboard) {
            this.props.navigation.addListener('focus', async () => {
                this.keyboardDidShowSubscription = Keyboard.addListener(
                    'keyboardDidShow', () => { this.setState({ keyboardShown: true }) }
                );
                this.keyboardDidHideSubscription = Keyboard.addListener(
                    'keyboardDidHide', () => { this.setState({ keyboardShown: false }) }
                );
            })
        }
    }
    componentWillUnmount() {
        if (this.props.hideToolbarOnKeyboard) {
            this.keyboardDidShowSubscription.remove();
            this.keyboardDidHideSubscription.remove();
        }
    }
    render() {
        return (
            <ImageBackground
                source={Config.settings.customBackground.use ?
                    ({ uri: Config.settings.customBackground.base64 }) :
                    (require('../../assets/ozadje.jpg'))}
                resizeMode={'stretch'} style={Style.background}>

                {this.props.drawerOpen === 'open' ? (null) : (<>

                    {!this.state.keyboardShown ? (
                        <View style={[Style.fade, Style.toolbar]}>
                            {/* title */}

                            <TouchableOpacity style={[Style.menuImg, { marginLeft: 0 }]} onPress={() => this.props.navigation.toggleDrawer()}>
                                <Image source={require('../../assets/menu.jpg')} style={Style.menuImg}></Image>
                            </TouchableOpacity>

                            {/* ../assets/searchicon.png */}
                        </View>
                    ) : (null)}

                    {this.props.children}
                </>)}
            </ImageBackground>
        )
    }
}

const Style = StyleSheet.create({
    background: {
        flex: 1,
        alignItems: 'center'
    },
    fade: {
        backgroundColor: '#FFFFFF2B',
        borderRadius: 30
    },
    toolbar: {
        width: 300,
        height: 95,
        justifyContent: 'center',
        marginTop: 40,
    },
    menuImg: {
        width: 53,
        height: 47,
        marginLeft: 35
    }
})

function addHook(Component) {
    return function WrappedComponent(props) {
        const drawerOpen = useDrawerStatus();
        return <Component {...props} drawerOpen={drawerOpen} />;
    }
}

export default addHook(Frame);