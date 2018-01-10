// This strategy editor is in BETA mode, please
// exercise extreme caution and use exclusively at
// your own risk. No bets can or will be refunded in
// case of errors.

// Please note the strategy editor executes arbitrary
// javascript without a sandbox and as such, only use
// strategies from trusted sources, as they can be
// backdoored to lose all your money or have
// intentional exploitable weaknesses etc.

// To see the full engine API see this mirror:
///https://github.com/kungfuant/webserver/blob/master/client_new/scripts/game-logic/script-controller.js

//Engine events: 
var fakeBalance = 1000000;
var betAmountScalar = .007;
var lossAmountScalar = 1.04;
var cashOutMultiplier = 1000;


var lastBet = 0;
var testMode = true;

function BetFaker (balance = 100000) {
    var _betInSatoshis = 0;
    var _autoCashOutinPercent = 0;
    var _lastGamePlayState = 'NOT_PLAYED';
    var _balance = balance;

    function bet (betInSatoshis, autoCashOutinPercent, autoPlay) { 
        _betInSatoshis = betInSatoshis;
        _autoCashOutinPercent = autoCashOutinPercent;
        _balance = _balance - betInSatoshis;
    }

    function crashPoint (crashedAt) {
        if (crashedAt > _autoCashOutinPercent) {
            _lastGamePlayState = 'WON'
            var newBalance = _balance + _betInSatoshis * _autoCashOutinPercent/100;
            console.log('Balance:', _balance, 'Bet', _betInSatoshis, 'Cash Out Multiplier:', _autoCashOutinPercent/100, 'New Total:', newBalance);
            _balance = newBalance;
        } else {
            _lastGamePlayState = 'LOST'
        }
    }

    function lastGamePlay () {
        return _lastGamePlayState;
    }

    function getBalance () {
        return _balance;
    }

    engine.on('game_starting', function(info) {
        console.log('FakeBet Balance: ', _balance);
    });

    engine.on('game_crash', function(data) {
        crashPoint(data.game_crash);
    });

    return {
        bet: bet,
        crashPoint: crashPoint,
        lastGamePlay: lastGamePlay,
        getBalance: getBalance
    }
}

var fakeBet = new BetFaker(fakeBalance);

function getBalance () {
    if (testMode) {
        return fakeBet.getBalance();
    }
    return engine.getBalance();
}

function placeBet (betInSatoshis, autoCashOutinPercent, autoPlay) {
    if (testMode) {
        return fakeBet.bet(betInSatoshis, autoCashOutinPercent, autoPlay);
    }
    return engine.placeBet(betInSatoshis, autoCashOutinPercent, autoPlay);
}

function lastGamePlay() {
    if (testMode) {
        return fakeBet.lastGamePlay();
    }
    return engine.lastGamePlay();
}

function getStartingBet() {
    return Math.floor(getBalance() * betAmountScalar);
}

function getAfterLossBet(bet) {
    return Math.floor(bet * lossAmountScalar);
}

function getBet() {
    var newBet = 0;
    if (lastGamePlay() == 'WON' || lastGamePlay() == 'NOT_PLAYED') {
        newBet = getStartingBet();
        console.log('Starting I will bet: ', newBet);
    } else if (lastGamePlay() == 'LOST') {
        newBet = getAfterLossBet(lastBet);
        console.log('I lost last game, I will bet: ', newBet);
    }

    return newBet;
}

engine.on('game_starting', function(info) {
    console.log('Game Starting in ' + info.time_till_start);
    console.log('Last Bet was: ', lastBet);
    lastBet = getBet();
    placeBet(lastBet, cashOutMultiplier);
    //engine.placeBet(betInSatoshis, autoCashOutinPercent, autoPlay);
});

engine.on('game_started', function(data) {
    console.log('Game Started', data);
});

engine.on('game_crash', function(data) {
    console.log('Game crashed at ', data.game_crash);
});

engine.on('player_bet', function(data) {
    //console.log('The player ', data.username, ' placed a bet. This player could be me :o.')
});

engine.on('cashed_out', function(resp) {
    //console.log('The player ', resp.username, ' cashed out. This could be me.');
});

engine.on('msg', function(data) {
    //console.log('Chat message!...');
});

engine.on('connect', function() {
    //console.log('Client connected, this wont happen when you run the script');
});

engine.on('disconnect', function() {
    //console.log('Client disconnected');
});


//Getters:
console.log('Balance: ' + engine.getBalance());
console.log('The current payout is: ' + engine.getCurrentPayout());
console.log('My username is: ', engine.getUsername());
console.log('The max current bet is: ', engine.getMaxBet()/100, ' ethos');
console.log('The current maxWin is: ', engine.getMaxWin()/100, ' ethos');
// engine.getEngine() for raw engine 


//Helpers:
console.log('Was the last game played? ', engine.lastGamePlayed()?'Yes':'No');
console.log('Last game status: ', engine.lastGamePlay());


//Actions:
//Do this between the 'game_starting' and 'game_started' events
//engine.placeBet(betInSatoshis, autoCashOutinPercent, autoPlay);

//engine.cashOut(); //Do this when playing
//engine.stop(); //Stops the strategy
//engine.chat('Hello Spam');
