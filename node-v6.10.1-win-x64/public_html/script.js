class CaseCollection extends Array {
  constructor(...args) {
    super(...args);
  }

  removeCase(item, lag) {
    let self = this;
    let index;
    if (this.length) {
      cases.removeQueue++;
      let elem;
      let nextElem;
      if ((typeof item) === "number") {
        elem = this[item];
        this.splice(item, 1); // Метод splice() изменяет содержимое массива, удаляя существующие элементы и/или добавляя новые.
        index = item;
      } else if ((typeof item) === "object") {
        this.forEach((comp, i) => { // Метод forEach() выполняет указанную функцию один раз для каждого элемента в массиве.
          if (comp === item) {
            elem = comp;
            nextElem = this[i + 1];
            this.splice(i, 1);
            index = i;
          }
        });
      }

      console.log(elem);
      if (elem) {
        let parent = elem.parentElement; // Свойство Node.parentElement только для чтения, возвращает родителя узла DOM Element, или null если узел не имеет родителя, или его родитель не DOM Element.
        elem.className = this.classRem;
        parent.style.transition = parent.savedTransition;
        elem.addEventListener('animationend', (e) => {
          if (elem === e.target) {
            upElements(elem);
            parent.removeChild(elem);
            parent.removeQueue--;
          }
        });
      }
    }

    function upElements(removedElem) {
      let heightRemElem = self._countHeight(removedElem);
      let parent = removedElem.parentElement;
      let time = 0;
      parent.totalHeightReduce += heightRemElem;
      if (parent.removeQueue > 1) {
        console.log("The queue is too long");
      } else {
        let secondY = 1 + 1 / (0.001 * Math.pow(parent.totalHeightReduce, 2));
        // console.log(secondY);
        for (let i = index; i < self.length; i++) {
          // if (lag) {
            self[i].style.transitionDelay = time + 's';
            self[i].style.transitionTimingFunction = `cubic-bezier(0,1.09,.53,${secondY})`;
            time += 0.1;
          // }
          self[i].style.top = parseInt(self[i].style.top) - parent.totalHeightReduce + 'px';
        }
        parent.style.transitionDelay = time + 's';
        parent.style.height = parseInt(parent.style.height) - parent.totalHeightReduce + 'px';
        parent.totalHeightReduce = 0;
      }
    }
  }

  addCase(elem, parent) {
    let self = this;
    let top = 0;
    elem.style.top = top + 'px';
    elem.style.left = '0px';
    this.unshift(elem);
    parent.insertBefore(elem, parent.firstChild);
    downElements(elem, parent);
    console.log(parent.savedTransition);
    parent.style.transition = 'none';
    parent.style.transitionDelay = '0s';
    // setTimeout(() => elem.classList.add("field-show"), 100);

    function downElements(addedElem, parent) {
      let heightAddElem = self._countHeight(addedElem);
      let time = 0;
      for (let i = 1; i < self.length; i++) {
        self[i].style.transitionDelay = time + 's';
        self[i].style.top = parseInt(self[i].style.top) + heightAddElem + 'px';
        // time += 0.1;
      }
      parent.style.transitionDelay = time + 's';
      let parentHeight = 0;
      if (parent.style.height) parentHeight = parseInt(parent.style.height);
      parent.style.height = parentHeight + heightAddElem + 'px';
    }
  }

  set classForRemove(classList) {
    this.classRem = classList;
  }

  _countHeight(elem) {
    if (elem) {
      let computedStyle = getComputedStyle(elem);
      let height = (parseInt(computedStyle.height) + parseInt(computedStyle.marginBottom));
      return height;
    }
  }
}

var oldListeners = {};

