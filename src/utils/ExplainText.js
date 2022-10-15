import React from "react";
import { StyleSheet, Text, View, Animated, Easing } from "react-native";

class ExplainText extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            opacity: new Animated.Value(0)
        };
    }

    componentDidUpdate(prevProps) {
        if (this.props != prevProps && this.props.shown) {
            this.startAnimation();
        }
    }

    startAnimation = () => {
        Animated.timing(this.state.opacity).stop();
        Animated.timing(this.state.opacity, {
            toValue: 1,
            duration: 3000,
            useNativeDriver: false,
            easing: Easing.bezier(.13,.96,.42,.83)
        }).start(() => {
            setTimeout(() => {
                Animated.timing(this.state.opacity, {
                    toValue: 0,
                    duration: 3000,
                    useNativeDriver: false,
                    easing: Easing.bezier(.13,.96,.42,.83)
                }).start()
            }, 2000)
        });
    }
    render() {
        return (
            <Animated.View style={[Style.cell, { top: this.props.y, opacity: this.state.opacity, transform: [{scale: this.state.opacity}] }]}>
                <Text style={Style.text}>{this.props.text}</Text>
            </Animated.View>
        )
    }
}

const Style = StyleSheet.create({
    cell: {
        justifyContent: 'center',
        alignItems: 'center',
        position: 'absolute',
        width: 300,
        height: 40,
        borderRadius: 30,
        backgroundColor: '#00000020'
    },
    text: {
        marginHorizontal: 10,
        color: '#000000'
    }
})

export default ExplainText;