const Log = {
  _log: [],
  all: function () { return this._log },
  record: function (myHand, opponentHand, result) {
    this._log.push({
      player: myHand,
      AI: opponentHand,
      result: result,
    });
  },
  last: function () {
    if (this._log.length < 1){
      return false;
    }
    return this._log[this._log.length - 1];
  },
  previous: function () {
    if (this._log.length < 2) {
      return false;
    }
    return this._log[this._log.length - 2];
  },
}