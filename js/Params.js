const Params = {
  config: {
    storagePrefix: "AI.insight_param_",
  },
  getParamKeys: function () {
    return Object.keys(Params._values);
  },
  syncStorage: function () {
    const params = this._values;
    const config = this.config;
    this.getParamKeys().map(key => {
      const storageKey = config.storagePrefix + key;
      const val = localStorage.getItem(storageKey);
      if (!val) {
        localStorage.setItem(storageKey, params[key]);
      } else {
        this.updateParam(key, Number(val));
      }
    });
  },
  updateParamsStorage: function () {
    const params = this._values;
    const config = this.config;
    this.getParamKeys().map(key => {
      const storageKey = config.storagePrefix + key;
      localStorage.setItem(storageKey, params[key]);
    });
  },
  updateParam: function (key, value) {
    const params = this._values;
    params[key] = value;
  },
  addToParam: function (key, value) {
    const params = this._values;
    params[key] = params[key] + value;
  },
  multiplyParam: function (key, value) {
    const params = this._values;
    params[key] = params[key] * value;
  },
  getParam: function (key) {
    return this._values[key];
  },
  _values: {
    bearer: 50,
    sticker: 50,
    prayer: 50,
    hunter: 50,
    cycler: 50,
    metaBearer: 50,
    metaSticker: 50,
    metaPrayer: 50,
    metaHunter: 50,
    metaCycler: 50,
    preferRock: 50,
    preferScissors: 50,
    preferPaper: 50,
  }
}

Params.syncStorage();
