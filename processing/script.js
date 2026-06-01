
//////////////***********Playing God Demo ***********************/////////////////

// ── PLAYING GOD — p5.js ──────────────────────────────────────────────────────
// Cola este ficheiro num sketch p5.js (ex: editor.p5js.org)
// ou usa index.html abaixo para correr localmente.
//
// index.html mínimo:
// <script src="https://cdnjs.cloudflare.com/ajax/libs/p5.js/1.9.0/p5.min.js"></script>
// <script src="playing_god.js"></script>

// ── DATA ─────────────────────────────────────────────────────────────────────
const SUITS = [
  { id: 'science',  name: 'Ciência',    col: [37,99,235] },
  { id: 'culture',  name: 'Cultura',    col: [124,58,237] },
  { id: 'precious', name: 'Precioso',   col: [202,138,4] },
  { id: 'military', name: 'Militar',    col: [220,38,38] },
  { id: 'mystic',   name: 'Misticismo', col: [22,163,74] },
  { id: 'tech',     name: 'Tecnologia', col: [234,88,12] },
];
const VALS = ['2','3','4','5','6','7','8','9','10','Knight','Page','Queen','King','Ace'];
const VORD = {}; VALS.forEach((v,i) => VORD[v] = i);
const SHORT = {Knight:'Kn',Page:'Pg',Queen:'Q',King:'K',Ace:'A'};
const vLabel = v => SHORT[v] || v;

const GOD = [
  {id:0,  name:'O Louco',        eff:'Troca a tua mão por cartas do Futuro ou do Passado.'},
  {id:1,  name:'O Mago',         eff:'Todos compram 2 do Futuro OU pegas 1 do Presente do CPU.'},
  {id:2,  name:'A Sacerdote',    eff:'Vê 3 cartas da mão do CPU.'},
  {id:3,  name:'A Imperatriz',   eff:'Compra até 5 cartas do Futuro.'},
  {id:4,  name:'O Imperador',    eff:'Usa o efeito de uma God Card aleatória.'},
  {id:5,  name:'O Papa',         eff:'Escolhe quem inicia o próximo turno.'},
  {id:6,  name:'Os Namorados',   eff:'Cada jogador escolhe 1 carta da mão para trocar.'},
  {id:7,  name:'O Carro',        eff:'Manda 1 carta da mão para o Futuro ou Passado.'},
  {id:8,  name:'A Força',        eff:'Troca 2 aleatórias com CPU OU todos mandam 1 para o Futuro.'},
  {id:9,  name:'O Ermita',       eff:'Vê as 3 primeiras do Futuro e fica com uma.'},
  {id:10, name:'Roda da Fortuna',eff:'Dado d4: ímpar=recebes teu Passado; par=recebes Passado do CPU.'},
  {id:11, name:'Justiça',        eff:'Todos ficam com o nº mínimo de cartas no Passado.'},
  {id:12, name:'O Enforcado',    eff:'Reinicia ronda em decrescente. Presente acumula.'},
  {id:13, name:'A Morte',        eff:'Dado d4: acertas=CPU eliminado. Falhas=és eliminado.'},
  {id:14, name:'A Temperança',   eff:'Passas este turno. No próximo jogas até 3 cartas.'},
  {id:15, name:'O Diabo',        eff:'Par=pegas 1 do Passado CPU. Ímpar=CPU pega 1 do teu.'},
  {id:16, name:'A Torre',        eff:'Reinicia ronda normal. Presente acumula.'},
  {id:17, name:'A Estrela',      eff:'Proteção contra a próxima God Card ofensiva.'},
  {id:18, name:'A Lua',          eff:'Todos trocam a mão pelo Passado.'},
  {id:19, name:'O Sol',          eff:'Próximo golpe de sorte garantido.'},
  {id:20, name:'O Julgamento',   eff:'CPU é eliminado (vitória imediata).'},
  {id:21, name:'O Mundo',        eff:'Reinicia o jogo inteiro.'},
];

// ── STATE ────────────────────────────────────────────────────────────────────
let G = {};
let _handY = 412; // updated each frame in drawGame
let modal = null;    // {title, desc, btns:[{label,fn}], pickCards, pickFn}
let tooltip = null;  // {text, x, y}
let hovered = -1;

// ── LAYOUT CONSTANTS ─────────────────────────────────────────────────────────
const CW = 52, CH = 72, CR = 6;   // card width/height/radius
const MCW = 30, MCH = 42;         // mini card
const PAD = 14;

// ── SETUP & DRAW ─────────────────────────────────────────────────────────────
function getCanvasWidth() {
  let el = document.getElementById('game-container');
  if (el) return min(el.clientWidth || window.innerWidth, 720);
  return min(window.innerWidth, 720);
}

function setup() {
  let w = getCanvasWidth();
  let h = w < 992 ? 1000 : 600;
  let canvas = createCanvas(w, h);
  canvas.parent('game-container');
  canvas.style('display', 'block');
  canvas.style('margin', '10px auto');
  canvas.style('cursor', 'default');
  textFont('Exo, sans-serif');
  initGame();
}

function windowResized() {
  let w = getCanvasWidth();
  let h = w < 992 ? 1000 : 600;
  resizeCanvas(w, h);
}

function isMobile() { return width < 992; }

function draw() {
  background(219, 219, 219);
  drawGame();
  if (modal) drawModal();
  if (tooltip) drawTooltip();
  updateCursor();
}

function updateCursor() {
  let cur = 'default';
  // Check buttons
  if (G._btns) {
    for (let b of G._btns) {
      if (mouseX>b.x && mouseX<b.x+b.w && mouseY>b.y && mouseY<b.y+b.h) { cur='pointer'; break; }
    }
  }
  // Check player hand cards
  if (!isMobile()) {
    let handY = _handY + 18;
    G.hands[1].forEach((c,i) => {
      let x = PAD+10+i*(CW+4);
      if (mouseX>x && mouseX<x+CW && mouseY>handY-10 && mouseY<handY+CH+2) cur='pointer';
    });
  } else {
    let mCW=34, mCH=48, pad=6;
    let perRow=max(1,floor((width-pad*2)/(mCW+4)));
    G.hands[1].forEach((c,i) => {
      let row=floor(i/perRow), col2=i%perRow;
      let x=pad+6+col2*(mCW+4);
      let baseY=_handY+14+row*(mCH+4);
      if(mouseX>x&&mouseX<x+mCW&&mouseY>baseY-8&&mouseY<baseY+mCH+2) cur='pointer';
    });
  }
  document.getElementById('defaultCanvas0') && (document.getElementById('defaultCanvas0').style.cursor=cur);
}

// ── INIT ─────────────────────────────────────────────────────────────────────
function initGame() {
  modal = null; tooltip = null; hovered = -1;
  G = {
    deck: makeDeck(),
    hands: [[], []],
    presents: [[], []],
    pasts: [[], []],
    globalTop: null,
    globalTopIsGod: false,
    turn: 1,
    selected: -1,
    reverse: false,
    presentLocked: false,
    protected: [false, false],
    sunActive: [false, false],
    skipTurn: [false, false],
    extraPlays: 0,
    gameover: false,
    busy: false,
    consecutiveSkips: 0,
    log: [],
  };
  for (let i = 0; i < 4; i++) {
    G.hands[1].push(G.deck.pop());
    G.hands[0].push(G.deck.pop());
  }
  addLog('Jogo iniciado!');
}

