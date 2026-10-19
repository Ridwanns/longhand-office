// Regression for an old cached Markets bridge pinning an earlier macro graph.
export async function run(original,base='http://127.0.0.1:4175/office/'){
 const context=await original.context().browser().newContext(),page=await context.newPage(),errors=[],bridges=[],checks=[];
 page.on('pageerror',e=>errors.push(e.message));
 await context.route('**/market-terminal.js*',async route=>{
  const url=new URL(route.request().url());bridges.push(url.href);
  if(!url.searchParams.has('office'))return route.fulfill({status:200,contentType:'text/javascript',body:"throw Error('TEST ONLY: stale unversioned Markets bridge');"});
  return route.continue();
 });
 const check=(name,ok)=>{if(!ok)throw Error(name);checks.push(name);};
 try{
  await page.goto(base+'#market/macro/id/economy');await page.locator('[data-latest-cycle]').waitFor();
  const version=await page.locator('meta[name="office-macro-assets"]').getAttribute('content');
  check('Only the release-versioned Markets bridge executes',bridges.length===1&&new URL(bridges[0]).searchParams.get('office')===version);
  check('Latest-release cycle is present despite a poisoned stale bridge URL',await page.locator('.latest-cycle-plot').isVisible());
  check('Annual cycle remains a separate archive',await page.locator('.cycle-annual-archive').count()===1);
  await page.goto(base+'#market/commodities');await page.locator('[data-inspect]').first().waitFor();
  check('New commodity directory also loads through the release bridge',await page.locator('[data-inspect]').count()===27);
  check('No stale-bridge or other script error',errors.length===0);
  return {checks,errors};
 }finally{await context.close();}
}
