/**
 * Self-adjusting interval to account for drifting
 * 
 * @param {function} workFunc  Callback containing the work to be done
 *                             for each interval
 * @param {int}      interval  Interval speed (in milliseconds)
 * @param {function} errorFunc (Optional) Callback to run if the drift
 *                             exceeds interval
 */
function AdjustingInterval(workFunc, pomodoroTimer, interval, errorFunc) {
    var that = this;
    var expected, timeout;
    this.interval = interval;
    this.pomodoroTimer = pomodoroTimer;

    this.start = function() {
        expected = Date.now() + this.interval;
        timeout = setTimeout(step, this.interval);
        console.log("AdjustingInterval started");
    }

    this.stop = function() {
        clearTimeout(timeout);
        console.log('Stopped');
    }

    function step() {
        var drift = Date.now() - expected;
        if (drift > that.interval) {
            if (errorFunc) errorFunc();
        }
        workFunc(that.pomodoroTimer);
        expected += that.interval;
        timeout = setTimeout(step, Math.max(0, that.interval-drift));
    }
}

function setPomodoro(time = 25) {
    let pomodoroTimer = new Date();
    if (new Date().getMinutes() + time > 60) {
        pomodoroTimer.setHours(pomodoroTimer.getHours() + 1);
        pomodoroTimer.setMinutes(new Date().getMinutes() + time - 60);
    } else {
        pomodoroTimer.setMinutes(new Date().getMinutes() + time);
    }
    return pomodoroTimer;
}

// TODO : 
//      (i) Fix ending of timer!!! 
//      (ii) Add a start, pause, reset button 
//      (iii) add fourth line to show timer left 
//      (iv) add a sound when timer ends 
//      (v) add a sound when timer starts
//      (vi) add seconds to setPomodoro function

// Define the work to be done until pomodoro timer is stopped
var doWork = function(pomodoroTimer) {
    let endingFlag = false;
    if (new Date().getHours() == pomodoroTimer.getHours() && new Date().getMinutes() == pomodoroTimer.getMinutes())
        endingFlag = true;
    console.log("Execute until " + pomodoroTimer.getHours() + ":" + pomodoroTimer.getMinutes());
    if (endingFlag) ticker.stop();
    // return endingFlag;
};

// Define what to do if something goes wrong
var doError = function() {
    console.warn('The drift exceeded the interval.');
};

var pomodoroTimer = setPomodoro(1);
var ticker = new AdjustingInterval(doWork, pomodoroTimer, 1000, doError);

document.body.onkeyup = function(e) {
    if (e.key == " " ||
        e.code == "Space" ||      
        e.keyCode == 32      
    ) {
        ticker.start();
    }
  }

// You can start or stop your timer at will
// ticker.start();
// ticker.stop();

// You can also change the interval while it's in progress
// ticker.interval = 99;