// ── DECK ─────────────────────────────────────────────────────────────────────
function makeDeck() {
  let d = [];
  SUITS.forEach(s => VALS.forEach(v => d.push({ type:'simple', suit:s.id, value:v })));
  GOD.forEach(g => d.push({ type:'god', ...g, suit:'god' }));
  return shuffleArr(d);
}
function shuffleArr(a) {
  let b = [...a];
  for (let i = b.length-1; i > 0; i--) {
    let j = floor(random(i+1)); [b[i],b[j]]=[b[j],b[i]];
  }
  return b;
}
function rollDice(n=4) { return floor(random(n)) + 1; }

// ── HELPERS ───────────────────────────────────────────────────────────────────
function addLog(msg) {
  G.log.unshift(msg);
  if (G.log.length > 20) G.log.pop();
}
function cardName(c) {
  if (c.type === 'god') return c.name;
  let s = SUITS.find(x => x.id === c.suit);
  return c.value + (s ? ' (' + s.name + ')' : '');
}
function shortGodName(n) { return n.replace(/^(O |A |Os )/, ''); }
function getSuitCol(c) {
  if (c.type === 'god') return [162, 28, 175];
  let s = SUITS.find(x => x.id === c.suit);
  return s ? s.col : [100,100,100];
}
function canPlay(c) {
  if (!G.globalTop && !G.globalTopIsGod) return true;
  if (G.globalTopIsGod) return c.type === 'god';
  if (c.type === 'god') return true;
  return G.reverse ? VORD[c.value] <= VORD[G.globalTop] : VORD[c.value] >= VORD[G.globalTop];
}
function playableList(who) { return G.hands[who].filter(c => canPlay(c)); }
function updateGlobalTop(c) {
  if (c.type === 'god') { G.globalTopIsGod = true; G.globalTop = null; }
  else { G.globalTopIsGod = false; G.globalTop = c.value; }
}
function isParagem(card, prevTop, prevTopIsGod) {
  if (card.type==='god' || prevTopIsGod || !prevTop) return false;
  return card.value === prevTop;
}
function checkHandLimit(who) {
  while (G.hands[who].length > 13) {
    let hand = G.hands[who];
    let simples = hand.map((c,i) => ({c,i})).filter(x => x.c.type==='simple');
    let toDiscard = simples.length
      ? simples.sort((a,b) => VORD[a.c.value]-VORD[b.c.value])[0].i
      : 0;
    let disc = hand.splice(toDiscard, 1)[0];
    addLog((who===1?'Tu':'CPU') + ': descartou ' + cardName(disc) + ' (mão cheia).');
    if (G.pasts[who].length > 0) { let p = G.pasts[who].pop(); G.deck.push(p); }
  }
}

// ── DRAW GAME ────────────────────────────────────────────────────────────────
function drawGame() {
  if (isMobile()) { drawGameMobile(); return; }
  G._btns = [];

  // Fixed Y positions
  let cpuY   = 0;
  let cpuH   = 100;
  let midY   = cpuH + 4;
  let midH   = 260;
  let sbY    = midY + midH + 4;
  let sbH    = 40;
  let handY  = sbY + sbH + 4;
  _handY = handY; // sync with mousePressed
  let handH  = CH + 30;
  let btnY   = handY + handH + 6;
  let logY   = btnY + 34;

  // resize canvas if needed
  // (already set in setup)

  // ── CPU hand ──
  drawZone(PAD, cpuY, width-PAD*2, cpuH, 'CPU — mão: ' + G.hands[0].length + ' | passado: ' + G.pasts[0].length + '/13');
  G.hands[0].forEach((c, i) => {
    drawCardBack(PAD+10 + i*(CW+4), cpuY+20, c.type==='god');
  });

  // ── Mid: 3 columns ──
  let cZoneW = 110;
  let sideW  = floor((width - PAD*2 - cZoneW - 8) / 2);

  // CPU past
  drawZone(PAD, midY, sideW, midH, 'Passado CPU');
  G.pasts[0].slice(-12).forEach((c,i) => {
    let col = i % 6, row = floor(i/6);
    drawMiniCard(PAD+8+col*(MCW+3), midY+18+row*(MCH+4), c, false);
  });

  // Center column
  let cx = PAD + sideW + 4;

  // Futuro
  let futH = CH + 48;
  drawZone(cx, midY, cZoneW, futH, 'Futuro');
  for (let i=2; i>=0; i--) drawCardBack(cx+cZoneW/2-CW/2+i*2, midY+24+i*2, false);
  fill(60,40,10); noStroke(); textSize(10); textAlign(CENTER);
  text(G.deck.length + ' cartas', cx+cZoneW/2, midY+futH-10);

  // Presente — no built-in label, draw manually
  let presY2 = midY + futH + 4;
  let presH  = midH - futH - 4;
  let pHalf = floor(presH / 2);
  let pmw = 22, pmh = 30; // tiny cards for Presente
  drawZone(cx, presY2, cZoneW, presH, '');
  fill(255,255,255,220); noStroke(); rect(cx+6, presY2+4, 72, 14, 3);
  fill(60,40,10); textSize(9); textAlign(LEFT); textStyle(NORMAL);
  text('PRESENTE', cx+10, presY2+14);
  // CPU half
  fill(60,40,10); noStroke(); textSize(9); textAlign(CENTER);
  text('CPU', cx+cZoneW/2, presY2+26);
  if (G.presents[0].length === 0) {
    fill(190); textSize(10); text('—', cx+cZoneW/2, presY2+pHalf-8);
  } else {
    G.presents[0].slice(-3).forEach((c,i) => {
      let col = getSuitCol(c);
      fill(col[0],col[1],col[2],50); stroke(col[0],col[1],col[2]); strokeWeight(i===G.presents[0].slice(-3).length-1?2:1);
      rect(cx+4+i*(pmw+2), presY2+28, pmw, pmh, 3);
      fill(col[0]*0.5,col[1]*0.5,col[2]*0.5); noStroke(); textSize(9); textAlign(CENTER); textStyle(BOLD);
      text(c.type==='god'?'✦':vLabel(c.value), cx+4+i*(pmw+2)+pmw/2, presY2+28+pmh/2+4);
      textStyle(NORMAL);
    });
  }
  // divider
  stroke(255,255,255); strokeWeight(1);
  line(cx+8, presY2+pHalf, cx+cZoneW-8, presY2+pHalf);
  // Jogador half
  fill(60,40,10); noStroke(); textSize(9); textAlign(CENTER);
  text('Jogador', cx+cZoneW/2, presY2+pHalf+14);
  if (G.presents[1].length === 0) {
    fill(190); textSize(10); text('—', cx+cZoneW/2, presY2+pHalf+pHalf-8);
  } else {
    G.presents[1].slice(-3).forEach((c,i) => {
      let col = getSuitCol(c);
      fill(col[0],col[1],col[2],50); stroke(col[0],col[1],col[2]); strokeWeight(i===G.presents[1].slice(-3).length-1?2:1);
      rect(cx+4+i*(pmw+2), presY2+pHalf+16, pmw, pmh, 3);
      fill(col[0]*0.5,col[1]*0.5,col[2]*0.5); noStroke(); textSize(9); textAlign(CENTER); textStyle(BOLD);
      text(c.type==='god'?'✦':vLabel(c.value), cx+4+i*(pmw+2)+pmw/2, presY2+pHalf+16+pmh/2+4);
      textStyle(NORMAL);
    });
  }

  // Player past
  let ppx = cx + cZoneW + 4;
  drawZone(ppx, midY, sideW, midH, 'Passado Jogador');
  G.pasts[1].slice(-12).forEach((c,i) => {
    let col = i % 6, row = floor(i/6);
    drawMiniCard(ppx+8+col*(MCW+3), midY+18+row*(MCH+4), c, false);
  });

  // ── Status bar ──
  drawZone(PAD, sbY, width-PAD*2, sbH, '');
  fill(17,9,1); noStroke(); textSize(11); textAlign(LEFT);
  let topStr = 'Ronda nova' + (G.reverse?' ↓ reverso':'') + (G.presentLocked?' [acumulado]':'');
  if (G.globalTopIsGod) topStr = '✦ God Card — só God Card pode jogar!';
  else if (G.globalTop) topStr = 'Topo: ' + G.globalTop + (G.reverse?' ↓':'') + (G.presentLocked?' [acumulado]':'');
  text(topStr, PAD+8, sbY+sbH/2+4);

  // Scores
  fill(17,9,1); textSize(11); textAlign(LEFT);
  text('CPU: ', width/2-100, sbY+sbH/2+4);
  fill(17,9,1); textStyle(BOLD);
  text(G.pasts[0].length, width/2-68, sbY+sbH/2+4);
  textStyle(NORMAL); fill(17,9,1);
  text('  Tu: ', width/2-55, sbY+sbH/2+4);
  fill(17,9,1); textStyle(BOLD);
  text(G.pasts[1].length, width/2-18, sbY+sbH/2+4);
  textStyle(NORMAL);

  // Turn badge
  let badgeX = width/2 + 10;
  fill(G.turn===1 ? color(255,151,0) : color(255,180,82));
  noStroke();
  rect(badgeX, sbY+6, 80, 26, 4);
  fill(color(17,9,1)); textSize(10); textAlign(CENTER);
  text(G.turn===1 ? 'Teu turno' + (G.extraPlays>0?' ('+G.extraPlays+')':'') : 'CPU...', badgeX+40, sbY+23);

  // Jogar + Comprar in status bar
  let canAct = G.turn===1 && !G.busy && !G.gameover && !modal;
  drawButton(width-PAD-214, sbY+6, 100, 26, 'Jogar', canAct && G.selected !== -1, () => playCards());
  drawButton(width-PAD-108, sbY+6, 100, 26, 'Comprar', canAct && G.deck.length>0, () => buyCard());

  // ── Player hand ──
  drawZone(PAD, handY, width-PAD*2, handH, 'A tua mão — ' + G.hands[1].length + ' cartas | passado: ' + G.pasts[1].length + '/13');
  tooltip = null;
  G.hands[1].forEach((c, i) => {
    let x = PAD+10 + i*(CW+4);
    let y = handY + 18;
    let sel = G.selected === i;
    let ok = canPlay(c);
    let hy = sel ? y-8 : y;
    renderCard(x, hy, c, ok, sel);
    if (c.type==='god' && mouseX>x && mouseX<x+CW && mouseY>hy && mouseY<hy+CH) {
      tooltip = { text: c.name + '\n' + c.eff, x: x, y: hy };
    }
  });

  // ── Novo Jogo button + log below hand ──
  drawButton(PAD, btnY, 100, 26, 'Novo Jogo', true, () => initGame());
  fill(80,50,20); noStroke(); textSize(10); textAlign(LEFT);
  G.log.slice(0,4).forEach((l,i) => text(l, PAD+110, btnY+4 + i*13));

  // ── Gameover ──
  if (G.gameover && !modal) {
    fill(0,0,0,180); noStroke(); rect(0,0,width,height);
    fill(255,151,0); textSize(28); textAlign(CENTER);
    text(G._endTitle || '?', width/2, height/2 - 20);
    fill(255); textSize(14); text(G._endDesc || '', width/2, height/2+20);
    drawButton(width/2-60, height/2+40, 120, 32, 'Jogar novamente', true, () => initGame());
  }
}




