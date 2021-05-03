function initializeView() {
  function buildParameterElement(key) {
    return `<li class="parameter" id="${key}">
          <div class="parameter-attribute">${key.toUpperCase()}</div>
          <div class="parameter-graph">
            <div class="gauge"></div>
          </div>
        </li>`
  }
  const $graphField = $("#graph-field");
  Params.getParamKeys().map(key => {
    $graphField.append(buildParameterElement(key));
  });
}

function getAnimationClass(delta) {
  if (delta > 0) {
    return "gauge-up";
  } else if (delta < 0) {
    return "gauge-down";
  } else {
    return false;
  }
}

function updateGraph() {
  Params.getParamKeys().map(key => {
    const val = localStorage.getItem(Params.config.storagePrefix + key);
    if (isNaN(val)) {
      return;
    }
    const prevVal = Params.getParam(key);
    const currentVal = Number(val);
    Params.updateParam(key, currentVal);
    const $gauge = $("#" + key).find(".gauge");
    const animationClass = getAnimationClass(currentVal - prevVal);
    if (animationClass) {
      $gauge.addClass(animationClass);
      setTimeout(function () {
        $gauge.removeClass(animationClass);
      }, 500);
    }
    $gauge.css("width", val + "%");
  });
}

initializeView();
window.setInterval(updateGraph, 1000);