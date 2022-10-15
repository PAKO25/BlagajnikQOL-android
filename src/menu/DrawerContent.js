import React from "react";
import { Text, View, ScrollView, Image, StyleSheet, TouchableOpacity } from "react-native";
import auth from '@react-native-firebase/auth';

const DrawerContent = (props) => {

    const logOut = async () => {
        await auth().signOut();
    }

    const username = auth().currentUser.displayName;

    return (
        <View style={{ alignItems: 'center', flex: 1 }}>

            {/* head */}
            <Image source={require('../../assets/logo.png')} style={styles.logo}></Image>
            <Text style={styles.userName}>{username}</Text>
            <View style={styles.line} />

            <ScrollView>
                {/* body */}

                <TouchableOpacity style={styles.label} onPress={() => {props.navigation.goBack(); props.navigation.goBack();}}>
                    <Image source={require('../../assets/homeicon.png')} style={styles.icon} />
                    <Text style={styles.labelText}>Home</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.label} onPress={() => {props.navigation.navigate('Share')}}>
                    <Image source={require('../../assets/shareicon.png')} style={styles.icon} />
                    <Text style={styles.labelText}>Share</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.label} onPress={() => {props.navigation.navigate('History')}}>
                    <Image source={require('../../assets/historyicon.png')} style={styles.icon} />
                    <Text style={styles.labelText}>History</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.label} onPress={() => {props.navigation.navigate('Payments')}}>
                    <Image source={require('../../assets/coinicon.png')} style={styles.icon} />
                    <Text style={styles.labelText}>Payments</Text>
                </TouchableOpacity>

            </ScrollView>

            <View style={styles.line} />
            {/* bottom */}
            <TouchableOpacity style={styles.label} onPress={() => {props.navigation.navigate('Settings')}}>
                <Image source={require('../../assets/settingsicon.png')} style={styles.icon} />
                <Text style={styles.labelText}>Settings</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.label} onPress={logOut}>
                <Image source={require('../../assets/logout.png')} style={styles.icon} />
                <Text style={styles.labelText}>Logout</Text>
            </TouchableOpacity>
        </View>
    )
}

const styles = StyleSheet.create({
    logo: {
        width: 124,
        height: 150,
        marginTop: 50,
    },
    userName: {
        fontSize: 25,
        color: '#000000',
        marginVertical: 20
    },
    line: {
        width: 250,
        borderColor: '#00000000',
        borderBottomColor: '#000000',
        borderWidth: 1
    },
    label: {
        marginVertical: 10,
        flexDirection: 'row',
        justifyContent: 'center'
    },
    icon: {
        width: 40,
        height: 40
    },
    labelText: {
        fontSize: 20,
        color: '#000000',
        marginLeft: 15,
        top: 5
    },
})

export default DrawerContent;