// ── MOBILE LAYOUT — dynamic sizing based on canvas width ────────────────────
function drawGameMobile() {
  G._btns = [];
  let pad = 6;
  let cw = width - pad*2; // total usable width

  // Dynamic card sizes: fit ~8 cards per row in cw
  let mCW = min(38, floor((cw - pad*2) / 8) - 3);
  let mCH = floor(mCW * 1.4);
  let mCR = 4;
  let mMCW = floor(mCW * 0.6);
  let mMCH = floor(mCW * 0.8);

  let y = 0;

  // ── CPU hand ──
  let cpuPerRow = max(1, floor(cw / (mCW+3)));
  let cpuRows = max(1, ceil(G.hands[0].length / cpuPerRow));
  let cpuHandH = cpuRows*(mCH+4) + 18;
  drawZone(pad, y, cw, cpuHandH, 'CPU — mão: '+G.hands[0].length+' | passado: '+G.pasts[0].length+'/13');
  G.hands[0].forEach((c,i) => {
    let r=floor(i/cpuPerRow), c2=i%cpuPerRow;
    drawCardBack(pad+6+c2*(mCW+3), y+14+r*(mCH+4), c.type==='god', mCW, mCH, mCR);
  });
  y += cpuHandH + 4;

  // ── CPU past ──
  let mmPerRow = max(1, floor(cw / (mMCW+2)));
  let cpuPastRows = max(1, ceil(min(G.pasts[0].length, mmPerRow*2) / mmPerRow));
  let cpuPastH = cpuPastRows*mMCH + 22;
  drawZone(pad, y, cw, cpuPastH, 'Passado CPU');
  G.pasts[0].slice(-mmPerRow*2).forEach((c,i) => {
    let r=floor(i/mmPerRow), c2=i%mmPerRow;
    let col=getSuitCol(c);
    fill(col[0],col[1],col[2],50); stroke(col[0],col[1],col[2]); strokeWeight(1);
    rect(pad+6+c2*(mMCW+2), y+16+r*(mMCH+3), mMCW, mMCH, 3);
    fill(col[0]*0.5,col[1]*0.5,col[2]*0.5); noStroke(); textSize(8); textAlign(CENTER); textStyle(BOLD);
    text(c.type==='god'?'✦':vLabel(c.value), pad+6+c2*(mMCW+2)+mMCW/2, y+16+r*(mMCH+3)+mMCH/2+3);
    textStyle(NORMAL);
  });
  y += cpuPastH + 4;

  // ── Futuro + Presente ──
  let futW = mCW + 16;
  let presW = cw - futW - 4;
  let midH = max(110, mCH*2 + 28);

  drawZone(pad, y, futW, midH, 'Futuro');
  drawCardBack(pad+(futW-mCW)/2, y+16, false, mCW, mCH, mCR);
  fill(60,40,10); noStroke(); textSize(8); textAlign(CENTER);
  text(G.deck.length+' c.', pad+futW/2, y+midH-8);

  let px = pad+futW+4;
  drawZone(px, y, presW, midH, '');
  fill(255,255,255,220); noStroke(); rect(px+4,y+4,66,13,3);
  fill(60,40,10); textSize(8); textAlign(LEFT); textStyle(NORMAL);
  text('PRESENTE', px+8, y+13);
  let pHalf=floor(midH/2);
  // CPU half
  fill(100); noStroke(); textSize(8); textAlign(CENTER);
  text('CPU', px+presW/2, y+24);
  if(G.presents[0].length===0){
    fill(180); textSize(9); text('—', px+presW/2, y+pHalf-6);
  } else {
    let maxShow=max(1,floor((presW-8)/(mMCW+2)));
    G.presents[0].slice(-maxShow).forEach((c,i)=>{
      let col=getSuitCol(c);
      fill(col[0],col[1],col[2],50); stroke(col[0],col[1],col[2]); strokeWeight(i===G.presents[0].slice(-maxShow).length-1?2:1);
      rect(px+4+i*(mMCW+2),y+26,mMCW,mMCH,3);
      fill(col[0]*0.5,col[1]*0.5,col[2]*0.5); noStroke(); textSize(8); textAlign(CENTER); textStyle(BOLD);
      text(c.type==='god'?'✦':vLabel(c.value),px+4+i*(mMCW+2)+mMCW/2,y+26+mMCH/2+3);
      textStyle(NORMAL);
    });
  }
  stroke(200); strokeWeight(1); line(px+4,y+pHalf,px+presW-4,y+pHalf);
  fill(100); noStroke(); textSize(8); textAlign(CENTER);
  text('Jogador', px+presW/2, y+pHalf+12);
  if(G.presents[1].length===0){
    fill(180); textSize(9); text('—', px+presW/2, y+pHalf+pHalf-6);
  } else {
    let maxShow=max(1,floor((presW-8)/(mMCW+2)));
    G.presents[1].slice(-maxShow).forEach((c,i)=>{
      let col=getSuitCol(c);
      fill(col[0],col[1],col[2],50); stroke(col[0],col[1],col[2]); strokeWeight(i===G.presents[1].slice(-maxShow).length-1?2:1);
      rect(px+4+i*(mMCW+2),y+pHalf+14,mMCW,mMCH,3);
      fill(col[0]*0.5,col[1]*0.5,col[2]*0.5); noStroke(); textSize(8); textAlign(CENTER); textStyle(BOLD);
      text(c.type==='god'?'✦':vLabel(c.value),px+4+i*(mMCW+2)+mMCW/2,y+pHalf+14+mMCH/2+3);
      textStyle(NORMAL);
    });
  }
  y += midH + 4;

  // ── Player past ──
  let ppRows = max(1, ceil(min(G.pasts[1].length, mmPerRow*2) / mmPerRow));
  let ppH = ppRows*mMCH + 22;
  drawZone(pad, y, cw, ppH, 'Passado Jogador');
  G.pasts[1].slice(-mmPerRow*2).forEach((c,i) => {
    let r=floor(i/mmPerRow), c2=i%mmPerRow;
    let col=getSuitCol(c);
    fill(col[0],col[1],col[2],50); stroke(col[0],col[1],col[2]); strokeWeight(1);
    rect(pad+6+c2*(mMCW+2), y+16+r*(mMCH+3), mMCW, mMCH, 3);
    fill(col[0]*0.5,col[1]*0.5,col[2]*0.5); noStroke(); textSize(8); textAlign(CENTER); textStyle(BOLD);
    text(c.type==='god'?'✦':vLabel(c.value), pad+6+c2*(mMCW+2)+mMCW/2, y+16+r*(mMCH+3)+mMCH/2+3);
    textStyle(NORMAL);
  });
  y += ppH + 4;

  // ── Status bar ──
  let sbH = 52;
  drawZone(pad, y, cw, sbH, '');
  fill(17,9,1); noStroke(); textSize(9); textAlign(LEFT);
  let topStr='Ronda nova'+(G.reverse?' ↓':'')+(G.presentLocked?' [ac.]':'');
  if(G.globalTopIsGod) topStr='✦ Só God Card!';
  else if(G.globalTop) topStr='Topo: '+G.globalTop+(G.reverse?' ↓':'');
  text(topStr, pad+6, y+15);
  textAlign(RIGHT);
  text('CPU:'+G.pasts[0].length+' Tu:'+G.pasts[1].length, pad+cw-6, y+15);
  fill(G.turn===1?color(255,151,0):color(255,180,82)); noStroke();
  rect(pad+4, y+20, cw-8, 26, 4);
  fill(17,9,1); textSize(10); textAlign(CENTER);
  text(G.turn===1?'Teu turno'+(G.extraPlays>0?' (+'+G.extraPlays+')':''):'CPU a jogar...', pad+cw/2, y+37);
  y += sbH + 4;

  // ── Buttons ──
  let canAct=G.turn===1&&!G.busy&&!G.gameover&&!modal;
  let bw=(cw-4)/2;
  drawButton(pad,y,bw,30,'Jogar',canAct&&G.selected!==-1,()=>playCards());
  drawButton(pad+bw+4,y,bw,30,'Comprar',canAct&&G.deck.length>0,()=>buyCard());
  y += 38;

  // ── Player hand ──
  let perRow = max(1, floor(cw / (mCW+4)));
  let rows = max(1, ceil(G.hands[1].length/perRow));
  let handH = rows*(mCH+4)+18;
  _handY = y;
  drawZone(pad, y, cw, handH, 'A tua mão — '+G.hands[1].length+' cartas | passado: '+G.pasts[1].length+'/13');
  G.hands[1].forEach((c,i) => {
    let row=floor(i/perRow), col2=i%perRow;
    let x=pad+6+col2*(mCW+4);
    let baseY=y+14+row*(mCH+4);
    let sel=G.selected===i;
    let ok=canPlay(c);
    let hy=sel?baseY-6:baseY;
    let col=getSuitCol(c);
    let bgC=sel?color(col[0],col[1],col[2],220):color(col[0],col[1],col[2],40);
    if(!ok){fill(200,200,200,80);stroke(180);strokeWeight(1.5);}
    else{fill(bgC);stroke(color(col[0],col[1],col[2]));strokeWeight(sel?2.5:2);}
    rect(x,hy,mCW,mCH,mCR);
    fill(ok?color(col[0]*0.6,col[1]*0.6,col[2]*0.6):150);
    noStroke(); textAlign(CENTER); textStyle(BOLD);
    textSize(floor(mCW*0.35));
    text(c.type==='god'?'✦':vLabel(c.value),x+mCW/2,hy+mCH/2-2);
    if(c.type==='god'){
      let nm=shortGodName(c.name);
      let fs=floor(mCW*0.22); textSize(fs);
      while(textWidth(nm)>mCW-4&&fs>5){fs--;textSize(fs);}
      text(nm,x+mCW/2,hy+mCH/2+floor(mCH*0.2));
    }
    textStyle(NORMAL);
  });
  y += handH + 4;

  // ── God card info panel ──
  if(G.selected!==-1&&G.hands[1][G.selected]&&G.hands[1][G.selected].type==='god'){
    let gc=G.hands[1][G.selected];
    let th=54;
    fill(56,33,5,240); stroke(255,151,0); strokeWeight(1);
    rect(pad,y,cw,th,6);
    fill(255,180,82); noStroke(); textSize(10); textAlign(LEFT); textStyle(BOLD);
    text(gc.name,pad+8,y+16); textStyle(NORMAL);
    fill(255,220,150); textSize(9);
    let words=gc.eff.split(' '),line='',lineY=y+30,lineH=12;
    words.forEach(w=>{
      let test=line?line+' '+w:w;
      if(textWidth(test)<cw-16){line=test;}
      else{text(line,pad+8,lineY);lineY+=lineH;line=w;}
    });
    if(line)text(line,pad+8,lineY);
    y += th+4;
  }

  // ── Novo Jogo + log ──
  drawButton(pad,y,100,26,'Novo Jogo',true,()=>initGame());
  fill(80,50,20); noStroke(); textSize(9); textAlign(LEFT);
  G.log.slice(0,4).forEach((l,i)=>text(l,pad+108,y+6+i*12));

  // ── Gameover ──
  if(G.gameover&&!modal){
    fill(0,0,0,180); noStroke(); rect(0,0,width,height);
    fill(255,151,0); textSize(22); textAlign(CENTER);
    text(G._endTitle||'?',width/2,height/2-20);
    fill(255); textSize(12); text(G._endDesc||'',width/2,height/2+10);
    drawButton(width/2-60,height/2+30,120,30,'Jogar novamente',true,()=>initGame());
  }
}


