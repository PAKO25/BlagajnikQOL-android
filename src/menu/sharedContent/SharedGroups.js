import React from 'react';
import { ScrollView, Text } from 'react-native';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import { storeData, Config, pushHistory } from '../../config';
import Tile from '../../content/Tile';
import Alert from '../../utils/Alert';

class SharedGroups extends React.Component {

  constructor(props) {
    super(props);

    this.alertRef = React.createRef();

    this.state = {
      jsx: <Text>Fetching data...</Text>,
    }
  }


  clickOnTile = (name, id, perms) => {
    storeData(['sharedGroupShown', id]);
    storeData(['sharedGroupShownName', name]);
    storeData(['sharedGroupShownPerms', perms]);
    console.log(perms)
    this.props.changeShown('lists', true) //shared = true
  }

  delTile = async (name, id) => {
    //preveri če je ziher
    console.log('delshared: ', name)

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

    //preveri če je owner
    const f = await firestore().collection('Shared').doc(id).get();
    const owner = f.data().owner;

    if (owner == auth().currentUser.uid) {

      //dobi vse liste v grupi
      const mainFile = await firestore().collection('Shared').doc(id).collection('group').doc('main').get();
      const lists = mainFile.data().liste;

      //deleta main + vse liste
      await firestore().collection('Shared').doc(id).collection('group').doc('main').delete();
      for (const list of lists) {
        await firestore().collection('Shared').doc(id).collection('group').doc(list).delete();
      }

      //deleta doc za grupo
      await firestore().collection('Shared').doc(id).delete();

    } else {
      //remova iz accessa
      const f = await firestore().collection('Shared').doc(id).get();
      const access = f.data().access;
      let perms;
      for (let a of access) {
        if (a.uid == auth().currentUser.uid) perms = a.perms;
      }
      await firestore().collection('Shared').doc(id).update({
        access: firestore.FieldValue.arrayRemove({
          name: auth().currentUser.displayName,
          uid: auth().currentUser.uid,
          perms: perms
        })
      })
    }

    //deleta group v user doc
    let obj = { shared: firestore.FieldValue.arrayRemove(id) };
    await firestore().collection('Userdata').doc(auth().currentUser.uid).update(obj);

    pushHistory({ name: 'Delete' }, 'sharedGroup', name);

    //rerendera
    this.componentDidMount();
  }

  groupSettings = (name, id) => {
    console.log('settings: ', name)
    this.props.navigation.navigate('GroupSettings', { name: name, id: id, fromHome: this.props.inHome })
  }

  async componentDidMount() {
    console.log('showSHAREDgroups')

    const userDocument = await firestore().collection('Userdata').doc(auth().currentUser.uid).get()
    const groupsById = userDocument.data().shared;

    let groups = [];
    let groupsByIdAfterSorting = [];
    let groupsByPerms = [];

    for (const group of groupsById) {
      //loopa skozi groupe, razdeli jih v 3 arreje po podatkih: name, id, perms
      const groupDoc = await firestore().collection('Shared').doc(group).get();
      const data = groupDoc.data();
      groups.push(data.groupName);
      groupsByIdAfterSorting.push(group);
      //dobi tvoje permse
      let perms;
      for (let a of data.access) {
        if (a.uid == auth().currentUser.uid) perms = a.perms;
      }
      groupsByPerms.push(perms)
    }


    storeData(['sharedGroups', groups]);
    storeData(['sharedGroupsById', groupsByIdAfterSorting]);

    let jsx = groups.map((group, i) => {
      return <Tile name={group} key={i} id={groupsByIdAfterSorting[i]} perms={groupsByPerms[i]}
        clickOnTile={this.clickOnTile} delTile={this.delTile} settings={this.groupSettings} shared={true} />
    })
    this.setState({
      ...this.state,
      jsx: jsx
    })
    if (this.state.jsx == '') this.setState({ ...this.state, jsx: <Text>Add a group by clicking on the + button!</Text> })
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



export default SharedGroups;
