import React from "react";
import { BackHandler } from "react-native";
import SharedGroups from './sharedContent/SharedGroups';
import SharedLists from "./sharedContent/SharedLists";
import AddButton from '../utils/AddButton';
import SharedHumans from "./sharedContent/SharedHumans";
import Frame from "../utils/Frame";

class Share extends React.Component {

    constructor(props) {
        super(props);

        this.state = {
            shown: 'groups',
            render: true,
        }
    }

    componentDidMount() {
        this.props.navigation.addListener('focus', () => {
            this.setState({
                ...this.state,
                render: true
            });
            BackHandler.addEventListener('hardwareBackPress', this.handleBack);
        })
        this.props.navigation.addListener('blur', () => {
            this.setState({
                ...this.state,
                render: false
            });
            BackHandler.removeEventListener('hardwareBackPress', this.handleBack);
        })
    }


    changeShown = (towhat) => {
        this.setState({
            ...this.state,
            shown: towhat
        })
    }

    handleBack = () => {
        //custom handler
        if (this.state.shown == 'lists') {
            this.changeShown('groups');
        } else if (this.state.shown == 'humans') {
            this.changeShown('lists');
        } else {
            this.props.navigation.goBack();
        }
        console.log('sharedback')
        return true;
    }

    render() {

        let show;

        if (this.state.shown == 'groups') show = <SharedGroups changeShown={this.changeShown} navigation={this.props.navigation} inHome={false}/>
        if (this.state.shown == 'lists') show = <SharedLists changeShown={this.changeShown} />
        if (this.state.shown == 'humans') show = <SharedHumans changeShown={this.changeShown} />

        return (
            <Frame navigation={this.props.navigation} hideToolbarOnKeyboard={false}>

                    {this.state.render ? (
                        <>
                        { show }
                        </>
                    ) : (null)}

                    <AddButton handler={() => { this.props.navigation.navigate('AddScreen', { name: this.state.shown, shared: true }) }} />
            </Frame>
        )
    }
}

export default Share;