// ── CARD DRAWING ─────────────────────────────────────────────────────────────
function renderCard(x, y, c, playable, selected) {
  let col = getSuitCol(c);
  let bgCol = selected ? color(col[0],col[1],col[2],220) : color(col[0],col[1],col[2],40);
  let borderCol = color(col[0],col[1],col[2]);
  if (!playable) { fill(200,200,200,80); stroke(180); strokeWeight(1.5); }
  else { fill(bgCol); stroke(borderCol); strokeWeight(selected?2.5:2); }
  rect(x, y, CW, CH, CR);
  // value
  fill(playable ? color(col[0]*0.6,col[1]*0.6,col[2]*0.6) : 150);
  noStroke(); textSize(16); textAlign(CENTER); textStyle(BOLD);
  text(c.type==='god' ? '✦' : vLabel(c.value), x+CW/2, y+CH/2-4);
  textStyle(NORMAL);
  if (c.type==='god') {
    let nm = shortGodName(c.name);
    // shrink font until text fits within card width
    let fs = 8;
    textSize(fs);
    while (textWidth(nm) > CW-6 && fs > 5) { fs--; textSize(fs); }
    text(nm, x+CW/2, y+CH/2+10);
  }
}

function drawCardBack(x, y, isGod, cw=CW, ch=CH, cr=CR) {
  if (isGod) {
    fill(45,26,14); stroke(201,134,10); strokeWeight(2);
  } else {
    fill(30,58,95); stroke(45,90,142); strokeWeight(2);
  }
  rect(x, y, cw, ch, cr);
  fill(isGod ? color(232,184,75) : color(123,175,212));
  noStroke(); textSize(isGod?12:15); textAlign(CENTER); textStyle(BOLD);
  text(isGod ? '✦' : '◈', x+cw/2, y+ch/2+4);
  if (isGod) { textSize(6); text('GOD', x+cw/2, y+ch/2+14); }
  textStyle(NORMAL);
}

