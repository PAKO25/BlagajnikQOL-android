import React from 'react';
import { ScrollView, Text } from 'react-native';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import { storeData, Config, pushHistory } from '../../config';
import Tile from '../../content/Tile';
import Alert from '../../Alert';

class SharedGroups extends React.Component {

  constructor(props) {
    super(props);

    this.alertRef = React.createRef();

    this.state = {
      jsx: <Text>Fetching data...</Text>,
    }
  }


  clickOnTile = (name, id) => {
    storeData(['sharedGroupShown', id]);
    storeData(['sharedGroupShownName', name]);
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

    //dobi vse liste v grupi
    const mainFile = await firestore().collection('Shared').doc(id).collection('group').doc('main').get();
    const lists = mainFile.data().liste;

    //deleta main + vse liste
    await firestore().collection('Shared').doc(id).collection('group').doc('main').delete();
    for (const list of lists) {
        await firestore().collection('Shared').doc(id).collection('group').doc(list).delete();
    }

    //deleta group v user doc
    let obj = { shared: firestore.FieldValue.arrayRemove(id) };
    await firestore().collection('Userdata').doc(auth().currentUser.uid).update(obj);

    //deleta doc za grupo
    await firestore().collection('Shared').doc(id).delete();

    pushHistory({name: 'Delete'}, 'sharedGroup', name);

    //rerendera
    this.componentDidMount();
  }

  groupSettings = (name, id) => {
    console.log('settings: ', name)
    this.props.navigation.navigate('GroupSettings', {name: name, id: id, fromHome: this.props.inHome})
  }

  async componentDidMount() {
    console.log('showSHAREDgroups')

    const userDocument = await firestore().collection('Userdata').doc(auth().currentUser.uid).get()
    const groupsById = userDocument.data().shared;

    let groups = [];
    let groupsByIdAfterSorting = [];

    for (const group of groupsById) {
      //preveri če je v groupu, če ni ga remova, če je pa dobi njegov name
      const groupDoc = await firestore().collection('Shared').doc(group).get();
      const data = groupDoc.data().groupName;
      groups.push(data);
      groupsByIdAfterSorting.push(group);
    }


    storeData(['sharedGroups', groups]);
    storeData(['sharedGroupsById', groupsByIdAfterSorting]);

    let jsx = groups.map((group, i) => {
      return <Tile name={group} key={i} id={groupsByIdAfterSorting[i]}
              clickOnTile={this.clickOnTile} delTile={this.delTile} settings={this.groupSettings} shared={true} />
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



export default SharedGroups;
