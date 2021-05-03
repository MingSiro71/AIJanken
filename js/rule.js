function rule(myHand, opponentHand) {
  function handToNumeric(hand) {
  switch (hand) {
    case "rock": return 0;
    case "scissors": return 1;
    case "paper": return 2;
  }
  }
  if (myHand === opponentHand) {
   return 0;
  } else if (
  handToNumeric(opponentHand) - handToNumeric(myHand) === 1 ||
  handToNumeric(opponentHand) - handToNumeric(myHand) === -2
  ) {
    return 1;
  } else {
    return -1;
  }
}