function drawMiniCard(x, y, c, isTop) {
  let col = getSuitCol(c);
  let w = isTop ? MCW+8 : MCW, h = isTop ? MCH+8 : MCH;
  fill(col[0],col[1],col[2],50); stroke(col[0],col[1],col[2]); strokeWeight(isTop?2:1.5);
  rect(x, y, w, h, 4);
  fill(col[0]*0.5,col[1]*0.5,col[2]*0.5); noStroke();
  textSize(isTop?12:9); textAlign(CENTER); textStyle(BOLD);
  text(c.type==='god' ? '✦' : vLabel(c.value), x+w/2, y+h/2+4);
  textStyle(NORMAL);
}

function drawZone(x, y, w, h, label) {
  fill(255, 255, 255); stroke(255,255,255); strokeWeight(2);
  rect(x, y, w, h, 8);
  if (label) {
    fill(255,255,255,220); noStroke();
    rect(x+6, y+4, textWidth(label.toUpperCase())+8, 14, 3);
    fill(60,40,20); textSize(9); textAlign(LEFT); textStyle(NORMAL);
    text(label.toUpperCase(), x+10, y+14);
  }
}

function drawButton(x, y, w, h, label, enabled, fn) {
  let hovering = mouseX>x && mouseX<x+w && mouseY>y && mouseY<y+h;
  if (enabled) {
    fill(hovering ? color(255,180,82) : color(255,151,0));
    stroke(255,200,120);
  } else {
    fill(255,180,82); stroke(255,200,120);
  }
  strokeWeight(1); rect(x, y, w, h, 6);
  fill(enabled ? color(17,9,1) : color(100,70,30));
  noStroke(); textSize(11); textAlign(CENTER); textStyle(BOLD);
  text(label, x+w/2, y+h/2+4);
  textStyle(NORMAL);
  if (enabled) {
    if (!G._btns) G._btns = [];
    G._btns.push({x,y,w,h,fn,hover:hovering});
  }
}

function drawTooltip() {
  if (!tooltip) return;
  let tw = 180, lh = 13, pad = 8;
  textSize(10); textAlign(LEFT); textStyle(NORMAL);

  // Word-wrap each line to fit tw-pad*2
  let rawLines = tooltip.text.split('\n');
  let wrapped = [];
  rawLines.forEach(raw => {
    let words = raw.split(' ');
    let cur = '';
    words.forEach(w => {
      let test = cur ? cur + ' ' + w : w;
      if (textWidth(test) < tw - pad*2) {
        cur = test;
      } else {
        if (cur) wrapped.push(cur);
        cur = w;
      }
    });
    if (cur) wrapped.push(cur);
  });

  let th = wrapped.length * lh + pad * 2;
  let tx = min(tooltip.x, width - tw - 4);
  let ty = max(4, tooltip.y - th - 6);
  fill(56,33,5,240); stroke(255,151,0); strokeWeight(1);
  rect(tx, ty, tw, th, 6);
  fill(255,220,150); noStroke();
  wrapped.forEach((l,i) => text(l, tx+pad, ty+pad+lh*(i+0.8)));
}

// ── MODAL ────────────────────────────────────────────────────────────────────
function drawModal() {
  if (!modal) return;
  // dim
  fill(0,0,0,160); noStroke(); rect(0,0,width,height);
  // box
  let bw=340, bh=modal.pickCards ? 320 : 200;
  let bx=width/2-bw/2, by=height/2-bh/2;
  fill(219,219,219); stroke(255,255,255); strokeWeight(2); rect(bx,by,bw,bh,10);
  // title
  fill(17,9,1); noStroke(); textSize(14); textAlign(LEFT); textStyle(BOLD);
  text(modal.title, bx+14, by+24); textStyle(NORMAL);
  // desc
  textSize(11); fill(60,40,10);
  let descLines = modal.desc.split('\n');
  descLines.forEach((l,i) => text(l, bx+14, by+42+i*14));
  // pick cards
  if (modal.pickCards) {
    modal.pickCards.forEach((c,i) => {
      let cx2 = bx+14 + i*(CW+4);
      let cy2 = by+42 + descLines.length*14 + 8;
      renderCard(cx2, cy2, c, true, false);
    });
  }
  // buttons
  G._btns = [];
  if (modal.btns) {
    modal.btns.forEach((b,i) => {
      let btnX = bx+14 + i*110;
      let btnY = by+bh-44;
      drawButton(btnX, btnY, 100, 28, b.label, true, b.fn);
    });
  }
}

