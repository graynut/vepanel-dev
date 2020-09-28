/**
 * progress.js
 * 顶部进度条
*/
let progressWrap = '';
let progressBar = '';
let progrssCss = null;
let progressCssPrefix = null;
let progressCount = 0;
let progressStatus = false;
let progressHideTimer = null;

function initProgressVar() {
    if (progressBar !== '') {
        return;
    }
    const _DOC = document;
    const wrap = _DOC.getElementById('progress-wrap');
    const bar = _DOC.getElementById('progress-bar');
    if (!wrap || !bar) {
        progressWrap = null;
        return;
    }
    wrap.style.display = 'none';
    progressWrap = wrap;
    progressBar = bar;
    const style = _DOC.body.style;
    progressCssPrefix = ('WebkitTransform' in style) ? 'Webkit' :
                       ('MozTransform' in style) ? 'Moz' :
                       ('msTransform' in style) ? 'ms' :
                       ('OTransform' in style) ? 'O' : '';
    if (progressCssPrefix + 'Perspective' in style) {
      // Modern browsers with 3D support, e.g. Webkit, IE10
      progrssCss = 'translate3d';
    } else if (progressCssPrefix + 'Transform' in style) {
      // Browsers without 3D support, e.g. IE9
      progrssCss = 'translate';
    } else {
      // Browsers without translate() support, e.g. IE7-8
      progrssCss = 'margin';
    }
}

function setProgerssPercent(amount) {
    if (progressStatus === false) {
        return false;
    }
    const max = 0.994;
    let n = progressStatus;
    if (n !== 1) {
        if (!amount) {
            if (n >= 0 && n < 0.2) { amount = 0.1; }
            else if (n >= 0.2 && n < 0.5) { amount = 0.04; }
            else if (n >= 0.5 && n < 0.8) { amount = 0.02; }
            else if (n >= 0.8 && n < 0.99) { amount = 0.005; }
            else { amount = 0; }
        }
        n = Math.min(max, Math.max(0, n + amount));
        if (n > 0.99 && n < max) {
            n = max;
        }
        progressStatus = n;
    }
    n = (-1 + progressStatus) * 100;
    if (progrssCss === 'margin') {
        progressBar.style.marginLeft = n+'%';
    } else {
        progressBar.style.transform = progrssCss === 'translate3d' 
            ? 'translate3d('+n+'%,0,0)'
            : 'translate('+n+'%,0)';
        progressBar.style.transition = 'all 200ms linear';
    }
    return progressStatus < max ? true : false;
}

function moveProgress() {
    if (setProgerssPercent()) {
        setTimeout(moveProgress, 200);
    }
}

function startProgress() {
    initProgressVar();
    if (!progressWrap) {
        return;
    }
    progressCount++;
    if (progressStatus !== false) {
        return;
    }
    if (progressHideTimer) {
        clearTimeout(progressHideTimer);
        progressHideTimer = null;
    }
    progressStatus = 0;
    moveProgress();
    progressWrap.style.display = 'block';
}

function endProgress() {
    progressCount--;
    if (progressCount > 0) {
        return;
    }
    setProgerssPercent(0.3 + 0.5 * Math.random());
    progressStatus = 1;
    setProgerssPercent();
    progressStatus = false;
    progressHideTimer = setTimeout(() => {
        progressWrap.style.display = 'none';
    }, 300)
}

export {
    startProgress,
    endProgress
};
