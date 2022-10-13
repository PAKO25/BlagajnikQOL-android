import React from "react";
import { View, BackHandler } from "react-native";
import Groups from "./content/Groups";
import Lists from "./content/Lists";
import Humans from "./content/Humans";
import { Config } from "./config";
import Frame from "./Frame";
import AddButton from './AddButton';
import HomeExtension from "./content/HomeExtension";


class Home extends React.Component {

    constructor(props) {
        super(props);

        this.state = {
            shown: 'groups',
            render: true
        }
        this.HomeExtension = React.createRef();
    }

    componentDidMount() {
        //listener za rerender zarad addScreena
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
        if (Config.settings.showShared) {
            //homeextension backhandler
            this.HomeExtension.current.handleBack();

        } else {
            if (this.state.shown == 'lists') this.changeShown('groups');
            if (this.state.shown == 'humans') this.changeShown('lists');
        }

        return true;
    }


    render() {

        let show;

        if (this.state.shown == 'groups') show = <Groups changeShown={this.changeShown} />
        if (this.state.shown == 'lists') show = <Lists changeShown={this.changeShown} />
        if (this.state.shown == 'humans') show = <Humans changeShown={this.changeShown} />


        return (
            <Frame navigation={this.props.navigation} hideToolbarOnKeyboard={false}>

                {this.state.render ? (
                    <>
                        {!Config.settings.showShared ? (
                            <>
                                <View style={{ top: 20, marginBottom: 250 }}>
                                    {/* navigator za med contentom */}
                                    {show}
                                </View>
                                <AddButton handler={() => { this.props.navigation.navigate('AddScreen', { name: this.state.shown, shared: false }) }} />
                            </>
                        ) : (
                            <>
                                <HomeExtension navigation={this.props.navigation} ref={this.HomeExtension} />
                            </>
                        )}
                    </>
                ) : (null)}

            </Frame>
        )
    }
}

export default Home;