// ── INPUT ────────────────────────────────────────────────────────────────────
function mousePressed() {
  G._btns = G._btns || [];
  // Check buttons first
  for (let b of G._btns) {
    if (mouseX>b.x && mouseX<b.x+b.w && mouseY>b.y && mouseY<b.y+b.h) {
      b.fn(); G._btns=[]; return;
    }
  }
  G._btns = [];

  // Modal pick cards
  if (modal && modal.pickCards) {
    let bw=340, bh=320;
    let bx=width/2-bw/2, by=height/2-bh/2;
    let descLines = modal.desc.split('\n');
    modal.pickCards.forEach((c,i) => {
      let cx2 = bx+14 + i*(CW+4);
      let cy2 = by+42 + descLines.length*14 + 8;
      if (mouseX>cx2 && mouseX<cx2+CW && mouseY>cy2 && mouseY<cy2+CH) {
        let fn = modal.pickFn;
        modal = null;
        fn(i);
      }
    });
    return;
  }

  if (modal) return;
  if (G.gameover || G.busy || G.turn!==1) return;

  // Select card from player hand — use _handY synced from drawGame
  if (isMobile()) {
    let pad=6, cw=width-pad*2;
    let mCW=min(38,floor((cw-pad*2)/8)-3);
    let mCH=floor(mCW*1.4);
    let perRow=max(1,floor(cw/(mCW+4)));
    G.hands[1].forEach((c,i)=>{
      let row=floor(i/perRow), col2=i%perRow;
      let x=pad+6+col2*(mCW+4);
      let baseY=_handY+14+row*(mCH+4);
      if(mouseX>x&&mouseX<x+mCW&&mouseY>baseY-8&&mouseY<baseY+mCH+2){
        G.selected=(G.selected===i)?-1:i;
      }
    });
  } else {
    G.hands[1].forEach((c,i) => {
      let x = PAD+10 + i*(CW+4);
      let baseY = _handY + 18;
      if (mouseX>x && mouseX<x+CW && mouseY>baseY-10 && mouseY<baseY+CH+2) {
        G.selected = (G.selected===i) ? -1 : i;
      }
    });
  }

  // Deck click = draw
  let cx = PAD + (width-PAD*2-120)/2 + 4;
  let midY = 110;
  if (mouseX>cx+28 && mouseX<cx+28+CW && mouseY>midY+16 && mouseY<midY+16+CH) {
    if (G.turn===1 && !G.busy && G.deck.length>0) buyCard();
  }
}

function getHandY() {
  let cpuZoneH=88, midY=PAD+cpuZoneH+4, midH=CH+20;
  let futH=CH+28, presH=MCH*2+28;
  let presY=midY+futH+4;
  let sbY=max(midY+midH, presY+presH)+4;
  return sbY+36;
}

// ── GAME ACTIONS ─────────────────────────────────────────────────────────────
function playCards() {
  if (G.selected===-1) { addLog('Seleciona uma carta.'); return; }
  let i=G.selected, card=G.hands[1][i];
  if (!canPlay(card)) { addLog('Não podes jogar essa carta.'); return; }
  G.busy=true; G.selected=-1;
  let prevTop=G.globalTop, prevTopIsGod=G.globalTopIsGod;
  G.hands[1].splice(i,1);
  G.presents[1].push(card);
  updateGlobalTop(card);
  addLog('Jogaste: '+cardName(card));
  G.consecutiveSkips=0;
  if (isParagem(card,prevTop,prevTopIsGod)) { addLog('⚡ Paragem! CPU perde o turno.'); G.skipTurn[0]=true; }
  if (G.extraPlays>0) {
    G.extraPlays--;
    if (G.extraPlays>0 && card.type!=='god' && !(card.type==='simple'&&card.value==='Ace')) {
      checkHandLimit(1); G.busy=false; return;
    }
  }
  if (card.type==='simple' && card.value==='Ace') { endRound(1); return; }
  if (card.type==='god') {
    triggerGod(card,1,() => {
      checkHandLimit(0); checkHandLimit(1);
      if (G.gameover) return;
      G.turn=0; G.busy=false;
      setTimeout(() => cpuTurn(), 700);
    });
    return;
  }
  checkHandLimit(1);
  G.turn=0; G.busy=false;
  setTimeout(() => cpuTurn(), 700);
}

function buyCard() {
  if (!G.deck.length || G.busy) return;
  G.busy=true;
  let c=G.deck.pop(); G.hands[1].push(c);
  addLog('Compraste: '+cardName(c)+'. Fim do turno.');
  checkHandLimit(1);
  G.consecutiveSkips++;
  if (G.consecutiveSkips>=2) { addLog('Ninguém consegue jogar — fim de ronda!'); endRound(1); return; }
  G.turn=0; G.busy=false;
  setTimeout(() => cpuTurn(), 700);
}

function endRound(who) {
  addLog('— Fim de ronda! —');
  G.pasts[0].push(...G.presents[0]); G.pasts[1].push(...G.presents[1]);
  addLog('Cartas do Presente → Passado.');
  G.presents=[[],[]]; G.globalTop=null; G.globalTopIsGod=false;
  G.reverse=false; G.presentLocked=false; G.consecutiveSkips=0; G.busy=false; G.extraPlays=0;
  checkWin();
  if (G.gameover) return;
  G.turn=who;
  if (who!==1) setTimeout(() => cpuTurn(), 600);
}

function resetRound(who, reverseMode) {
  addLog('— Ronda reiniciada! Presente acumulado. —');
  G.globalTop=null; G.globalTopIsGod=false;
  G.reverse=reverseMode; G.presentLocked=true;
  G.consecutiveSkips=0; G.busy=false;
  G.turn=who;
  if (who!==1) setTimeout(() => cpuTurn(), 600);
}

function checkWin() {
  let cp=G.pasts[0].length, pp=G.pasts[1].length;
  if (cp<13 && pp<13) return;
  let winner;
  if (cp>=13&&pp>=13) winner=Math.abs(cp-13)<=Math.abs(pp-13)?'cpu':'player';
  else if (cp>=13) winner='cpu';
  else winner='player';
  triggerWin(winner,'passado');
}
function eliminate(who) { triggerWin(who===0?'player':'cpu','eliminação'); }
function triggerWin(winner, reason) {
  G.gameover=true; G.busy=true;
  G._endTitle = winner==='player' ? '🏆 És o Deus!' : '💀 Foste eliminado!';
  G._endDesc = 'Fim por '+reason+'. CPU: '+G.pasts[0].length+' | Tu: '+G.pasts[1].length;
}

