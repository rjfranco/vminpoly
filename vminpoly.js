(function() {
  var head, initLayoutEngine, onresize, sheets, styleElement;

  sheets = {};

  styleElement = document.createElement('style');

  head = document.getElementsByTagName('head')[0];

  head.appendChild(styleElement);

  initLayoutEngine = function() {
    var analyzeStyleRule, analyzeStylesheet, i, links, _i, _len, _results;
    analyzeStyleRule = function(rule) {
      var declaration, declarations, hasDimension, token, _i, _j, _len, _len1, _ref, _ref1;
      declarations = [];
      _ref = rule.value;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        declaration = _ref[_i];
        hasDimension = false;
        _ref1 = declaration.value;
        for (_j = 0, _len1 = _ref1.length; _j < _len1; _j++) {
          token = _ref1[_j];
          if (token.tokenType === 'DIMENSION' && (token.unit === 'vmin' || token.unit === 'vh' || token.unit === 'vw')) {
            hasDimension = true;
          }
        }
        if (hasDimension) {
          declarations.push(declaration);
        }
      }
      rule.value = declarations;
      return declarations;
    };
    analyzeStylesheet = function(sheet) {
      var atRules, decs, rule, rules, _i, _len, _ref;
      rules = [];
      _ref = sheet.value;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        rule = _ref[_i];
        switch (rule.type) {
          case 'STYLE-RULE':
            decs = analyzeStyleRule(rule);
            if (decs.length !== 0) {
              rules.push(rule);
            }
            break;
          case 'AT-RULE':
            atRules = analyzeStylesheet(rule);
            if (atRules.length !== 0) {
              rules.push(rule);
            }
        }
      }
      sheet.value = rules;
      return rules;
    };
    links = document.getElementsByTagName('link');
    _results = [];
    for (_i = 0, _len = links.length; _i < _len; _i++) {
      i = links[_i];
      if (i.rel !== 'stylesheet') {
        continue;
      }
      _results.push($.ajax({
        url: i.href,
        dataType: "text",
        success: function(cssText) {
          var sheet, tokenlist;
          tokenlist = tokenize(cssText);
          sheet = parse(tokenlist);
          analyzeStylesheet(sheet);
          sheets[i.href] = sheet;
        }
      }));
    }
    return _results;
  };

  initLayoutEngine();

  onresize = function() {
    var css, dims, generateRuleCode, generateSheetCode, sheet, url;
    dims = {
      vh: window.innerHeight / 100,
      vw: window.innerWidth / 100
    };
    dims.vmin = Math.min(dims.vh, dims.vw);
    generateRuleCode = function(rule) {
      var declaration, declarations, ruleCss, token, _i, _j, _len, _len1, _ref, _ref1;
      declarations = [];
      ruleCss = rule.selector.join('');
      ruleCss += "{";
      _ref = rule.value;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        declaration = _ref[_i];
        ruleCss += declaration.name;
        ruleCss += ":";
        _ref1 = declaration.value;
        for (_j = 0, _len1 = _ref1.length; _j < _len1; _j++) {
          token = _ref1[_j];
          if (token.tokenType === 'DIMENSION' && (token.unit === 'vmin' || token.unit === 'vh' || token.unit === 'vw')) {
            ruleCss += "" + (Math.floor(token.num * dims[token.unit])) + "px";
          } else {
            ruleCss += token.toString();
          }
        }
        ruleCss += ";";
      }
      ruleCss += "}";
      return ruleCss;
    };
    generateSheetCode = function(sheet) {
      var prelude, rule, sheetCss, t, _i, _j, _len, _len1, _ref, _ref1;
      sheetCss = '';
      _ref = sheet.value;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        rule = _ref[_i];
        switch (rule.type) {
          case 'STYLE-RULE':
            sheetCss += generateRuleCode(rule);
            break;
          case 'AT-RULE':
            prelude = '';
            _ref1 = rule.prelude;
            for (_j = 0, _len1 = _ref1.length; _j < _len1; _j++) {
              t = _ref1[_j];
              if (t.name === '(') {
                prelude += '(';
                prelude += t.value.join('');
                prelude += ')';
              } else {
                prelude += t.toString();
              }
            }
            sheetCss += "@" + rule.name + " " + prelude + " {";
            sheetCss += generateSheetCode(rule);
            sheetCss += '}';
        }
      }
      return sheetCss;
    };
    css = '';
    for (url in sheets) {
      sheet = sheets[url];
      css += generateSheetCode(sheet);
    }
    return styleElement.innerHTML = css;
  };

  window.onresize = onresize;

  setTimeout(onresize, 2000);

}).call(this);
