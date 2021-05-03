const initialGameState = {
  log: [],
  score: {
    player: 0,
    opponent: 0,
  },
  wait: false,
  waitTime: 1500,
};
const Game = _.cloneDeep(initialGameState);

function generateHandInnerHtml(hand) {
  switch (hand) {
    case "rock": return '<div class="hand-wrapper hand-rock"><span class="hand-initial">R</span>ock</div></div>';
    case "scissors": return '<div class="hand-wrapper hand-scissors"><span class="hand-initial">S</span>cissors</div></div>';
    case "paper": return '<div class="hand-wrapper hand-paper"><span class="hand-initial">P</span>aper</div>';
  }
}

function generateGameMessage(result) {
  switch (result) {
    case "playerPoint": return 'YOUR POINT';
    case "AIPoint": return 'AI\'S POINT';
    case "draw": return 'draw';
  }
}

function judgeResult(myHand, opponentHand) {
  switch (rule(myHand, opponentHand)) {
    case 1: return "playerPoint";
    case -1: return "AIPoint";
    case 0: return "draw";
  }
}

function setOpponentHand(hand) {
  const $hand = $("#opponent-hand");
  const innerHtml = generateHandInnerHtml(hand);
  $hand.html(innerHtml).addClass("active").addClass("hand-" + hand);
}

function removeOpponentHand() {
  const $hand = $("#opponent-hand");
  $hand.empty().removeClass("active");
}

function setTelop(result) {
  const $telop = $("#play-field").find(".telop");
  $telop.html(generateGameMessage(result)).addClass("active");
}

function removeTelop() {
  const $telop = $("#play-field").find(".telop");
  $telop.empty().removeClass("active");
}

function countupPoint(result) {
  const myScoreBorad = $("#my-point").find(".score-board-score");
  const opponentScoreBorad = $("#opponent-point").find(".score-board-score");

  if (result === "playerPoint") {
    Game.score.player += 1;
  } else if (result === "AIPoint") {
    Game.score.opponent += 1;
  }
  myScoreBorad.text(Game.score.player);
  opponentScoreBorad.text(Game.score.opponent);
}

function hideMyHandExcept(hand) {
  switch (hand) {
    case "rock":
      $("#my-hand-scissors").removeClass("active");
      $("#my-hand-paper").removeClass("active");
      break;
    case "scissors":
      $("#my-hand-rock").removeClass("active");
      $("#my-hand-paper").removeClass("active");
      break;
    case "paper":
      $("#my-hand-rock").removeClass("active");
      $("#my-hand-scissors").removeClass("active");
      break;
  }
}

function resetMyHand() {
  $("#my-hand-rock").addClass("active");
  $("#my-hand-scissors").addClass("active");
  $("#my-hand-paper").addClass("active");
}

function gameover(winner) {
  $("#overlay-gameover").addClass("active");
  const $gameoverMessageElement = $("#gameover-message");
  if (winner === "player") {
    $gameoverMessageElement.html("Congratulations!<br>...How do you think to be beat me?");
  } else if (winner === "opponent") {
    $gameoverMessageElement.html("You won't beat me. Will you try again?");
  } else {
    $gameoverMessageElement.html("There is bug. Or are you trying to hack?");
  }
}

function reset(e) {
  e.preventDefault();
  Game.score = _.cloneDeep(initialGameState.score);
  Game.wait = false;
  removeTelop();
  removeOpponentHand();
  resetMyHand();
  countupPoint(null);
  $("#gameover-message").empty();
  $("#overlay-gameover").removeClass("active");
}

function game(myHand) {
  if (Game.wait) {
    return false;
  }
  Game.wait = true;
  const opponentHand = AI.selectHand(Log, Params);
  setOpponentHand(opponentHand);
  hideMyHandExcept(myHand);
  const result = judgeResult(myHand, opponentHand)
  setTelop(result);
  countupPoint(result);

  Log.record(myHand, opponentHand, result);
  AI.updateInsight(Log, Params);

  if (Game.score.player >= 10) {
    gameover("player");
    return true;
  } else if (Game.score.opponent >= 10) {
    gameover("opponent");
    return true;
  }

  window.setTimeout(removeTelop, Game.waitTime);
  window.setTimeout(removeOpponentHand, Game.waitTime);
  window.setTimeout(resetMyHand, Game.waitTime);
  window.setTimeout(function () {
    Game.wait = false;
  }, Game.waitTime);
}

$("#my-hand-rock").on("click", game.bind(null, "rock"));
$("#my-hand-scissors").on("click", game.bind(null, "scissors"));
$("#my-hand-paper").on("click", game.bind(null, "paper"));