// ── CPU ───────────────────────────────────────────────────────────────────────
function cpuTurn() {
  if (G.turn!==0 || G.gameover) return;
  G.busy=true;
  setTimeout(() => {
    if (G.skipTurn[0]) {
      G.skipTurn[0]=false; addLog('CPU perdeu o turno (Paragem)!');
      G.turn=1; G.busy=false; return;
    }
    let pl=playableList(0);
    if (pl.length===0) {
      if (G.deck.length) {
        let c=G.deck.pop(); G.hands[0].push(c);
        addLog('CPU comprou uma carta. Fim do turno.');
        checkHandLimit(0);
        G.consecutiveSkips++;
        if (G.consecutiveSkips>=2) { addLog('Ninguém consegue jogar — fim de ronda!'); endRound(0); return; }
        G.turn=1; G.busy=false;
      } else { addLog('CPU sem jogadas — fim de ronda!'); endRound(0); }
      return;
    }
    G.consecutiveSkips=0;
    cpuPlayOne(pl);
  }, 600);
}

function cpuPlayOne(pl) {
  let simple=pl.filter(c=>c.type==='simple');
  let gods=pl.filter(c=>c.type==='god');
  let chosen;
  if (simple.length) {
    simple.sort((a,b)=>G.reverse?VORD[a.value]-VORD[b.value]:VORD[b.value]-VORD[a.value]);
    if (G.globalTop&&!G.globalTopIsGod) {
      let same=simple.filter(c=>c.value===G.globalTop);
      if (same.length && random()<0.4) chosen=same[0];
    }
    if (!chosen) chosen=simple[0];
  } else if (gods.length) {
    chosen=gods[floor(random(gods.length))];
  } else { endRound(0); return; }

  let prevTop=G.globalTop, prevTopIsGod=G.globalTopIsGod;
  let idx=G.hands[0].indexOf(chosen);
  G.hands[0].splice(idx,1); G.presents[0].push(chosen); updateGlobalTop(chosen);
  addLog('CPU jogou: '+cardName(chosen));
  if (isParagem(chosen,prevTop,prevTopIsGod)) { addLog('⚡ CPU Paragem! Perdes o turno.'); G.skipTurn[1]=true; }
  if (chosen.type==='simple'&&chosen.value==='Ace') { endRound(0); return; }
  if (chosen.type==='god') {
    triggerGod(chosen,0,() => {
      checkHandLimit(0); checkHandLimit(1);
      if (G.gameover) return;
      G.turn=1; G.busy=false;
    });
    return;
  }
  checkHandLimit(0); checkHandLimit(1); checkWin();
  if (G.gameover) return;
  if (G.skipTurn[1]) { G.skipTurn[1]=false; addLog('O teu turno foi cancelado!'); G.turn=0; G.busy=false; setTimeout(()=>cpuTurn(),700); return; }
  G.turn=1; G.busy=false;
}

// ── GOD EFFECTS ──────────────────────────────────────────────────────────────
function isOffensiveGod(id) { return [1,6,8,10,11,13,15,18,20].includes(id); }

function triggerGod(card, who, done) {
  let opp=1-who;
  if (who===1&&G.protected[0]&&isOffensiveGod(card.id)) { G.protected[0]=false; addLog('CPU protegido! Estrela absorveu.'); done(); return; }
  if (who===0&&G.protected[1]&&isOffensiveGod(card.id)) { G.protected[1]=false; addLog('Protegido! Estrela absorveu.'); done(); return; }
  runGodEffect(card.id, who, opp, done);
}

function showModal(title, desc, btns) {
  modal = { title, desc, btns };
}
function showPickModal(title, desc, cards, pickFn) {
  modal = { title, desc, pickCards:[...cards], pickFn };
}

