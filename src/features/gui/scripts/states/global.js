'use strict';


const {State} = require('@omnigame/core');


class Global extends State {
    onIsLoaded() {
        return true;
    }

    onIsLoading() {
        return false;
    }

    onIsReady() {
        return true;
    }
}


module.exports = Global;
