import React from 'react';
import { ScrollView, Text } from 'react-native';
import Tile from './Tile';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import { storeData, getData, Config, pushHistory } from '../config';
import Alert from '../utils/Alert';

class Lists extends React.Component {

  constructor(props) {
    super(props);

    this.alertRef = React.createRef();

    this.state = {
      jsx: <Text>Fetching data...</Text>,
    }
  }


  clickOnTile = (name) => {
    storeData(['listShown', name]);
    this.props.changeShown('humans', false) //shared = false
  }


  async componentDidMount() {
    console.log('show lists')

    const userDocument = await firestore().collection('Userdata').doc(auth().currentUser.uid)
      .collection(getData('groupShown')).doc("main").get();

    const lists = userDocument.data().liste;

    storeData(['lists', lists]);

    let jsx = lists.map((list, i) => {
      return <Tile name={list} key={i} clickOnTile={this.clickOnTile} delTile={this.delTile} shared={false} />
    })
    this.setState({
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
    await firestore().collection('Userdata').doc(auth().currentUser.uid).collection(getData('groupShown')).doc(name).delete();
    //deleta doc v mainu v groupu
    let obj = { liste: firestore.FieldValue.arrayRemove(name) };
    await firestore().collection('Userdata').doc(auth().currentUser.uid).collection(getData('groupShown')).doc('main').update(obj);

    pushHistory({name: 'Delete'}, getData('groupShown'), name)

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



export default Lists;
