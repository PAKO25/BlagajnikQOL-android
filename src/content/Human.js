import React from 'react';
import { Animated, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';
import { getData, Config, pushHistory } from '../config';
import Alert from '../utils/Alert';
import uuid from 'react-native-uuid';
import InputPopup from '../utils/InputPopup';


class Human extends React.Component {

  constructor(props) {
    super(props);

    this.alertRef = React.createRef();
    this.inputRef = React.createRef();

    //toggla glede na props
    let indicatorColor = '#FF00007F';
    let indicatorPos = new Animated.Value(0);
    if (props.checked) {
      indicatorColor = '#00FF007F'
      indicatorPos = new Animated.Value(140);
    }
    this.state = {
      indicatorColor: indicatorColor,
      indicatorPos: indicatorPos,
      on: props.checked,
    }
  }

  sendEmail = async () => {
    const code = uuid.v4();

    //preveri če je email že shranjen
    let email;
    let rdata;
    let oldemail;
    let saved = false;
    if (this.props.shared) {
      const doc = await firestore().collection('Shared').doc(getData('sharedGroupShown')).collection('group').doc('main').get();
      rdata = doc.data().emails;
    } else {
      const doc = await firestore().collection('Userdata').doc(auth().currentUser.uid).collection(getData('groupShown')).doc('main').get();
      rdata = doc.data().emails;
    }
    for (const batch of rdata) {
      if (batch.name == this.props.name) {
        email = batch.email;
        oldemail = batch.email;
        saved = true;
      }
    }

    let ok = true;
    if (saved) {
      //preveri če je saved mail ok

      const asyncAlert = () => new Promise((resolve) => {
        this.alertRef.current.showAlert('Wait!', `Is this the email: ${email}?`, 'NO', 'YES',
          () => { this.alertRef.current.hideAlert(); resolve(false) }, () => { this.alertRef.current.hideAlert(); resolve(true) }, true)
      });
      ok = await asyncAlert();
      if (!ok) saved = false;
    }
    if (!saved) {
      //dobi email z inputom
      const asyncInput = () => new Promise((resolve) => {
        this.inputRef.current.show('Enter the email:', 'E-mail', (text) => {
          var re = /\S+@\S+\.\S+/;
          const ok = re.test(text);
          ok ? resolve(text) : resolve(false)
        })
      })
      email = await asyncInput();
    }

    //če email ni dejnski email
    if (!email) {
      const asyncAlert = () => new Promise((resolve) => {
        this.alertRef.current.showAlert('lol', `Thats not an email`, 'NO', 'I know sorry',
          () => { }, () => { this.alertRef.current.hideAlert(); resolve() }, false)
      });
      await asyncAlert();
      return;
    }

    if (!saved) {
      //vpraša če hočeš savat email za naslenjič
      const asyncAlert2 = () => new Promise((resolve) => {
        this.alertRef.current.showAlert('Wait!', `Do you want to save ${email}, so you dont have to type it again?`, 'NO', 'YES',
          () => { this.alertRef.current.hideAlert(); resolve(false) }, () => { this.alertRef.current.hideAlert(); resolve(true) }, true)
      });
      const save = await asyncAlert2();

      if (!ok) {
        //deleta stari entry, če se je odločil spremeniti savan mail
        if (this.props.shared) {
          await firestore().collection('Shared').doc(getData('sharedGroupShown')).collection('group').doc('main').update({
            emails: firestore.FieldValue.arrayRemove({ name: this.props.name, email: oldemail })
          })
        } else {
          await firestore().collection('Userdata').doc(auth().currentUser.uid).collection(getData('groupShown')).doc('main').update({
            emails: firestore.FieldValue.arrayRemove({ name: this.props.name, email: oldemail })
          })
        }
      }

      //sava v main doc
      if (save) {
        if (this.props.shared) {
          await firestore().collection('Shared').doc(getData('sharedGroupShown')).collection('group').doc('main').update({
            emails: firestore.FieldValue.arrayUnion({ name: this.props.name, email: email })
          })
        } else {
          await firestore().collection('Userdata').doc(auth().currentUser.uid).collection(getData('groupShown')).doc('main').update({
            emails: firestore.FieldValue.arrayUnion({ name: this.props.name, email: email })
          })
        }
      }
    }

    //pošle request
    let data = {
      method: 'POST',
      body: JSON.stringify({
        service_id: Config.email.serviceId,
        template_id: Config.email.templateId,
        user_id: Config.email.publicKey,
        template_params: {
          email: email,
          by: auth().currentUser.displayName + " (" + auth().currentUser.email + ")",
          list: this.props.shared ? getData('sharedListShown') : getData('listShown'),
          code: code
        },
      }),
      headers: { 'Content-Type': 'application/json', }
    }
    fetch('https://api.emailjs.com/api/v1.0/email/send', data)
      .then(d => { console.log(d.status) })

    this.storePayment(code, email)
  }

  storePayment = async (code, email) => {
    await firestore().collection('Payments').doc(code).set({
      for: email,
      data: {
        approved: auth().currentUser.displayName,
        list: this.props.shared ? getData('sharedListShown') : getData('listShown'),
        time: new Date().getTime()
      }
    })
  }

  toggleOn = async () => {
    //preveri če želi poslati email
    if (Config.settings.sendEmail) {
      let send = false;
      const asyncAlert = () => new Promise((resolve) => {
        this.alertRef.current.showAlert('Wait!', `Do you want to send a confirmation email?`, 'NO', 'YES',
          () => { this.alertRef.current.hideAlert(); resolve() }, () => { this.alertRef.current.hideAlert(); send = true; resolve() }, true)
      });
      await asyncAlert();
      if (send) {
        this.sendEmail();
      }
    }
    //animacija
    const asyncAnim = () => new Promise((resolve) => {
      Animated.timing(this.state.indicatorPos, {
        toValue: 140,
        duration: 400,
        useNativeDriver: false
      }).start(() => { resolve() });
    });
    await asyncAnim();
    this.setState({
      ...this.state,
      indicatorColor: '#00FF007F',
      on: true
    })
  }

  toggleOff = async () => {
    const asyncAnim = () => new Promise((resolve) => {
      Animated.timing(this.state.indicatorPos, {
        toValue: 0,
        duration: 400,
        useNativeDriver: false
      }).start(() => { resolve() });
    });
    await asyncAnim();
    this.setState({
      ...this.state,
      indicatorColor: '#FF00007F',
      on: false
    })
  }

  clickHuman = async () => {

    //preveri če ma dovoljenje
    if (this.props.shared) {
      const perms = getData('sharedGroupShownPerms');
      if (perms == 'Viewer') {
        this.alertRef.current.showAlert('Oops!', `You dont have the required permissions! Talk to the group owner.`, 'NO', 'OK',
          () => { null }, () => { this.alertRef.current.hideAlert(); }, false);
        return;
      }
    }

    //preveri če je ziher
    let sure = false;
    const asyncAlert = () => new Promise((resolve) => {
      this.alertRef.current.showAlert('Wait!', `Are you sure you want to toggle ${this.props.name}?`, 'NO', 'YES',
        () => { this.alertRef.current.hideAlert(); resolve() }, () => {
          if (this.state.on) {
            this.alertRef.current.hideAlert();
          }
          if (!this.state.on && !Config.settings.sendEmail) {
            this.alertRef.current.hideAlert();
          }
          sure = true; resolve();
        }, true)
    });
    if (Config.settings.confirmToggle) {
      await asyncAlert();
    } else {
      sure = true;
    }
    if (!sure) return;

    console.log(this.state.on)
    this.state.on ? (await this.toggleOff()) : (await this.toggleOn())

    //updata value
    let obj = {};
    obj[this.props.name] = this.state.on;

    if (this.props.shared) {
      await firestore().collection('Shared').doc(getData('sharedGroupShown')).collection('group')
        .doc(getData('sharedListShown')).update(obj);

      pushHistory({ name: 'Toggle', value: this.state.on }, `${getData('sharedGroupShownName')}/${getData('sharedListShown')}`,
        this.props.name, false, true, getData('sharedGroupShown'), auth().currentUser.displayName)
    } else {
      await firestore().collection('Userdata').doc(auth().currentUser.uid).collection(getData('groupShown'))
        .doc(getData('listShown')).update(obj);

      pushHistory({ name: 'Toggle', value: this.state.on }, `${getData('groupShown')}/${getData('listShown')}`, this.props.name)
    }
  }

  render() {
    return (
      <>
        <TouchableOpacity style={styles.button} onPress={this.clickHuman} onLongPress={() => { this.props.delHuman(this.props.name) }}>
          <Animated.View style={[styles.indicator, {
            backgroundColor: this.state.indicatorColor,
            left: this.state.indicatorPos
          }]}>
            <Text style={styles.text}>{this.props.name}</Text>
          </Animated.View>
        </TouchableOpacity>
        <Alert ref={this.alertRef} />
        <InputPopup ref={this.inputRef} />
      </>
    )
  }
}


const styles = StyleSheet.create({
  button: {
    width: 300,
    height: 55,
    backgroundColor: '#6D6D6D3F',
    borderRadius: 40,
    margin: 15,
  },
  indicator: {
    width: 160,
    height: 55,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    fontSize: 20,
    color: '#000000'
  }
})

export default Human;
