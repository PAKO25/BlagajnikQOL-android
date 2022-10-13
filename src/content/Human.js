import React from 'react';
import { Animated, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';
import { getData, Config, pushHistory } from '../config';
import Alert from '../Alert';

class Human extends React.Component {

  constructor(props) {
    super(props);

    this.alertRef = React.createRef();

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

  toggleOn = async () => {
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
    console.log('off')
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

    //preveri če je ziher
    let sure = false;
    const asyncAlert = () => new Promise((resolve) => {
      console.log('alert')
      this.alertRef.current.showAlert('Wait!', `Are you sure you want to toggle ${this.props.name}?`, 'NO', 'YES',
        () => { this.alertRef.current.hideAlert(); resolve() }, () => { this.alertRef.current.hideAlert(); sure = true; resolve() })
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
    margin: 15
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
