import React from 'react';
import { ScrollView, Text } from 'react-native';
import Tile from './Tile';
import auth, { firebase } from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import { storeData, Config, pushHistory } from '../config';
import Alert from '../utils/Alert';
import uuid from 'react-native-uuid';

class Groups extends React.Component {

  constructor(props) {
    super(props);

    this.alertRef = React.createRef();

    this.state = {
      jsx: <Text>Fetching data...</Text>,
    }
  }


  clickOnTile = (name) => {
    storeData(['groupShown', name]);
    this.props.changeShown('lists', false) //shared = false
  }

  delTile = async (name) => {
    //preveri če je ziher
    let sure = false;
    const asyncAlert = () => new Promise((resolve) => {
      this.alertRef.current.showAlert('Wait!', `Are you sure you want to delete ${name}?`, 'NO', 'YES',
        () => { this.alertRef.current.hideAlert(); resolve() }, () => { this.alertRef.current.hideAlert(); sure = true; resolve() }, true)
    });
    if (Config.settings.confirmDelete) {
      await asyncAlert();
    } else {
      sure = true;
    }
    if (!sure) return;

    //dobi vse liste v grupi
    const mainFile = await firestore().collection('Userdata').doc(auth().currentUser.uid).collection(name).doc('main').get();
    const lists = mainFile.data().liste;

    //deleta main + vse liste
    await firestore().collection('Userdata').doc(auth().currentUser.uid).collection(name).doc('main').delete();
    lists.forEach(async (list) => {
        await firestore().collection('Userdata').doc(auth().currentUser.uid).collection(name).doc(list).delete();
    });

    //deleta group v user doc
    let obj = { skupine: firestore.FieldValue.arrayRemove(name) };
    await firestore().collection('Userdata').doc(auth().currentUser.uid).update(obj);

    pushHistory({name: 'Delete'}, 'group', name)

    //rerendera
    this.componentDidMount();
  }

  convertTile = async (name) => {
    //preveri če je ziher
    const asyncAlert = () => new Promise((resolve) => {
      this.alertRef.current.showAlert('Wait!', `Are you sure you want to create a shared version of ${name}?`, 'NO', 'YES',
        () => { this.alertRef.current.hideAlert(); resolve(false) }, () => { this.alertRef.current.hideAlert(); resolve(true) }, true)
    });
    if (!await asyncAlert()) return;

    const id = uuid.v4();

    //naredi doc
    await firestore().collection('Shared').doc(id).set({
      owner: auth().currentUser.uid,
      groupName: name,
      history: [],
      waiting: [],
      access: [{
        name: auth().currentUser.displayName,
        uid: auth().currentUser.uid,
        email: auth().currentUser.email,
        perms: 'Admin'
      }]
    })

    //dobi podatke iz maina
    const doc = await firestore().collection('Userdata').doc(auth().currentUser.uid).collection(name).doc('main').get();
    const maindata = doc.data();
    const emails = maindata.emails;
    const liste = maindata.liste;
    const ljudje = maindata.ljudje;

    //ustvari main v shared
    await firestore().collection('Shared').doc(id).collection('group').doc('main').set({
      emails: emails,
      liste: liste,
      ljudje: ljudje
    })

    //loopa skozi liste
    for (const list of liste) {
      //dobi podatke
      const listDoc = await firestore().collection('Userdata').doc(auth().currentUser.uid).collection(name).doc(list).get();
      const listData = listDoc.data();

      //ustvari novo listo v shared
      await firestore().collection('Shared').doc(id).collection('group').doc(list).set(listData);
    }

    //doda v shared
    await firestore().collection('Userdata').doc(auth().currentUser.uid).update({
      shared: firestore.FieldValue.arrayUnion(id)
    })
  }

  async componentDidMount() {
    console.log('showgroups')

    const userDocument = await firestore().collection('Userdata').doc(auth().currentUser.uid).get()
    const groups = userDocument.data().skupine;

    storeData(['groups', groups]);

    let jsx = groups.map((group, i) => {
      return <Tile name={group} key={i} clickOnTile={this.clickOnTile} delTile={this.delTile} shared={false} convert={this.convertTile} group={true} />
    })
    this.setState({
      ...this.state,
      jsx: jsx
    })
    if (this.state.jsx == '') this.setState({...this.state, jsx: <Text>Add a group by clicking on the + button!</Text>})
  }


  render() {
    return (
      <>
        <ScrollView contentContainerStyle={{
          flexDirection: 'row',
          justifyContent: 'center',
          flexWrap: 'wrap',
        }}>
          {this.state.jsx}
        </ScrollView>

        <Alert ref={this.alertRef} />
      </>
    )
  }
}



export default Groups;
