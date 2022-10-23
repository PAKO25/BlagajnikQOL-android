import React from 'react';
import { StyleSheet, Text, TouchableOpacity, Image } from 'react-native';

class Tile extends React.Component {

  constructor(props) {
    super(props);
  }

  render() {
    return (
      <TouchableOpacity style={styles.button} 
      onPress={() => {this.props.clickOnTile(this.props.name, this.props.id, this.props.perms ? this.props.perms : null)}} 
      onLongPress={() => {this.props.delTile(this.props.name, this.props.id)}}>
        <Text style={styles.text}>{this.props.name}</Text>

        {this.props.shared ? (
          <>
          <TouchableOpacity style={styles.settingsField} onPress={() => {this.props.settings(this.props.name, this.props.id)}}>
            <Image source={require('../../assets/groupsettingsicon.png')} style={styles.settingsIcon}></Image>
          </TouchableOpacity>
          </>
        ) : (null)}
      </TouchableOpacity>
    )
  }
}


const styles = StyleSheet.create({
  button: {
    width: 130,
    height: 130,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#D9D9D93F',
    borderRadius: 30,
    marginHorizontal: 15,
    marginVertical: 15
  },
  text: {
    color: '#000000',
    fontSize: 20
  },
  settingsField: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: '#00000050',
    borderRadius: 40,
    width: 30,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center'
  },
  settingsIcon: {
    width: 20,
    height: 20
  }
})


export default Tile;
