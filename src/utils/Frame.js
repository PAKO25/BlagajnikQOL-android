import React from "react";
import { ImageBackground, StyleSheet, Keyboard, TouchableOpacity, Image, View } from "react-native";
import { Config } from "../config";
import { useDrawerStatus } from "@react-navigation/drawer";
import auth from '@react-native-firebase/auth';

class Frame extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            keyboardShown: false,
            imageUrl: ''
        }
    }
    componentDidMount() {
        if (this.props.hideToolbarOnKeyboard) {
            this.props.navigation.addListener('focus', async () => {
                this.keyboardDidShowSubscription = Keyboard.addListener(
                    'keyboardDidShow', () => { this.setState({ ...this.state, keyboardShown: true }) }
                );
                this.keyboardDidHideSubscription = Keyboard.addListener(
                    'keyboardDidHide', () => { this.setState({ ...this.state, keyboardShown: false }) }
                );
            })
        }

        const image = auth().currentUser.photoURL;
        this.setState({ ...this.state, imageUrl: image });
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
                        <View style={Style.toolbar}>
                            {/* title */}

                            <TouchableOpacity style={[Style.menuImg, { marginLeft: 0 }]} onPress={() => this.props.navigation.toggleDrawer()}>
                                <Image source={require('../../assets/menu.jpg')} style={Style.menuImg}></Image>
                            </TouchableOpacity>

                            <Image source={{ uri: this.state.imageUrl != '' ? this.state.imageUrl : null }}style={Style.profileImage} />

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
        alignItems: 'center',
    },
    toolbar: {
        width: 300,
        height: 95,
        justifyContent: 'space-between',
        marginTop: 40,
        backgroundColor: '#FFFFFF2B',
        borderRadius: 30,
        flexDirection: 'row',
        alignItems: 'center'
    },
    menuImg: {
        width: 53,
        height: 47,
        marginHorizontal: 35
    },
    profileImage: {
        width: 62,
        height: 55,
        marginHorizontal: 35,
        borderRadius: 20
    }
})

function addHook(Component) {
    return function WrappedComponent(props) {
        const drawerOpen = useDrawerStatus();
        return <Component {...props} drawerOpen={drawerOpen} />;
    }
}

export default addHook(Frame);