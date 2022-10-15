import React from 'react';
import { ScrollView, Text } from 'react-native';
import Human from './Human'
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import { getData, storeData, Config, pushHistory } from '../config';
import Alert from '../utils/Alert';

class Humans extends React.Component {

  constructor(props) {
    super(props);

    this.alertRef = React.createRef();

    this.state = {
      jsx: <Text>Fetching data...</Text>,
    }
  }

  async componentDidMount() {
    console.log('show humans')

    const userDocument = await firestore().collection('Userdata').doc(auth().currentUser.uid)
      .collection(getData('groupShown')).doc(getData('listShown')).get();

    const data = userDocument.data();

    let humans = Object.keys(data)
    Object.values(data).forEach((value, i) => {
      humans[i] = [humans[i], value]
    })

    humans.sort();

    storeData(['humans', humans]);

    let jsx = humans.map((human, i) => {
      return <Human name={human[0]} checked={human[1]} key={i} delHuman={this.delHuman} shared={false} />
    })

    this.setState({
      jsx: jsx
    })
  }


  delHuman = async (name) => {
    //preveri če je ziher
    let sure = false;
    const asyncAlert = () => new Promise((resolve) => {
      this.alertRef.current.showAlert('Wait!', `Are you sure you want to remove ${name}?`, 'NO', 'YES',
        () => { this.alertRef.current.hideAlert(); resolve() }, () => { sure = true; resolve() }, true)
    });
    if (Config.settings.confirmDelete) {
      await asyncAlert();
    } else {
      sure = true;
    }
    if (!sure) return;

    //remova iz vseh al samo totega
    let all = false;
    const asyncAlert2 = () => new Promise((resolve) => {
      this.alertRef.current.showAlert('Wait!', `Do you want to remove him from just this list or all the lists?`, 'Just this one', 'All of them',
        () => { this.alertRef.current.hideAlert(); resolve() }, () => { this.alertRef.current.hideAlert(); all = true; resolve() }, true)
    });
    await asyncAlert2();

    if (all) {
      //remova iz vseh + iz maina (če ni v filih upam da ne crashne aplikacije xd)
      //deleta iz maina
      let obj = { ljudje: firestore.FieldValue.arrayRemove(name) };
      await firestore().collection('Userdata').doc(auth().currentUser.uid).collection(getData('groupShown')).doc('main').update(obj);

      //deleta iz vseh ostalih
      let obj2 = {};
      obj2[name] = firestore.FieldValue.delete();

      for (const list of getData('lists')) {
        await firestore().collection('Userdata').doc(auth().currentUser.uid).collection(getData('groupShown')).doc(list).update(obj2);
      }

    } else {
      //remova samo iz current lista
      let obj = {};
      obj[name] = firestore.FieldValue.delete();
      await firestore().collection('Userdata').doc(auth().currentUser.uid)
        .collection(getData('groupShown')).doc(getData('listShown')).update(obj);
    }

    pushHistory({name: 'Delete'}, `${getData('groupShown')}/${getData('listShown')}`, name, all)

    //rerendera
    this.componentDidMount();
  }


  render() {
    return (
      <>
        <ScrollView contentContainerStyle={{
          flexDirection: 'row',
          flexWrap: 'wrap',
          width: 330
        }}>

          {this.state.jsx}

        </ScrollView>
        <Alert ref={this.alertRef} />
      </>
    )
  }
}



export default Humans;
