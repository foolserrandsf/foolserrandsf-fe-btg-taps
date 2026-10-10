/* Builds the printable BTG + draft menu right on the phone, no Google needed.
   Same layout as the approved Google Doc version: letter landscape, beer on the
   left half (centered 190pt from the left edge), wine on the right (606pt),
   Georgia, 12.5pt lines, 10.5pt descriptions, 21/19pt headings.
   Drawn at 300 dpi and wrapped in a one-page PDF. */
(function(){
var W=792, H=612, DPI=300, K=DPI/72;
var INK='#231F20', HH_INK='#000000';
var LEFT_C=190.1, RIGHT_C=606.0;      // centers measured from the approved menu
var BEER_BASE=47.8, WINE_BASE=39.8;    // baseline of the first heading (wine sits a little higher)
var LAST_BASE=592;                     // lowest a baseline may go
var MAX_W=340;                         // widest a line may be before it's shrunk
var SECTIONS=['DRAFT','CIDER CANS','NON-ALCOHOLIC CANS','SPARKLING','WHITE','RED'];
var TITLES={'DRAFT':'Draft','CIDER CANS':'Cider Cans','NON-ALCOHOLIC CANS':'Non-Alcoholic Cans','SPARKLING':'Sparkling','WHITE':'White','RED':'Red'};
var BODY=12.5, DESC=10.5, H1=21, H2=19, HH=12;

function t(x){ return String(x==null?'':x).trim(); }
function q(s){ return '\u2018'+s+'\u2019'; }
function price(p){ return t(p).replace(/^\$/,''); }

var ctx;
function font(style,size){
  return (style==='I'||style==='BI'?'italic ':'')+(style==='B'||style==='BI'?'bold ':'')+(size*K)+'px Georgia, "Times New Roman", serif';
}
function runW(r){ ctx.font=font(r[1],r[2]); return ctx.measureText(r[0]).width/K; }
function width(runs){ return runs.reduce(function(n,r){ return n+runW(r); },0); }
function fit(runs){
  var w=width(runs); if(w<=MAX_W) return runs;
  var k=MAX_W/w; return runs.map(function(r){ return [r[0],r[1],r[2]*k]; });
}

function beerLines(v){
  var tail=[t(v[4]),t(v[5]),price(v[6])].filter(Boolean).join(' | ');
  var main=[[t(v[0])+(t(v[1])?' '+q(t(v[1])):'')+' ','R',BODY],[t(v[2])+' ','B',BODY],['| '+tail,'R',BODY]];
  if(t(v[7])) main.push([' *','R',BODY],[t(v[7]),'BI',BODY]);
  var sub=[]; if(t(v[3])) t(v[3]).split(/\*\*(.+?)\*\*/).forEach(function(p,i){ if(p) sub.push([p,i%2?'BI':'I',DESC]); });
  return {main:main,sub:sub};
}
function wineLines(v){
  var l1=[[t(v[0])+(t(v[1])?' '+q(t(v[1])):'')+' ','R',BODY],[t(v[2]),'B',BODY]];
  if(t(v[5])) l1.push([' '+t(v[5]),'R',BODY]);
  var l2=[[t(v[3])+(t(v[4])?' '+t(v[4]):'')+' | '+price(v[6]),'R',BODY]];
  if(t(v[7])) l2.push([' *','R',BODY],[t(v[7]),'BI',BODY]);
  return {l1:l1,l2:l2};
}

/* a line = {gap: baseline-to-baseline distance from the line above, runs, black, flex}
   Gaps are measured from the approved menu; flex gaps tighten on a long week. */
function leftColumn(d){
  var out=[], first=true, lastDesc=false;
  ['DRAFT','CIDER CANS','NON-ALCOHOLIC CANS'].forEach(function(s){
    if(!d[s].length) return;
    var size=first?H1:H2;
    out.push({gap:first?0:34.8,runs:[[TITLES[s],'B',size]],flex:true});
    var prevDesc=false;
    d[s].forEach(function(v,i){
      var b=beerLines(v);
      out.push({gap:i===0?(first?16.7:17.2):(prevDesc?18.4:21.3),runs:fit(b.main),flex:i>0});
      if(b.sub.length) out.push({gap:12.4,runs:fit(b.sub)});
      prevDesc=b.sub.length>0;
    });
    lastDesc=prevDesc; first=false;
  });
  if(d.hh.items.length){
    var title=d.hh.title, when=title.indexOf('\u00b7')>=0?t(title.split('\u00b7')[1]):'';
    var deals=[], extras=[];
    d.hh.items.forEach(function(v){
      if(t(v[6])) deals.push('$'+price(v[6])+' '+t(v[0])+(t(v[7])?' *'+t(v[7]):''));
      else extras.push(t(v[0]));
    });
    out.push({gap:lastDesc?24:26.4,runs:[['Happy Hour','B',HH]],black:true,flex:true});
    if(when) out.push({gap:19.9,runs:[[when,'B',HH]],black:true});
    if(deals.length) out.push({gap:19.9,runs:fit([[deals.join(' | '),'B',HH]]),black:true});
    extras.forEach(function(e){ out.push({gap:20,runs:[[e,'B',HH]],black:true}); });
  }
  return out;
}
function rightColumn(d){
  var out=[], first=true;
  ['SPARKLING','WHITE','RED'].forEach(function(s){
    if(!d[s].length) return;
    var size=first?H1:H2;
    out.push({gap:first?0:27.3,runs:[[TITLES[s],'B',size]],flex:true});
    d[s].forEach(function(v,i){
      var w=wineLines(v);
      out.push({gap:i===0?(first?17.7:17.2):21.4,runs:fit(w.l1),flex:i>0});
      out.push({gap:14.2,runs:fit(w.l2)});
    });
    first=false;
  });
  return out;
}
function place(items,top0){   // sets it.base for each line
  var fixed=0, flex=0;
  items.forEach(function(it){ if(it.flex) flex+=it.gap; else fixed+=it.gap; });
  var k=1; if(top0+fixed+flex>LAST_BASE && flex) k=Math.max(0.5,(LAST_BASE-top0-fixed)/flex);
  var y=top0; items.forEach(function(it){ y+=it.gap*(it.flex?k:1); it.base=y; });
  return {k:k, last:y, over:y>LAST_BASE+1};
}
function draw(items,center){
  items.forEach(function(it){
    var base=it.base, x=center-width(it.runs)/2;
    ctx.fillStyle=it.black?HH_INK:INK;
    it.runs.forEach(function(r){ ctx.font=font(r[1],r[2]); ctx.fillText(r[0],x*K,base*K); x+=runW(r); });
  });
}

/* sections from the app (S.data) -> menu data */
function fromWeek(week){
  var d={hh:{title:'',items:[]}}; SECTIONS.forEach(function(s){ d[s]=[]; });
  week.sections.forEach(function(sec){
    var rows=sec.items.map(function(it){return it.v;}).filter(function(v){return t(v[0]);});
    if(sec.key==='HH'){ d.hh.title=sec.label; d.hh.items=rows; }
    else if(d[sec.key]) d[sec.key]=rows;
  });
  return d;
}

/* one-page PDF holding one JPEG */
function pdfFromJpeg(bytes,pxW,pxH){
  var enc=new TextEncoder(), parts=[], len=0, offs=[];
  function add(x){ var b=typeof x==='string'?enc.encode(x):x; parts.push(b); len+=b.length; }
  function obj(n,body){ offs[n]=len; add(n+' 0 obj\n'); body(); add('\nendobj\n'); }
  add('%PDF-1.4\n%\u00e2\u00e3\u00cf\u00d3\n');
  var content='q '+W+' 0 0 '+H+' 0 0 cm /Im0 Do Q';
  obj(1,function(){ add('<< /Type /Catalog /Pages 2 0 R >>'); });
  obj(2,function(){ add('<< /Type /Pages /Kids [3 0 R] /Count 1 >>'); });
  obj(3,function(){ add('<< /Type /Page /Parent 2 0 R /MediaBox [0 0 '+W+' '+H+'] /Resources << /XObject << /Im0 4 0 R >> >> /Contents 5 0 R >>'); });
  obj(4,function(){ add('<< /Type /XObject /Subtype /Image /Width '+pxW+' /Height '+pxH+' /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length '+bytes.length+' >>\nstream\n'); add(bytes); add('\nendstream'); });
  obj(5,function(){ add('<< /Length '+content.length+' >>\nstream\n'+content+'\nendstream'); });
  var xref=len, s='xref\n0 6\n0000000000 65535 f \n';
  for(var i=1;i<=5;i++) s+=('000000000'+offs[i]).slice(-10)+' 00000 n \n';
  add(s+'trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n'+xref+'\n%%EOF');
  return new Blob(parts,{type:'application/pdf'});
}

window.buildMenuPdf=function(week,cb){
  var c=document.createElement('canvas'); c.width=Math.round(W*K); c.height=Math.round(H*K);
  ctx=c.getContext('2d'); ctx.fillStyle='#fff'; ctx.fillRect(0,0,c.width,c.height);
  ctx.textBaseline='alphabetic';
  var d=fromWeek(week);
  var L=leftColumn(d), R=rightColumn(d);
  var pl=place(L,BEER_BASE);
  // BOTTLE LIST AVAILABLE sits near the bottom, just under the last beer-side line
  var bottle={gap:30,runs:[['BOTTLE LIST AVAILABLE','B',BODY]],flex:true}; R.push(bottle);
  var pr=place(R,WINE_BASE);
  bottle.base=Math.max(bottle.base,Math.min(LAST_BASE,pl.last+10.8));
  draw(L,LEFT_C); draw(R,RIGHT_C);
  c.toBlob(function(jpg){
    jpg.arrayBuffer().then(function(buf){
      cb(pdfFromJpeg(new Uint8Array(buf),c.width,c.height),{tooLong:pl.over||pr.over});
      c.width=c.height=1;   // free the memory right away
    });
  },'image/jpeg',0.95);
};
})();
