class Timer {
    constructor () {
      this.isRunning = false;
      this.startTime = 0;
      this.overallTime = 0;
    }

    _getTimeElapsedSinceLastStart () {
        if (!this.startTime) {
            return 0;
        }
        return Date.now() - this.startTime;
    }

    start () {
        if (this.isRunning) {
            return console.error('Timer is already running');
        }
        this.isRunning = true;
        this.startTime = Date.now();
    }
  
    stop () {
        if (!this.isRunning) {
            return console.error('Timer is already stopped');
        }
        this.isRunning = false;
        this.overallTime = this.overallTime + this._getTimeElapsedSinceLastStart();
    }

    reset () {
        this.overallTime = 0;
        if (this.isRunning) {
            this.startTime = Date.now();
            return;
        }
        this.startTime = 0;
    }
  
    getTime () {
        if (!this.startTime) {
            return 0;
        }
        if (this.isRunning) {
            return this.overallTime + this._getTimeElapsedSinceLastStart();
        }
        return this.overallTime;
    }
}



let pomodoroTimer = new Timer();
let breakTimer = false;
document.body.onkeyup = function(e) {
    if ((e.key == " " ||
        e.code == "Space" ||      
        e.keyCode == 32      
    ) && !pomodoroTimer.isRunning) {
        pomodoroTimer.start();
        var _ = setInterval(() => {
            const timeInSeconds = Math.round(pomodoroTimer.getTime() / 1000);
            console.log(timeInSeconds);
            if (timeInSeconds / 60 === 1) {
                pomodoroTimer.stop();
                console.log("Time is up!");
                clearInterval(_);
            }
        }, 1000)
    }
}

// // TODO : 
// //      (i) Fix ending of timer!!! 
// //      (ii) Add a start, pause, reset button 
// //      (iii) add fourth line to show timer left 
// //      (iv) add a sound when timer ends 
// //      (v) add a sound when timer starts
// //      (vi) add seconds to setPomodoro function
// //     (vii) add a function to set the timer to a specific time
// //    (viii) setup TWEEN.js to animate intro