function runGodEffect(id, who, opp, done) {
  if (id===4) {
    let others=GOD.filter(g=>g.id!==4);
    let rand=others[floor(random(others.length))];
    addLog((who===1?'Tu':'CPU')+' — Imperador activa: '+rand.name+'!');
    runGodEffect(rand.id, who, opp, done); return;
  }
  switch(id) {
    case 0:
      if (who===1) {
        showModal('O Louco',GOD[0].eff,[
          {label:'Futuro',fn:()=>{let n=G.hands[1].length;G.deck.push(...G.hands[1]);G.deck=shuffleArr(G.deck);G.hands[1]=[];for(let i=0;i<min(n,G.deck.length);i++)G.hands[1].push(G.deck.pop());addLog('Trocaste mão com Futuro!');modal=null;done();}},
          {label:'Passado',fn:()=>{let n=G.hands[1].length;let take=G.pasts[1].splice(0,min(n,G.pasts[1].length));G.pasts[1].push(...G.hands[1]);G.hands[1]=take;addLog('Trocaste mão com Passado!');modal=null;done();}}
        ]);
      } else { let n=G.hands[0].length;G.deck.push(...G.hands[0]);G.deck=shuffleArr(G.deck);G.hands[0]=[];for(let i=0;i<min(n,G.deck.length);i++)G.hands[0].push(G.deck.pop());addLog('CPU trocou mão com Futuro!');done(); }
      break;
    case 1:
      if (who===1) {
        showModal('O Mago',GOD[1].eff,[
          {label:'Todos compram 2',fn:()=>{for(let i=0;i<2;i++){if(G.deck.length)G.hands[1].push(G.deck.pop());if(G.deck.length)G.hands[0].push(G.deck.pop());}addLog('Todos compraram 2!');modal=null;done();}},
          {label:'Pegar 1 Presente CPU',fn:()=>{if(G.presents[0].length){let c=G.presents[0].pop();G.hands[1].push(c);addLog('Pegaste 1 do Presente CPU!');}else addLog('Presente CPU vazio.');modal=null;done();}}
        ]);
      } else { for(let i=0;i<2;i++){if(G.deck.length)G.hands[0].push(G.deck.pop());if(G.deck.length)G.hands[1].push(G.deck.pop());}addLog('CPU Mago — todos compram 2!');done(); }
      break;
    case 2:
      if (who===1) { let seen=G.hands[0].slice(0,3).map(c=>cardName(c)).join('\n')||'(vazio)';showModal('A Sacerdote','CPU tem:\n'+seen,[{label:'Ok',fn:()=>{modal=null;done();}}]); }
      else { addLog('CPU espiou a tua mão!'); done(); }
      break;
    case 3: for(let i=0;i<5;i++){if(G.deck.length)G.hands[who].push(G.deck.pop());}addLog((who===1?'Tu':'CPU')+' comprou 5!');done();break;
    case 5:
      if (who===1) {
        showModal('O Papa',GOD[5].eff,[
          {label:'Começo eu',fn:()=>{addLog('Começas tu!');modal=null;done();}},
          {label:'Começa CPU',fn:()=>{addLog('CPU começa!');G.turn=0;modal=null;done();setTimeout(()=>cpuTurn(),600);}}
        ]);
      } else { addLog('CPU Papa — volta a jogar!');G.turn=0;done();setTimeout(()=>cpuTurn(),600); }
      break;
    case 6:
      if (who===1) {
        if (!G.hands[1].length) { addLog('Mão vazia!'); done(); break; }
        let cpuPick=G.hands[0].length?G.hands[0][floor(random(G.hands[0].length))]:null;
        showPickModal('Os Namorados','Escolhe uma carta da tua mão para trocar:',G.hands[1],(pi)=>{
          let myC=G.hands[1].splice(pi,1)[0];
          if(cpuPick){let ci=G.hands[0].indexOf(cpuPick);G.hands[0].splice(ci,1);G.hands[1].push(cpuPick);G.hands[0].push(myC);addLog('Trocaste '+cardName(myC)+' ↔ '+cardName(cpuPick)+'!');}
          else{G.hands[1].push(myC);addLog('CPU sem cartas!');}
          done();
        });
      } else {
        if(G.hands[0].length&&G.hands[1].length){let ci=floor(random(G.hands[0].length)),pi=floor(random(G.hands[1].length));let c0=G.hands[0].splice(ci,1)[0],c1=G.hands[1].splice(pi,1)[0];G.hands[0].push(c1);G.hands[1].push(c0);addLog('CPU trocou cartas!');}
        done();
      }
      break;
    case 7:
      if (who===1) {
        if (!G.hands[1].length) { addLog('Mão vazia!'); done(); break; }
        showPickModal('O Carro','Escolhe uma carta para mandar:',G.hands[1],(pi)=>{
          let rc=G.hands[1][pi];
          showModal('O Carro','Para onde vai '+cardName(rc)+'?',[
            {label:'Futuro',fn:()=>{G.hands[1].splice(pi,1);G.deck.push(rc);G.deck=shuffleArr(G.deck);addLog('Mandaste '+cardName(rc)+' para o Futuro!');modal=null;done();}},
            {label:'Passado',fn:()=>{G.hands[1].splice(pi,1);G.pasts[1].push(rc);addLog('Mandaste '+cardName(rc)+' para o Passado!');modal=null;done();}}
          ]);
        });
      } else { if(G.hands[0].length){let c=G.hands[0].splice(floor(random(G.hands[0].length)),1)[0];G.pasts[0].push(c);addLog('CPU mandou '+cardName(c)+' para o Passado!');}done(); }
      break;
    case 8:
      if (who===1) {
        showModal('A Força',GOD[8].eff,[
          {label:'Trocar 2',fn:()=>{for(let i=0;i<2;i++){if(G.hands[0].length&&G.hands[1].length){let ci=floor(random(G.hands[0].length)),pi=floor(random(G.hands[1].length));[G.hands[0][ci],G.hands[1][pi]]=[G.hands[1][pi],G.hands[0][ci]];}}addLog('Trocaste 2 cartas!');modal=null;done();}},
          {label:'Todos→Futuro',fn:()=>{if(G.hands[1].length){let c=G.hands[1].splice(floor(random(G.hands[1].length)),1)[0];G.deck.push(c);}if(G.hands[0].length){let c=G.hands[0].splice(floor(random(G.hands[0].length)),1)[0];G.deck.push(c);}G.deck=shuffleArr(G.deck);addLog('Todos mandaram 1 para Futuro!');modal=null;done();}}
        ]);
      } else { for(let i=0;i<2;i++){if(G.hands[0].length&&G.hands[1].length){let ci=floor(random(G.hands[0].length)),pi=floor(random(G.hands[1].length));[G.hands[0][ci],G.hands[1][pi]]=[G.hands[1][pi],G.hands[0][ci]];}}addLog('CPU trocou 2!');done(); }
      break;
    case 9:
      if (who===1) {
        let top3=G.deck.slice(-3).map(c=>cardName(c)).join('\n')||'(vazio)';
        showModal('O Ermita','Futuro:\n'+top3,[
          {label:'Pegar do topo',fn:()=>{if(G.deck.length){let c=G.deck.pop();G.hands[1].push(c);addLog('Pegaste '+cardName(c)+'!');}modal=null;done();}},
          {label:'Não',fn:()=>{modal=null;done();}}
        ]);
      } else { if(G.deck.length){let c=G.deck.pop();G.hands[0].push(c);addLog('CPU olhou Futuro!');}done(); }
      break;
    case 10: {
      let r=rollDice(4);
      addLog('Roda da Fortuna! Dado: '+r+' ('+(r%2===0?'Par':'Ímpar')+')');
      if(r%2!==0){G.hands[who].push(...G.pasts[who]);G.pasts[who]=[];addLog((who===1?'Tu':'CPU')+' recebeu o seu Passado!');}
      else{G.hands[who].push(...G.pasts[opp]);G.pasts[opp]=[];addLog((who===1?'Tu':'CPU')+' recebeu o Passado do adversário!');}
      done();break;
    }
    case 11: {let mn=min(G.pasts[0].length,G.pasts[1].length);while(G.pasts[0].length>mn)G.deck.push(G.pasts[0].pop());while(G.pasts[1].length>mn)G.deck.push(G.pasts[1].pop());addLog('Justiça! Todos com '+mn+' no Passado.');done();break;}
    case 12: addLog('Enforcado! Ronda em decrescente, Presente acumula.');resetRound(who,true);break;
    case 13: {
      let r=rollDice(4),t=rollDice(4);
      let hit=G.sunActive[who]||r===t;G.sunActive[who]=false;
      addLog('A Morte! Dado:'+r+'/Alvo:'+t+(hit?' ACERTASTE!':' falhou.'));
      if(hit){addLog((opp===0?'CPU':'Tu')+' eliminado!');eliminate(opp);}
      else{addLog((who===1?'Tu':'CPU')+' eliminado!');eliminate(who);}
      break;
    }
    case 14:
      addLog((who===1?'Tu':'CPU')+' Temperança — passa turno, joga 3 no próximo.');
      if(who===1){G.extraPlays=3;G.turn=0;G.busy=false;setTimeout(()=>cpuTurn(),700);}
      else done();
      break;
    case 15: {let r=rollDice(4);addLog('O Diabo! Dado:'+r+' ('+(r%2===0?'Par':'Ímpar')+')');if(r%2===0){if(G.pasts[opp].length){let c=G.pasts[opp].pop();G.hands[who].push(c);addLog((who===1?'Tu':'CPU')+' pegou 1 do Passado adversário!');}}else{if(G.pasts[who].length){let c=G.pasts[who].pop();G.hands[opp].push(c);addLog('Adversário pegou 1 do teu Passado!');}}done();break;}
    case 16: addLog('A Torre! Ronda reinicia, Presente acumula.');resetRound(who,false);break;
    case 17: G.protected[who]=true;addLog((who===1?'Tu':'CPU')+' A Estrela — proteção!');done();break;
    case 18: {let h0=[...G.hands[0]];G.hands[0]=[...G.pasts[0]];G.pasts[0]=h0;let h1=[...G.hands[1]];G.hands[1]=[...G.pasts[1]];G.pasts[1]=h1;addLog('A Lua! Mão ↔ Passado.');done();break;}
    case 19: G.sunActive[who]=true;addLog((who===1?'Tu':'CPU')+' O Sol — próximo dado garantido!');done();break;
    case 20: addLog((opp===0?'CPU':'Tu')+' eliminado pelo Julgamento!');eliminate(opp);break;
    case 21: addLog('O Mundo! Jogo reinicia...');setTimeout(()=>initGame(),1200);break;
    default: done();
  }
}

//////////////***********Playing God Demo ***********************/////////////////