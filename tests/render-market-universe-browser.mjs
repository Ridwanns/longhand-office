export async function run(original){
 const root='http://127.0.0.1:4175/office/',c=await original.context().browser().newContext({reducedMotion:'reduce',viewport:{width:1440,height:1000}}),p=await c.newPage(),cases=[],errors=[];p.on('pageerror',e=>errors.push(e.message));
 try{
  await p.goto(root+'#market/us');const data=await p.evaluate(async()=>fetch('./data/market.json').then(r=>r.json()));
  for(const category of ['us','idx','bonds','commodities','macro']){
   const symbols=Object.keys(data.quotes).filter(k=>k.startsWith(category+':')).map(k=>k.split(':')[1]);
   for(let i=0;i<symbols.length;i+=12){const batch=symbols.slice(i,i+12);
    if(['us','idx'].includes(category))await p.evaluate(({category,batch})=>localStorage.setItem('longhand-office.watchlists.v1',JSON.stringify({[category]:batch})),{category,batch});
    await p.goto(root+'#market/'+category);await p.reload();await p.waitForFunction(()=>document.querySelector('#refresh-market')&&!document.querySelector('#refresh-market').disabled);
    for(const symbol of batch){const q=data.quotes[category+':'+symbol].quote,row=p.locator('tr[data-symbol="'+symbol+'"]');
     if(await row.locator('.watch-price').count()!==1)throw Error('No price rendered for '+category+':'+symbol+': '+await row.innerText());
     const rendered=await row.locator('.watch-price').innerText(),expected=new Intl.NumberFormat('en-GB',{maximumFractionDigits:4}).format(q.price);
     if(!rendered.startsWith(expected))throw Error('Wrong rendered price '+symbol);
     await p.locator('[data-inspect="'+symbol+'"]').click();const detail=await p.locator('#market-detail').innerText(),unit=category==='us'?'USD / share':category==='idx'?'IDR / share':q.unit;
     if(!detail.includes(symbol)||!detail.includes(unit)||!detail.toLowerCase().includes('source time'))throw Error('Missing unit/provenance '+symbol+': '+detail);
     if(['us','idx','bonds'].includes(category)&&!await p.locator('[data-market-models]').isEnabled())throw Error('Models disabled for '+symbol);
     cases.push({category,symbol,priceMatches:true,unit,modelButton:['us','idx','bonds'].includes(category)?'enabled':'not offered',passed:true});
    }
   }
  }
  if(errors.length)throw Error(JSON.stringify(errors));return {publishedAt:data.publishedAt,cases,errors};
 }finally{await c.close();}
}
