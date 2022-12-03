import React, { useRef, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { BackHandler } from 'react-native';
import Login from './Login';
import Home from './Home';
import AddScreen from './menu/AddScreen';
import Share from './menu/Share';
import Settings from './menu/Settings';
import History from './menu/History';
import DrawerContent from './menu/DrawerContent';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import { Config, useNewSettings, checkShared, restoreConfig } from './config';
import GroupSettings from './menu/sharedContent/GroupSettings';
import Payments from './menu/Payments'


GoogleSignin.configure({
  webClientId: '237842090952-kmh1pls9qfesucrkh80291jf2efcidfj.apps.googleusercontent.com',
});


const Drawer = createDrawerNavigator();

const App = () => {

  const [loggedIn, changeLoggedIn] = useState(false);
  const homeRef = useRef();
  const shareRef = useRef();

  let skip = true;


  const onAuthStateChanged = async (user) => {
    if (skip) { skip = false; return; }
    if (user) {
      //signed in
      //dobi user document
      const userDocument = await firestore().collection('Userdata').doc(user.uid).get();

      //preveri če je novi signup
      if (!userDocument.exists) {
        await firestore().collection("Userdata").doc(user.uid).set({
          name: user.displayName,
          uid: user.uid,
          createdAt: firestore.FieldValue.serverTimestamp(),
          skupine: [],
          settings: Config.settings,
          shared: [],
          history: [],
          payments: []
        })
      } else {
        //dobi settinge
        const data = userDocument.data();
        //počaka da se vse nalozi -> zato promise
        await new Promise((resolve) => {useNewSettings(data.settings, resolve)});
      }

      //preveri če so kaki novi sharedgroupi na waitinglistu
      checkShared();

      //spremeni screen
      changeLoggedIn(true);

    } else {
      //signed out
      restoreConfig();
      changeLoggedIn(false);
    }
  }
  auth().onAuthStateChanged(onAuthStateChanged);

  return (
    <>
      {loggedIn ? (
        //je loggedin
        <NavigationContainer>
          <Drawer.Navigator initialRouteName="Home" 
          screenOptions={{ headerShown: false, drawerStyle: {backgroundColor: 'transparent'} }} 
          drawerContent={DrawerContent}>

            <Drawer.Screen name="Home" >
              {(props) => <Home {...props} fref={homeRef} />}
            </Drawer.Screen>

            <Drawer.Screen name="Share">
            {(props) => <Share {...props} fref={shareRef} />}
            </Drawer.Screen>

            <Drawer.Screen name="AddScreen" component={AddScreen} />
            <Drawer.Screen name="GroupSettings" component={GroupSettings} />
            <Drawer.Screen name="Settings" component={Settings} />
            <Drawer.Screen name="History" component={History} />
            <Drawer.Screen name="Payments" component={Payments} />

          </Drawer.Navigator>
        </NavigationContainer >
      ) : (
        //ni loggedin
        <Login />
      )}
    </>
  )
}



export default App;
