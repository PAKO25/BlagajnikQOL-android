import React from "react";
import { Text, ImageBackground, StyleSheet, TouchableOpacity } from "react-native";
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import auth from '@react-native-firebase/auth';
import { Config } from "./config";

class Login extends React.Component {

    constructor(props) {
        super(props);
    }


    login = async () => {
        // Get the users ID token
        const { idToken } = await GoogleSignin.signIn();

        // Create a Google credential with the token
        const googleCredential = auth.GoogleAuthProvider.credential(idToken);

        // Sign-in the user with the credential
        await auth().signInWithCredential(googleCredential);
    }


    render() {
        return (
            <ImageBackground source={Config.settings.customBackground.use ?
                ({ uri: Config.settings.customBackground.base64 }) :
                (require('../assets/ozadje.jpg'))} 
                resizeMode={'stretch'} style={Style.background}>
                <Text style={Style.title}>Blagajnik QOL</Text>
                <TouchableOpacity style={Style.button} onPress={this.login}>
                    <Text style={Style.buttonText}>Login</Text>
                </TouchableOpacity>
            </ImageBackground>
        )
    }
}

const Style = StyleSheet.create({
    background: {
        flex: 1,
        alignItems: "center"
    },
    title: {
        fontSize: 43,
        color: '#FFFFFF',
        fontFamily: 'Inter',
        marginTop: 250
    },
    button: {
        marginTop: 220,
        width: 166,
        height: 69,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: '#FFFFFF2B',
        borderRadius: 30
    },
    buttonText: {
        color: '#FFFFFF',
        fontSize: 20
    }
})

export default Login;