function sampleOnLoad(sampleJSON) {
  var find = document.querySelector("#find"),
      cases = document.querySelector("#cases"),
      replacement = document.querySelector("#replacement");

  var sucCases = 0;
  cases.innerHTML = "";
  cases.style.height = '0px'
  var casesArray = new CaseCollection();
  casesArray.classForRemove = "case-block animated zoomOut";
  // var inputs = [],
  //     answers = [];
  // var classMatch = ["no-match", "match"],
  //     answerMatch = ["No match", "Match"];
  cases.style.transition = '';
  cases.savedTransition = getComputedStyle(cases).transition;
  cases.totalHeightReduce = 0;
  cases.removeQueue = 0;
  createCases();
  omniHandler(true);

  find.oninput = function() {
    omniHandler();
  };

  replacement.oninput = function() {
    omniHandler();
  };

  let deleteButton = document.querySelector('#delete');
  if (oldListeners.deleteButton) {
    deleteButton.removeEventListener('click', oldListeners.deleteButton);
  }
  oldListeners.deleteButton = () => casesArray.removeCase(0);
  deleteButton.addEventListener('click', oldListeners.deleteButton);

  let addButton = document.querySelector('#add');
  if (oldListeners.addButton) {
    addButton.removeEventListener('click', oldListeners.addButton);
  }
  oldListeners.addButton = () => createCaseBlock();
  document.querySelector('#add').addEventListener('click', oldListeners.addButton);

  // casesArray.forEach(function(caseBlock) {
  //   caseBlock.input.oninput = () => handlerComparison(caseBlock.input);
  // });

  function createCases() {
    find.value = sampleJSON.regex;
    document.querySelector(".description").innerHTML = sampleJSON.description;
    var parent = find.parentElement.parentElement;
    var divRepl = parent.children[1];
    var conditions = document.querySelector(".conditions");

    if (sampleJSON.type == "comparison") {
      divRepl.classList.remove("field-show");
      replacement.value = "";
      conditions.classList.remove("full-conditions");
      casesArray.typeRegex = 0;
    } else if (sampleJSON.type == "replacement") {
      replacement.value = sampleJSON.replace;
      divRepl.classList.add("field-show");
      conditions.classList.add("full-conditions");
      casesArray.typeRegex = 1;
    }
    for (let i = sampleJSON.values.length; i--; ) {
      createCaseBlock(sampleJSON.values[i])
    }
  }

  function createCaseBlock(value) {
    var caseBlock = document.createElement('div');
    var input = document.createElement('input');
    var answer = document.createElement('div');
    var deleteButton = document.createElement('a');
    let expectation;
    deleteButton.setAttribute('role', 'button');
    deleteButton.className = "button anim-button delete-button";
    deleteButton.innerHTML =
      `<span>remove</span>
      <div class="icon">
        <i class="fa fa-remove"></i>
      </div>`;
    deleteButton.addEventListener('click', () => {
      caseBlock.className = "case-block animated zoomOut";
      casesArray.removeCase(caseBlock);
    });

    caseBlock.className = "case-block animated zoomIn";
    input.setAttribute('type', 'text');
    input.setAttribute('placeholder', 'Place your sample here');
    input.value = value ? value.value : '';
    caseBlock.appendChild(input);
    caseBlock.appendChild(answer);

    caseBlock.input = input;
    caseBlock.answer = answer;

    if (casesArray.typeRegex === 0) {
      answer.className = "answer";
      handlerComparison(caseBlock.input, caseBlock.answer);
      input.oninput = () => handlerComparison(caseBlock.input, caseBlock.answer);
    } else {
      expectation = document.createElement('input');
      expectation.setAttribute('type', 'text');
      expectation.setAttribute('placeholder', 'Expectation');
      expectation.className = "expectation";
      expectation.value = value ? value.expectation : '';
      caseBlock.expectation = expectation;
      input.className = "input-for-replace";
      answer.className = "answer text-answer no-match-replacement";
      answer.innerHTML = value ? value.answer : '<span>Replacement result</span>';
      caseBlock.appendChild(expectation);
      handlerReplacement(caseBlock.input, caseBlock.answer, caseBlock.expectation);
      input.oninput = () => handlerReplacement(caseBlock.input, caseBlock.answer, caseBlock.expectation);
      expectation.oninput = () => handlerReplacement(caseBlock.input, caseBlock.answer, caseBlock.expectation);
    }

    caseBlock.appendChild(deleteButton);
    casesArray.addCase(caseBlock, cases);
  }

  function omniHandler(first) {
    let regex = readRegex()
    if (!first) {
      if (regex) {
        casesArray.forEach(function(caseBlock) {
          if (casesArray.typeRegex === 0) {
            handlerComparison(caseBlock.input, caseBlock.answer);
          } else {
            handlerReplacement(caseBlock.input, caseBlock.answer, caseBlock.expectation);
          }
        });
      } else {
        casesArray.forEach(function(caseBlock) {
          if (casesArray.typeRegex === 0) {
            removeMatchComp(caseBlock.answer);
          } else {
            removeMatchRepl(caseBlock.answer);
          }
        });
      }
    }
  }

  function readRegex() {
    var regex = /^\/.*\/(?:([ig])(?!\1)){0,2}$/;
    var value = find.value;
    if (regex.test(value)) {
      find.classList.remove("wrong-regex");
      regex = /\/(.*)\/(.*)$/;
      var found = value.match(regex);
      if (casesArray.typeRegex === 0) {
        regex = new RegExp("^" + found[1] + "$", found[2]);
      } else {
        regex = new RegExp(found[1], found[2]);
      }

      return regex;
    } else {
      find.classList.add("wrong-regex");
      return false;
    }
  }

  function handlerComparison(input, answer) {
    // var answer = input.nextElementSibling;
    // var answer = input.parentElement.querySelector('.answer');
    var regex = readRegex();
    if (regex instanceof RegExp) {
      if (regex.test(input.value)) {
        answer.classList.remove("no-match")
        answer.classList.add("match");
        answer.innerHTML = "Match";
      } else {
        removeMatchComp(answer);
      }
    }
  }

  function removeMatchComp(answer) {
    answer.classList.remove("match")
    answer.classList.add("no-match");
    answer.innerHTML = "No match";
  }

  function handlerReplacement(input, answer, expectation) {
    // var answer = input.nextElementSibling;
    // var answer = input.parentElement.querySelector('.answer');
    var regex = readRegex();
    if (regex instanceof RegExp) {
      let result = input.value.replace(regex, replacement.value);
      // console.log("Result " + input.value);
      // console.log("regex " + regex);
      // console.log("replacement " + replacement);
      if (result) {
        answer.innerHTML = result;
      } else {
        answer.innerHTML = '<span>Replacement result</span>';
      }
      if (result && (result === expectation.value)) {
        answer.classList.remove("no-match-replacement")
        answer.classList.add("match-replacement");
      } else {
        removeMatchRepl(answer);
      }
    }
  }

  function removeMatchRepl(answer) {
    answer.classList.remove("match-replacement")
    answer.classList.add("no-match-replacement");
    // answer.innerHTML = "No match";
  }
}

