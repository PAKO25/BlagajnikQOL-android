import React from 'react';
import { ScrollView, Text } from 'react-native';
import Tile from '../../content/Tile';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import { storeData, getData, Config, pushHistory } from '../../config';
import Alert from '../../utils/Alert';

class SharedLists extends React.Component {

  constructor(props) {
    super(props);

    this.alertRef = React.createRef();

    this.state = {
      jsx: <Text>Fetching data...</Text>,
    }
  }


  clickOnTile = (name) => {
    console.log('clickonsharedlist: ', name)
    storeData(['sharedListShown', name])
    this.props.changeShown('humans', true) //shared = true
  }


  async componentDidMount() {
    console.log('showsharedlists')

    const group = getData('sharedGroupShown');
    const mainDoc = await firestore().collection('Shared').doc(group).collection('group').doc('main').get();

    const data = mainDoc.data().liste;
    storeData(['sharedLists', data]);

    let jsx = data.map((list, i) => {
      return <Tile name={list} key={i} clickOnTile={this.clickOnTile} delTile={this.delTile} shared={false} />
    })
    this.setState({
      ...this.state,
      jsx: jsx
    })
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

    //deleta doc
    await firestore().collection('Shared').doc(getData('sharedGroupShown')).collection('group').doc(name).delete();
    //deleta doc v mainu v groupu
    let obj = { liste: firestore.FieldValue.arrayRemove(name) };
    await firestore().collection('Shared').doc(getData('sharedGroupShown')).collection('group').doc('main').update(obj);

    pushHistory({name: 'Delete'}, getData('sharedGroupShownName'), name, false, true, getData('sharedGroupShown'), auth().currentUser.displayName)

    //rerendera
    this.componentDidMount();
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



export default SharedLists;
