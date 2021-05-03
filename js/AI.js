if (!rule) {
  throw "AI depends on rule.js"
}

const AI = {
  config: {
    baseline: 50,
    cutoff: 30,
    noZeroFactor: 0.0001,
    primaryParamFactorWeight: 0.8,
    partialParamsFactorWeight: 0.2,
    partialParamsFactorAdditionallyMotivateElement: 1.25,
    strategyWeight: 0.9,
    preferenceWeight: 0.1,
  },
  _Log: undefined,
  _Params: undefined,
  strategyParams: [
    "bearer",
    "sticker",
    "prayer",
    "hunter",
    "cycler",
    "metaBearer",
    "metaSticker",
    "metaPrayer",
    "metaHunter",
    "metaCycler",
  ],
  preferenceParams: [
    "preferRock",
    "preferScissors",
    "preferPaper",
  ],
  randomHand: function (probability = undefined) {
    const bound = {};
    if (
      !probability ||
      !(probability.rock && probability.scissors && probability.paper)
    ) {
      bound.rock = 2 / 3;
      bound.scissors = 1 / 3;
    } else {
      bound.rock = 0 + probability.paper + probability.scissors;
      bound.scissors = 0 + probability.paper;
    }
    const r = Math.random();
    if (r > bound.rock) {
      // Player Will Select "rock";
      return "paper";
    } else if (r > bound.scissors) {
      // Player Will Select "scissors";
      return "rock";
    } else {
      // Player Will Select "paper";
      return "scissors";
    }
  },
  strategyFactorToProbability: function (strategyFactors) {
    const factorTotal = Object.keys(strategyFactors).reduce(function (acc, key) {
      return acc + strategyFactors[key];
    }, 0);
    const strategyProbability = {};
    Object.keys(strategyFactors).map(key => {
      strategyProbability[key] = strategyFactors[key] / factorTotal * this.config.strategyWeight;
    });
    return strategyProbability;
  },
  preferenceFactorToProbability: function () {
    const preferenceProbability = {};
    this.preferenceParams.map(key => {
      const hand = key.replace("prefer", "").toLowerCase();
      preferenceProbability[hand] = this._Params._values[key] / (this.config.baseline * this.preferenceParams.length) * this.config.preferenceWeight;
    });
    return preferenceProbability;
  },
  FactorToProbability: function (strategyFactors) {
    const strategyProbability = this.strategyFactorToProbability(strategyFactors); // return { stay: x, cycle: y, reverse: z } (x + y + z = 0.9)
    const preferenceProbability = this.preferenceFactorToProbability(); // return { rock: x, scissors: y, paper: z } (x + y + z = 0.1)
    const playerHand = this._Log.last().player;
    switch (playerHand) {
      case "rock":
        return {
          rock: strategyProbability.stay + preferenceProbability.rock,
          scissors: strategyProbability.cycle + preferenceProbability.scissors,
          paper: strategyProbability.reverse + preferenceProbability.paper,
        }
      case "scissors":
        return {
          rock: strategyProbability.reverse + preferenceProbability.rock,
          scissors: strategyProbability.stay + preferenceProbability.scissors,
          paper: strategyProbability.cycle + preferenceProbability.paper,
        }
      case "paper":
        return {
          rock: strategyProbability.cycle + preferenceProbability.rock,
          scissors: strategyProbability.reverse + preferenceProbability.scissors,
          paper: strategyProbability.stay + preferenceProbability.paper,
        }
    }
  },
  quantifyTendency: function (...params) {
    const baseline = this.config.baseline;
    const cutoff = this.config.cutoff;
    const noZeroFactor = this.config.noZeroFactor;
    if (params.length === 0) {
      return baseline - cutoff + noZeroFactor;
    } else if (params.length === 1) {
      return Math.max(Params.getParam(params[0]) - cutoff) + noZeroFactor;
    } else {
      const paramArr = params.map(key => {
        return {
          paramName: key,
          value: Math.max(Params.getParam(key) - cutoff)
        }
      });
      const sortedParamArr = paramArr.sort(function (a, b) { return b.value - a.value });
      const primaryParamFactor = sortedParamArr[0].value;
      const partialParamsFactor = paramArr.reduce(function (acc, obj) {
        return acc + obj.value;
      }, 0);
      return (primaryParamFactor * this.config.primaryParamFactorWeight) 
        + (partialParamsFactor * this.config.partialParamsFactorAdditionallyMotivateElement / params.length * this.config.partialParamsFactorWeight);
    }
  },
  modefyStrategyFactor: function (tendency) {
    const base = Math.min(tendency.stay, tendency.cycle, tendency.reverse);
    return {
      stay: tendency.stay - base,
      cycle: tendency.cycle - base,
      reverse: tendency.reverse - base,
    }
  },
  useInsightAfterBeat: function () {
    // Will stay: Prayer
    // Will cycle: Cycler, Hunter, MetaSticker, MetaHunte
    // Will reverse: MetaCycler
    const tendency = {
      stay: this.quantifyTendency("prayer"),
      cycle: this.quantifyTendency("cycler", "hunter", "metaSticker", "metaHunter"),
      reverse: this.quantifyTendency("metaCycler"),
    }
    return this.modefyStrategyFactor(tendency);
  },
  useInsightAfterLose: function () {
    // Will stay: Sticker, Hunter, MetaPrayer
    // Will cycle: Cycler, MetaCycler, MetaHunter
    // Will reverse: none
    const tendency = {
      stay: this.quantifyTendency("sticker", "hunter", "metaPrayer"),
      cycle: this.quantifyTendency("cycler", "metaCycler", "metaHunter"),
      reverse: this.quantifyTendency(),
    }
    debugger;
    return this.modefyStrategyFactor(tendency);
  },
  useInsightAfterDraw: function () {
    // Will stay: Bearer, MetaCycler
    // Will cycle: Cycler, MetaHunter
    // Will reverse: Hunter, MetaBearer
    const tendency = {
      stay: this.quantifyTendency("bearer", "metaCycler"),
      cycle: this.quantifyTendency("cycler", "metaHunter"),
      reverse: this.quantifyTendency("hunter", "metaBearer"),
    }
    return this.modefyStrategyFactor(tendency);
  },
  selectHand: function (Log, Params) {
    this._Log = Log;
    this._Params = Params;
    if (!Log || Log._log.length === 0 || !Params) {
      return this.randomHand();
    }
    const last = Log.last();

    let strategyFactors = undefined;
    switch (last.result) {
      case "playerPoint":
        strategyFactors = this.useInsightAfterLose();
        break;
      case "AIPoint":
        strategyFactors = this.useInsightAfterBeat();
        break;
      case "draw":
        strategyFactors = this.useInsightAfterDraw();
        break;
    }
    const probability = this.FactorToProbability(strategyFactors)
    return this.randomHand(probability);
  },
  updateInsight: function (Log, Params) {
    this._Log = Log;
    this._Params = Params;
    const prev = Log.previous();
    const last = Log.last();
    if (!last) {
      throw "Record log before update insight";
    } else if (!prev) {
      // Player prefers last hand
      const hand = last.player;
      const key = "prefer" + hand[0].toUpperCase() + hand.slice(1);
      Params.addToParam(key, 10);
    } else if (prev.result === "playerPoint" && last.player === prev.player) {
      // Player may be Sticker
      Params.addToParam("sticker", 10);
      // In addition, player may be MetaSticker
      Params.addToParam("metaSticker", 2);
      // Player may be Hunter
      Params.addToParam("hunter", 10);
      // But player is not MetaHunter
      // Player may be MetaPrayer
      Params.addToParam("metaPrayer", 5);
      if (last.result === "playerPoint") {
        // Player may be reinforced to be Sticker
        Params.addToParam("sticker", 5);
        // Player may be reinforced to be Hunter
        Params.addToParam("hunter", 5);
        // Player may be reinforced to be MetaPrayer
        Params.addToParam("metaPrayer", 5);
      } else if (last.result === "AIPoint") {
        // Player may be get to be less Sticker
        Params.addToParam("sticker", -5);
        // Player may be get to be less Hunter
        Params.addToParam("hunter", -5);
        // Player may be get to be less MetaPrayer
        Params.addToParam("metaPrayer", -5);
      }
    } else if (prev.result === "playerPoint" && last.player === prev.AI){
      // Player is Cycler
      Params.addToParam("cycler", 15);
      // In addition, player may be MetaCycler
      Params.addToParam("metaCycler", 2);
      if (last.result === "playerPoint") {
        // Player may be reinforced to be Cycler
        Params.addToParam("cycler", 5);
      } else if (last.result === "AIPoint") {
        // Player may be get to be less Cycler
        Params.addToParam("cycler", -5);
      }
    } else if (prev.result === "playerPoint") { // && player cycles reverse
      // Player may not MetaHunter
      Params.addToParam("metaHunter", -8);
      // Player may not MetaPrayer
      Params.addToParam("metaPrayer", -8);
      // Player may not MetaCycler
      Params.addToParam("metaCycler", -8);
      // Player may prefers last hand
      const hand = last.player;
      const key = "prefer" + hand[0].toUpperCase() + hand.slice(1);
      Params.addToParam(key, 5);
    } else if (prev.result === "AIPoint" && last.player === prev.player) {
      // Player is Prayer
      Params.addToParam("prayer", 15);
      // In addition, player may be MetaPrayer
      Params.addToParam("metaPrayer", 2);
      if (last.result === "playerPoint") {
        // Player may be reinforced to be Prayer
        Params.addToParam("prayer", 5);
      } else if (last.result === "AIPoint") {
        // Player may be get to be less Prayer
        Params.addToParam("prayer", -5);
      }
    } else if (prev.result === "AIPoint" && last.player === prev.AI) {
      // Player is MetaCycler
      Params.addToParam("metaCycler", 15);
      // In addition, player may be Cycler
      Params.addToParam("cycler", 2);
      if (last.result === "playerPoint") {
        // Player may be reinforced to be MetaCycler
        Params.addToParam("metaCycler", 5);
      } else if (last.result === "AIPoint") {
        // Player may be get to be less MetaCycler
        Params.addToParam("metaCycler", -5);
      }
    } else if (prev.result === "AIPoint") { // && player cycles reverse
      // Player is Hunter
      Params.addToParam("hunter", 15);
      // In addition, Player may be MetaHunter
      Params.addToParam("metaHunter", 2);
      if (last.result === "playerPoint") {
        // Player may be reinforced to be Hunter
        Params.addToParam("hunter", 5);
      } else if (last.result === "AIPoint") {
        // Player may be get to be less Hunter
        Params.addToParam("hunter", -5);
      }
    } else if (prev.result === "draw" && last.player === prev.player) {
      // Player is Bearer
      Params.addToParam("bearer", 15);
      // In addition, Player may be MetaBearer
      Params.addToParam("metaBearer", 2);
      if (last.result === "playerPoint") {
        // Player may be reinforced to be Bearer
        Params.addToParam("bearer", 5);
      } else if (last.result === "AIPoint") {
        // Player may be get to be less Bearer
        Params.addToParam("bearer", -5);
      }
    } else if (prev.result === "draw" && rule(last.player, prev.player) === -1) {
      // Player may MetaHunter
      Params.addToParam("metaHunter", 10);
      // Player may Cycler
      Params.addToParam("cycler", 10);
      if (last.result === "playerPoint") {
        // Player may be reinforced to be MetaHunter
        Params.addToParam("metaHunter", 5);
        // Player may be reinforced to be cycler
        Params.addToParam("cycler", 5);
      } else if (last.result === "AIPoint") {
        // Player may be get to be less MetaHunter
        Params.addToParam("metaHunter", -5);
        // Player may be get to be less cycler
        Params.addToParam("cycler", -5);

      }
    } else { // draw && player cycles reverse
      // Player may be Hunter
      Params.addToParam("hunter", 10);
      // In addition, Player may be MetaHunter
      Params.addToParam("metaHunter", 2);
      // Player may be MetaBearer
      Params.addToParam("metaBearer", 10);
      if (last.result === "playerPoint") {
        // Player may be reinforced to be Hunter
        Params.addToParam("hunter", 5);
        // Player may be reinforced to be MetaBearer
        Params.addToParam("metaBearer", 5);
      } else if (last.result === "AIPoint") {
        // Player may be get to be less Hunter
        Params.addToParam("hunter", -5);
        // Player may be get to be less MetaBearer
        Params.addToParam("metaBearer", -5);
      }
    }
    const sumStrategy = this.strategyParams.reduce(function (acc, key) {
      return acc + Params.getParam(key);
    }, 0);
    {
      const rate = (this.config.baseline * this.strategyParams.length) / sumStrategy;
      this.strategyParams.map(function (key) {
        Params.multiplyParam(key, rate);
      });
    }
    const sumPreference = this.preferenceParams.reduce(function (acc, key) {
      return acc + Params.getParam(key);
    }, 0);
    {
      const rate = (this.config.baseline * this.preferenceParams.length) / sumPreference;
      this.preferenceParams.map(function (key) {
        Params.multiplyParam(key, rate);
      });
    }
    Params.updateParamsStorage();
  }
}