getFromServer('1');

function getComparison() {
  getFromServer('1');
}

function getReplacement() {
  getFromServer('2');
}

function getFromServer(id) {
  if (id === undefined) return;
  var xhr = new XMLHttpRequest();
  xhr.open('GET', `/getsample?id=${id}`, true);
  xhr.setRequestHeader("X-Requested-With", "XMLHttpRequest");
  xhr.send();

  xhr.onreadystatechange = function() {
    if (xhr.readyState != 4) return;
    if (xhr.status != 200) {
      alert(xhr.status + ': ' + xhr.statusText);
    } else {
      console.log(JSON.parse(xhr.responseText));
      sampleOnLoad(JSON.parse(xhr.responseText));
    }
  }
}

function sendToServer(body) {
  var xhr = new XMLHttpRequest();
  xhr.open('POST','/setsample',true);
  xhr.setRequestHeader('content-type','application/json; charset=utf-8');
  // xhr.setRequestHeader('Content-Encoding','gzip');
  // var body = 'abc ';
  // for (var i=0; i<10; i++) {
  //   body += body;
  // }
  xhr.send(body);
  console.log("post");
}



        // divRepl.addEventListener('transitionend', () => {
        //   parent.removeChild(divRepl);
        //   console.log("Removed");
        // });

      // if (divRepl) {
      //   parent.removeChild(divRepl);
      // }
      // var div = document.createElement('div');
      // div.className = "field-group";

      // var label = document.createElement('label');
      // label.setAttribute('for', 'replacement');
      // label.innerHTML = "Replace with";

      // replacement = document.createElement('textarea');
      // replacement.setAttribute('id', 'replacement')
      // div.appendChild(label);
      // div.appendChild(replacement);
      // parent.appendChild(div);
      // div.style.opacity = '0';
      // if (parent.children[1]) {
      //   div.classList.add("field-show");
      //   console.log("added");
      // }
